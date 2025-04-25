from fastapi import FastAPI
from core.database import Base, engine
from routers.auth import router as auth_router
from routers.attendance import router as attendance_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router, tags=["Auth"])
app.include_router(attendance_router, tags=["Attendance"])
