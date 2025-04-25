from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttendanceStart(BaseModel):
    work_summary: Optional[str] = None

class AttendanceEnd(BaseModel):
    work_summary: Optional[str] = None

class BreakSchema(BaseModel):
    pass  # For break_in and break_out, no body needed
