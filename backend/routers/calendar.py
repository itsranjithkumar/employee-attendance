from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from core.database import get_db
from models.attendance import Attendance
from models.leave import LeaveRequest, LeaveStatus
from utils.jwt_token import get_current_user
from typing import Dict

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get("/", response_model=Dict[str, str])
def get_calendar_view(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=1900),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Get first and last day of the month
    try:
        first_day = date(year, month, 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year or month")
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)

    # 1. Attendance records for the month
    attendance_records = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date >= first_day,
        Attendance.date <= last_day
    ).all()
    attendance_days = set([rec.date.date() if hasattr(rec.date, 'date') else rec.date for rec in attendance_records])

    # 2. Approved leave requests overlapping this month
    leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == current_user.id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.end_date >= first_day,
        LeaveRequest.start_date <= last_day
    ).all()
    leave_days = set()
    for leave in leave_requests:
        day = leave.start_date
        while day <= leave.end_date:
            if first_day <= day <= last_day:
                leave_days.add(day)
            day += timedelta(days=1)

    # 3. Build calendar status
    calendar = {}
    today = date.today()
    for d in range((last_day - first_day).days + 1):
        day = first_day + timedelta(days=d)
        day_str = day.isoformat()
        if day in attendance_days:
            calendar[day_str] = "present"
        elif day in leave_days:
            calendar[day_str] = "leave"
        elif day < today:
            # Skip weekends from being marked as absent
            if day.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
                calendar[day_str] = "weekend"
            else:
                calendar[day_str] = "absent"
        else:
            calendar[day_str] = "future"
    return calendar
