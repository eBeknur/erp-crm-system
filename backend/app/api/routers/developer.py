from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_developer
from app.models.models import User
from app.schemas.schemas import DeveloperProfileOut, DeveloperProfileUpdate, PasswordChangeRequest
from app.core.security import hash_password, verify_password
from app.services.audit_service import log_audit

router = APIRouter(prefix="/developer", tags=["Developer Administration"])

@router.get("/profile", response_model=DeveloperProfileOut)
def get_developer_profile(
    current_user: User = Depends(require_developer)
):
    """
    Get DEVELOPER profile details (DEVELOPER only).
    """
    return current_user

@router.put("/profile", response_model=DeveloperProfileOut)
def update_developer_profile(
    payload: DeveloperProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    Update DEVELOPER profile (Name, Surname, Email, Phone, Avatar, Username).
    """
    old_info = f"Name: {current_user.full_name}, Email: {current_user.email}, Phone: {current_user.phone}"
    
    if payload.username and payload.username != current_user.username:
        existing = db.query(User).filter(User.username == payload.username).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username band!")
        current_user.username = payload.username

    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.email is not None:
        current_user.email = payload.email
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(current_user)

    new_info = f"Name: {current_user.full_name}, Email: {current_user.email}, Phone: {current_user.phone}"

    log_audit(
        db=db,
        action_type="DEVELOPER_UPDATED_PROFILE",
        user=current_user,
        entity="User",
        entity_id=current_user.id,
        old_value=old_info,
        new_value=new_info,
        request=request,
        notes="DEVELOPER profili ma'lumotlarini o'zgartirdi"
    )

    return current_user

@router.put("/change-password")
def change_developer_password(
    payload: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_developer)
):
    """
    Change DEVELOPER account password.
    """
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eski parol noto'g'ri kiritildi!"
        )

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    log_audit(
        db=db,
        action_type="USER_CHANGE_PASSWORD",
        user=current_user,
        entity="User",
        entity_id=current_user.id,
        request=request,
        notes="DEVELOPER o'z parolini muvaffaqiyatli o'zgartirdi"
    )

    return {"message": "Parol muvaffaqiyatli o'zgartirildi!"}
