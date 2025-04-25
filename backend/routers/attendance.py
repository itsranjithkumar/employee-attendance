from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.attendance import Attendance
from schemas.attendance_schema import AttendanceStart, AttendanceEnd
from datetime import datetime
from utils.token import get_current_user

router = APIRouter()

# Start Day Route
@router.post("/attendance/start")
def start_day(data: AttendanceStart, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()  # Get the current date in UTC
    # Check if the user already has an attendance record for today
    existing = db.query(Attendance).filter_by(employee_id=current_user.id, date=today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already started today.")
    
    # Create a new attendance record
    attendance = Attendance(
        employee_id=current_user.id,
        start_time=datetime.utcnow(),
        work_summary=data.work_summary
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return {"msg": "Day started", "attendance_id": attendance.id}

# End Day Route
@router.post("/attendance/end")
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
    return {"msg": "Day ended"}

# Break-In Route
@router.post("/attendance/break-in")
def break_in(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter_by(employee_id=current_user.id, date=today).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today.")
    
    # Mark the break-in time
    attendance.break_in = datetime.utcnow()
    db.commit()
    return {"msg": "Break started"}

# Break-Out Route
@router.post("/attendance/break-out")
def break_out(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.utcnow().date()
    attendance = db.query(Attendance).filter_by(employee_id=current_user.id, date=today).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance record found for today.")
    
    # Mark the break-out time
    attendance.break_out = datetime.utcnow()
    db.commit()
    return {"msg": "Break ended"}
