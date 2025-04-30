from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class Break(Base):
    __tablename__ = "breaks"

    id = Column(Integer, primary_key=True, index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id"), nullable=False)
    break_in = Column(DateTime, nullable=False, default=datetime.utcnow)
    break_out = Column(DateTime, nullable=True)

    attendance = relationship("Attendance", back_populates="breaks")
