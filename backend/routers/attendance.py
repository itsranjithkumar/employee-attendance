from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.attendance import Attendance
from models.breaks import Break
from schemas.attendance_schema import AttendanceStart, AttendanceEnd
from schemas.breaks_schema import BreakSchema
from datetime import datetime
from utils.jwt_token import get_current_user

router = APIRouter(prefix="/attendance")

# Start Day Route
@router.post("/start")
def start_day(data: AttendanceStart, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()  # Get the current date in UTC
    # Check if the user already has an attendance record for today
    existing = db.query(Attendance).filter_by(employee_id=current_user.id, date=today).first()
    print(f"Existing attendance: {existing}")
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already started today.")
    print(f"Starting attendance for {current_user.name} on {today}")
    # Create a new attendance record
    attendance = Attendance(
        employee_id=current_user.id,
        start_time=datetime.utcnow(),  # Set to current UTC time
        work_summary=data.work_summary,
        date=today
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return {"msg": "Day started", "attendance_id": attendance.id, "start_time": attendance.start_time.isoformat()}

# End Day Route
@router.post("/end")
def end_day(data: AttendanceEnd, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter_by(employee_id=current_user.id, date=today).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today.")
    
    # Mark the end time of the attendance record
    attendance.end_time = datetime.utcnow()
    if data.work_summary:
        attendance.work_summary = data.work_summary
    db.commit()
    return {"msg": "Day ended", "start_time": attendance.start_time.isoformat() if attendance.start_time else None, "end_time": attendance.end_time.isoformat() if attendance.end_time else None}

# Get Today's Attendance Route
@router.get("/today")
def get_today_attendance(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        func.date(Attendance.start_time) == today
    ).first()
    if not attendance:
        return {"start_time": None, "end_time": None, "breaks": []}
    # Get all breaks for this attendance
    breaks = db.query(Break).filter_by(attendance_id=attendance.id).all()
    breaks_data = [
        {"id": b.id, "break_in": b.break_in.isoformat(), "break_out": b.break_out.isoformat() if b.break_out else None}
        for b in breaks
    ]
    return {
        "start_time": attendance.start_time.isoformat() if attendance.start_time else None,
        "end_time": attendance.end_time.isoformat() if attendance.end_time else None,
        "breaks": breaks_data
    }

# Break-In Route
@router.post("/break-in")
def break_in(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        func.date(Attendance.start_time) == today
    ).first()
    if not attendance:
        # Try to debug why attendance is not found
        all_today = db.query(Attendance).filter_by(date=today).all()
        print(f"Attendance for today: {all_today}")
        print(f"Current user ID: {current_user.id}")
        raise HTTPException(status_code=404, detail="No attendance record found for today.")
    # Create a new Break record
    new_break = Break(attendance_id=attendance.id, break_in=datetime.utcnow())
    db.add(new_break)
    db.commit()
    db.refresh(new_break)
    return {"msg": "Break started", "break_id": new_break.id, "break_in": new_break.break_in.isoformat()}

# Break-Out Route
@router.post("/break-out")
def break_out(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        func.date(Attendance.start_time) == today
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today.")
    
    # Find the latest open break (break_out is null)
    latest_break = db.query(Break).filter_by(attendance_id=attendance.id, break_out=None).order_by(Break.break_in.desc()).first()
    if not latest_break:
        raise HTTPException(status_code=404, detail="No open break found to end.")
    latest_break.break_out = datetime.utcnow()
    db.commit()
    db.refresh(latest_break)
    return {"msg": "Break ended", "break_id": latest_break.id, "break_out": latest_break.break_out.isoformat()}

# Attendance Summary for Dashboard
@router.get("/summary")
def attendance_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total = db.query(Attendance).filter_by(employee_id=current_user.id).count()
    present = db.query(Attendance).filter_by(employee_id=current_user.id).filter(Attendance.start_time.isnot(None)).count()
    absent = total - present
    leaves = db.query(Attendance).filter_by(employee_id=current_user.id).filter(Attendance.work_summary == "LEAVE").count()
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "leaves": leaves
    }
