from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_user, require_developer, verify_store_isolation
from app.models.models import Store, User, Employee, AuditLog
from app.schemas.schemas import StoreCreate, StoreUpdate, StoreOut, StoreAdminCreate, UserOut
from app.core.security import hash_password
from app.services.audit_service import log_audit

router = APIRouter(prefix="/stores", tags=["Stores Multi-Tenant"])

@router.get("", response_model=List[StoreOut])
def list_stores(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    List all registered stores (DEVELOPER only).
    """
    stores = db.query(Store).all()
    result = []

    for s in stores:
        # Find store primary admin
        admin_user = db.query(User).filter(User.store_id == s.id, User.role == "ADMIN").first()
        if not admin_user:
            admin_user = db.query(User).filter(User.store_id == s.id, User.role == "SUPER_ADMIN").first()
        
        worker_count = db.query(func.count(Employee.id)).filter(Employee.store_id == s.id).scalar() or 0
        active_users_count = db.query(func.count(User.id)).filter(User.store_id == s.id, User.is_active == True).scalar() or 0
        
        # Last activity
        last_log = db.query(AuditLog).filter(AuditLog.store_id == s.id).order_by(AuditLog.created_at.desc()).first()
        last_activity = last_log.created_at if last_log else s.updated_at

        out = StoreOut(
            id=s.id,
            name=s.name,
            code=s.code,
            address=s.address,
            phone=s.phone,
            email=s.email,
            opening_time=s.opening_time,
            closing_time=s.closing_time,
            latitude=s.latitude,
            longitude=s.longitude,
            attendance_radius=s.attendance_radius,
            timezone=s.timezone,
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
            admin_full_name=admin_user.full_name if admin_user else None,
            admin_username=admin_user.username if admin_user else None,
            worker_count=worker_count,
            active_users_count=active_users_count,
            last_activity=last_activity
        )
        result.append(out)

    return result

@router.post("", response_model=StoreOut)
def create_store(
    payload: StoreCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    Create a new store tenant and optional initial ADMIN account (DEVELOPER only).
    """
    existing_store = db.query(Store).filter(Store.code == payload.code).first()
    if existing_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kodi '{payload.code}' bo'lgan magazin allaqachon mavjud!"
        )

    store = Store(
        name=payload.name,
        code=payload.code,
        address=payload.address,
        phone=payload.phone,
        email=payload.email,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        latitude=payload.latitude,
        longitude=payload.longitude,
        attendance_radius=payload.attendance_radius,
        timezone=payload.timezone,
        status=payload.status
    )
    db.add(store)
    db.commit()
    db.refresh(store)

    admin_name = None
    admin_uname = None

    # Create initial ADMIN user if requested
    if payload.create_initial_admin:
        if not payload.admin_username or not payload.admin_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Birinchi ADMIN yaratish uchun username va password talab qilinadi!"
            )
        
        existing_user = db.query(User).filter(User.username == payload.admin_username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Foydalanuvchi nomi '{payload.admin_username}' band!"
            )

        admin_user = User(
            store_id=store.id,
            username=payload.admin_username,
            full_name=payload.admin_full_name or f"{payload.name} Admini",
            email=payload.admin_email,
            phone=payload.admin_phone,
            hashed_password=hash_password(payload.admin_password),
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        admin_name = admin_user.full_name
        admin_uname = admin_user.username

    # Audit Logging
    log_audit(
        db=db,
        action_type="DEVELOPER_CREATED_STORE",
        user=current_user,
        store_id=store.id,
        entity="Store",
        entity_id=store.id,
        new_value=f"Store: {store.name} ({store.code})",
        request=request,
        notes=f"DEVELOPER '{current_user.username}' yangi magazin yaratdi: {store.name}"
    )

    return StoreOut(
        id=store.id,
        name=store.name,
        code=store.code,
        address=store.address,
        phone=store.phone,
        email=store.email,
        opening_time=store.opening_time,
        closing_time=store.closing_time,
        latitude=store.latitude,
        longitude=store.longitude,
        attendance_radius=store.attendance_radius,
        timezone=store.timezone,
        status=store.status,
        created_at=store.created_at,
        updated_at=store.updated_at,
        admin_full_name=admin_name,
        admin_username=admin_uname,
        worker_count=0,
        active_users_count=1 if admin_name else 0,
        last_activity=store.updated_at
    )

@router.get("/{store_id}", response_model=StoreOut)
def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get store details. Allowed for DEVELOPER or Store's ADMIN.
    """
    verify_store_isolation(current_user, store_id)
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magazin topilmadi")

    admin_user = db.query(User).filter(User.store_id == store.id, User.role.in_(["ADMIN", "SUPER_ADMIN"])).first()
    worker_count = db.query(func.count(Employee.id)).filter(Employee.store_id == store.id).scalar() or 0
    active_users_count = db.query(func.count(User.id)).filter(User.store_id == store.id, User.is_active == True).scalar() or 0
    last_log = db.query(AuditLog).filter(AuditLog.store_id == store.id).order_by(AuditLog.created_at.desc()).first()

    return StoreOut(
        id=store.id,
        name=store.name,
        code=store.code,
        address=store.address,
        phone=store.phone,
        email=store.email,
        opening_time=store.opening_time,
        closing_time=store.closing_time,
        latitude=store.latitude,
        longitude=store.longitude,
        attendance_radius=store.attendance_radius,
        timezone=store.timezone,
        status=store.status,
        created_at=store.created_at,
        updated_at=store.updated_at,
        admin_full_name=admin_user.full_name if admin_user else None,
        admin_username=admin_user.username if admin_user else None,
        worker_count=worker_count,
        active_users_count=active_users_count,
        last_activity=last_log.created_at if last_log else store.updated_at
    )

@router.put("/{store_id}", response_model=StoreOut)
def update_store(
    store_id: int,
    payload: StoreUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    Update store configuration or status (Activate/Deactivate) (DEVELOPER only).
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magazin topilmadi")

    old_status = store.status
    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(store, field, val)

    db.commit()
    db.refresh(store)

    # Audit Logging
    log_audit(
        db=db,
        action_type="DEVELOPER_UPDATED_STORE",
        user=current_user,
        store_id=store.id,
        entity="Store",
        entity_id=store.id,
        old_value=f"Status: {old_status}",
        new_value=f"Status: {store.status}",
        request=request,
        notes=f"DEVELOPER '{current_user.username}' magazin ma'lumotlarini tahrirladi"
    )

    admin_user = db.query(User).filter(User.store_id == store.id, User.role.in_(["ADMIN", "SUPER_ADMIN"])).first()
    worker_count = db.query(func.count(Employee.id)).filter(Employee.store_id == store.id).scalar() or 0
    active_users_count = db.query(func.count(User.id)).filter(User.store_id == store.id, User.is_active == True).scalar() or 0
    last_log = db.query(AuditLog).filter(AuditLog.store_id == store.id).order_by(AuditLog.created_at.desc()).first()

    return StoreOut(
        id=store.id,
        name=store.name,
        code=store.code,
        address=store.address,
        phone=store.phone,
        email=store.email,
        opening_time=store.opening_time,
        closing_time=store.closing_time,
        latitude=store.latitude,
        longitude=store.longitude,
        attendance_radius=store.attendance_radius,
        timezone=store.timezone,
        status=store.status,
        created_at=store.created_at,
        updated_at=store.updated_at,
        admin_full_name=admin_user.full_name if admin_user else None,
        admin_username=admin_user.username if admin_user else None,
        worker_count=worker_count,
        active_users_count=active_users_count,
        last_activity=last_log.created_at if last_log else store.updated_at
    )

@router.post("/{store_id}/admin", response_model=UserOut)
def create_or_update_store_admin(
    store_id: int,
    payload: StoreAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    Manage Store ADMIN account (Create or Reset Admin for store) (DEVELOPER only).
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Magazin topilmadi")

    admin_user = db.query(User).filter(User.store_id == store_id, User.role.in_(["ADMIN", "SUPER_ADMIN"])).first()
    if admin_user:
        admin_user.full_name = payload.full_name
        admin_user.email = payload.email
        admin_user.phone = payload.phone
        admin_user.hashed_password = hash_password(payload.password)
        db.commit()
        db.refresh(admin_user)
        action_msg = "updated"
    else:
        existing_user = db.query(User).filter(User.username == payload.username).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username band")

        admin_user = User(
            store_id=store_id,
            username=payload.username,
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            hashed_password=hash_password(payload.password),
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        action_msg = "created"

    log_audit(
        db=db,
        action_type="DEVELOPER_MANAGED_STORE_ADMIN",
        user=current_user,
        store_id=store_id,
        entity="User",
        entity_id=admin_user.id,
        new_value=f"Admin: {admin_user.username}",
        request=request,
        notes=f"DEVELOPER magazin ADMIN hisobini {action_msg} qildi: {admin_user.username}"
    )

    return admin_user
