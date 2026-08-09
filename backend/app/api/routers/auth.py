from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, hash_password, create_access_token
from app.models.models import User
from app.schemas.schemas import Token, LoginRequest, UserCreate, UserOut
from app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Foydalanuvchi nomi yoki parol noto'g'ri"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hisobingiz faol emas. Iltimos administratsiyaga murojaat qiling!"
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(subject=user.username)

    # Audit Logging
    log_audit(
        db=db,
        action_type="USER_LOGIN",
        user=user,
        store_id=user.store_id,
        entity="User",
        entity_id=user.id,
        request=request,
        notes=f"User '{user.username}' ({user.role}) tizimga kirdi"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Log audit trail on logout.
    """
    log_audit(
        db=db,
        action_type="USER_LOGOUT",
        user=current_user,
        store_id=current_user.store_id,
        entity="User",
        entity_id=current_user.id,
        request=request,
        notes=f"User '{current_user.username}' tizimdan chiqdi"
    )
    return {"message": "Tizimdan muvaffaqiyatli chiqildi"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserOut)
def register_user(
    req: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only DEVELOPER or ADMIN can register users
    if current_user.role not in ["DEVELOPER", "ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Foydalanuvchi yaratish huquqiga ega emassiz!")
    
    # Non-DEVELOPER cannot create DEVELOPER accounts
    if req.role == "DEVELOPER" and current_user.role != "DEVELOPER":
        raise HTTPException(status_code=403, detail="DEVELOPER hisobini yaratish taqiqlangan!")

    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bunday foydalanuvchi nomi mavjud")
    
    target_store_id = req.store_id if current_user.role == "DEVELOPER" else current_user.store_id

    user = User(
        store_id=target_store_id,
        username=req.username,
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        hashed_password=hash_password(req.password),
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(
        db=db,
        action_type=f"{current_user.role}_CREATED_USER",
        user=current_user,
        store_id=target_store_id,
        entity="User",
        entity_id=user.id,
        new_value=f"Username: {user.username}, Role: {user.role}",
        request=request,
        notes=f"{current_user.role} '{current_user.username}' yangi user yaratdi: {user.username}"
    )

    return user
