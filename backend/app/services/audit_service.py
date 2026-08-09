from typing import Optional, Any
from fastapi import Request
from sqlalchemy.orm import Session
from app.models.models import AuditLog, User, Store

def log_audit(
    db: Session,
    action_type: str,
    user: Optional[User] = None,
    store_id: Optional[int] = None,
    entity: Optional[str] = None,
    entity_id: Optional[int] = None,
    changed_data: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    request: Optional[Request] = None,
    notes: Optional[str] = None
) -> AuditLog:
    """
    Central Audit Log Recorder for Technical & Business Actions.
    """
    ip_address = None
    device_info = None

    if request:
        # Extract real IP taking into account standard proxies if present
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        elif request.client:
            ip_address = request.client.host
        
        device_info = request.headers.get("user-agent")

    user_id = user.id if user else None
    user_name = user.full_name if user else "Tizim"
    user_role = user.role if user else "SYSTEM"

    # Determine store context
    effective_store_id = store_id
    if effective_store_id is None and user and user.store_id:
        effective_store_id = user.store_id

    store_name = None
    if effective_store_id:
        store_obj = db.query(Store).filter(Store.id == effective_store_id).first()
        if store_obj:
            store_name = store_obj.name

    audit_entry = AuditLog(
        user_id=user_id,
        user_name=user_name,
        user_role=user_role,
        store_id=effective_store_id,
        store_name=store_name,
        action_type=action_type,
        entity=entity,
        entity_id=entity_id,
        changed_data=changed_data or notes,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        device_info=device_info
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
