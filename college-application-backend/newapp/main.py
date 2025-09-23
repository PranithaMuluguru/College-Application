from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_
from newapp.database import SessionLocal, engine
from newapp import models
import random
import string
from passlib.context import CryptContext
import jwt
from typing import Optional, List

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="College App API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================ AUTH MODELS ================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    college_id: str
    department: str
    year: int
    phone_number: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

# ================ ACADEMIC MODELS ================
class TimetableEntryCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    course_name: str
    teacher: str
    room_number: str

class TimetableEntryUpdate(BaseModel):
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    course_name: Optional[str] = None
    teacher: Optional[str] = None
    room_number: Optional[str] = None

class ExamEntryCreate(BaseModel):
    exam_name: str
    date: str
    room_number: str
    additional_notes: Optional[str] = None

class ExamEntryUpdate(BaseModel):
    exam_name: Optional[str] = None
    date: Optional[str] = None
    room_number: Optional[str] = None
    additional_notes: Optional[str] = None

class GradeEntryCreate(BaseModel):
    course_name: str
    credits: float
    grade: str
    semester: str
    category_id: Optional[int] = None

class GradeEntryUpdate(BaseModel):
    course_name: Optional[str] = None
    credits: Optional[float] = None
    grade: Optional[str] = None
    semester: Optional[str] = None
    category_id: Optional[int] = None

# ================ UTILITY FUNCTIONS ================
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

def calculate_cgpa(grades):
    """Calculate CGPA based on grades"""
    grade_points = {
        'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
    }
    
    total_points = 0
    total_credits = 0
    
    for grade_entry in grades:
        points = grade_points.get(grade_entry.grade, 0)
        total_points += points * grade_entry.credits
        total_credits += grade_entry.credits
    
    return {
        'cgpa': round(total_points / total_credits if total_credits > 0 else 0, 2),
        'total_credits': total_credits
    }

# ================ AUTH ENDPOINTS ================
@app.post("/register/", response_model=dict)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(
        or_(
            models.User.email == user.email,
            models.User.college_id == user.college_id
        )
    ).first()
    
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email or College ID already registered"
        )
    
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

    # In production, send this via email
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found. Please check email or college ID."
        )
    
    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Account not verified. Please verify your email first."
        )
    
    if not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect password."
        )
    
    access_token = create_access_token(
        data={"sub": db_user.email, "user_id": db_user.id},
        expires_delta=timedelta(days=7)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "college_id": db_user.college_id,
            "department": db_user.department,
            "year": db_user.year,
            "phone_number": db_user.phone_number
        }
    }

# ================ TIMETABLE ENDPOINTS ================
@app.get("/timetable/{user_id}")
async def get_timetable(user_id: int, db: Session = Depends(get_db)):
    try:
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id
        ).all()
        return timetable_entries
    except Exception as e:
        print(f"Error fetching timetable: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching timetable"
        )

@app.post("/timetable/{user_id}")
async def create_timetable_entry(user_id: int, entry: TimetableEntryCreate, db: Session = Depends(get_db)):
    try:
        db_entry = models.TimetableEntry(
            user_id=user_id,
            day_of_week=entry.day_of_week,
            start_time=entry.start_time,
            end_time=entry.end_time,
            course_name=entry.course_name,
            teacher=entry.teacher,
            room_number=entry.room_number
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except Exception as e:
        print(f"Error creating timetable entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating timetable entry"
        )

@app.put("/timetable/{entry_id}")
async def update_timetable_entry(entry_id: int, entry: TimetableEntryUpdate, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Timetable entry not found")
        
        update_data = entry.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating timetable entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating timetable entry"
        )

@app.delete("/timetable/{entry_id}")
async def delete_timetable_entry(entry_id: int, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Timetable entry not found")
        
        db.delete(db_entry)
        db.commit()
        return {"message": "Timetable entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting timetable entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting timetable entry"
        )

# ================ EXAM ENDPOINTS ================
@app.get("/exams/{user_id}")
async def get_exams(user_id: int, db: Session = Depends(get_db)):
    try:
        exam_entries = db.query(models.ExamEntry).filter(models.ExamEntry.user_id == user_id).all()
        return exam_entries
    except Exception as e:
        print(f"Error fetching exams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching exams"
        )

@app.post("/exams/{user_id}")
async def create_exam_entry(user_id: int, entry: ExamEntryCreate, db: Session = Depends(get_db)):
    try:
        db_entry = models.ExamEntry(
            user_id=user_id,
            exam_name=entry.exam_name,
            date=entry.date,
            room_number=entry.room_number,
            additional_notes=entry.additional_notes
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except Exception as e:
        print(f"Error creating exam entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating exam entry"
        )

@app.put("/exams/{entry_id}")
async def update_exam_entry(entry_id: int, entry: ExamEntryUpdate, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.ExamEntry).filter(models.ExamEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Exam entry not found")
        
        update_data = entry.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating exam entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating exam entry"
        )

@app.delete("/exams/{entry_id}")
async def delete_exam_entry(entry_id: int, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.ExamEntry).filter(models.ExamEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Exam entry not found")
        
        db.delete(db_entry)
        db.commit()
        return {"message": "Exam entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting exam entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting exam entry"
        )

# ================ GRADE ENDPOINTS ================
@app.get("/grades/{user_id}")
async def get_grades(user_id: int, db: Session = Depends(get_db)):
    try:
        grade_entries = db.query(models.GradeEntry).filter(models.GradeEntry.user_id == user_id).all()
        return grade_entries
    except Exception as e:
        print(f"Error fetching grades: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching grades"
        )

@app.get("/grades/cgpa/{user_id}")
async def get_cgpa(user_id: int, db: Session = Depends(get_db)):
    try:
        grade_entries = db.query(models.GradeEntry).filter(models.GradeEntry.user_id == user_id).all()
        return calculate_cgpa(grade_entries)
    except Exception as e:
        print(f"Error calculating CGPA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating CGPA"
        )

@app.post("/grades/{user_id}")
async def create_grade_entry(user_id: int, entry: GradeEntryCreate, db: Session = Depends(get_db)):
    try:
        db_entry = models.GradeEntry(
            user_id=user_id,
            course_name=entry.course_name,
            credits=entry.credits,
            grade=entry.grade,
            semester=entry.semester,
            category_id=entry.category_id
        )
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except Exception as e:
        print(f"Error creating grade entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating grade entry"
        )

@app.put("/grades/{entry_id}")
async def update_grade_entry(entry_id: int, entry: GradeEntryUpdate, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.GradeEntry).filter(models.GradeEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Grade entry not found")
        
        update_data = entry.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating grade entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating grade entry"
        )

@app.delete("/grades/{entry_id}")
async def delete_grade_entry(entry_id: int, db: Session = Depends(get_db)):
    try:
        db_entry = db.query(models.GradeEntry).filter(models.GradeEntry.id == entry_id).first()
        
        if not db_entry:
            raise HTTPException(status_code=404, detail="Grade entry not found")
        
        db.delete(db_entry)
        db.commit()
        return {"message": "Grade entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting grade entry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting grade entry"
        )

@app.get("/")
async def root():
    return {"message": "College App API is running", "status": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)