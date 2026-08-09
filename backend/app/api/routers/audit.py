from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogOut

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    store_id: Optional[int] = None,
    action_type: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List Audit Logs:
    - ISHCHI and HR_MANAGER: Access Denied (403 Forbidden).
    - ADMIN: Sees ONLY logs of their own store.
    - DEVELOPER: Sees logs across ALL stores, option to filter by store_id.
    """
    # Restrict ISHCHI & HR_MANAGER
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER", "SELLER": "ISHCHI"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role in ["ISHCHI", "HR_MANAGER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Loglarni ko'rish uchun ruxsat berilmadi!"
        )

    # Server-side store isolation check
    target_store_id = verify_store_isolation(current_user, store_id)

    query = db.query(AuditLog)

    if target_store_id is not None:
        query = query.filter(AuditLog.store_id == target_store_id)

    if action_type:
        query = query.filter(AuditLog.action_type == action_type)

    logs = query.order_by(AuditLog.id.desc()).offset(offset).limit(limit).all()
    return logs
