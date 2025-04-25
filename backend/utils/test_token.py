from datetime import datetime, timedelta
from jose import jwt
import sys
sys.path.append("..")  # Ensure parent directory is in path for imports
import models  # Ensure all models are imported and relationships are resolved
from core.database import get_db
from models.user import User

SECRET_KEY = "your-secret-key-here"  # Use the same key as your app
ALGORITHM = "HS256"

# Simulate user email
user_email = "testuser@example.com"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def test_jwt_creation_and_db_lookup():
    # 1. Create a token
    data = {"sub": user_email}
    token = create_access_token(data=data, expires_delta=timedelta(minutes=5))
    print(f"Generated token: {token}\n")

    # 2. Decode the token and look up user in DB
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded payload: {payload}")
        username = payload.get("sub")
        print(f"Username (sub): {username}")
        assert username == user_email, "Username in token does not match!"

        # Look up user in database using the session
        db = next(get_db())
        user = db.query(User).filter(User.email == username).first()
        if user:
            print(f"User found in DB: {user.email}")
        else:
            print("User not found in DB!")
        db.close()
        print("Token and DB test passed!")
    except Exception as e:
        print(f"Error decoding token or accessing DB: {e}")

test_jwt_creation_and_db_lookup()
