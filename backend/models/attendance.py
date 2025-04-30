from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
from .breaks import Break  # Correct relative import for Break model

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    break_in = Column(DateTime, nullable=True)
    break_out = Column(DateTime, nullable=True)
    work_summary = Column(String, nullable=True)

    # Relationship to Breaks
    breaks = relationship(Break, back_populates="attendance", cascade="all, delete-orphan")

    employee = relationship("User", back_populates="attendance")
