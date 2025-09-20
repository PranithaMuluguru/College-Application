from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_
from newapp.database import SessionLocal, engine
from newapp import models,schemas
import random
import string
from passlib.context import CryptContext
import jwt

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="College App API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    college_id: str
    department: str
    year: int
    phone_number: str

class UserLogin(BaseModel):
    identifier: str  # can be email or college_id
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

# Utility functions
def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# API Endpoints
@app.post("/register/", response_model=dict)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        college_id=user.college_id,
        department=user.department,
        year=user.year,
        phone_number=user.phone_number,
        verification_otp=otp,
        otp_expiry=otp_expiry,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # In production, send OTP via email
    print(f"OTP for {user.email}: {otp}")
    return {"message": "Registration successful. Check your email for the OTP."}

@app.post("/verify-otp/", response_model=dict)
async def verify_otp(otp_data: OTPVerify, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if db_user.is_verified:
        return {"message": "User already verified"}
    if db_user.verification_otp != otp_data.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    if datetime.utcnow() > db_user.otp_expiry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")
    
    db_user.is_verified = True
    db_user.verification_otp = None
    db_user.otp_expiry = None
    db.commit()
    return {"message": "Email verified successfully"}

@app.post("/login/", response_model=dict)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        or_(
            models.User.email == login_data.identifier,
            models.User.college_id == login_data.identifier
        )
    ).first()
    
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found. Please check email or college ID.")
    if not db_user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not verified. Please verify your email first.")
    if not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password.")
    
    access_token = create_access_token(
        data={"sub": db_user.email, "user_id": db_user.id},
        expires_delta=timedelta(days=7)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "college_id": db_user.college_id
    }




@app.get("/")
async def root():
    return {"message": "College App API is running", "status": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
