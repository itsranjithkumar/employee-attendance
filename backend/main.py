from fastapi import FastAPI
from core.database import Base, engine
from routers.auth import router as auth_router
from routers.attendance import router as attendance_router
from routers.leave import router as leave_router
from routers.calendar import router as calendar_router
from routers.admin import router as admin_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. Use ["http://localhost:3000"] for more security.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, tags=["Auth"])
app.include_router(attendance_router, tags=["Attendance"])
app.include_router(leave_router)
app.include_router(calendar_router, tags=["Calendar"])
app.include_router(admin_router, tags=["Admin"])
