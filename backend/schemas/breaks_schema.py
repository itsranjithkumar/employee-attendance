from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BreakSchema(BaseModel):
    id: int
    attendance_id: int
    break_in: datetime
    break_out: Optional[datetime] = None

    class Config:
        orm_mode = True

class BreakCreate(BaseModel):
    break_in: datetime
    break_out: Optional[datetime] = None
