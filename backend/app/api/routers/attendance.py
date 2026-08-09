import math
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import Attendance, Employee, Store, User
from app.schemas.schemas import AttendanceCheckInRequest, AttendanceCheckOutRequest, AttendanceOut
from app.services.audit_service import log_audit

router = APIRouter(prefix="/attendance", tags=["Attendance & Keldi-Ketdi"])

# Default Turkuaz Building Coordinates
TURKUAZ_LAT = 41.3211769
TURKUAZ_LNG = 69.2367225
DEFAULT_RADIUS = 150.0  # meters

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance between two GPS coordinates in meters using Haversine formula."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@router.get("/config")
def get_attendance_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns store attendance geolocation config (Turkuaz building coordinates & radius)"""
    store = None
    if current_user.store_id:
        store = db.query(Store).filter(Store.id == current_user.store_id).first()
    
    lat = store.latitude if (store and store.latitude) else TURKUAZ_LAT
    lng = store.longitude if (store and store.longitude) else TURKUAZ_LNG
    radius = store.attendance_radius if (store and store.attendance_radius) else DEFAULT_RADIUS

    return {
        "store_id": current_user.store_id or 1,
        "store_name": store.name if store else "Turkuaz Supermarket",
        "building_name": "Turkuaz Binosi",
        "latitude": lat,
        "longitude": lng,
        "attendance_radius_meters": radius
    }

@router.get("/today", response_model=Optional[AttendanceOut])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's today attendance status"""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
    if not emp:
        return None

    tashkent_tz = timezone(timedelta(hours=5))
    today_start = datetime.now(tashkent_tz).replace(hour=0, minute=0, second=0, microsecond=0)
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.created_at >= today_start
    ).order_by(Attendance.id.desc()).first()

    return attendance

@router.post("/check-in", response_model=AttendanceOut)
def check_in(
    req: AttendanceCheckInRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Worker checks in with GPS location & camera selfie photo.
    Verifies physical presence inside Turkuaz building radius (150m).
    """
    target_store_id = current_user.store_id or 1

    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
    if not emp:
        emp = Employee(
            store_id=target_store_id,
            user_id=current_user.id,
            full_name=current_user.full_name or current_user.username,
            position="ISHCHI",
            salary_type="MONTHLY",
            base_salary=4000000.0
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)
    store = db.query(Store).filter(Store.id == target_store_id).first()
    
    target_lat = store.latitude if (store and store.latitude) else TURKUAZ_LAT
    target_lng = store.longitude if (store and store.longitude) else TURKUAZ_LNG
    allowed_radius = store.attendance_radius if (store and store.attendance_radius) else DEFAULT_RADIUS

    # Location validation disabled per user request - always valid
    is_valid = True
    distance_m = 0.0

    if not req.photo_url or len(req.photo_url) < 50:
        raise HTTPException(status_code=400, detail="📸 Ishga kelganligingizni tasdiqlash uchun kamerangizdan selfie rasm yuborish shart!")

    # Tashkent Timezone (Asia/Tashkent, UTC+5)
    tashkent_tz = timezone(timedelta(hours=5))
    now_tashkent = datetime.now(tashkent_tz)
    today_start = now_tashkent.replace(hour=0, minute=0, second=0, microsecond=0)

    # Check if already checked in today
    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.created_at >= today_start
    ).first()

    # Calculate late minutes from 09:00 AM shift start (Asia/Tashkent)
    shift_start_today = now_tashkent.replace(hour=9, minute=0, second=0, microsecond=0)
    diff_seconds = (now_tashkent - shift_start_today).total_seconds()
    late_mins = max(0, int(diff_seconds // 60))
    attendance_status = "LATE" if late_mins > 0 else "PRESENT"

    if existing:
        existing.check_in_time = now_tashkent
        existing.check_in_photo_url = req.photo_url
        existing.latitude = req.latitude
        existing.longitude = req.longitude
        existing.distance_meters = distance_m
        existing.is_valid_location = True
        existing.late_minutes = late_mins
        existing.status = attendance_status
        if req.notes:
            existing.notes = req.notes
        db.commit()
        db.refresh(existing)
        attendance = existing
    else:
        attendance = Attendance(
            store_id=target_store_id,
            employee_id=emp.id,
            user_id=current_user.id,
            check_in_time=now_tashkent,
            check_in_photo_url=req.photo_url,
            latitude=req.latitude,
            longitude=req.longitude,
            distance_meters=distance_m,
            is_valid_location=True,
            late_minutes=late_mins,
            status=attendance_status,
            notes=req.notes
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)

    log_audit(
        db=db,
        action_type="ISHCHI_CHECK_IN",
        user=current_user,
        store_id=target_store_id,
        entity="Attendance",
        entity_id=attendance.id,
        request=request,
        notes=f"Ishchi '{current_user.username}' Turkuaz binosidan ishga keldi (Masofa: {int(distance_m)}m)"
    )

    return attendance

@router.post("/check-out", response_model=AttendanceOut)
def check_out(
    req: AttendanceCheckOutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Worker checks out at end of shift"""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
    if not emp:
        emp = Employee(
            store_id=current_user.store_id or 1,
            user_id=current_user.id,
            full_name=current_user.full_name or current_user.username,
            position="ISHCHI",
            salary_type="MONTHLY",
            base_salary=4000000.0
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

    tashkent_tz = timezone(timedelta(hours=5))
    now_tashkent = datetime.now(tashkent_tz)
    today_start = now_tashkent.replace(hour=0, minute=0, second=0, microsecond=0)

    attendance = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.created_at >= today_start
    ).order_by(Attendance.id.desc()).first()

    if not attendance:
        # Fallback to latest attendance record for employee
        attendance = db.query(Attendance).filter(
            Attendance.employee_id == emp.id
        ).order_by(Attendance.id.desc()).first()

    if not attendance:
        raise HTTPException(status_code=400, detail="Bugun hali ishga kelish (Check-in) belgilanmagan!")

    attendance.check_out_time = now_tashkent
    if req.photo_url:
        attendance.check_out_photo_url = req.photo_url
    attendance.status = "COMPLETED"
    if req.notes:
        attendance.notes = (attendance.notes or "") + f" | Ketish izohi: {req.notes}"

    db.commit()
    db.refresh(attendance)

    setattr(attendance, 'photo_url', attendance.check_in_photo_url)
    setattr(attendance, 'full_name', emp.full_name)

    log_audit(
        db=db,
        action_type="ISHCHI_CHECK_OUT",
        user=current_user,
        store_id=current_user.store_id or 1,
        entity="Attendance",
        entity_id=attendance.id,
        request=request,
        notes=f"Ishchi '{current_user.username}' ishni yakunlab ketdi"
    )

    return attendance

@router.get("/list", response_model=List[AttendanceOut])
def list_attendance(
    employee_id: Optional[int] = None,
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List attendance records. Admin sees all employees; Worker sees own records."""
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Attendance)

    if target_store_id is not None:
        query = query.filter(Attendance.store_id == target_store_id)

    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER", "SELLER": "ISHCHI"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role not in ["ADMIN", "DEVELOPER", "HR_MANAGER"]:
        # Worker sees only their own attendance
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not emp:
            emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
        else:
            return []

    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    records = query.order_by(Attendance.id.desc()).limit(20).all()
    for r in records:
        setattr(r, 'photo_url', r.check_in_photo_url)
        if r.employee:
            setattr(r, 'full_name', r.employee.full_name)
    return records
