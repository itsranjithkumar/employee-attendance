# Remove the 'app' prefix from imports
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.user import UserCreate, UserLogin, UserResponse
from models.user import User
from core.database import SessionLocal, get_db
from core.security import hash_password, verify_password
from utils.jwt_token import create_access_token, get_current_user
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login_json(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/user/me")
def get_me(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }