from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from core.database import get_db
from models.leave import LeaveRequest, LeaveType, LeaveStatus
from models.user import User
from schemas.leave import LeaveRequestCreate, LeaveRequestResponse, LeaveBalanceResponse
from utils.jwt_token import get_current_user

router = APIRouter(prefix="/leave", tags=["Leave"])

def is_admin(current_user: User):
    # Only allow the specific admin email
    if current_user.role != "admin" or current_user.email != "ranjithhhh@eexample.com":
        raise HTTPException(status_code=403, detail="Not authorized: Only this admin can perform this action")

@router.post("/apply", response_model=LeaveRequestResponse)
def apply_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Date validation
    if request.start_date > request.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
    # Overlap check
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == current_user.id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.end_date >= request.start_date,
        LeaveRequest.start_date <= request.end_date
    ).first()
    if overlap:
        raise HTTPException(status_code=400, detail="Leave overlaps with existing approved leave")
    leave = LeaveRequest(
        employee_id=current_user.id,
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave

@router.get("/my-requests", response_model=List[LeaveRequestResponse])
def my_leave_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id).order_by(LeaveRequest.applied_at.desc()).all()

@router.get("/pending", response_model=List[LeaveRequestResponse])
def pending_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    return db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).order_by(LeaveRequest.applied_at.desc()).all()

@router.post("/approve/{leave_id}", response_model=LeaveRequestResponse)
def approve_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Leave already processed")
    # Deduct leave balance
    user = db.query(User).filter(User.id == leave.employee_id).first()
    num_days = (leave.end_date - leave.start_date).days + 1
    if leave.leave_type == LeaveType.CASUAL:
        if user.casual_leave_balance < num_days:
            raise HTTPException(status_code=400, detail="Insufficient casual leave balance")
        user.casual_leave_balance -= num_days
    elif leave.leave_type == LeaveType.SICK:
        if user.sick_leave_balance < num_days:
            raise HTTPException(status_code=400, detail="Insufficient sick leave balance")
        user.sick_leave_balance -= num_days
    elif leave.leave_type == LeaveType.WFH:
        if user.wfh_balance < num_days:
            raise HTTPException(status_code=400, detail="Insufficient WFH balance")
        user.wfh_balance -= num_days
    leave.status = LeaveStatus.APPROVED
    leave.reviewed_at = date.today()
    leave.reviewed_by = current_user.id
    db.commit()
    db.refresh(leave)
    return leave

@router.post("/reject/{leave_id}", response_model=LeaveRequestResponse)
def reject_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Leave already processed")
    leave.status = LeaveStatus.REJECTED
    leave.reviewed_at = date.today()
    leave.reviewed_by = current_user.id
    db.commit()
    db.refresh(leave)
    return leave

@router.get("/balance", response_model=LeaveBalanceResponse)
def get_leave_balance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return LeaveBalanceResponse(
        casual_leave_balance=current_user.casual_leave_balance,
        sick_leave_balance=current_user.sick_leave_balance,
        wfh_balance=current_user.wfh_balance
    )
