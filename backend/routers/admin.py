from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models.user import User
from models.attendance import Attendance
from schemas.user import UserCreate, UserResponse
from core.database import get_db
from utils.jwt_token import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

# Utility: Check admin

def is_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")

# 1. List all users
@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    return db.query(User).all()

# 2. Create user
@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    from core.security import hash_password
    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 3. Edit user
@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(user_id: int, user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.name = user.name
    db_user.email = user.email
    from core.security import hash_password
    db_user.hashed_password = hash_password(user.password)
    db.commit()
    db.refresh(db_user)
    return db_user

# 4. Delete user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"msg": "User deleted"}

# 5. Monitor daily logs
@router.get("/attendance")
def monitor_attendance(date: str = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_admin(current_user)
    try:
        query_date = date
        # Accept both YYYY-MM-DD and date obj
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format")
    records = db.query(Attendance).filter(Attendance.date == query_date).all()
    return [
        {
            "employee_id": rec.employee_id,
            "attendance_id": rec.id,
            "date": rec.date,
            "start_time": rec.start_time,
            "end_time": rec.end_time,
            "work_summary": rec.work_summary
        }
        for rec in records
    ]

# (Attendance manual edit/add endpoints will be next)
