from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from core.database import get_db
from models.leave import LeaveRequest, LeaveType, LeaveStatus
from models.user import User
from schemas.leave import LeaveRequestCreate, LeaveRequestResponse, LeaveBalanceResponse
from utils.jwt_token import get_current_user

router = APIRouter(prefix="/leave", tags=["Leave"])

@router.post("/apply", response_model=LeaveRequestResponse)
def apply_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    # You may want to check admin privileges here
    return db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).order_by(LeaveRequest.applied_at.desc()).all()

@router.post("/approve/{leave_id}", response_model=LeaveRequestResponse)
def approve_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = LeaveStatus.APPROVED
    leave.reviewed_at = date.today()
    leave.reviewed_by = current_user.id
    db.commit()
    db.refresh(leave)
    return leave

@router.post("/reject/{leave_id}", response_model=LeaveRequestResponse)
def reject_leave(leave_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
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
