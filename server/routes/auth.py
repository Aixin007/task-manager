from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import resend
from database import get_db
from models.user import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
import pyotp, os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

class RegisterInput(BaseModel):
    email: str
    password: str
    phone: str = None

class LoginInput(BaseModel):
    email: str
    password: str

class OTPInput(BaseModel):
    email: str
    otp: str

def create_token(user_id: int):
    expire = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(data.password[:72])
    otp_secret = pyotp.random_base32()
    user = User(email=data.email, hashed_password=hashed, phone=data.phone, otp_secret=otp_secret)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Registered successfully"}

@router.post("/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password[:72], user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    totp = pyotp.TOTP(user.otp_secret, interval=300)
    otp = totp.now()
    resend.api_key = os.getenv("RESEND_API_KEY")
    resend.Emails.send({
        "from": "TaskFlow <onboarding@resend.dev>",
        "to": user.email,
        "subject": "Your TaskFlow OTP",
        "html": f"<p>Your OTP is: <strong>{otp}</strong>. Valid for 5 minutes.</p>"
    })
    return {"message": "OTP sent to your email"}

@router.post("/verify-otp")
def verify_otp(data: OTPInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    totp = pyotp.TOTP(user.otp_secret, interval=300)
    if not totp.verify(data.otp, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    user.is_verified = True
    db.commit()
    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer"}