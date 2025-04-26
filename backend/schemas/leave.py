from pydantic import BaseModel
from datetime import date, datetime
from enum import Enum
from typing import Optional

class LeaveType(str, Enum):
    CASUAL = "CASUAL"
    SICK = "SICK"
    WFH = "WFH"

class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str]
    status: LeaveStatus
    applied_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[int]

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    casual_leave_balance: int
    sick_leave_balance: int
    wfh_balance: int

    class Config:
        from_attributes = True
