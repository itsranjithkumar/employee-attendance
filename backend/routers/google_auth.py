from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from models import user as user_model
from core.database import engine, Base
from sqlalchemy.orm import Session
from core.security import create_access_token

router = APIRouter()

class GoogleToken(BaseModel):
    token: str

@router.post("/google-login")
async def google_login(data: GoogleToken):
    try:
        idinfo = id_token.verify_oauth2_token(
            data.token, requests.Request(), "853434167999-0aj5opdatd6i58n6uifanipcchfkunqd.apps.googleusercontent.com"
        )
        email = idinfo.get("email")
        name = idinfo.get("name")
        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")
        # Check if user exists, else create
        db = Session(bind=engine)
        user = db.query(user_model.User).filter_by(email=email).first()
        if not user:
            user = user_model.User(email=email, name=name, hashed_password="", role="user")
            db.add(user)
            db.commit()
            db.refresh(user)
        token = create_access_token({"sub": user.email})
        db.close()
        return {"access_token": token, "token_type": "bearer"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
