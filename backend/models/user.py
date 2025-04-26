# models/user.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Relationship to Attendance model
    attendance = relationship("Attendance", back_populates="employee")
    # Relationship to LeaveRequest model
    leave_requests = relationship(
        "LeaveRequest",
        back_populates="employee",
        foreign_keys="LeaveRequest.employee_id"
    )

    # Leave balances
    casual_leave_balance = Column(Integer, default=12)  # Example: 12 per year
    sick_leave_balance = Column(Integer, default=8)    # Example: 8 per year
    wfh_balance = Column(Integer, default=10)          # Example: 10 per year
