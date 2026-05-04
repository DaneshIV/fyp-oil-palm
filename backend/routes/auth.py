from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ── Config ───────────────────────────────────────────────────
SECRET_KEY  = os.getenv("JWT_SECRET_KEY", "fyp-oil-palm-secret-key-2024")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security    = HTTPBearer()

# ── Users ────────────────────────────────────────────────────
USERS = {
    "admin":  {"username": "admin",  "password": "fyp2024",     "role": "admin"},
    "danesh": {"username": "danesh", "password": "oilpalm2024", "role": "admin"}
}

# ── Schemas (MUST be before endpoints) ──────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    username:     str
    expires_in:   int

# ── Helpers ──────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload  = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ── Endpoints ────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = USERS.get(data.username)
    if not user or data.password != user["password"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": data.username, "role": user["role"]})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "username":     data.username,
        "expires_in":   ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/verify")
def verify(username: str = Depends(verify_token)):
    return {"valid": True, "username": username}

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}