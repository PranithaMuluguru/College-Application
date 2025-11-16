from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Depends, HTTPException, status,Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr,validator
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import or_, text, func,and_
from typing import Optional, List
from enum import Enum
import random
import string
from passlib.context import CryptContext
import jwt
from difflib import SequenceMatcher

import traceback

from newapp.database import SessionLocal, engine
from newapp import models
from newapp.ai_service import AIAssistant
from newapp.web_scraper import scrape_iitpkd_website

# Add to your main.py
from newapp.admin_auth import router as admin_auth_router
from newapp.create_default_admin import create_default_admin
from newapp.study_buddy_routes import router as study_buddy_router

# Import new routers
from . import course_routes
from . import study_buddy_routes

# ###########CLUBS    
# # from .auth import router as auth_router
from .admin_auth import router as admin_auth_router
# # from .routes.admin import router as admin_router
# from .routes.clubs import router as clubs_router
# from .routes.club_members import router as club_members_router
# from .routes.club_follows import router as club_follows_router
# from .routes.club_events import router as club_events_router
# from .routes.club_announcements import router as club_announcements_router
# from .routes.club_photos import router as club_photos_router
# from .routes.club_achievements import router as club_achievements_router
# from .routes.calendar import router as calendar_router
# # from .middleware.performance import PerformanceMiddleware, SystemMetricsMiddleware
# # from .config.settings import settings
from .club_routes import router as club_routes_router
from .admin_routes import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)  # Add this line!

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting up...")
    models.Base.metadata.create_all(bind=engine)
    
    from newapp.create_default_admin import create_default_admin
    create_default_admin()
    
    yield
    print("🛑 Shutting down...")

app = FastAPI(title="College App API", version="1.0.0",lifespan = lifespan)

# app.include_router(admin_router)





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





@app.get("/")
async def root():
    return {"message": "College App API is running"}


# Debug routes on startup

app.include_router(admin_auth_router)
# # app.include_router(auth_router, prefix="/auth", tags=["authentication"])
# app.include_router(admin_auth_router, prefix="/admin/auth", tags=["admin-auth"])
# # app.include_router(admin_router, prefix="/admin", tags=["admin"])
# app.include_router(clubs_router, prefix="/clubs", tags=["clubs"])
# app.include_router(club_members_router, prefix="/clubs", tags=["club-members"])
# app.include_router(club_follows_router, prefix="/clubs", tags=["club-follows"])
# app.include_router(club_events_router, prefix="/events", tags=["club-events"])
# app.include_router(club_announcements_router, prefix="/announcements", tags=["club-announcements"])
# app.include_router(club_photos_router, prefix="/photos", tags=["club-photos"])
# app.include_router(club_achievements_router, prefix="/achievements", tags=["club-achievements"])
# app.include_router(calendar_router, prefix="/calendar", tags=["calendar"])
# Include routers
app.include_router(course_routes.router)
app.include_router(study_buddy_routes.router)
app.include_router(club_routes_router)  # /clubs
app.include_router(admin_router)  # /admin
app.include_router(study_buddy_router)  # /study-buddy




# Import router and verify it exists
print("\n🔍 Checking admin_auth router...")
try:
    from newapp import admin_auth
    print(f"✓ Module imported: {admin_auth}")
    print(f"✓ Router object: {admin_auth.router}")
    print(f"✓ Router prefix: {admin_auth.router.prefix}")
    print(f"✓ Number of routes: {len(admin_auth.router.routes)}")
    
    # Include the router
    app.include_router(admin_auth.router)
    print("✓ Router included successfully\n")
    
except Exception as e:
    print(f"✗ Failed to import/include router: {e}")
    import traceback
    traceback.print_exc()

# Debug: Print all routes
@app.on_event("startup")
async def print_routes():
    print("\n" + "="*70)
    print("📋 REGISTERED ROUTES:")
    print("="*70)
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(route.methods)
            print(f"  {methods:8} {route.path}")
    print("="*70 + "\n")



@app.post("/admin/auth/login")
async def test_inline_login(data: dict):
    return {"message": "Inline route works!", "data": data}

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Course models
class CourseCreate(BaseModel):
    course_name: str
    teacher: str
    start_date: Optional[str] = None

# Attendance models
class AttendanceStatusEnum(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    CANCELLED = "cancelled"

class AttendanceRecordCreate(BaseModel):
    timetable_entry_id: int
    date: str
    status: AttendanceStatusEnum
    notes: Optional[str] = None

class AttendanceRecordUpdate(BaseModel):
    status: Optional[AttendanceStatusEnum] = None
    notes: Optional[str] = None

# ================ AUTH MODELS ================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    college_id: str
    department: str
    year: int
    phone_number: str
    @validator('year')
    def validate_year(cls, v):
        if v < 1 or v > 5:  # Adjust range as needed
            raise ValueError('Year must be between 1 and 5')
        return v

class UserLogin(BaseModel):
    identifier: str
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

# ================ TODO MODELS ================
class TodoItemCreate(BaseModel):
    task: str
    priority: Optional[str] = "medium"

class TodoItemUpdate(BaseModel):
    task: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None

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

# ================ MESS MENU MODELS ================
class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class MealType(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACKS = "Snacks"
    DINNER = "Dinner"

class MenuWeekType(str, Enum):
    WEEK_1 = "Week 1"
    WEEK_2 = "Week 2"

class MessMenuItemCreate(BaseModel):
    day_of_week: DayOfWeek
    meal_type: MealType
    menu_week_type: MenuWeekType
    item_name: str
    description: Optional[str] = None
    rating: Optional[float] = 0.0
    votes: Optional[int] = 0

# ================ AI MODELS ================
class ChatMessage(BaseModel):
    message: str

class AddAnswerRequest(BaseModel):
    question_id: int
    answer: str
    category: Optional[str] = None

# ================ CALENDAR EVENT MODELS ================
class EventType(str, Enum):
    ACADEMIC = "Academic"
    EXAM = "Exam"
    ASSIGNMENT = "Assignment"
    CLUB = "Club"
    SPORTS = "Sports"
    CULTURAL = "Cultural"
    WORKSHOP = "Workshop"
    OTHER = "Other"

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    is_all_day: Optional[bool] = False
    reminder_minutes: Optional[int] = 30

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    reminder_minutes: Optional[int] = None

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

def get_current_menu_week_type():
    """Get current week type based on week number"""
    now = datetime.utcnow()
    week_number = now.isocalendar().week
    if week_number % 4 in [1, 3]:  # Weeks 1 and 3 of month
        return "WEEK_1"
    else:  # Weeks 2 and 4 of month
        return "WEEK_2"

def fix_database_schema(db: Session):
    """Fix the database schema by adding missing columns"""
    try:
        # Add missing columns if they don't exist
        
        # Check if course_id exists in timetable_entries
        try:
            db.execute(text("SELECT course_id FROM timetable_entries LIMIT 1"))
        except:
            print("Adding course_id column to timetable_entries")
            db.execute(text("ALTER TABLE timetable_entries ADD COLUMN course_id INTEGER REFERENCES courses(id)"))
        
        # Check if start_date exists in courses
        try:
            db.execute(text("SELECT start_date FROM courses LIMIT 1"))
        except:
            print("Adding start_date column to courses")
            db.execute(text("ALTER TABLE courses ADD COLUMN start_date DATE"))
        
        db.commit()
        print("Database schema fixed successfully")
    except Exception as e:
        print(f"Error fixing database schema: {e}")
        db.rollback()

def fix_todo_table_schema(db: Session):
    """Fix the todo_items table schema"""
    try:
        # Drop the existing table if it has wrong schema
        db.execute(text("DROP TABLE IF EXISTS todo_items"))
        db.commit()
        
        # Recreate the table with correct schema
        models.TodoItem.__table__.create(bind=engine, checkfirst=True)
        db.commit()
        
        print("TodoItem table schema fixed successfully")
    except Exception as e:
        print(f"Error fixing TodoItem table schema: {e}")
        db.rollback()

# ================ MESS MENU DATA POPULATION ================
def populate_mess_menu_data(db: Session):
    """Populate database with authentic mess menu data from PDF"""
    try:
        # Check if data already exists
        existing_count = db.query(models.MessMenuItem).count()
        if existing_count > 0:
            print(f"Mess menu data already exists ({existing_count} items)")
            return

        print("Populating mess menu data from PDF...")

        # WEEK 1 & 3 MENU DATA (from PDF page 1)
        week2_menu = {
            "MONDAY": {
                "BREAKFAST": [
                    {"name": "Bread", "desc": "Common", "rating": 3.8},
                    {"name": "Butter", "desc": "Common", "rating": 4.0},
                    {"name": "Jam", "desc": "Common", "rating": 3.9},
                    {"name": "Milk", "desc": "Common", "rating": 4.1},
                    {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
                    {"name": "Sprouts/Chana", "desc": "Common", "rating": 4.2},
                    {"name": "Aloo Paratha", "desc": "Main", "rating": 4.3},
                    {"name": "Ketchup", "desc": "Side", "rating": 3.5},
                    {"name": "Curd", "desc": "Side", "rating": 4.0},
                    {"name": "Mint & Coriander Chutney", "desc": "Side", "rating": 4.1}
                ],
                "LUNCH": [
                    {"name": "Mix Pickle", "desc": "Common", "rating": 3.7},
                    {"name": "Papad", "desc": "Common", "rating": 3.8},
                    {"name": "Mix Salad", "desc": "Common", "rating": 3.6},
                    {"name": "Onion", "desc": "Common", "rating": 3.5},
                    {"name": "Lemon", "desc": "Common", "rating": 3.4},
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Kerala Rice", "desc": "Main", "rating": 4.2},
                    {"name": "Chana Masala", "desc": "Curry", "rating": 4.4},
                    {"name": "Arhar Dal", "desc": "Curry", "rating": 4.2},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "SNACKS": [
                    {"name": "Tea/Coffee", "desc": "Common", "rating": 3.8},
                    {"name": "Sugar", "desc": "Common", "rating": 3.0},
                    {"name": "Onion Kachori", "desc": "Snack", "rating": 4.2},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
                    {"name": "Fried Chilly", "desc": "Side", "rating": 3.7}
                ],
                "DINNER": [
                    {"name": "Appalam", "desc": "Common", "rating": 3.8},
                    {"name": "Mixed Salad", "desc": "Common", "rating": 3.6},
                    {"name": "Pickle", "desc": "Common", "rating": 3.7},
                    {"name": "Egg Fried Rice", "desc": "Non-Veg", "rating": 4.5},
                    {"name": "Gobhi Fried Rice", "desc": "Veg", "rating": 4.2},
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Dal Tadka", "desc": "Curry", "rating": 4.3},
                    {"name": "Garlic Sauce", "desc": "Side", "rating": 3.6}
                ]
            },
            "TUESDAY": {
                "BREAKFAST": [
                    {"name": "Bread", "desc": "Common", "rating": 3.8},
                    {"name": "Butter", "desc": "Common", "rating": 4.0},
                    {"name": "Jam", "desc": "Common", "rating": 3.9},
                    {"name": "Milk", "desc": "Common", "rating": 4.1},
                    {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
                    {"name": "Masala Dosa", "desc": "Main", "rating": 4.4},
                    {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2}
                ],
                "LUNCH": [
                    {"name": "Puri", "desc": "Main", "rating": 4.2},
                    {"name": "Aloo Palak", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Ridge Gourd Dry", "desc": "Vegetable", "rating": 3.7},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Buttermilk", "desc": "Drink", "rating": 4.1},
                    {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0},
                    {"name": "Kerala Rice", "desc": "Main", "rating": 4.2}
                ],
                "SNACKS": [
                    {"name": "Aloo Bonda", "desc": "Snack", "rating": 4.3},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
                ],
                "DINNER": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Chole Masala", "desc": "Curry", "rating": 4.5},
                    {"name": "Jeera Rice", "desc": "Rice", "rating": 4.2},
                    {"name": "Dal", "desc": "Curry", "rating": 4.2},
                    {"name": "Raita Plain", "desc": "Side", "rating": 4.0},
                    {"name": "Ice Cream", "desc": "Dessert", "rating": 4.6}
                ]
            },
            "WEDNESDAY": {
                "BREAKFAST": [
                    {"name": "Dal Kitchdi", "desc": "Main", "rating": 4.0},
                    {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2},
                    {"name": "Dahi Boondhi", "desc": "Side", "rating": 3.9},
                    {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Green Peas Masala", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Tomato Rice", "desc": "Rice", "rating": 4.1},
                    {"name": "Onion Raita", "desc": "Side", "rating": 3.9},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0},
                    {"name": "Chana Dal Fry", "desc": "Curry", "rating": 4.2}
                ],
                "SNACKS": [
                    {"name": "Masala Chana", "desc": "Snack", "rating": 4.1}
                ],
                "DINNER": [
                    {"name": "Hyderabadi Paneer Dish", "desc": "Veg", "rating": 4.4},
                    {"name": "Hyderabadi Chicken Masala", "desc": "Non-Veg", "rating": 4.7},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Moong Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Lachcha Paratha", "desc": "Main", "rating": 4.3},
                    {"name": "Laddu", "desc": "Sweet", "rating": 4.5},
                    {"name": "Lemon", "desc": "Side", "rating": 3.4}
                ]
            },
            "THURSDAY": {
                "BREAKFAST": [
                    {"name": "Puri", "desc": "Main", "rating": 4.2},
                    {"name": "Chana Masala", "desc": "Curry", "rating": 4.4}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Gobhi Butter Masala", "desc": "Vegetable", "rating": 4.2},
                    {"name": "Bottle Gourd Dry", "desc": "Vegetable", "rating": 3.6},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "SNACKS": [
                    {"name": "Tikki Chat", "desc": "Snack", "rating": 4.2}
                ],
                "DINNER": [
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Masala Dosa", "desc": "Main", "rating": 4.4},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Coriander Chutney", "desc": "Side", "rating": 4.1},
                    {"name": "Payasam", "desc": "Sweet", "rating": 4.4},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0}
                ]
            },
            "FRIDAY": {
                "BREAKFAST": [
                    {"name": "Fried Idly", "desc": "Main", "rating": 4.1},
                    {"name": "Vada", "desc": "Side", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2}
                ],
                "LUNCH": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Kadai Veg", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Potato Cabbage Dry", "desc": "Vegetable", "rating": 3.8},
                    {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
                ],
                "SNACKS": [
                    {"name": "Pungulu", "desc": "Snack", "rating": 4.0},
                    {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2}
                ],
                "DINNER": [
                    {"name": "Chicken Gravy", "desc": "Non-Veg", "rating": 4.6},
                    {"name": "Paneer Butter Masala", "desc": "Veg", "rating": 4.5},
                    {"name": "Pulao", "desc": "Rice", "rating": 4.3},
                    {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
                    {"name": "Lemon", "desc": "Side", "rating": 3.4},
                    {"name": "Jalebi", "desc": "Sweet", "rating": 4.4}
                ]
            },
            "SATURDAY": {
                "BREAKFAST": [
                    {"name": "Gobhi Mix Veg Paratha", "desc": "Main", "rating": 4.2},
                    {"name": "Ketchup", "desc": "Side", "rating": 3.5},
                    {"name": "Green Coriander Chutney", "desc": "Side", "rating": 4.1},
                    {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Rajma Masala", "desc": "Curry", "rating": 4.4},
                    {"name": "Green Vegetable Dry", "desc": "Vegetable", "rating": 3.8},
                    {"name": "Ginger Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Gongura Chutney", "desc": "Side", "rating": 3.9},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "SNACKS": [
                    {"name": "Samosa", "desc": "Snack", "rating": 4.3},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
                    {"name": "Cold Coffee", "desc": "Drink", "rating": 4.2}
                ],
                "DINNER": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Green Peas Masala", "desc": "Vegetable", "rating": 4.0},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Brinjal Curry", "desc": "Vegetable", "rating": 3.9},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0}
                ]
            },
            "SUNDAY": {
                "BREAKFAST": [
                    {"name": "Onion Rava Dosa", "desc": "Main", "rating": 4.2},
                    {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2}
                ],
                "LUNCH": [
                    {"name": "Chicken Dum Biryani", "desc": "Non-Veg", "rating": 4.8},
                    {"name": "Paneer Dum Biryani", "desc": "Veg", "rating": 4.6},
                    {"name": "Shorba Masala", "desc": "Curry", "rating": 4.2},
                    {"name": "Onion Raita", "desc": "Side", "rating": 4.0},
                    {"name": "Aam Panna", "desc": "Drink", "rating": 4.3}
                ],
                "SNACKS": [
                    {"name": "Vada Pav", "desc": "Snack", "rating": 4.4},
                    {"name": "Fried Green Chilly", "desc": "Side", "rating": 3.7},
                    {"name": "Green Coriander Chutney", "desc": "Side", "rating": 4.1}
                ],
                "DINNER": [
                    {"name": "Arhar Dal Tadka", "desc": "Curry", "rating": 4.2},
                    {"name": "Aloo Fry", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Kadhi Pakoda", "desc": "Curry", "rating": 4.3},
                    {"name": "Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Chapati", "desc": "Main", "rating": 4.1},
                    {"name": "Gulab Jamun", "desc": "Sweet", "rating": 4.5}
                ]
            }
        }

        # WEEK 2 & 4 MENU DATA (from PDF page 2)
        week1_menu = {
            "MONDAY": {
                "BREAKFAST": [
                    {"name": "Bread", "desc": "Common", "rating": 3.8},
                    {"name": "Butter", "desc": "Common", "rating": 4.0},
                    {"name": "Jam", "desc": "Common", "rating": 3.9},
                    {"name": "Milk", "desc": "Common", "rating": 4.1},
                    {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
                    {"name": "Aloo Paratha", "desc": "Main", "rating": 4.3},
                    {"name": "Ketchup", "desc": "Side", "rating": 3.5},
                    {"name": "Curd", "desc": "Side", "rating": 4.0},
                    {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0},
                    {"name": "Mint & Coriander Chutney", "desc": "Side", "rating": 4.1}
                ],
                "LUNCH": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Ghee Rice", "desc": "Rice", "rating": 4.3},
                    {"name": "Aloo Chana Masala", "desc": "Curry", "rating": 4.2},
                    {"name": "Soya Chilly", "desc": "Vegetable", "rating": 3.9},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0},
                    {"name": "Chutney", "desc": "Side", "rating": 3.9},
                    {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
                ],
                "SNACKS": [
                    {"name": "Macaroni", "desc": "Snack", "rating": 4.0}
                ],
                "DINNER": [
                    {"name": "Paneer Biryani", "desc": "Veg", "rating": 4.5},
                    {"name": "Egg Biryani", "desc": "Non-Veg", "rating": 4.6},
                    {"name": "Raita", "desc": "Side", "rating": 4.0},
                    {"name": "Mutter Masala", "desc": "Vegetable", "rating": 4.1},
                    {"name": "Chana Dal Tadka", "desc": "Curry", "rating": 4.2},
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Makhan Peda", "desc": "Sweet", "rating": 4.4},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0}
                ]
            },
            "TUESDAY": {
                "BREAKFAST": [
                    {"name": "Poha", "desc": "Main", "rating": 4.1},
                    {"name": "Coriander Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "LUNCH": [
                    {"name": "Chola Bhatura", "desc": "Main", "rating": 4.5},
                    {"name": "Toor Dal Fry", "desc": "Curry", "rating": 4.1},
                    {"name": "Watermelon", "desc": "Fruit", "rating": 4.2},
                    {"name": "Aloo Bhindi Dry", "desc": "Vegetable", "rating": 3.8},
                    {"name": "Lemon Rice", "desc": "Rice", "rating": 4.1},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "SNACKS": [
                    {"name": "Bread Pakoda", "desc": "Snack", "rating": 4.2},
                    {"name": "Sauce", "desc": "Side", "rating": 3.4}
                ],
                "DINNER": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Methi Dal", "desc": "Curry", "rating": 4.0},
                    {"name": "Veg White Kurma", "desc": "Vegetable", "rating": 4.1},
                    {"name": "Ice Cream", "desc": "Dessert", "rating": 4.6}
                ]
            },
            "WEDNESDAY": {
                "BREAKFAST": [
                    {"name": "Puttu", "desc": "Main", "rating": 3.9},
                    {"name": "Kadala Curry", "desc": "Curry", "rating": 4.1},
                    {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "Methi Dal", "desc": "Curry", "rating": 4.0},
                    {"name": "Drumstick Gravy", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Dondakaya Dry", "desc": "Vegetable", "rating": 3.7},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0},
                    {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
                ],
                "SNACKS": [
                    {"name": "Grilled Sandwich", "desc": "Snack", "rating": 4.2},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
                ],
                "DINNER": [
                    {"name": "Kadai Chicken", "desc": "Non-Veg", "rating": 4.6},
                    {"name": "Kadai Paneer", "desc": "Veg", "rating": 4.4},
                    {"name": "Pulao", "desc": "Rice", "rating": 4.3},
                    {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Tawa Butter Naan", "desc": "Main", "rating": 4.3},
                    {"name": "Jalebi", "desc": "Sweet", "rating": 4.4},
                    {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
                    {"name": "Lemon", "desc": "Side", "rating": 3.4}
                ]
            },
            "THURSDAY": {
                "BREAKFAST": [
                    {"name": "Mini Chola Bhatura", "desc": "Main", "rating": 4.3},
                    {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "Mutter Paneer Masala", "desc": "Vegetable", "rating": 4.3},
                    {"name": "Coriander Rice", "desc": "Rice", "rating": 4.1},
                    {"name": "Kollu Rasam", "desc": "Soup", "rating": 3.9},
                    {"name": "Potato Chips", "desc": "Side", "rating": 3.8},
                    {"name": "Dalpodhi", "desc": "Side", "rating": 3.7},
                    {"name": "Curd", "desc": "Side", "rating": 4.0}
                ],
                "SNACKS": [
                    {"name": "Cutlet", "desc": "Snack", "rating": 4.2},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
                ],
                "DINNER": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Baby Aloo Masala", "desc": "Vegetable", "rating": 4.2},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Dal Thick", "desc": "Curry", "rating": 4.1},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0},
                    {"name": "Halwa Mix", "desc": "Sweet", "rating": 4.3}
                ]
            },
            "FRIDAY": {
                "BREAKFAST": [
                    {"name": "Dal Dosa", "desc": "Main", "rating": 4.2},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
                ],
                "LUNCH": [
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Navadhanya Masala", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2},
                    {"name": "Rasam", "desc": "Soup", "rating": 4.0},
                    {"name": "Mix Veg Sahi Curry", "desc": "Vegetable", "rating": 4.1},
                    {"name": "Watermelon Juice", "desc": "Drink", "rating": 4.3}
                ],
                "SNACKS": [
                    {"name": "Pani Puri", "desc": "Snack", "rating": 4.4}
                ],
                "DINNER": [
                    {"name": "Chicken Gravy", "desc": "Non-Veg", "rating": 4.6},
                    {"name": "Paneer Butter Masala", "desc": "Veg", "rating": 4.5},
                    {"name": "Pulao", "desc": "Rice", "rating": 4.3},
                    {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "Jalebi", "desc": "Sweet", "rating": 4.4},
                    {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
                    {"name": "Lemon", "desc": "Side", "rating": 3.4}
                ]
            },
            "SATURDAY": {
                "BREAKFAST": [
                    {"name": "Mix Veg Paratha", "desc": "Main", "rating": 4.2},
                    {"name": "Curd", "desc": "Side", "rating": 4.0},
                    {"name": "Ketchup", "desc": "Side", "rating": 3.5}
                ],
                "LUNCH": [
                    {"name": "Chapathi", "desc": "Main", "rating": 4.1},
                    {"name": "Green Peas Pulav", "desc": "Rice", "rating": 4.2},
                    {"name": "Spinach Dal", "desc": "Curry", "rating": 4.1},
                    {"name": "Gobhi Capsicum Dry", "desc": "Vegetable", "rating": 3.8},
                    {"name": "Butter Masala", "desc": "Curry", "rating": 4.2},
                    {"name": "Cabbage Chutney", "desc": "Side", "rating": 3.8},
                    {"name": "Masala Butter Milk", "desc": "Drink", "rating": 4.1}
                ],
                "SNACKS": [
                    {"name": "Samosa", "desc": "Snack", "rating": 4.3},
                    {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
                    {"name": "Cold Coffee", "desc": "Drink", "rating": 4.2}
                ],
                "DINNER": [
                    {"name": "Dal Makhani", "desc": "Curry", "rating": 4.5},
                    {"name": "Gobhi Matar", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Phulka", "desc": "Main", "rating": 4.1},
                    {"name": "Tomato Rice", "desc": "Rice", "rating": 4.1},
                    {"name": "Kheer", "desc": "Sweet", "rating": 4.4}
                ]
            },
            "SUNDAY": {
                "BREAKFAST": [
                    {"name": "Andhra Kara Dosa", "desc": "Main", "rating": 4.3},
                    {"name": "Peanut Chutney", "desc": "Side", "rating": 4.0},
                    {"name": "Sambar", "desc": "Curry", "rating": 4.2}
                ],
                "LUNCH": [
                    {"name": "Puri", "desc": "Main", "rating": 4.2},
                    {"name": "Biryani Rice", "desc": "Rice", "rating": 4.7},
                    {"name": "Chicken Masala Spicy", "desc": "Non-Veg", "rating": 4.8},
                    {"name": "Paneer Masala Spicy", "desc": "Veg", "rating": 4.6},
                    {"name": "Chana Dal Tadka", "desc": "Curry", "rating": 4.2},
                    {"name": "Raita", "desc": "Side", "rating": 4.0},
                    {"name": "Fruit Juice", "desc": "Drink", "rating": 4.3}
                ],
                "SNACKS": [
                    {"name": "Pav Bhaji", "desc": "Snack", "rating": 4.6}
                ],
                "DINNER": [
                    {"name": "Arhar Dal Tadka", "desc": "Curry", "rating": 4.2},
                    {"name": "Aloo Fry", "desc": "Vegetable", "rating": 4.0},
                    {"name": "Kadhi Pakoda", "desc": "Curry", "rating": 4.3},
                    {"name": "White Rice", "desc": "Main", "rating": 4.0},
                    {"name": "Chapati", "desc": "Main", "rating": 4.1},
                    {"name": "Mysore Pak", "desc": "Sweet", "rating": 4.5}
                ]
            }
        }

        # Add menu items to database
        items_added = 0
        
        # Add Week 1 & 3 menu
        for day, meals in week1_menu.items():
            for meal_type, items in meals.items():
                for item_data in items:
                    menu_item = models.MessMenuItem(
                        day_of_week=getattr(models.DayOfWeek, day),
                        meal_type=getattr(models.MealType, meal_type),
                        menu_week_type=models.MenuWeekType.WEEK_1,
                        item_name=item_data["name"],
                        description=item_data["desc"],
                        rating=item_data["rating"],
                        votes=random.randint(15, 150)
                    )
                    db.add(menu_item)
                    items_added += 1

        # Add Week 2 & 4 menu
        for day, meals in week2_menu.items():
            for meal_type, items in meals.items():
                for item_data in items:
                    menu_item = models.MessMenuItem(
                        day_of_week=getattr(models.DayOfWeek, day),
                        meal_type=getattr(models.MealType, meal_type),
                        menu_week_type=models.MenuWeekType.WEEK_2,
                        item_name=item_data["name"],
                        description=item_data["desc"],
                        rating=item_data["rating"],
                        votes=random.randint(15, 150)
                    )
                    db.add(menu_item)
                    items_added += 1

        db.commit()
        print(f"Successfully added {items_added} mess menu items from PDF data!")

    except Exception as e:
        db.rollback()
        print(f"Error populating mess menu data: {e}")
        raise


# ================ AUTH ENDPOINTS ================
@app.post("/register/", response_model=dict)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"Received registration data: {user.dict()}")  # Add this line
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

# ================ TODO ENDPOINTS ================
@app.get("/todos/{user_id}")
async def get_todos(user_id: int, db: Session = Depends(get_db)):
    try:
        todos = db.query(models.TodoItem).filter(
            models.TodoItem.user_id == user_id
        ).order_by(models.TodoItem.created_at.desc()).all()
        return todos
    except Exception as e:
        print(f"Error fetching todos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching todos"
        )

@app.post("/todos/{user_id}")
async def create_todo(user_id: int, todo: TodoItemCreate, db: Session = Depends(get_db)):
    try:
        db_todo = models.TodoItem(
            user_id=user_id,
            task=todo.task,
            priority=todo.priority,
            is_completed=False
        )
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        return db_todo
    except Exception as e:
        print(f"Error creating todo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating todo"
        )

@app.put("/todos/{todo_id}")
async def update_todo(todo_id: int, todo: TodoItemUpdate, db: Session = Depends(get_db)):
    try:
        db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        update_data = todo.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_todo, field, value)
        
        db.commit()
        db.refresh(db_todo)
        return db_todo
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating todo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating todo"
        )

@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    try:
        db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        db.delete(db_todo)
        db.commit()
        return {"message": "Todo deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting todo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting todo"
        )

# ================ TIMETABLE ENDPOINTS ================
@app.get("/timetable/{user_id}")
async def get_timetable(user_id: int, db: Session = Depends(get_db)):
    try:
        # First attempt with course_id column
        try:
            timetable_entries = db.query(models.TimetableEntry).filter(
                models.TimetableEntry.user_id == user_id
            ).all()
        except Exception as e:
            # If column doesn't exist, fix schema and try again
            print(f"Error in first timetable attempt: {e}")
            fix_database_schema(db)
            timetable_entries = db.execute(text(
                "SELECT id, user_id, day_of_week, start_time, end_time, course_name, teacher, room_number "
                "FROM timetable_entries WHERE user_id = :user_id"
            ), {"user_id": user_id}).fetchall()
            
            # Convert to list of dicts
            timetable_entries = [
                {
                    "id": entry[0],
                    "user_id": entry[1],
                    "day_of_week": entry[2],
                    "start_time": entry[3],
                    "end_time": entry[4],
                    "course_name": entry[5],
                    "teacher": entry[6],
                    "room_number": entry[7],
                }
                for entry in timetable_entries
            ]
        
        return timetable_entries
    except Exception as e:
        print(f"Error fetching timetable: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching timetable: {str(e)}"
        )

@app.post("/timetable/{user_id}")
async def create_timetable_entry(user_id: int, entry: TimetableEntryCreate, db: Session = Depends(get_db)):
    try:
        # Check if course exists or create one
        try:
            course = db.query(models.Course).filter(
                models.Course.user_id == user_id,
                models.Course.course_name == entry.course_name,
                models.Course.teacher == entry.teacher
            ).first()
        except Exception as e:
            # If error occurs due to missing column, fix schema
            print(f"Error querying courses: {e}")
            fix_database_schema(db)
            
            # Try raw SQL approach if needed
            course_result = db.execute(text(
                "SELECT id FROM courses WHERE user_id = :user_id AND course_name = :course_name AND teacher = :teacher"
            ), {
                "user_id": user_id, 
                "course_name": entry.course_name, 
                "teacher": entry.teacher
            }).fetchone()
            
            if course_result:
                course_id = course_result[0]
            else:
                course_id = None
                
            if not course_id:
                # Create course
                result = db.execute(text(
                    "INSERT INTO courses (user_id, course_name, teacher, created_at) "
                    "VALUES (:user_id, :course_name, :teacher, :created_at) RETURNING id"
                ), {
                    "user_id": user_id,
                    "course_name": entry.course_name,
                    "teacher": entry.teacher,
                    "created_at": datetime.utcnow()
                })
                db.commit()
                course_id = result.fetchone()[0]
            
            # Create timetable entry with raw SQL
            result = db.execute(text(
                "INSERT INTO timetable_entries (user_id, course_id, day_of_week, start_time, end_time, "
                "course_name, teacher, room_number, created_at, updated_at) "
                "VALUES (:user_id, :course_id, :day_of_week, :start_time, :end_time, "
                ":course_name, :teacher, :room_number, :created_at, :updated_at) "
                "RETURNING id"
            ), {
                "user_id": user_id,
                "course_id": course_id,
                "day_of_week": entry.day_of_week,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "course_name": entry.course_name,
                "teacher": entry.teacher,
                "room_number": entry.room_number,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            db.commit()
            entry_id = result.fetchone()[0]
            
            # Return the created entry
            return {
                "id": entry_id,
                "user_id": user_id,
                "course_id": course_id,
                "day_of_week": entry.day_of_week,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "course_name": entry.course_name,
                "teacher": entry.teacher,
                "room_number": entry.room_number
            }
        
        if not course:
            course = models.Course(
                user_id=user_id,
                course_name=entry.course_name,
                teacher=entry.teacher
            )
            db.add(course)
            db.commit()
            db.refresh(course)
        
        # Create timetable entry linked to course
        db_entry = models.TimetableEntry(
            user_id=user_id,
            course_id=course.id,
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
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating timetable entry: {str(e)}"
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

# ================ MESS MENU ENDPOINTS ================
@app.get("/mess-menu/week/{day_of_week}")
async def get_full_day_menu(day_of_week: DayOfWeek, db: Session = Depends(get_db)):
    try:
        current_week_type = get_current_menu_week_type()
        
        menu_items = db.query(models.MessMenuItem).filter(
            models.MessMenuItem.day_of_week == getattr(models.DayOfWeek, day_of_week.upper()),
            models.MessMenuItem.menu_week_type == getattr(models.MenuWeekType, current_week_type)
        ).order_by(models.MessMenuItem.meal_type, models.MessMenuItem.item_name).all()
        
        grouped_menu = {}
        for item in menu_items:
            meal_type = item.meal_type.value
            if meal_type not in grouped_menu:
                grouped_menu[meal_type] = []
            grouped_menu[meal_type].append({
                "id": item.id,
                "item_name": item.item_name,
                "description": item.description,
                "rating": item.rating,
                "votes": item.votes
            })
        
        return {
            "day": day_of_week,
            "week_type": current_week_type,
            "meals": grouped_menu
        }
    except Exception as e:
        print(f"Error fetching full day menu for {day_of_week}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching day menu"
        )

@app.get("/mess-menu/weekly")
async def get_weekly_menu(db: Session = Depends(get_db)):
    try:
        current_week_type = get_current_menu_week_type()
        
        menu_items = db.query(models.MessMenuItem).filter(
            models.MessMenuItem.menu_week_type == getattr(models.MenuWeekType, current_week_type)
        ).order_by(
            models.MessMenuItem.day_of_week, 
            models.MessMenuItem.meal_type, 
            models.MessMenuItem.item_name
        ).all()
        
        weekly_menu = {}
        for item in menu_items:
            day = item.day_of_week.value
            meal_type = item.meal_type.value
            
            if day not in weekly_menu:
                weekly_menu[day] = {}
            if meal_type not in weekly_menu[day]:
                weekly_menu[day][meal_type] = []
                
            weekly_menu[day][meal_type].append({
                "id": item.id,
                "item_name": item.item_name,
                "description": item.description,
                "rating": item.rating,
                "votes": item.votes
            })
        
        return {
            "week_type": current_week_type,
            "weekly_menu": weekly_menu
        }
    except Exception as e:
        print(f"Error fetching weekly menu: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching weekly menu"
        )

@app.post("/mess-menu/")
async def add_mess_menu_item(item: MessMenuItemCreate, db: Session = Depends(get_db)):
    try:
        db_item = models.MessMenuItem(
            day_of_week=getattr(models.DayOfWeek, item.day_of_week.upper()),
            meal_type=getattr(models.MealType, item.meal_type.upper()),
            menu_week_type=getattr(models.MenuWeekType, item.menu_week_type.replace(" ", "_")),
            item_name=item.item_name,
            description=item.description,
            rating=item.rating,
            votes=item.votes
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        print(f"Error adding mess menu item '{item.item_name}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding mess menu item"
        )

# ================ CALENDAR EVENT ENDPOINTS ================
@app.get("/calendar-events/{user_id}")
async def get_calendar_events(
    user_id: int, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get calendar events for a user, optionally filtered by date range"""
    try:
        query = db.query(models.CalendarEvent).filter(
            models.CalendarEvent.user_id == user_id
        )
        
        if start_date:
            query = query.filter(models.CalendarEvent.start_datetime >= start_date)
        if end_date:
            query = query.filter(models.CalendarEvent.start_datetime <= end_date)
        
        events = query.order_by(models.CalendarEvent.start_datetime).all()
        return events
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching calendar events"
        )

@app.post("/calendar-events/{user_id}")
async def create_calendar_event(
    user_id: int, 
    event: CalendarEventCreate, 
    db: Session = Depends(get_db)
):
    try:
        db_event = models.CalendarEvent(
            user_id=user_id,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            location=event.location,
            is_all_day=event.is_all_day,
            reminder_minutes=event.reminder_minutes
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except Exception as e:
        print(f"Error creating calendar event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating calendar event"
        )

@app.put("/calendar-events/{event_id}")
async def update_calendar_event(
    event_id: int, 
    event: CalendarEventUpdate, 
    db: Session = Depends(get_db)
):
    try:
        db_event = db.query(models.CalendarEvent).filter(
            models.CalendarEvent.id == event_id
        ).first()
        
        if not db_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        update_data = event.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        
        db.commit()
        db.refresh(db_event)
        return db_event
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating calendar event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating calendar event"
        )

@app.delete("/calendar-events/{event_id}")
async def delete_calendar_event(event_id: int, db: Session = Depends(get_db)):
    try:
        db_event = db.query(models.CalendarEvent).filter(
            models.CalendarEvent.id == event_id
        ).first()
        
        if not db_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        db.delete(db_event)
        db.commit()
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting calendar event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting calendar event"
        )

# ================ QUICK STATS ENDPOINT ================
@app.get("/academics/stats/{user_id}")
async def get_academic_stats(user_id: int, db: Session = Depends(get_db)):
    """Get quick academic statistics for dashboard"""
    try:
        # Count upcoming classes today
        today = datetime.now().strftime("%A")[:3]
        classes_today = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id,
            models.TimetableEntry.day_of_week == today
        ).count()
        
        # Count upcoming exams (next 30 days)
        upcoming_exams = db.query(models.ExamEntry).filter(
            models.ExamEntry.user_id == user_id,
            models.ExamEntry.date >= datetime.now().strftime("%Y-%m-%d"),
            models.ExamEntry.date <= (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        ).count()
        
        # Get CGPA
        grades = db.query(models.GradeEntry).filter(
            models.GradeEntry.user_id == user_id
        ).all()
        cgpa_info = calculate_cgpa(grades)
        
        # Count total assignments (calendar events of type assignment)
        assignments = db.query(models.CalendarEvent).filter(
            models.CalendarEvent.user_id == user_id,
            models.CalendarEvent.event_type == "Assignment",
            models.CalendarEvent.start_datetime >= datetime.now()
        ).count()
        
        return {
            "classes_today": classes_today,
            "upcoming_exams": upcoming_exams,
            "cgpa": cgpa_info["cgpa"],
            "pending_assignments": assignments
        }
    except Exception as e:
        print(f"Error fetching academic stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching academic stats"
        )

# ================ AI ENDPOINTS ================
@app.post("/ai/ask")
async def ask_ai(
    user_id: int,
    chat: ChatMessage,
    db: Session = Depends(get_db)
):
    """Ask AI assistant a question"""
    try:
        assistant = AIAssistant(db)
        response = await assistant.get_response(user_id, chat.message)
        return response
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "response": "Sorry, I'm having trouble right now. Please contact office@iitpkd.ac.in",
            "confidence": "error"
        }

@app.get("/ai/chat-history/{user_id}")
async def get_chat_history(
    user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get user's chat history"""
    history = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id
    ).order_by(
        models.ChatHistory.created_at.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": msg.id,
            "message": msg.message,
            "is_user": msg.is_user,
            "confidence_score": msg.confidence_score,
            "created_at": msg.created_at.isoformat()
        }
        for msg in reversed(history)
    ]

@app.delete("/ai/chat-history/{user_id}")
async def clear_chat_history(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Clear user's chat history"""
    db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == user_id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared"}

# ================ ADMIN AI ENDPOINTS ================
@app.get("/ai/question-queue")
async def get_question_queue(
    status: Optional[str] = "unanswered",
    db: Session = Depends(get_db)
):
    """Get unanswered questions (Admin)"""
    
    query = db.query(models.UnansweredQuestion)
    
    if status:
        query = query.filter(
            models.UnansweredQuestion.status == status
        )
    
    questions = query.order_by(
        models.UnansweredQuestion.ask_count.desc(),
        models.UnansweredQuestion.created_at.desc()
    ).all()
    
    return {
        "total": len(questions),
        "questions": [
            {
                "id": q.id,
                "question": q.question_text,
                "category": q.category,
                "ask_count": q.ask_count,
                "status": q.status.value,
                "created_at": q.created_at.isoformat(),
                "confidence_score": q.confidence_score
            }
            for q in questions
        ]
    }

@app.post("/ai/add-answer")
async def add_answer_to_knowledge(
    request: AddAnswerRequest,
    db: Session = Depends(get_db)
):
    """Add answer to knowledge base and resolve question (Admin)"""
    
    # Get the question
    question = db.query(models.UnansweredQuestion).filter(
        models.UnansweredQuestion.id == request.question_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Add to knowledge base
    kb_entry = models.KnowledgeBase(
        category=request.category or question.category,
        content=f"Q: {question.question_text}\n\nA: {request.answer}",
        source_url="admin_added",
        keywords=','.join(question.question_text.lower().split()[:10])
    )
    db.add(kb_entry)
    
    # Mark question as answered
    question.status = models.QuestionStatus.ANSWERED
    question.admin_answer = request.answer
    question.resolved_at = datetime.utcnow()
    
    # Find and resolve similar questions
    similar_questions = db.query(models.UnansweredQuestion).filter(
        models.UnansweredQuestion.status == models.QuestionStatus.UNANSWERED,
        models.UnansweredQuestion.id != question.id
    ).all()
    
    resolved_count = 0
    for q in similar_questions:
        similarity = SequenceMatcher(
            None, 
            question.question_text.lower(), 
            q.question_text.lower()
        ).ratio()
        
        if similarity > 0.7:  # 70% similar
            q.status = models.QuestionStatus.DUPLICATE
            q.similar_question_id = question.id
            q.resolved_at = datetime.utcnow()
            resolved_count += 1
    
    db.commit()
    
    return {
        "message": "Answer added successfully",
        "resolved_similar_questions": resolved_count
    }

@app.get("/ai/analytics")
async def get_ai_analytics(db: Session = Depends(get_db)):
    """Get AI analytics (Admin)"""
    
    total_questions = db.query(models.UnansweredQuestion).count()
    answered = db.query(models.UnansweredQuestion).filter(
        models.UnansweredQuestion.status == models.QuestionStatus.ANSWERED
    ).count()
    pending = db.query(models.UnansweredQuestion).filter(
        models.UnansweredQuestion.status == models.QuestionStatus.UNANSWERED
    ).count()
    
    # Most asked questions
    top_questions = db.query(models.UnansweredQuestion).order_by(
        models.UnansweredQuestion.ask_count.desc()
    ).limit(10).all()
    
    # Category distribution
    category_counts = db.query(
        models.UnansweredQuestion.category,
        func.count(models.UnansweredQuestion.id)
    ).group_by(models.UnansweredQuestion.category).all()
    
    kb_entries = db.query(models.KnowledgeBase).count()
    
    return {
        "total_questions": total_questions,
        "answered": answered,
        "pending": pending,
        "knowledge_base_entries": kb_entries,
        "top_questions": [
            {
                "question": q.question_text,
                "ask_count": q.ask_count,
                "category": q.category
            }
            for q in top_questions
        ],
        "categories": [
            {"category": cat, "count": count}
            for cat, count in category_counts
        ]
    }

@app.post("/ai/refresh-knowledge")
async def refresh_knowledge_base(db: Session = Depends(get_db)):
    """Refresh knowledge base by re-scraping website (Admin)"""
    try:
        # Clear old entries
        db.query(models.KnowledgeBase).filter(
            models.KnowledgeBase.source_url != "admin_added"
        ).delete()
        db.commit()
        
        # Re-scrape
        scrape_iitpkd_website(db)
        
        count = db.query(models.KnowledgeBase).count()
        return {
            "message": "Knowledge base refreshed",
            "total_entries": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================ ATTENDANCE ENDPOINTS ================
@app.get("/attendance/{user_id}")
async def get_attendance_records(
    user_id: int,
    timetable_entry_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance records for a user, optionally filtered"""
    try:
        query = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id
        )
        
        if timetable_entry_id:
            query = query.filter(
                models.AttendanceRecord.timetable_entry_id == timetable_entry_id
            )
        
        if start_date:
            query = query.filter(models.AttendanceRecord.date >= start_date)
        
        if end_date:
            query = query.filter(models.AttendanceRecord.date <= end_date)
        
        records = query.order_by(models.AttendanceRecord.date.desc()).all()
        return records
    except Exception as e:
        print(f"Error fetching attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching attendance records"
        )

@app.post("/attendance/{user_id}")
async def mark_attendance(
    user_id: int,
    attendance: AttendanceRecordCreate,
    db: Session = Depends(get_db)
):
    """Mark attendance for a specific date"""
    try:
        # Convert string date to Python date object if it's a string
        attendance_date = attendance.date
        if isinstance(attendance_date, str):
            attendance_date = date.fromisoformat(attendance_date)
        
        # Check if attendance already exists for this date and class
        existing = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id,
            models.AttendanceRecord.timetable_entry_id == attendance.timetable_entry_id,
            models.AttendanceRecord.date == attendance_date
        ).first()
        
        if existing:
            # Update existing record
            existing.status = attendance.status
            existing.notes = attendance.notes
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new record
            db_record = models.AttendanceRecord(
                user_id=user_id,
                timetable_entry_id=attendance.timetable_entry_id,
                date=attendance_date,
                status=attendance.status,
                notes=attendance.notes
            )
            db.add(db_record)
            db.commit()
            db.refresh(db_record)
            return db_record
    except Exception as e:
        print(f"Error marking attendance: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking attendance: {str(e)}"
        )

# New endpoint for marking multiple attendance records
@app.post("/attendance/historical/{user_id}")
async def mark_historical_attendance(
    user_id: int,
    attendance_data: List[AttendanceRecordCreate],
    db: Session = Depends(get_db)
):
    """Mark attendance for multiple past dates"""
    results = []
    
    for record in attendance_data:
        try:
            # Check if record exists and update, or create new
            existing = db.query(models.AttendanceRecord).filter(
                models.AttendanceRecord.user_id == user_id,
                models.AttendanceRecord.timetable_entry_id == record.timetable_entry_id,
                models.AttendanceRecord.date == record.date
            ).first()
            
            if existing:
                existing.status = record.status
                existing.notes = record.notes
                db.commit()
                results.append({"id": existing.id, "status": "updated"})
            else:
                new_record = models.AttendanceRecord(
                    user_id=user_id,
                    timetable_entry_id=record.timetable_entry_id,
                    date=record.date,
                    status=record.status,
                    notes=record.notes
                )
                db.add(new_record)
                db.commit()
                db.refresh(new_record)
                results.append({"id": new_record.id, "status": "created"})
                
        except Exception as e:
            db.rollback()
            results.append({"error": str(e)})
    
    return results

@app.put("/attendance/{record_id}")
async def update_attendance(
    record_id: int,
    attendance: AttendanceRecordUpdate,
    db: Session = Depends(get_db)
):
    """Update an attendance record"""
    try:
        db_record = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.id == record_id
        ).first()
        
        if not db_record:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        update_data = attendance.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_record, field, value)
        
        db_record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_record)
        return db_record
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating attendance: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating attendance"
        )

@app.delete("/attendance/{record_id}")
async def delete_attendance(record_id: int, db: Session = Depends(get_db)):
    """Delete an attendance record"""
    try:
        db_record = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.id == record_id
        ).first()
        
        if not db_record:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        db.delete(db_record)
        db.commit()
        return {"message": "Attendance record deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting attendance: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting attendance"
        )

# Improved course-based attendance endpoints
@app.get("/attendance/course-stats/{user_id}")
async def get_all_courses_attendance(user_id: int, db: Session = Depends(get_db)):
    """Get attendance statistics for all courses"""
    try:
        # Get all courses for user
        courses = db.query(models.Course).filter(
            models.Course.user_id == user_id
        ).all()
        
        course_stats = {}
        for course in courses:
            # Get all timetable entries for this course
            timetable_entries = db.query(models.TimetableEntry).filter(
                models.TimetableEntry.user_id == user_id,
                models.TimetableEntry.course_name == course.course_name
            ).all()
            
            entry_ids = [entry.id for entry in timetable_entries]
            
            # Get attendance records for these entries
            records = db.query(models.AttendanceRecord).filter(
                models.AttendanceRecord.user_id == user_id,
                models.AttendanceRecord.timetable_entry_id.in_(entry_ids) if entry_ids else False
            ).all()
            
            # Calculate statistics
            total_classes = len(records)
            present_count = sum(1 for r in records if r.status == 'present')
            absent_count = sum(1 for r in records if r.status == 'absent')
            cancelled_count = sum(1 for r in records if r.status == 'cancelled')
            
            effective_classes = total_classes - cancelled_count
            attendance_percentage = (
                (present_count / effective_classes * 100) 
                if effective_classes > 0 else 0
            )
            
            course_stats[course.id] = {
                "course_name": course.course_name,
                "total_classes": total_classes,
                "present": present_count,
                "absent": absent_count,
                "cancelled": cancelled_count,
                "attendance_percentage": round(attendance_percentage, 2)
            }
        
        return course_stats
    except Exception as e:
        print(f"Error getting course stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting course stats: {str(e)}"
        )

@app.get("/attendance/course-stats/{user_id}/{course_id}")
async def get_course_attendance_stats(
    user_id: int,
    course_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get attendance statistics for a specific course"""
    try:
        # Get all timetable entries for this course
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id,
            models.TimetableEntry.course_id == course_id
        ).all()
        
        if not timetable_entries:
            # Try to find by course name if course_id approach fails
            course = db.query(models.Course).filter(models.Course.id == course_id).first()
            if course:
                timetable_entries = db.query(models.TimetableEntry).filter(
                    models.TimetableEntry.user_id == user_id,
                    models.TimetableEntry.course_name == course.course_name
                ).all()
        
        if not timetable_entries:
            return {
                "course_id": course_id,
                "total_classes": 0,
                "present": 0,
                "absent": 0,
                "cancelled": 0,
                "attendance_percentage": 0
            }
            
        entry_ids = [entry.id for entry in timetable_entries]
        
        # Build query for attendance records
        query = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id,
            models.AttendanceRecord.timetable_entry_id.in_(entry_ids)
        )
        
        # Add date filters if provided
        if start_date:
            query = query.filter(models.AttendanceRecord.date >= start_date)
        if end_date:
            query = query.filter(models.AttendanceRecord.date <= end_date)
            
        records = query.all()
        
        # Calculate statistics
        total_classes = len(records)
        present_count = len([r for r in records if r.status == 'present'])
        absent_count = len([r for r in records if r.status == 'absent'])
        cancelled_count = len([r for r in records if r.status == 'cancelled'])
        
        # Calculate percentage excluding cancelled classes
        effective_classes = total_classes - cancelled_count
        attendance_percentage = (
            (present_count / effective_classes * 100) if effective_classes > 0 else 0
        )
        
        # Get course details
        course = db.query(models.Course).filter(models.Course.id == course_id).first()
        
        return {
            "course_id": course_id,
            "course_name": course.course_name if course else "Unknown Course",
            "total_classes": total_classes,
            "present": present_count,
            "absent": absent_count,
            "cancelled": cancelled_count,
            "attendance_percentage": round(attendance_percentage, 2),
            "detailed_records": [
                {
                    "date": record.date.isoformat() if hasattr(record.date, 'isoformat') else str(record.date),
                    "status": record.status,
                    "timetable_entry_id": record.timetable_entry_id
                }
                for record in records
            ]
        }
    except Exception as e:
        print(f"Error getting course attendance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting course attendance statistics"
        )

@app.get("/attendance/stats/{user_id}/{timetable_entry_id}")
async def get_attendance_stats(
    user_id: int,
    timetable_entry_id: int,
    db: Session = Depends(get_db)
):
    """Get attendance statistics for a specific class"""
    try:
        records = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id,
            models.AttendanceRecord.timetable_entry_id == timetable_entry_id
        ).all()
        
        total_classes = len(records)
        present_count = len([r for r in records if r.status == 'present'])
        absent_count = len([r for r in records if r.status == 'absent'])
        cancelled_count = len([r for r in records if r.status == 'cancelled'])
        
        # Calculate percentage excluding cancelled classes
        effective_classes = total_classes - cancelled_count
        attendance_percentage = (
            (present_count / effective_classes * 100) if effective_classes > 0 else 0
        )
        
        return {
            "total_classes": total_classes,
            "present": present_count,
            "absent": absent_count,
            "cancelled": cancelled_count,
            "attendance_percentage": round(attendance_percentage, 2)
        }
    except Exception as e:
        print(f"Error getting attendance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting attendance statistics"
        )
# Add this to your main.py file

@app.get("/attendance/by-course-name/{user_id}/{course_name}")
async def get_attendance_by_course_name(
    user_id: int,
    course_name: str,
    db: Session = Depends(get_db)
):
    """Get attendance for a specific course by name (across all days)"""
    try:
        # Get all timetable entries for this course name
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id,
            models.TimetableEntry.course_name == course_name
        ).all()
        
        entry_ids = [entry.id for entry in timetable_entries]
        if not entry_ids:
            return {
                "course_name": course_name,
                "attendance_percentage": 0,
                "total_classes": 0,
                "present": 0,
                "absent": 0,
                "cancelled": 0
            }
            
        # Get all attendance records for these entries
        records = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id,
            models.AttendanceRecord.timetable_entry_id.in_(entry_ids)
        ).all()
        
        # Calculate aggregate statistics
        total = len(records)
        present = sum(1 for r in records if r.status == 'present')
        absent = sum(1 for r in records if r.status == 'absent')
        cancelled = sum(1 for r in records if r.status == 'cancelled')
        
        attendance_percentage = (present / (total - cancelled) * 100) if (total - cancelled) > 0 else 0
        
        return {
            "course_name": course_name,
            "attendance_percentage": round(attendance_percentage, 2),
            "total_classes": total,
            "present": present,
            "absent": absent,
            "cancelled": cancelled,
            "entries": [
                {
                    "id": entry.id,
                    "day": entry.day_of_week,
                    "time": f"{entry.start_time} - {entry.end_time}"
                }
                for entry in timetable_entries
            ]
        }
    except Exception as e:
        print(f"Error getting attendance by course name: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting course attendance"
        )

@app.get("/attendance/dashboard/{user_id}")
async def get_attendance_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Get overall attendance dashboard for all classes"""
    try:
        # Get all timetable entries for user
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id
        ).all()
        
        dashboard_data = []
        
        for entry in timetable_entries:
            records = db.query(models.AttendanceRecord).filter(
                models.AttendanceRecord.user_id == user_id,
                models.AttendanceRecord.timetable_entry_id == entry.id
            ).all()
            
            total_classes = len(records)
            present_count = len([r for r in records if r.status == 'present'])
            absent_count = len([r for r in records if r.status == 'absent'])
            cancelled_count = len([r for r in records if r.status == 'cancelled'])
            
            effective_classes = total_classes - cancelled_count
            attendance_percentage = (
                (present_count / effective_classes * 100) if effective_classes > 0 else 0
            )
            
            dashboard_data.append({
                "timetable_entry_id": entry.id,
                "course_name": entry.course_name,
                "day_of_week": entry.day_of_week,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
                "total_classes": total_classes,
                "present": present_count,
                "absent": absent_count,
                "cancelled": cancelled_count,
                "attendance_percentage": round(attendance_percentage, 2)
            })
        
        # Calculate overall stats
        total_effective_classes = sum(max(c["total_classes"] - c["cancelled"], 0) for c in dashboard_data)
        total_present = sum(c["present"] for c in dashboard_data)
        
        return {
            "classes": dashboard_data,
            "overall_stats": {
                "total_classes": sum(c["total_classes"] for c in dashboard_data),
                "total_present": total_present,
                "total_absent": sum(c["absent"] for c in dashboard_data),
                "overall_percentage": round(
                    (total_present / max(total_effective_classes, 1)) * 100,
                    2
                )
            }
        }
    except Exception as e:
        print(f"Error getting attendance dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting attendance dashboard"
        )

# Detailed analytics for a specific course
@app.get("/attendance/analytics/{user_id}/{course_name}")
async def get_course_analytics(
    user_id: int,
    course_name: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get detailed analytics for a specific course"""
    try:
        # Get all timetable entries for this course
        timetable_entries = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id,
            models.TimetableEntry.course_name == course_name
        ).all()
        
        entry_ids = [entry.id for entry in timetable_entries]
        
        # Get attendance records
        query = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.user_id == user_id,
            models.AttendanceRecord.timetable_entry_id.in_(entry_ids) if entry_ids else False
        )
        
        if start_date:
            query = query.filter(models.AttendanceRecord.date >= start_date)
        if end_date:
            query = query.filter(models.AttendanceRecord.date <= end_date)
            
        records = query.order_by(models.AttendanceRecord.date).all()
        
        # Weekly and monthly trends
        weekly_data = {}
        monthly_data = {}
        
        for record in records:
            date_str = str(record.date)
            date_obj = datetime.strptime(date_str, "%Y-%m-%d") if isinstance(date_str, str) else record.date
            week_key = f"{date_obj.year}-W{date_obj.isocalendar()[1]}"
            month_key = f"{date_obj.year}-{date_obj.month}"
            
            # Update weekly stats
            if week_key not in weekly_data:
                weekly_data[week_key] = {"present": 0, "absent": 0, "cancelled": 0}
            weekly_data[week_key][record.status] += 1
            
            # Update monthly stats
            if month_key not in monthly_data:
                monthly_data[month_key] = {"present": 0, "absent": 0, "cancelled": 0}
            monthly_data[month_key][record.status] += 1
        
        return {
            "course_name": course_name,
            "total_records": len(records),
            "present_count": sum(1 for r in records if r.status == 'present'),
            "absent_count": sum(1 for r in records if r.status == 'absent'),
            "cancelled_count": sum(1 for r in records if r.status == 'cancelled'),
            "weekly_trends": weekly_data,
            "monthly_trends": monthly_data,
            "detailed_records": [
                {
                    "date": str(record.date),
                    "status": record.status,
                    "notes": record.notes
                }
                for record in records
            ]
        }
        
    except Exception as e:
        print(f"Error getting course analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting course analytics: {str(e)}"
        )

# ================ COURSE ENDPOINTS ================
@app.post("/courses/{user_id}")
async def create_course(user_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """Create a new course"""
    try:
        # Convert string date to Python date object if provided
        start_date = None
        if course.start_date:
            start_date = date.fromisoformat(course.start_date)
            
        # Create course
        db_course = models.Course(
            user_id=user_id,
            course_name=course.course_name,
            teacher=course.teacher,
            start_date=start_date
        )
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        return db_course
    except Exception as e:
        print(f"Error creating course: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating course"
        )

@app.get("/courses/{user_id}")
async def get_courses(user_id: int, db: Session = Depends(get_db)):
    """Get all courses for a user"""
    try:
        try:
            # First try to query with the expected schema
            courses = db.query(models.Course).filter(
                models.Course.user_id == user_id
            ).all()
        except Exception as e:
            # If error due to missing column, fix schema and use raw SQL
            print(f"Error in first courses attempt: {e}")
            fix_database_schema(db)
            
            # Use raw SQL query
            courses_data = db.execute(text(
                "SELECT id, user_id, course_name, teacher, created_at FROM courses WHERE user_id = :user_id"
            ), {"user_id": user_id}).fetchall()
            
            courses = [
                {
                    "id": c[0],
                    "user_id": c[1],
                    "course_name": c[2],
                    "teacher": c[3],
                    "created_at": c[4]
                }
                for c in courses_data
            ]
        
        return courses
    except Exception as e:
        print(f"Error fetching courses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching courses: {str(e)}"
        )

@app.get("/")
async def root():
    return {"message": "College App API is running", "status": "connected"}

# ================ STARTUP EVENT ================
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and populate data on startup"""
    db = SessionLocal()
    try:
        # Fix database schema
        fix_database_schema(db)
        
        # Fix TodoItem table schema
        fix_todo_table_schema(db)
        
        # Populate mess menu data
        populate_mess_menu_data(db)
        
        # Initialize AI knowledge base
        kb_count = db.query(models.KnowledgeBase).count()
        if kb_count == 0:
            print("Initializing AI knowledge base by scraping IIT Palakkad website...")
            scrape_iitpkd_website(db)
            print(f"Knowledge base initialized with {db.query(models.KnowledgeBase).count()} entries")
        else:
            print(f"Knowledge base already exists ({kb_count} entries)")
        
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error during startup: {e}")
    finally:
        db.close()
# ================ PYDANTIC MODELS ================

class FollowRequest(BaseModel):
    following_id: int

class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    status: str

class ChatGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: List[int]

class ChatMessageCreate(BaseModel):
    message: str
    message_type: Optional[str] = "text"
    media_url: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_announcement: Optional[bool] = False

class CommentCreate(BaseModel):
    content: str

class DiscussionCreate(BaseModel):
    title: str
    topic: str
    content: str
    visibility: Optional[str] = "public"
    allowed_departments: Optional[str] = None
    allowed_years: Optional[str] = None

class DiscussionReplyCreate(BaseModel):
    content: str
    parent_reply_id: Optional[int] = None

# ================ FOLLOW ENDPOINTS ================

# ================ FOLLOW ENDPOINTS ================

@app.post("/follow/{user_id}")
async def send_follow_request(
    user_id: int,
    follow: FollowRequest,
    db: Session = Depends(get_db)
):
    """Send a follow request"""
    try:
        print(f"Follow request from {user_id} to {follow.following_id}")
        
        # Check if already following
        existing = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.following_id == follow.following_id
        ).first()
        
        if existing:
            print(f"Existing follow found with status: {existing.status}")
            if existing.status == models.FollowStatus.ACCEPTED:
                return {"message": "Already following", "status": "accepted"}
            else:
                return {"message": "Follow request already sent", "status": "pending"}
        
        # Get follower info for notification
        follower = db.query(models.User).filter(models.User.id == user_id).first()
        print(f"Follower found: {follower.full_name}")
        
        # Create follow request
        new_follow = models.Follow(
            follower_id=user_id,
            following_id=follow.following_id,
            status=models.FollowStatus.PENDING
        )
        db.add(new_follow)
        
        # Create notification
        notification = models.Notification(
            user_id=follow.following_id,
            type=models.NotificationType.FOLLOW_REQUEST,
            title="New Follow Request",
            message=f"{follower.full_name} wants to follow you",
            related_id=user_id
        )
        db.add(notification)
        print(f"Notification created for user {follow.following_id}")
        
        db.commit()
        db.refresh(new_follow)
        
        print("Follow request and notification committed successfully")
        
        return {
            "id": new_follow.id,
            "follower_id": new_follow.follower_id,
            "following_id": new_follow.following_id,
            "status": new_follow.status.value,
            "message": "Follow request sent"
        }
    except Exception as e:
        print(f"Follow request error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/follow/{user_id}/accept/{follower_id}")
async def accept_follow_request(
    user_id: int,
    follower_id: int,
    db: Session = Depends(get_db)
):
    """Accept a follow request and create mutual follow"""
    try:
        # Find the follow request
        follow = db.query(models.Follow).filter(
            models.Follow.follower_id == follower_id,
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.PENDING
        ).first()
        
        if not follow:
            raise HTTPException(status_code=404, detail="Follow request not found")
        
        # Accept the request
        follow.status = models.FollowStatus.ACCEPTED
        
        # Create mutual follow (follow back automatically)
        mutual_follow = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.following_id == follower_id
        ).first()
        
        if not mutual_follow:
            mutual_follow = models.Follow(
                follower_id=user_id,
                following_id=follower_id,
                status=models.FollowStatus.ACCEPTED
            )
            db.add(mutual_follow)
        else:
            mutual_follow.status = models.FollowStatus.ACCEPTED
        
        # Get accepting user info
        accepting_user = db.query(models.User).filter(
            models.User.id == user_id
        ).first()
        
        # Create notification for original requester
        notification = models.Notification(
            user_id=follower_id,
            type=models.NotificationType.FOLLOW_ACCEPTED,
            title="Follow Request Accepted",
            message=f"{accepting_user.full_name} accepted your follow request. You can now chat!",
            related_id=user_id
        )
        db.add(notification)
        
        # Mark the follow request notification as read
        old_notification = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.type == models.NotificationType.FOLLOW_REQUEST,
            models.Notification.related_id == follower_id,
            models.Notification.is_read == False
        ).first()
        if old_notification:
            old_notification.is_read = True
        
        db.commit()
        
        return {
            "message": "Follow request accepted. You both can now chat!",
            "status": "accepted"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Accept follow error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/follow/{user_id}/reject/{follower_id}")
async def reject_follow_request(
    user_id: int,
    follower_id: int,
    db: Session = Depends(get_db)
):
    """Reject a follow request"""
    try:
        follow = db.query(models.Follow).filter(
            models.Follow.follower_id == follower_id,
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.PENDING
        ).first()
        
        if not follow:
            raise HTTPException(status_code=404, detail="Follow request not found")
        
        # Update status to rejected
        follow.status = models.FollowStatus.REJECTED
        
        # Mark notification as read
        notification = db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.type == models.NotificationType.FOLLOW_REQUEST,
            models.Notification.related_id == follower_id,
            models.Notification.is_read == False
        ).first()
        if notification:
            notification.is_read = True
        
        db.commit()
        
        return {"message": "Follow request rejected"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reject follow error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/follow/{user_id}/unfollow/{following_id}")
async def unfollow_user(
    user_id: int,
    following_id: int,
    db: Session = Depends(get_db)
):
    """Unfollow a user (removes both directions)"""
    try:
        # Delete both directions of follow
        db.query(models.Follow).filter(
            or_(
                and_(
                    models.Follow.follower_id == user_id,
                    models.Follow.following_id == following_id
                ),
                and_(
                    models.Follow.follower_id == following_id,
                    models.Follow.following_id == user_id
                )
            )
        ).delete(synchronize_session=False)
        
        db.commit()
        return {"message": "Unfollowed successfully"}
    except Exception as e:
        print(f"Unfollow error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/follow/{user_id}/status/{other_user_id}")
async def get_follow_status(
    user_id: int,
    other_user_id: int,
    db: Session = Depends(get_db)
):
    """Get follow status between two users"""
    try:
        # Check if user is following other_user
        following = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.following_id == other_user_id
        ).first()
        
        # Check if other_user is following user
        followed_by = db.query(models.Follow).filter(
            models.Follow.follower_id == other_user_id,
            models.Follow.following_id == user_id
        ).first()
        
        return {
            "is_following": following is not None,
            "follow_status": following.status.value if following else None,
            "is_followed_by": followed_by is not None,
            "are_mutual": (
                following and followed_by and 
                following.status == models.FollowStatus.ACCEPTED and 
                followed_by.status == models.FollowStatus.ACCEPTED
            )
        }
    except Exception as e:
        print(f"Get follow status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/follow/{user_id}/followers")
async def get_followers(user_id: int, db: Session = Depends(get_db)):
    """Get list of followers"""
    try:
        followers = db.query(models.Follow).filter(
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).all()
        
        result = []
        for follow in followers:
            user = db.query(models.User).filter(
                models.User.id == follow.follower_id
            ).first()
            if user:
                result.append({
                    "id": user.id,
                    "full_name": user.full_name,
                    "college_id": user.college_id,
                    "department": user.department,
                    "year": user.year,
                    "email": user.email
                })
        
        return result
    except Exception as e:
        print(f"Get followers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/follow/{user_id}/following")
async def get_following(user_id: int, db: Session = Depends(get_db)):
    """Get list of users being followed"""
    try:
        following = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).all()
        
        result = []
        for follow in following:
            user = db.query(models.User).filter(
                models.User.id == follow.following_id
            ).first()
            if user:
                result.append({
                    "id": user.id,
                    "full_name": user.full_name,
                    "college_id": user.college_id,
                    "department": user.department,
                    "year": user.year,
                    "email": user.email
                })
        
        return result
    except Exception as e:
        print(f"Get following error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/follow/{user_id}/requests")
async def get_follow_requests(user_id: int, db: Session = Depends(get_db)):
    """Get pending follow requests"""
    try:
        requests = db.query(models.Follow).filter(
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.PENDING
        ).all()
        
        result = []
        for follow in requests:
            user = db.query(models.User).filter(
                models.User.id == follow.follower_id
            ).first()
            if user:
                result.append({
                    "id": user.id,
                    "full_name": user.full_name,
                    "college_id": user.college_id,
                    "department": user.department,
                    "year": user.year,
                    "email": user.email,
                    "request_id": follow.id
                })
        
        return result
    except Exception as e:
        print(f"Get follow requests error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================ SEARCH ENDPOINTS ================

@app.get("/search/users")
async def search_users(
    query: str,
    current_user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Search users by name, college ID, or email"""
    try:
        users = db.query(models.User).filter(
            or_(
                models.User.full_name.ilike(f'%{query}%'),
                models.User.college_id.ilike(f'%{query}%'),
                models.User.email.ilike(f'%{query}%'),
                models.User.department.ilike(f'%{query}%')
            )
        ).limit(50).all()
        
        result = []
        for user in users:
            user_data = {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "college_id": user.college_id,
                "department": user.department,
                "year": user.year
            }
            
            # Add follow status if current_user_id provided
            if current_user_id:
                follow = db.query(models.Follow).filter(
                    models.Follow.follower_id == current_user_id,
                    models.Follow.following_id == user.id
                ).first()
                
                user_data["follow_status"] = follow.status.value if follow else None
                user_data["is_following"] = follow is not None
            
            result.append(user_data)
        
        return result
    except Exception as e:
        print(f"Search users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================ CHAT ENDPOINTS ================

@app.post("/chat/groups/{user_id}")
async def create_chat_group(
    user_id: int,
    group: ChatGroupCreate,
    db: Session = Depends(get_db)
):
    """Create a new chat group"""
    try:
        # Create group
        new_group = models.ChatGroup(
            name=group.name,
            description=group.description,
            created_by=user_id,
            chat_type=models.ChatType.GROUP
        )
        db.add(new_group)
        db.flush()
        
        # Add creator as admin
        creator_member = models.GroupMember(
            group_id=new_group.id,
            user_id=user_id,
            role="admin"
        )
        db.add(creator_member)
        
        # Add other members
        for member_id in group.member_ids:
            if member_id != user_id:
                member = models.GroupMember(
                    group_id=new_group.id,
                    user_id=member_id,
                    role="member"
                )
                db.add(member)
                
                # Create notification
                notification = models.Notification(
                    user_id=member_id,
                    type=models.NotificationType.GROUP_ADDED,
                    title="Added to Group",
                    message=f"You were added to {group.name}",
                    related_id=new_group.id
                )
                db.add(notification)
        
        db.commit()
        db.refresh(new_group)
        return new_group
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/groups/{user_id}")
async def get_user_groups(user_id: int, db: Session = Depends(get_db)):
    """Get all groups for a user"""
    try:
        memberships = db.query(models.GroupMember).filter(
            models.GroupMember.user_id == user_id
        ).all()
        
        groups = []
        for membership in memberships:
            group = db.query(models.ChatGroup).filter(
                models.ChatGroup.id == membership.group_id,
                models.ChatGroup.is_active == True
            ).first()
            
            if group:
                # Get last message
                last_message = db.query(models.ChatMessage).filter(
                    models.ChatMessage.group_id == group.id
                ).order_by(models.ChatMessage.created_at.desc()).first()
                
                # Get unread count
                unread_count = db.query(models.ChatMessage).filter(
                    models.ChatMessage.group_id == group.id,
                    models.ChatMessage.sender_id != user_id,
                    models.ChatMessage.is_read == False
                ).count()
                
                groups.append({
                    "id": group.id,
                    "name": group.name,
                    "description": group.description,
                    "chat_type": group.chat_type.value,
                    "avatar_url": group.avatar_url,
                    "last_message": last_message.message if last_message else None,
                    "last_message_time": last_message.created_at.isoformat() if last_message else None,
                    "unread_count": unread_count,
                    "member_count": len(group.members)
                })
        
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/groups/{group_id}/messages/{user_id}")
async def send_message(
    group_id: int,
    user_id: int,
    message: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """Send a message in a group"""
    try:
        # Check if user is member
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Create message
        new_message = models.ChatMessage(
            group_id=group_id,
            sender_id=user_id,
            message=message.message,
            message_type=message.message_type,
            media_url=message.media_url
        )
        db.add(new_message)
        
        # Create notifications for other members
        other_members = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id != user_id
        ).all()
        
        for member in other_members:
            notification = models.Notification(
                user_id=member.user_id,
                type=models.NotificationType.NEW_MESSAGE,
                title="New Message",
                message=f"New message in {membership.group.name}",
                related_id=group_id
            )
            db.add(notification)
        
        db.commit()
        db.refresh(new_message)
        
        return {
            "id": new_message.id,
            "message": new_message.message,
            "sender_id": new_message.sender_id,
            "created_at": new_message.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/groups/{group_id}/messages")
async def get_group_messages(
    group_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get messages from a group"""
    try:
        messages = db.query(models.ChatMessage).filter(
            models.ChatMessage.group_id == group_id
        ).order_by(
            models.ChatMessage.created_at.desc()
        ).limit(limit).offset(offset).all()
        
        result = []
        for msg in reversed(messages):
            sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
            result.append({
                "id": msg.id,
                "message": msg.message,
                "message_type": msg.message_type,
                "media_url": msg.media_url,
                "sender_id": msg.sender_id,
                "sender_name": sender.full_name if sender else "Unknown",
                "created_at": msg.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ================ ENHANCED CHAT ENDPOINTS ================

@app.get("/chat/groups/{group_id}/members")
async def get_group_members(group_id: int, db: Session = Depends(get_db)):
    """Get all members of a group with their roles"""
    try:
        members = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id
        ).all()
        
        result = []
        for member in members:
            user = db.query(models.User).filter(
                models.User.id == member.user_id
            ).first()
            if user:
                result.append({
                    "id": member.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "college_id": user.college_id,
                    "department": user.department,
                    "year": user.year,
                    "role": member.role,
                    "joined_at": member.joined_at.isoformat()
                })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/groups/{group_id}/info")
async def get_group_info(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed group information"""
    try:
        group = db.query(models.ChatGroup).filter(
            models.ChatGroup.id == group_id
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is member
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Get creator info
        creator = db.query(models.User).filter(
            models.User.id == group.created_by
        ).first()
        
        # Get member count
        member_count = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id
        ).count()
        
        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "chat_type": group.chat_type.value,
            "created_by": group.created_by,
            "creator_name": creator.full_name if creator else "Unknown",
            "created_at": group.created_at.isoformat(),
            "member_count": member_count,
            "user_role": membership.role,
            "is_admin": membership.role == "admin"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/groups/{group_id}/add-members")
async def add_members_to_group(
    group_id: int,
    user_id: int,
    member_ids: list[int],
    db: Session = Depends(get_db)
):
    """Add new members to a group (admin only)"""
    try:
        # Check if requester is admin
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id
        ).first()
        
        if not membership or membership.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can add members")
        
        group = db.query(models.ChatGroup).filter(
            models.ChatGroup.id == group_id
        ).first()
        
        added_count = 0
        for member_id in member_ids:
            # Check if already a member
            existing = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == group_id,
                models.GroupMember.user_id == member_id
            ).first()
            
            if not existing:
                new_member = models.GroupMember(
                    group_id=group_id,
                    user_id=member_id,
                    role="member"
                )
                db.add(new_member)
                
                # Create notification
                notification = models.Notification(
                    user_id=member_id,
                    type=models.NotificationType.GROUP_ADDED,
                    title="Added to Group",
                    message=f"You were added to {group.name}",
                    related_id=group_id
                )
                db.add(notification)
                added_count += 1
        
        db.commit()
        return {"message": f"Added {added_count} new members"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/groups/{group_id}/remove-member/{member_user_id}")
async def remove_member_from_group(
    group_id: int,
    member_user_id: int,
    admin_user_id: int,
    db: Session = Depends(get_db)
):
    """Remove a member from group (admin only)"""
    try:
        # Check if requester is admin
        admin_membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == admin_user_id
        ).first()
        
        if not admin_membership or admin_membership.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can remove members")
        
        # Can't remove yourself if you're the creator
        group = db.query(models.ChatGroup).filter(
            models.ChatGroup.id == group_id
        ).first()
        
        if member_user_id == group.created_by:
            raise HTTPException(status_code=403, detail="Cannot remove group creator")
        
        # Remove member
        db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == member_user_id
        ).delete()
        
        db.commit()
        return {"message": "Member removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/groups/{group_id}/leave/{user_id}")
async def leave_group(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Leave a group"""
    try:
        group = db.query(models.ChatGroup).filter(
            models.ChatGroup.id == group_id
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        # Check if user is a member
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id
        ).first()
        
        if not membership:
            raise HTTPException(status_code=404, detail="Not a member of this group")
        
        # If creator, transfer admin or delete group
        if group.created_by == user_id:
            # Check if there are other members
            other_members = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == group_id,
                models.GroupMember.user_id != user_id
            ).all()
            
            if other_members:
                # Transfer admin to first member
                other_members[0].role = "admin"
                group.created_by = other_members[0].user_id
                
                # Notify new admin
                notification = models.Notification(
                    user_id=other_members[0].user_id,
                    type=models.NotificationType.GROUP_ADDED,
                    title="You're now Group Admin",
                    message=f"You've been made admin of {group.name}",
                    related_id=group_id
                )
                db.add(notification)
            else:
                # Delete group if no other members
                group.is_active = False
        
        # Remove user from group
        db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id
        ).delete(synchronize_session=False)
        
        db.commit()
        return {"message": "Left group successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Leave group error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/chat/groups/{group_id}/make-admin/{member_user_id}")
async def make_member_admin(
    group_id: int,
    member_user_id: int,
    admin_user_id: int,
    db: Session = Depends(get_db)
):
    """Make a member an admin (creator only)"""
    try:
        group = db.query(models.ChatGroup).filter(
            models.ChatGroup.id == group_id
        ).first()
        
        if group.created_by != admin_user_id:
            raise HTTPException(status_code=403, detail="Only creator can make admins")
        
        member = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == member_user_id
        ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member.role = "admin"
        db.commit()
        
        return {"message": "Member promoted to admin"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/groups/{user_id}")
async def create_chat_group(
    user_id: int,
    group: ChatGroupCreate,
    db: Session = Depends(get_db)
):
    """Create a new chat group - Only with mutually following users"""
    try:
        # Verify all members are mutually following the creator
        invalid_members = []
        for member_id in group.member_ids:
            if member_id != user_id:
                # Check mutual follow
                follow1 = db.query(models.Follow).filter(
                    models.Follow.follower_id == user_id,
                    models.Follow.following_id == member_id,
                    models.Follow.status == models.FollowStatus.ACCEPTED
                ).first()
                
                follow2 = db.query(models.Follow).filter(
                    models.Follow.follower_id == member_id,
                    models.Follow.following_id == user_id,
                    models.Follow.status == models.FollowStatus.ACCEPTED
                ).first()
                
                if not (follow1 and follow2):
                    user = db.query(models.User).filter(
                        models.User.id == member_id
                    ).first()
                    invalid_members.append(user.full_name if user else str(member_id))
        
        if invalid_members:
            raise HTTPException(
                status_code=403,
                detail=f"Can only add mutual followers. Not mutual: {', '.join(invalid_members)}"
            )
        
        # Create group
        new_group = models.ChatGroup(
            name=group.name,
            description=group.description,
            created_by=user_id,
            chat_type=models.ChatType.GROUP
        )
        db.add(new_group)
        db.flush()
        
        # Add creator as admin
        creator_member = models.GroupMember(
            group_id=new_group.id,
            user_id=user_id,
            role="admin"
        )
        db.add(creator_member)
        
        # Add other members
        for member_id in group.member_ids:
            if member_id != user_id:
                member = models.GroupMember(
                    group_id=new_group.id,
                    user_id=member_id,
                    role="member"
                )
                db.add(member)
                
                # Create notification
                notification = models.Notification(
                    user_id=member_id,
                    type=models.NotificationType.GROUP_ADDED,
                    title="Added to Group",
                    message=f"You were added to {group.name}",
                    related_id=new_group.id
                )
                db.add(notification)
        
        db.commit()
        db.refresh(new_group)
        return new_group
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ================ FEED/POSTS ENDPOINTS ================

@app.post("/posts/{user_id}")
async def create_post(
    user_id: int,
    post: PostCreate,
    db: Session = Depends(get_db)
):
    """Create a new post"""
    try:
        new_post = models.Post(
            user_id=user_id,
            content=post.content,
            media_url=post.media_url,
            media_type=post.media_type,
            is_announcement=post.is_announcement
        )
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        
        # If announcement, notify all followers
        if post.is_announcement:
            followers = db.query(models.Follow).filter(
                models.Follow.following_id == user_id,
                models.Follow.status == models.FollowStatus.ACCEPTED
            ).all()
            
            for follow in followers:
                notification = models.Notification(
                    user_id=follow.follower_id,
                    type=models.NotificationType.ADMIN_BROADCAST,
                    title="New Announcement",
                    message=f"New announcement posted",
                    related_id=new_post.id
                )
                db.add(notification)
            
            db.commit()
        
        return new_post
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/posts/feed/{user_id}")
async def get_feed(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get feed for a user (posts from followed users + own posts)"""
    try:
        # Get followed users
        following = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).all()
        
        followed_ids = [f.following_id for f in following]
        followed_ids.append(user_id)  # Include own posts
        
        # Get posts
        posts = db.query(models.Post).filter(
            models.Post.user_id.in_(followed_ids)
        ).order_by(
            models.Post.created_at.desc()
        ).limit(limit).offset(offset).all()
        
        result = []
        for post in posts:
            author = db.query(models.User).filter(models.User.id == post.user_id).first()
            likes_count = len(post.likes)
            comments_count = len(post.comments)
            user_liked = any(like.user_id == user_id for like in post.likes)
            
            result.append({
                "id": post.id,
                "content": post.content,
                "media_url": post.media_url,
                "media_type": post.media_type,
                "is_announcement": post.is_announcement,
                "author": {
                    "id": author.id,
                    "full_name": author.full_name,
                    "department": author.department,
                    "year": author.year
                },
                "likes_count": likes_count,
                "comments_count": comments_count,
                "user_liked": user_liked,
                "created_at": post.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts/{post_id}/like/{user_id}")
async def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    """Like a post"""
    try:
        # Check if already liked
        existing = db.query(models.Like).filter(
            models.Like.post_id == post_id,
            models.Like.user_id == user_id
        ).first()
        
        if existing:
            # Unlike
            db.delete(existing)
            db.commit()
            return {"message": "Post unliked"}
        else:
            # Like
            new_like = models.Like(post_id=post_id, user_id=user_id)
            db.add(new_like)
            
            # Create notification
            post = db.query(models.Post).filter(models.Post.id == post_id).first()
            if post and post.user_id != user_id:
                notification = models.Notification(
                    user_id=post.user_id,
                    type=models.NotificationType.POST_LIKE,
                    title="New Like",
                    message=f"Someone liked your post",
                    related_id=post_id
                )
                db.add(notification)
            
            db.commit()
            return {"message": "Post liked"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/posts/{post_id}/comment/{user_id}")
async def add_comment(
    post_id: int,
    user_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db)
):
    """Add a comment to a post"""
    try:
        new_comment = models.Comment(
            post_id=post_id,
            user_id=user_id,
            content=comment.content
        )
        db.add(new_comment)
        
        # Create notification
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post and post.user_id != user_id:
            notification = models.Notification(
                user_id=post.user_id,
                type=models.NotificationType.POST_COMMENT,
                title="New Comment",
                message=f"Someone commented on your post",
                related_id=post_id
            )
            db.add(notification)
        
        db.commit()
        db.refresh(new_comment)
        
        author = db.query(models.User).filter(models.User.id == user_id).first()
        return {
            "id": new_comment.id,
            "content": new_comment.content,
            "author": {
                "id": author.id,
                "full_name": author.full_name
            },
            "created_at": new_comment.created_at.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/posts/{post_id}/comments")
async def get_comments(post_id: int, db: Session = Depends(get_db)):
    """Get comments for a post"""
    try:
        comments = db.query(models.Comment).filter(
            models.Comment.post_id == post_id
        ).order_by(models.Comment.created_at.asc()).all()
        
        result = []
        for comment in comments:
            author = db.query(models.User).filter(models.User.id == comment.user_id).first()
            result.append({
                "id": comment.id,
                "content": comment.content,
                "author": {
                    "id": author.id,
                    "full_name": author.full_name,
                    "department": author.department
                },
                "created_at": comment.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ================ DELETE POST ENDPOINT ================

@app.delete("/posts/{post_id}")
async def delete_post(
    post_id: int, 
    user_id: int, 
    db: Session = Depends(get_db)
):
    """Delete a post"""
    try:
        # First verify the post exists and user owns it
        post = db.query(models.Post).filter(
            models.Post.id == post_id,
            models.Post.user_id == user_id
        ).first()
        
        if not post:
            raise HTTPException(
                status_code=404, 
                detail="Post not found or you don't have permission to delete it"
            )
        
        # Delete related records in order
        # 1. Delete notifications related to this post
        db.query(models.Notification).filter(
            models.Notification.related_id == post_id,
            models.Notification.type.in_([
                models.NotificationType.POST_LIKE,
                models.NotificationType.POST_COMMENT,
                models.NotificationType.ADMIN_BROADCAST
            ])
        ).delete(synchronize_session=False)
        
        # 2. Delete comments
        db.query(models.Comment).filter(
            models.Comment.post_id == post_id
        ).delete(synchronize_session=False)
        
        # 3. Delete likes
        db.query(models.Like).filter(
            models.Like.post_id == post_id
        ).delete(synchronize_session=False)
        
        # 4. Finally delete the post
        db.delete(post)
        db.commit()
        
        return {"message": "Post deleted successfully", "success": True}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting post: {str(e)}")


# ================ EDIT POST ENDPOINT ================

@app.put("/posts/{post_id}")
async def edit_post(
    post_id: int,
    user_id: int,
    post_update: PostCreate,
    db: Session = Depends(get_db)
):
    """Edit a post"""
    try:
        post = db.query(models.Post).filter(
            models.Post.id == post_id,
            models.Post.user_id == user_id
        ).first()
        
        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found or you don't have permission to edit it"
            )
        
        post.content = post_update.content
        if post_update.media_url:
            post.media_url = post_update.media_url
        post.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(post)
        
        return {
            "id": post.id,
            "content": post.content,
            "media_url": post.media_url,
            "updated_at": post.updated_at.isoformat(),
            "message": "Post updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ================ DISCUSSION ENDPOINTS ================

# ================ DISCUSSION ENDPOINTS ================

@app.post("/discussions/{user_id}")
async def create_discussion(
    user_id: int,
    discussion: DiscussionCreate,
    db: Session = Depends(get_db)
):
    """Create a new discussion"""
    try:
        new_discussion = models.Discussion(
            user_id=user_id,
            title=discussion.title,
            topic=discussion.topic,
            content=discussion.content,
            visibility=models.DiscussionVisibility.PUBLIC if discussion.visibility == "public" else models.DiscussionVisibility.RESTRICTED,
            allowed_departments=discussion.allowed_departments,
            allowed_years=discussion.allowed_years
        )
        db.add(new_discussion)
        db.commit()
        db.refresh(new_discussion)
        
        # Add creator as participant
        participant = models.DiscussionParticipant(
            discussion_id=new_discussion.id,
            user_id=user_id,
            is_admin=True
        )
        db.add(participant)
        db.commit()
        
        return new_discussion
    except Exception as e:
        db.rollback()
        logging.error(f"Create discussion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/discussions")
async def get_discussions(
    user_id: int, 
    topic: Optional[str] = None, 
    limit: int = 20, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    """Get all discussions visible to the user"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        query = db.query(models.Discussion).filter(
            or_(
                models.Discussion.visibility == models.DiscussionVisibility.PUBLIC,
                and_(
                    models.Discussion.visibility == models.DiscussionVisibility.RESTRICTED,
                    or_(
                        models.Discussion.allowed_departments.ilike(f"%{user.department}%"),
                        models.Discussion.allowed_years.ilike(f"%{user.year}%")
                    )
                )
            )
        )
        
        if topic and topic != 'all':
            query = query.filter(models.Discussion.topic == topic)
        
        discussions = query.order_by(
            models.Discussion.created_at.desc()
        ).limit(limit).offset(offset).all()
        
        result = []
        for disc in discussions:
            author = db.query(models.User).filter(models.User.id == disc.user_id).first()
            replies_count = db.query(models.DiscussionReply).filter(
                models.DiscussionReply.discussion_id == disc.id
            ).count()
            
            # Check if user is participant
            is_participant = db.query(models.DiscussionParticipant).filter(
                models.DiscussionParticipant.discussion_id == disc.id,
                models.DiscussionParticipant.user_id == user_id
            ).first() is not None
            
            # Check if user is admin
            is_admin = db.query(models.DiscussionParticipant).filter(
                models.DiscussionParticipant.discussion_id == disc.id,
                models.DiscussionParticipant.user_id == user_id,
                models.DiscussionParticipant.is_admin == True
            ).first() is not None
            
            result.append({
                "id": disc.id,
                "title": disc.title,
                "topic": disc.topic,
                "content": disc.content,
                "author": {
                    "id": author.id,
                    "full_name": author.full_name
                } if author else {"id": 0, "full_name": "Unknown"},
                "replies_count": replies_count,
                "is_participant": is_participant,
                "is_admin": is_admin,
                "created_at": disc.created_at.isoformat()
            })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Discussion fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/discussions/{discussion_id}/join/{user_id}")
async def join_discussion(
    discussion_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Join a discussion"""
    try:
        # Check if already participant
        existing = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id,
            models.DiscussionParticipant.user_id == user_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already a participant")
        
        participant = models.DiscussionParticipant(
            discussion_id=discussion_id,
            user_id=user_id,
            is_admin=False
        )
        db.add(participant)
        db.commit()
        
        return {"message": "Joined successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/discussions/{discussion_id}/leave/{user_id}")
async def leave_discussion(
    discussion_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    """Leave a discussion"""
    try:
        participant = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id,
            models.DiscussionParticipant.user_id == user_id
        ).first()
        
        if not participant:
            raise HTTPException(status_code=404, detail="Not a participant")
        
        # Check if user is the creator
        discussion = db.query(models.Discussion).filter(
            models.Discussion.id == discussion_id
        ).first()
        
        if discussion.user_id == user_id:
            raise HTTPException(
                status_code=400, 
                detail="Creator cannot leave. Delete the discussion instead."
            )
        
        db.delete(participant)
        db.commit()
        
        return {"message": "Left successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/discussions/{discussion_id}/remove/{target_user_id}")
async def remove_participant(
    discussion_id: int,
    target_user_id: int,
    admin_user_id: int,
    db: Session = Depends(get_db)
):
    """Admin removes a participant"""
    try:
        # Check if requester is admin
        admin = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id,
            models.DiscussionParticipant.user_id == admin_user_id,
            models.DiscussionParticipant.is_admin == True
        ).first()
        
        if not admin:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Cannot remove creator
        discussion = db.query(models.Discussion).filter(
            models.Discussion.id == discussion_id
        ).first()
        
        if discussion.user_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot remove creator")
        
        # Remove participant
        participant = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id,
            models.DiscussionParticipant.user_id == target_user_id
        ).first()
        
        if not participant:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(participant)
        
        # Notify removed user
        notification = models.Notification(
            user_id=target_user_id,
            type=models.NotificationType.DISCUSSION_REPLY,
            title="Removed from Discussion",
            message=f"You were removed from '{discussion.title}'",
            related_id=discussion_id
        )
        db.add(notification)
        
        db.commit()
        
        return {"message": "Participant removed"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/discussions/{discussion_id}/participants")
async def get_participants(discussion_id: int, db: Session = Depends(get_db)):
    """Get all participants"""
    try:
        participants = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id
        ).all()
        
        result = []
        for p in participants:
            user = db.query(models.User).filter(models.User.id == p.user_id).first()
            if user:
                result.append({
                    "id": user.id,
                    "full_name": user.full_name,
                    "is_admin": p.is_admin,
                    "joined_at": p.joined_at.isoformat()
                })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/discussions/{discussion_id}/reply/{user_id}")
async def add_discussion_reply(
    discussion_id: int,
    user_id: int,
    reply: DiscussionReplyCreate,
    db: Session = Depends(get_db)
):
    """Reply to a discussion"""
    try:
        # Auto-join if not participant
        existing = db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id,
            models.DiscussionParticipant.user_id == user_id
        ).first()
        
        if not existing:
            participant = models.DiscussionParticipant(
                discussion_id=discussion_id,
                user_id=user_id,
                is_admin=False
            )
            db.add(participant)
        
        new_reply = models.DiscussionReply(
            discussion_id=discussion_id,
            user_id=user_id,
            content=reply.content,
            parent_reply_id=reply.parent_reply_id
        )
        db.add(new_reply)
        
        discussion = db.query(models.Discussion).filter(
            models.Discussion.id == discussion_id
        ).first()
        
        if discussion and discussion.user_id != user_id:
            notification = models.Notification(
                user_id=discussion.user_id,
                type=models.NotificationType.DISCUSSION_REPLY,
                title="New Reply",
                message=f"Someone replied to your discussion",
                related_id=discussion_id
            )
            db.add(notification)
        
        db.commit()
        db.refresh(new_reply)
        
        author = db.query(models.User).filter(models.User.id == user_id).first()
        return {
            "id": new_reply.id,
            "content": new_reply.content,
            "parent_reply_id": new_reply.parent_reply_id,
            "author": {
                "id": author.id,
                "full_name": author.full_name
            } if author else {"id": 0, "full_name": "Unknown"},
            "created_at": new_reply.created_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logging.error(f"Add reply error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/discussions/{discussion_id}/replies")
async def get_discussion_replies(discussion_id: int, db: Session = Depends(get_db)):
    """Get replies for a discussion"""
    try:
        replies = db.query(models.DiscussionReply).filter(
            models.DiscussionReply.discussion_id == discussion_id
        ).order_by(models.DiscussionReply.created_at.asc()).all()
        
        result = []
        for reply in replies:
            author = db.query(models.User).filter(models.User.id == reply.user_id).first()
            result.append({
                "id": reply.id,
                "content": reply.content,
                "parent_reply_id": reply.parent_reply_id,
                "author": {
                    "id": author.id,
                    "full_name": author.full_name
                } if author else {"id": 0, "full_name": "Unknown"},
                "created_at": reply.created_at.isoformat()
            })
        
        return result
        
    except Exception as e:
        logging.error(f"Get replies error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================ USER PROFILE ENDPOINTS ================

@app.get("/profile/{user_id}")
async def get_user_profile(user_id: int, viewer_id: int, db: Session = Depends(get_db)):
    """Get user profile with stats"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get stats
        followers_count = db.query(models.Follow).filter(
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).count()
        
        following_count = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).count()
        
        posts_count = db.query(models.Post).filter(models.Post.user_id == user_id).count()
        
        # Check if viewer is following
        is_following = db.query(models.Follow).filter(
            models.Follow.follower_id == viewer_id,
            models.Follow.following_id == user_id,
            models.Follow.status == models.FollowStatus.ACCEPTED
        ).first() is not None
        
        # Get recent posts
        recent_posts = db.query(models.Post).filter(
            models.Post.user_id == user_id
        ).order_by(models.Post.created_at.desc()).limit(6).all()
        
        posts_data = []
        for post in recent_posts:
            posts_data.append({
                "id": post.id,
                "content": post.content,
                "media_url": post.media_url,
                "likes_count": len(post.likes),
                "comments_count": len(post.comments),
                "created_at": post.created_at.isoformat()
            })
        
        return {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "college_id": user.college_id,
                "department": user.department,
                "year": user.year,
                "phone_number": user.phone_number
            },
            "stats": {
                "followers": followers_count,
                "following": following_count,
                "posts": posts_count
            },
            "is_following": is_following,
            "recent_posts": posts_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================ SEARCH ENDPOINTS ================

@app.get("/search/users")
async def search_users(
    query: str,
    department: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Search for users"""
    try:
        search_query = db.query(models.User).filter(
            or_(
                models.User.full_name.ilike(f"%{query}%"),
                models.User.college_id.ilike(f"%{query}%"),
                models.User.email.ilike(f"%{query}%")
            )
        )
        
        if department:
            search_query = search_query.filter(models.User.department == department)
        
        if year:
            search_query = search_query.filter(models.User.year == year)
        
        users = search_query.limit(limit).all()
        
        return [
            {
                "id": user.id,
                "full_name": user.full_name,
                "college_id": user.college_id,
                "department": user.department,
                "year": user.year
            }
            for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ================ NOTIFICATION ENDPOINTS ================

@app.get("/notifications/{user_id}")
async def get_notifications(
    user_id: int,
    unread_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get user notifications"""
    try:
        query = db.query(models.Notification).filter(
            models.Notification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(models.Notification.is_read == False)
        
        notifications = query.order_by(
            models.Notification.created_at.desc()
        ).all()
        
        return [
            {
                "id": n.id,
                "type": n.type.value,
                "title": n.title,
                "message": n.message,
                "related_id": n.related_id,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    except Exception as e:
        print(f"Get notifications error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    try:
        notification = db.query(models.Notification).filter(
            models.Notification.id == notification_id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Mark notification read error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/notifications/{user_id}/read-all")
async def mark_all_notifications_read(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for a user"""
    try:
        db.query(models.Notification).filter(
            models.Notification.user_id == user_id,
            models.Notification.is_read == False
        ).update({"is_read": True})
        
        db.commit()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        print(f"Mark all read error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    try:
        notification = db.query(models.Notification).filter(
            models.Notification.id == notification_id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        db.delete(notification)
        db.commit()
        
        return {"message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete notification error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
# marketplace_routes.py ####API 's for marketplace functionalities
# ================marketplace_route ENDPOINTS ================

# Pydantic Models
class SellerInfo(BaseModel):
    id: int
    name: str
    avatar: str
    college: str
    verified: bool = True
    rating: float = 4.5
    itemsSold: int

class MarketplaceItemBase(BaseModel):
    title: str
    description: str
    price: str
    category: str
    condition: str
    location: str

class MarketplaceItemCreate(MarketplaceItemBase):
    seller_id: int
    images: List[str] = []
    is_negotiable: bool = False

class MarketplaceItemResponse(BaseModel):
    id: int
    title: str
    description: str
    price: str
    category: str
    condition: str
    location: str
    images: List[str]
    views: int = 0
    isNegotiable: bool = False
    isSaved: bool = False
    postedDate: str
    seller: SellerInfo

class ChatCreate(BaseModel):
    item_id: int
    buyer_id: int

class MessageCreate(BaseModel):
    sender_id: int
    message: str
    message_type: str = "text"
    offer_amount: Optional[str] = None

# Helper function
def get_relative_time(dt: datetime) -> str:
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 7:
        return f"{diff.days // 7} weeks ago"
    elif diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600} hours ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60} minutes ago"
    else:
        return "Just now"

# Get all marketplace items
@app.get("/marketplace/items", response_model=List[MarketplaceItemResponse])
async def get_marketplace_items(
    category: str = Query("all"),
    search: str = Query(""),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        print(f"Getting marketplace items - category: {category}, user_id: {user_id}")
        query = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.status == 'active'
        )
        
        if category != 'all':
            query = query.filter(models.MarketplaceItem.category == category)
        
        if search:
            query = query.filter(
                or_(
                    models.MarketplaceItem.title.ilike(f"%{search}%"),
                    models.MarketplaceItem.description.ilike(f"%{search}%")
                )
            )
        
        items = query.order_by(models.MarketplaceItem.created_at.desc()).all()
        
        result = []
        for item in items:
            is_saved = False
            if user_id:
                is_saved = db.query(models.SavedItem).filter(
                    models.SavedItem.user_id == user_id, 
                    models.SavedItem.item_id == item.id
                ).first() is not None
            
            posted_date = get_relative_time(item.created_at)
            
            seller_items_sold = db.query(models.MarketplaceItem).filter(
                models.MarketplaceItem.seller_id == item.seller_id, 
                models.MarketplaceItem.status == 'sold'
            ).count()
            
            result.append(MarketplaceItemResponse(
                id=item.id,
                title=item.title,
                description=item.description,
                price=item.price,
                category=item.category,
                condition=item.condition,
                location=item.location,
                images=item.images or [],
                views=item.views,
                isNegotiable=item.is_negotiable,
                isSaved=is_saved,
                postedDate=posted_date,
                seller=SellerInfo(
                    id=item.seller.id,
                    name=item.seller.full_name,
                    avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={item.seller.full_name}",
                    college=item.seller.department,
                    verified=True,
                    rating=4.5,
                    itemsSold=seller_items_sold
                )
            ))
        
        return result
        
    except Exception as e:
        print(f"ERROR in get_marketplace_items:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Get single item details
@app.get("/marketplace/items/{item_id}", response_model=MarketplaceItemResponse)
async def get_item_details(
    item_id: int,
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        item = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Increment view count
        item.views += 1
        db.commit()
        
        is_saved = False
        if user_id:
            is_saved = db.query(models.SavedItem).filter(
                models.SavedItem.user_id == user_id, 
                models.SavedItem.item_id == item_id
            ).first() is not None
        
        posted_date = get_relative_time(item.created_at)
        
        seller_items_sold = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.seller_id == item.seller_id,
            models.MarketplaceItem.status == 'sold'
        ).count()
        
        return MarketplaceItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            price=item.price,
            category=item.category,
            condition=item.condition,
            location=item.location,
            images=item.images or [],
            views=item.views,
            isNegotiable=item.is_negotiable,
            isSaved=is_saved,
            postedDate=posted_date,
            seller=SellerInfo(
                id=item.seller.id,
                name=item.seller.full_name,
                avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={item.seller.full_name}",
                college=item.seller.department,
                verified=True,
                rating=4.5,
                itemsSold=seller_items_sold
            )
        )
        
    except Exception as e:
        print(f"ERROR in get_item_details:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Create new item
@app.post("/marketplace/items")
async def create_item(
    item: MarketplaceItemCreate,
    db: Session = Depends(get_db)
):
    try:
        print(f"Creating item: {item.title} for seller {item.seller_id}")
        
        # Verify user exists
        user = db.query(models.User).filter(
            models.User.id == item.seller_id
        ).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_item = models.MarketplaceItem(
            seller_id=item.seller_id,
            title=item.title,
            description=item.description,
            price=item.price,
            category=item.category,
            condition=item.condition,
            location=item.location,
            images=item.images or [],
            is_negotiable=item.is_negotiable,
            status='active'
        )
        
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        print(f"Item created successfully with id {new_item.id}")
        
        return {
            'message': 'Item created successfully',
            'item_id': new_item.id
        }
        
    except Exception as e:
        db.rollback()
        print(f"ERROR in create_item:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Update item
@app.put("/marketplace/items/{item_id}")
async def update_item(
    item_id: int,
    item_data: MarketplaceItemCreate,
    db: Session = Depends(get_db)
):
    try:
        item = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Verify ownership
        if item.seller_id != item_data.seller_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        if item_data.title:
            item.title = item_data.title
        if item_data.description:
            item.description = item_data.description
        if item_data.price:
            item.price = item_data.price
        if item_data.category:
            item.category = item_data.category
        if item_data.condition:
            item.condition = item_data.condition
        if item_data.location:
            item.location = item_data.location
        if item_data.images:
            item.images = item_data.images
        if item_data.is_negotiable is not None:
            item.is_negotiable = item_data.is_negotiable
        
        item.updated_at = datetime.utcnow()
        db.commit()
        
        return {'message': 'Item updated successfully'}
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_item:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Delete item - FIX for chat cascade
@app.delete("/marketplace/items/{item_id}")
async def delete_item(
    item_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    try:
        item = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Verify ownership
        if item.seller_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Delete associated chats first
        db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.item_id == item_id
        ).delete()
        
        # Delete saved items
        db.query(models.SavedItem).filter(
            models.SavedItem.item_id == item_id
        ).delete()
        
        # Now delete the item
        db.delete(item)
        db.commit()
        
        return {'message': 'Item deleted successfully'}
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in delete_item:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Mark as sold - FINAL FIX
@app.post("/marketplace/items/{item_id}/sold")
async def mark_as_sold(
    item_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Marking item {item_id} as sold by user {user_id}")
        
        item = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.id == item_id
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Verify ownership
        if item.seller_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        item.status = 'sold'
        item.updated_at = datetime.utcnow()
        db.commit()
        
        return {'message': 'Item marked as sold', 'status': 'sold'}
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in mark_as_sold:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Get user's listings
@app.get("/marketplace/my-listings/{user_id}")
async def get_my_listings(
    user_id: int,
    status: str = Query("active"),
    db: Session = Depends(get_db)
):
    try:
        print(f"Getting listings for user {user_id} with status {status}")
        items = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.seller_id == user_id,
            models.MarketplaceItem.status == status
        ).order_by(models.MarketplaceItem.created_at.desc()).all()
        
        result = []
        for item in items:
            inquiries = db.query(models.MarketplaceChat).filter(
                models.MarketplaceChat.item_id == item.id
            ).count()
            posted_date = get_relative_time(item.created_at)
            
            result.append({
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'price': item.price,
                'category': item.category,
                'condition': item.condition,
                'location': item.location,
                'images': item.images or [],
                'views': item.views,
                'status': item.status,
                'inquiries': inquiries,
                'postedDate': posted_date
            })
        
        return result
    
    except Exception as e:
        print(f"ERROR in get_my_listings:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Save/Unsave item - FINAL FIX
@app.post("/marketplace/items/{item_id}/save")
async def toggle_save_item(
    item_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Toggle save for item {item_id}, user {user_id}")
        
        saved = db.query(models.SavedItem).filter(
            models.SavedItem.user_id == user_id,
            models.SavedItem.item_id == item_id
        ).first()
        
        if saved:
            db.delete(saved)
            db.commit()
            return {'message': 'Item unsaved', 'is_saved': False}
        else:
            new_save = models.SavedItem(user_id=user_id, item_id=item_id)
            db.add(new_save)
            db.commit()
            return {'message': 'Item saved', 'is_saved': True}
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in toggle_save_item:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
# Get saved items
@app.get("/marketplace/saved/{user_id}")
async def get_saved_items(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        print(f"Getting saved items for user {user_id}")
        saved_items = db.query(models.SavedItem).filter(
            models.SavedItem.user_id == user_id
        ).all()
        
        result = []
        for saved in saved_items:
            item = saved.item
            if item and item.status == 'active':
                posted_date = get_relative_time(item.created_at)
                
                result.append({
                    'id': item.id,
                    'title': item.title,
                    'description': item.description,
                    'price': item.price,
                    'category': item.category,
                    'images': item.images or [],
                    'postedDate': posted_date,
                    'seller': {
                        'name': item.seller.full_name,
                        'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={item.seller.full_name}"
                    }
                })
        
        return result
    
    except Exception as e:
        print(f"ERROR in get_saved_items:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Create or get chat for an item
@app.post("/marketplace/chats")
async def create_or_get_chat(
    chat_data: ChatCreate,
    db: Session = Depends(get_db)
):
    try:
        item = db.query(models.MarketplaceItem).filter(
            models.MarketplaceItem.id == chat_data.item_id
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        existing_chat = db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.item_id == chat_data.item_id,
            models.MarketplaceChat.buyer_id == chat_data.buyer_id
        ).first()
        
        if existing_chat:
            return {
                'chat_id': existing_chat.id,
                'exists': True
            }
        
        # Create new chat
        new_chat = models.MarketplaceChat(
            item_id=chat_data.item_id,
            buyer_id=chat_data.buyer_id,
            seller_id=item.seller_id
        )
        
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        
        return {
            'chat_id': new_chat.id,
            'exists': False
        }
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in create_or_get_chat:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Get user's marketplace chats
@app.get("/marketplace/chats/{user_id}")
async def get_marketplace_chats(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        chats = db.query(models.MarketplaceChat).filter(
            or_(
                models.MarketplaceChat.buyer_id == user_id,
                models.MarketplaceChat.seller_id == user_id
            )
        ).order_by(models.MarketplaceChat.last_message_time.desc()).all()
        
        result = []
        for chat in chats:
            other_user = chat.seller if chat.buyer_id == user_id else chat.buyer
            unread_count = db.query(models.MarketplaceMessage).filter(
                and_(
                    models.MarketplaceMessage.chat_id == chat.id,
                    models.MarketplaceMessage.sender_id != user_id,
                    models.MarketplaceMessage.is_read == False
                )
            ).count()
            
            time_ago = get_relative_time(chat.last_message_time) if chat.last_message_time else ''
            
            result.append({
                'id': chat.id,
                'itemId': chat.item_id,
                'itemTitle': chat.item.title,
                'itemImage': chat.item.images[0] if chat.item.images else None,
                'itemPrice': chat.item.price,
                'otherUser': {
                    'id': other_user.id,
                    'name': other_user.full_name,
                    'avatar': f"https://api.dicebear.com/7.x/avataaars/svg?seed={other_user.full_name}"
                },
                'lastMessage': chat.last_message,
                'lastMessageTime': time_ago,
                'unreadCount': unread_count,
                'isBuyer': chat.buyer_id == user_id
            })
        
        return result
    
    except Exception as e:
        print(f"ERROR in get_marketplace_chats:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Send message
# Get chat messages
# Send message - CORRECTED
# Get chat messages - ADD THIS ENDPOINT
@app.get("/marketplace/chats/{chat_id}/messages")
async def get_chat_messages(
    chat_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    try:
        print(f"Getting messages for chat {chat_id}, user {user_id}")
        
        # Get chat info
        chat = db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.id == chat_id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Verify user is part of this chat
        if chat.buyer_id != user_id and chat.seller_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Get messages
        messages = db.query(models.MarketplaceMessage).filter(
            models.MarketplaceMessage.chat_id == chat_id
        ).order_by(models.MarketplaceMessage.created_at).all()
        
        # Mark messages as read for the current user
        db.query(models.MarketplaceMessage).filter(
            models.MarketplaceMessage.chat_id == chat_id,
            models.MarketplaceMessage.sender_id != user_id,
            models.MarketplaceMessage.is_read == False
        ).update({'is_read': True})
        db.commit()
        
        # Format response
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg.id,
                'senderId': msg.sender_id,
                'message': msg.message,
                'messageType': msg.message_type,
                'offerAmount': msg.offer_amount,
                'timestamp': msg.created_at.isoformat(),
                'isRead': msg.is_read
            })
        
        # Check if item exists (it might be deleted)
        item_data = None
        if chat.item_id and chat.item:
            item_data = {
                'id': chat.item.id,
                'title': chat.item.title,
                'image': chat.item.images[0] if chat.item.images else None,
                'price': chat.item.price,
                'status': chat.item.status
            }
        else:
            # Item was deleted
            item_data = {
                'id': None,
                'title': 'Item no longer available',
                'image': None,
                'price': 'N/A',
                'status': 'deleted'
            }
        
        return {
            'chat': {
                'id': chat.id,
                'itemId': chat.item_id,
                'itemTitle': item_data['title'],
                'itemImage': item_data['image'],
                'itemPrice': item_data['price'],
                'itemStatus': item_data['status'],
                'buyer': {
                    'id': chat.buyer.id,
                    'name': chat.buyer.full_name
                },
                'seller': {
                    'id': chat.seller.id,
                    'name': chat.seller.full_name
                }
            },
            'messages': message_list
        }
    
    except Exception as e:
        print(f"ERROR in get_chat_messages:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
# Send message in chat
@app.post("/marketplace/chats/{chat_id}/messages")
async def send_message(
    chat_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db)
):
    try:
        print(f"Sending message to chat {chat_id}")
        
        # Verify chat exists
        chat = db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.id == chat_id
        ).first()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Verify sender is part of chat
        if message_data.sender_id != chat.buyer_id and message_data.sender_id != chat.seller_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Create new message
        new_message = models.MarketplaceMessage(
            chat_id=chat_id,
            sender_id=message_data.sender_id,
            message=message_data.message,
            message_type=message_data.message_type,
            offer_amount=message_data.offer_amount
        )
        
        db.add(new_message)
        
        # Update chat's last message
        chat.last_message = message_data.message
        chat.last_message_time = datetime.utcnow()
        
        db.commit()
        db.refresh(new_message)
        
        print(f"Message sent successfully: {new_message.id}")
        
        return {
            'id': new_message.id,
            'senderId': new_message.sender_id,
            'message': new_message.message,
            'messageType': new_message.message_type,
            'offerAmount': new_message.offer_amount,
            'timestamp': new_message.created_at.isoformat(),
            'isRead': new_message.is_read
        }
    
    except Exception as e:
        db.rollback()
        print(f"ERROR in send_message:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
# Add this function
def initialize_admin():
    """Initialize default admin on startup"""
    try:
        create_default_admin()
    except Exception as e:
        print(f"Admin initialization failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
else:
    # Auto-create admin when module is imported
    initialize_admin()

# from fastapi import FastAPI, Depends, HTTPException, status
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, EmailStr
# from datetime import datetime, timedelta
# from sqlalchemy.orm import Session
# from sqlalchemy import or_,text
# from newapp.database import SessionLocal, engine
# from newapp import models
# import random
# import string
# from passlib.context import CryptContext
# import jwt
# from typing import Optional, List
# from enum import Enum

# from newapp.ai_service import AIAssistant
# from newapp.web_scraper import scrape_iitpkd_website
# from difflib import SequenceMatcher
    
# # Create database tables
# models.Base.metadata.create_all(bind=engine)

# app = FastAPI(title="College App API", version="1.0.0")

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Password hashing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # JWT settings
# SECRET_KEY = "your-secret-key-here-change-in-production"
# ALGORITHM = "HS256"

# # Database dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
# # Course models
# class CourseCreate(BaseModel):
#     course_name: str
#     teacher: str
#     start_date: Optional[str] = None

# # Attendance models
# class AttendanceStatusEnum(str, Enum):
#     PRESENT = "present"
#     ABSENT = "absent"
#     CANCELLED = "cancelled"

# class AttendanceRecordCreate(BaseModel):
#     timetable_entry_id: int
#     date: str
#     status: AttendanceStatusEnum
#     notes: Optional[str] = None

# class AttendanceRecordUpdate(BaseModel):
#     status: Optional[AttendanceStatusEnum] = None
#     notes: Optional[str] = None

# # ================ AUTH MODELS ================
# class UserCreate(BaseModel):
#     email: EmailStr
#     password: str
#     full_name: str
#     college_id: str
#     department: str
#     year: int
#     phone_number: str

# class UserLogin(BaseModel):
#     identifier: str
#     password: str

# class OTPVerify(BaseModel):
#     email: EmailStr
#     otp: str
# # ================ TODO MODELS ================
# class TodoItemCreate(BaseModel):
#     task: str
#     priority: Optional[str] = "medium"

# class TodoItemUpdate(BaseModel):
#     task: Optional[str] = None
#     is_completed: Optional[bool] = None
#     priority: Optional[str] = None
# # ================ ACADEMIC MODELS ================
# class TimetableEntryCreate(BaseModel):
#     day_of_week: str
#     start_time: str
#     end_time: str
#     course_name: str
#     teacher: str
#     room_number: str

# class TimetableEntryUpdate(BaseModel):
#     day_of_week: Optional[str] = None
#     start_time: Optional[str] = None
#     end_time: Optional[str] = None
#     course_name: Optional[str] = None
#     teacher: Optional[str] = None
#     room_number: Optional[str] = None

# class ExamEntryCreate(BaseModel):
#     exam_name: str
#     date: str
#     room_number: str
#     additional_notes: Optional[str] = None

# class ExamEntryUpdate(BaseModel):
#     exam_name: Optional[str] = None
#     date: Optional[str] = None
#     room_number: Optional[str] = None
#     additional_notes: Optional[str] = None

# class GradeEntryCreate(BaseModel):
#     course_name: str
#     credits: float
#     grade: str
#     semester: str
#     category_id: Optional[int] = None

# class GradeEntryUpdate(BaseModel):
#     course_name: Optional[str] = None
#     credits: Optional[float] = None
#     grade: Optional[str] = None
#     semester: Optional[str] = None
#     category_id: Optional[int] = None

# # ================ MESS MENU MODELS ================
# class DayOfWeek(str, Enum):
#     MONDAY = "Monday"
#     TUESDAY = "Tuesday"
#     WEDNESDAY = "Wednesday"
#     THURSDAY = "Thursday"
#     FRIDAY = "Friday"
#     SATURDAY = "Saturday"
#     SUNDAY = "Sunday"

# class MealType(str, Enum):
#     BREAKFAST = "Breakfast"
#     LUNCH = "Lunch"
#     SNACKS = "Snacks"
#     DINNER = "Dinner"

# class MenuWeekType(str, Enum):
#     WEEK_1 = "Week 1"
#     WEEK_2 = "Week 2"

# class MessMenuItemCreate(BaseModel):
#     day_of_week: DayOfWeek
#     meal_type: MealType
#     menu_week_type: MenuWeekType
#     item_name: str
#     description: Optional[str] = None
#     rating: Optional[float] = 0.0
#     votes: Optional[int] = 0

#     # Add after your existing models

# # ================ AI MODELS ================
# class ChatMessage(BaseModel):
#     message: str

# class AddAnswerRequest(BaseModel):
#     question_id: int
#     answer: str
#     category: Optional[str] = None

# # ================ UTILITY FUNCTIONS ================
# def generate_otp(length=6):
#     return ''.join(random.choices(string.digits, k=length))

# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: timedelta = None):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def calculate_cgpa(grades):
#     """Calculate CGPA based on grades"""
#     grade_points = {
#         'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
#     }
    
#     total_points = 0
#     total_credits = 0
    
#     for grade_entry in grades:
#         points = grade_points.get(grade_entry.grade, 0)
#         total_points += points * grade_entry.credits
#         total_credits += grade_entry.credits
    
#     return {
#         'cgpa': round(total_points / total_credits if total_credits > 0 else 0, 2),
#         'total_credits': total_credits
#     }

# def get_current_menu_week_type():
#     """Get current week type based on week number"""
#     now = datetime.utcnow()
#     week_number = now.isocalendar().week
#     if week_number % 4 in [1, 3]:  # Weeks 1 and 3 of month
#         return "WEEK_1"
#     else:  # Weeks 2 and 4 of month
#         return "WEEK_2"
# def fix_todo_table_schema(db: Session):
#     """Fix the todo_items table schema"""
#     try:
#         # Drop the existing table if it has wrong schema
#         db.execute(text("DROP TABLE IF EXISTS todo_items"))
#         db.commit()
        
#         # Recreate the table with correct schema
#         models.TodoItem.__table__.create(bind=engine, checkfirst=True)
#         db.commit()
        
#         print("TodoItem table schema fixed successfully")
#     except Exception as e:
#         print(f"Error fixing TodoItem table schema: {e}")
#         db.rollback()

# # ================ MESS MENU DATA POPULATION ================
# def populate_mess_menu_data(db: Session):
#     """Populate database with authentic mess menu data from PDF"""
#     try:
#         # Check if data already exists
#         existing_count = db.query(models.MessMenuItem).count()
#         if existing_count > 0:
#             print(f"Mess menu data already exists ({existing_count} items)")
#             return

#         print("Populating mess menu data from PDF...")

#         # WEEK 1 & 3 MENU DATA (from PDF page 1)
#         week2_menu = {
#             "MONDAY": {
#                 "BREAKFAST": [
#                     {"name": "Bread", "desc": "Common", "rating": 3.8},
#                     {"name": "Butter", "desc": "Common", "rating": 4.0},
#                     {"name": "Jam", "desc": "Common", "rating": 3.9},
#                     {"name": "Milk", "desc": "Common", "rating": 4.1},
#                     {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
#                     {"name": "Sprouts/Chana", "desc": "Common", "rating": 4.2},
#                     {"name": "Aloo Paratha", "desc": "Main", "rating": 4.3},
#                     {"name": "Ketchup", "desc": "Side", "rating": 3.5},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0},
#                     {"name": "Mint & Coriander Chutney", "desc": "Side", "rating": 4.1}
#                 ],
#                 "LUNCH": [
#                     {"name": "Mix Pickle", "desc": "Common", "rating": 3.7},
#                     {"name": "Papad", "desc": "Common", "rating": 3.8},
#                     {"name": "Mix Salad", "desc": "Common", "rating": 3.6},
#                     {"name": "Onion", "desc": "Common", "rating": 3.5},
#                     {"name": "Lemon", "desc": "Common", "rating": 3.4},
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Kerala Rice", "desc": "Main", "rating": 4.2},
#                     {"name": "Chana Masala", "desc": "Curry", "rating": 4.4},
#                     {"name": "Arhar Dal", "desc": "Curry", "rating": 4.2},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "SNACKS": [
#                     {"name": "Tea/Coffee", "desc": "Common", "rating": 3.8},
#                     {"name": "Sugar", "desc": "Common", "rating": 3.0},
#                     {"name": "Onion Kachori", "desc": "Snack", "rating": 4.2},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
#                     {"name": "Fried Chilly", "desc": "Side", "rating": 3.7}
#                 ],
#                 "DINNER": [
#                     {"name": "Appalam", "desc": "Common", "rating": 3.8},
#                     {"name": "Mixed Salad", "desc": "Common", "rating": 3.6},
#                     {"name": "Pickle", "desc": "Common", "rating": 3.7},
#                     {"name": "Egg Fried Rice", "desc": "Non-Veg", "rating": 4.5},
#                     {"name": "Gobhi Fried Rice", "desc": "Veg", "rating": 4.2},
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Dal Tadka", "desc": "Curry", "rating": 4.3},
#                     {"name": "Garlic Sauce", "desc": "Side", "rating": 3.6}
#                 ]
#             },
#             "TUESDAY": {
#                 "BREAKFAST": [
#                     {"name": "Bread", "desc": "Common", "rating": 3.8},
#                     {"name": "Butter", "desc": "Common", "rating": 4.0},
#                     {"name": "Jam", "desc": "Common", "rating": 3.9},
#                     {"name": "Milk", "desc": "Common", "rating": 4.1},
#                     {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
#                     {"name": "Masala Dosa", "desc": "Main", "rating": 4.4},
#                     {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2}
#                 ],
#                 "LUNCH": [
#                     {"name": "Puri", "desc": "Main", "rating": 4.2},
#                     {"name": "Aloo Palak", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Ridge Gourd Dry", "desc": "Vegetable", "rating": 3.7},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Buttermilk", "desc": "Drink", "rating": 4.1},
#                     {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0},
#                     {"name": "Kerala Rice", "desc": "Main", "rating": 4.2}
#                 ],
#                 "SNACKS": [
#                     {"name": "Aloo Bonda", "desc": "Snack", "rating": 4.3},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
#                 ],
#                 "DINNER": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Chole Masala", "desc": "Curry", "rating": 4.5},
#                     {"name": "Jeera Rice", "desc": "Rice", "rating": 4.2},
#                     {"name": "Dal", "desc": "Curry", "rating": 4.2},
#                     {"name": "Raita Plain", "desc": "Side", "rating": 4.0},
#                     {"name": "Ice Cream", "desc": "Dessert", "rating": 4.6}
#                 ]
#             },
#             "WEDNESDAY": {
#                 "BREAKFAST": [
#                     {"name": "Dal Kitchdi", "desc": "Main", "rating": 4.0},
#                     {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2},
#                     {"name": "Dahi Boondhi", "desc": "Side", "rating": 3.9},
#                     {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Green Peas Masala", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Tomato Rice", "desc": "Rice", "rating": 4.1},
#                     {"name": "Onion Raita", "desc": "Side", "rating": 3.9},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0},
#                     {"name": "Chana Dal Fry", "desc": "Curry", "rating": 4.2}
#                 ],
#                 "SNACKS": [
#                     {"name": "Masala Chana", "desc": "Snack", "rating": 4.1}
#                 ],
#                 "DINNER": [
#                     {"name": "Hyderabadi Paneer Dish", "desc": "Veg", "rating": 4.4},
#                     {"name": "Hyderabadi Chicken Masala", "desc": "Non-Veg", "rating": 4.7},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Moong Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Lachcha Paratha", "desc": "Main", "rating": 4.3},
#                     {"name": "Laddu", "desc": "Sweet", "rating": 4.5},
#                     {"name": "Lemon", "desc": "Side", "rating": 3.4}
#                 ]
#             },
#             "THURSDAY": {
#                 "BREAKFAST": [
#                     {"name": "Puri", "desc": "Main", "rating": 4.2},
#                     {"name": "Chana Masala", "desc": "Curry", "rating": 4.4}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Gobhi Butter Masala", "desc": "Vegetable", "rating": 4.2},
#                     {"name": "Bottle Gourd Dry", "desc": "Vegetable", "rating": 3.6},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "SNACKS": [
#                     {"name": "Tikki Chat", "desc": "Snack", "rating": 4.2}
#                 ],
#                 "DINNER": [
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Masala Dosa", "desc": "Main", "rating": 4.4},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Coriander Chutney", "desc": "Side", "rating": 4.1},
#                     {"name": "Payasam", "desc": "Sweet", "rating": 4.4},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0}
#                 ]
#             },
#             "FRIDAY": {
#                 "BREAKFAST": [
#                     {"name": "Fried Idly", "desc": "Main", "rating": 4.1},
#                     {"name": "Vada", "desc": "Side", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2}
#                 ],
#                 "LUNCH": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Kadai Veg", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Potato Cabbage Dry", "desc": "Vegetable", "rating": 3.8},
#                     {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
#                 ],
#                 "SNACKS": [
#                     {"name": "Pungulu", "desc": "Snack", "rating": 4.0},
#                     {"name": "Coconut Chutney", "desc": "Side", "rating": 4.2}
#                 ],
#                 "DINNER": [
#                     {"name": "Chicken Gravy", "desc": "Non-Veg", "rating": 4.6},
#                     {"name": "Paneer Butter Masala", "desc": "Veg", "rating": 4.5},
#                     {"name": "Pulao", "desc": "Rice", "rating": 4.3},
#                     {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
#                     {"name": "Lemon", "desc": "Side", "rating": 3.4},
#                     {"name": "Jalebi", "desc": "Sweet", "rating": 4.4}
#                 ]
#             },
#             "SATURDAY": {
#                 "BREAKFAST": [
#                     {"name": "Gobhi Mix Veg Paratha", "desc": "Main", "rating": 4.2},
#                     {"name": "Ketchup", "desc": "Side", "rating": 3.5},
#                     {"name": "Green Coriander Chutney", "desc": "Side", "rating": 4.1},
#                     {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Rajma Masala", "desc": "Curry", "rating": 4.4},
#                     {"name": "Green Vegetable Dry", "desc": "Vegetable", "rating": 3.8},
#                     {"name": "Ginger Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Gongura Chutney", "desc": "Side", "rating": 3.9},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "SNACKS": [
#                     {"name": "Samosa", "desc": "Snack", "rating": 4.3},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
#                     {"name": "Cold Coffee", "desc": "Drink", "rating": 4.2}
#                 ],
#                 "DINNER": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Green Peas Masala", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Brinjal Curry", "desc": "Vegetable", "rating": 3.9},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0}
#                 ]
#             },
#             "SUNDAY": {
#                 "BREAKFAST": [
#                     {"name": "Onion Rava Dosa", "desc": "Main", "rating": 4.2},
#                     {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chicken Dum Biryani", "desc": "Non-Veg", "rating": 4.8},
#                     {"name": "Paneer Dum Biryani", "desc": "Veg", "rating": 4.6},
#                     {"name": "Shorba Masala", "desc": "Curry", "rating": 4.2},
#                     {"name": "Onion Raita", "desc": "Side", "rating": 4.0},
#                     {"name": "Aam Panna", "desc": "Drink", "rating": 4.3}
#                 ],
#                 "SNACKS": [
#                     {"name": "Vada Pav", "desc": "Snack", "rating": 4.4},
#                     {"name": "Fried Green Chilly", "desc": "Side", "rating": 3.7},
#                     {"name": "Green Coriander Chutney", "desc": "Side", "rating": 4.1}
#                 ],
#                 "DINNER": [
#                     {"name": "Arhar Dal Tadka", "desc": "Curry", "rating": 4.2},
#                     {"name": "Aloo Fry", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Kadhi Pakoda", "desc": "Curry", "rating": 4.3},
#                     {"name": "Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Chapati", "desc": "Main", "rating": 4.1},
#                     {"name": "Gulab Jamun", "desc": "Sweet", "rating": 4.5}
#                 ]
#             }
#         }

#         # WEEK 2 & 4 MENU DATA (from PDF page 2)
#         week1_menu = {
#             "MONDAY": {
#                 "BREAKFAST": [
#                     {"name": "Bread", "desc": "Common", "rating": 3.8},
#                     {"name": "Butter", "desc": "Common", "rating": 4.0},
#                     {"name": "Jam", "desc": "Common", "rating": 3.9},
#                     {"name": "Milk", "desc": "Common", "rating": 4.1},
#                     {"name": "Tea/Coffee", "desc": "Common", "rating": 3.9},
#                     {"name": "Aloo Paratha", "desc": "Main", "rating": 4.3},
#                     {"name": "Ketchup", "desc": "Side", "rating": 3.5},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0},
#                     {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0},
#                     {"name": "Mint & Coriander Chutney", "desc": "Side", "rating": 4.1}
#                 ],
#                 "LUNCH": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Ghee Rice", "desc": "Rice", "rating": 4.3},
#                     {"name": "Aloo Chana Masala", "desc": "Curry", "rating": 4.2},
#                     {"name": "Soya Chilly", "desc": "Vegetable", "rating": 3.9},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0},
#                     {"name": "Chutney", "desc": "Side", "rating": 3.9},
#                     {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
#                 ],
#                 "SNACKS": [
#                     {"name": "Macaroni", "desc": "Snack", "rating": 4.0}
#                 ],
#                 "DINNER": [
#                     {"name": "Paneer Biryani", "desc": "Veg", "rating": 4.5},
#                     {"name": "Egg Biryani", "desc": "Non-Veg", "rating": 4.6},
#                     {"name": "Raita", "desc": "Side", "rating": 4.0},
#                     {"name": "Mutter Masala", "desc": "Vegetable", "rating": 4.1},
#                     {"name": "Chana Dal Tadka", "desc": "Curry", "rating": 4.2},
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Makhan Peda", "desc": "Sweet", "rating": 4.4},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0}
#                 ]
#             },
#             "TUESDAY": {
#                 "BREAKFAST": [
#                     {"name": "Poha", "desc": "Main", "rating": 4.1},
#                     {"name": "Coriander Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chola Bhatura", "desc": "Main", "rating": 4.5},
#                     {"name": "Toor Dal Fry", "desc": "Curry", "rating": 4.1},
#                     {"name": "Watermelon", "desc": "Fruit", "rating": 4.2},
#                     {"name": "Aloo Bhindi Dry", "desc": "Vegetable", "rating": 3.8},
#                     {"name": "Lemon Rice", "desc": "Rice", "rating": 4.1},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "SNACKS": [
#                     {"name": "Bread Pakoda", "desc": "Snack", "rating": 4.2},
#                     {"name": "Sauce", "desc": "Side", "rating": 3.4}
#                 ],
#                 "DINNER": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Methi Dal", "desc": "Curry", "rating": 4.0},
#                     {"name": "Veg White Kurma", "desc": "Vegetable", "rating": 4.1},
#                     {"name": "Ice Cream", "desc": "Dessert", "rating": 4.6}
#                 ]
#             },
#             "WEDNESDAY": {
#                 "BREAKFAST": [
#                     {"name": "Puttu", "desc": "Main", "rating": 3.9},
#                     {"name": "Kadala Curry", "desc": "Curry", "rating": 4.1},
#                     {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "Methi Dal", "desc": "Curry", "rating": 4.0},
#                     {"name": "Drumstick Gravy", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Dondakaya Dry", "desc": "Vegetable", "rating": 3.7},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0},
#                     {"name": "Buttermilk", "desc": "Drink", "rating": 4.1}
#                 ],
#                 "SNACKS": [
#                     {"name": "Grilled Sandwich", "desc": "Snack", "rating": 4.2},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
#                 ],
#                 "DINNER": [
#                     {"name": "Kadai Chicken", "desc": "Non-Veg", "rating": 4.6},
#                     {"name": "Kadai Paneer", "desc": "Veg", "rating": 4.4},
#                     {"name": "Pulao", "desc": "Rice", "rating": 4.3},
#                     {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Tawa Butter Naan", "desc": "Main", "rating": 4.3},
#                     {"name": "Jalebi", "desc": "Sweet", "rating": 4.4},
#                     {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
#                     {"name": "Lemon", "desc": "Side", "rating": 3.4}
#                 ]
#             },
#             "THURSDAY": {
#                 "BREAKFAST": [
#                     {"name": "Mini Chola Bhatura", "desc": "Main", "rating": 4.3},
#                     {"name": "Seasonal Fruit", "desc": "Fruit", "rating": 4.0}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "Mutter Paneer Masala", "desc": "Vegetable", "rating": 4.3},
#                     {"name": "Coriander Rice", "desc": "Rice", "rating": 4.1},
#                     {"name": "Kollu Rasam", "desc": "Soup", "rating": 3.9},
#                     {"name": "Potato Chips", "desc": "Side", "rating": 3.8},
#                     {"name": "Dalpodhi", "desc": "Side", "rating": 3.7},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0}
#                 ],
#                 "SNACKS": [
#                     {"name": "Cutlet", "desc": "Snack", "rating": 4.2},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4}
#                 ],
#                 "DINNER": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Baby Aloo Masala", "desc": "Vegetable", "rating": 4.2},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Dal Thick", "desc": "Curry", "rating": 4.1},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0},
#                     {"name": "Halwa Mix", "desc": "Sweet", "rating": 4.3}
#                 ]
#             },
#             "FRIDAY": {
#                 "BREAKFAST": [
#                     {"name": "Dal Dosa", "desc": "Main", "rating": 4.2},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Tomato Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Peanut Butter", "desc": "Side", "rating": 3.8}
#                 ],
#                 "LUNCH": [
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Navadhanya Masala", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2},
#                     {"name": "Rasam", "desc": "Soup", "rating": 4.0},
#                     {"name": "Mix Veg Sahi Curry", "desc": "Vegetable", "rating": 4.1},
#                     {"name": "Watermelon Juice", "desc": "Drink", "rating": 4.3}
#                 ],
#                 "SNACKS": [
#                     {"name": "Pani Puri", "desc": "Snack", "rating": 4.4}
#                 ],
#                 "DINNER": [
#                     {"name": "Chicken Gravy", "desc": "Non-Veg", "rating": 4.6},
#                     {"name": "Paneer Butter Masala", "desc": "Veg", "rating": 4.5},
#                     {"name": "Pulao", "desc": "Rice", "rating": 4.3},
#                     {"name": "Mix Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "Jalebi", "desc": "Sweet", "rating": 4.4},
#                     {"name": "Mango Pickle", "desc": "Side", "rating": 3.8},
#                     {"name": "Lemon", "desc": "Side", "rating": 3.4}
#                 ]
#             },
#             "SATURDAY": {
#                 "BREAKFAST": [
#                     {"name": "Mix Veg Paratha", "desc": "Main", "rating": 4.2},
#                     {"name": "Curd", "desc": "Side", "rating": 4.0},
#                     {"name": "Ketchup", "desc": "Side", "rating": 3.5}
#                 ],
#                 "LUNCH": [
#                     {"name": "Chapathi", "desc": "Main", "rating": 4.1},
#                     {"name": "Green Peas Pulav", "desc": "Rice", "rating": 4.2},
#                     {"name": "Spinach Dal", "desc": "Curry", "rating": 4.1},
#                     {"name": "Gobhi Capsicum Dry", "desc": "Vegetable", "rating": 3.8},
#                     {"name": "Butter Masala", "desc": "Curry", "rating": 4.2},
#                     {"name": "Cabbage Chutney", "desc": "Side", "rating": 3.8},
#                     {"name": "Masala Butter Milk", "desc": "Drink", "rating": 4.1}
#                 ],
#                 "SNACKS": [
#                     {"name": "Samosa", "desc": "Snack", "rating": 4.3},
#                     {"name": "Tomato Ketchup", "desc": "Side", "rating": 3.4},
#                     {"name": "Cold Coffee", "desc": "Drink", "rating": 4.2}
#                 ],
#                 "DINNER": [
#                     {"name": "Dal Makhani", "desc": "Curry", "rating": 4.5},
#                     {"name": "Gobhi Matar", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Phulka", "desc": "Main", "rating": 4.1},
#                     {"name": "Tomato Rice", "desc": "Rice", "rating": 4.1},
#                     {"name": "Kheer", "desc": "Sweet", "rating": 4.4}
#                 ]
#             },
#             "SUNDAY": {
#                 "BREAKFAST": [
#                     {"name": "Andhra Kara Dosa", "desc": "Main", "rating": 4.3},
#                     {"name": "Peanut Chutney", "desc": "Side", "rating": 4.0},
#                     {"name": "Sambar", "desc": "Curry", "rating": 4.2}
#                 ],
#                 "LUNCH": [
#                     {"name": "Puri", "desc": "Main", "rating": 4.2},
#                     {"name": "Biryani Rice", "desc": "Rice", "rating": 4.7},
#                     {"name": "Chicken Masala Spicy", "desc": "Non-Veg", "rating": 4.8},
#                     {"name": "Paneer Masala Spicy", "desc": "Veg", "rating": 4.6},
#                     {"name": "Chana Dal Tadka", "desc": "Curry", "rating": 4.2},
#                     {"name": "Raita", "desc": "Side", "rating": 4.0},
#                     {"name": "Fruit Juice", "desc": "Drink", "rating": 4.3}
#                 ],
#                 "SNACKS": [
#                     {"name": "Pav Bhaji", "desc": "Snack", "rating": 4.6}
#                 ],
#                 "DINNER": [
#                     {"name": "Arhar Dal Tadka", "desc": "Curry", "rating": 4.2},
#                     {"name": "Aloo Fry", "desc": "Vegetable", "rating": 4.0},
#                     {"name": "Kadhi Pakoda", "desc": "Curry", "rating": 4.3},
#                     {"name": "White Rice", "desc": "Main", "rating": 4.0},
#                     {"name": "Chapati", "desc": "Main", "rating": 4.1},
#                     {"name": "Mysore Pak", "desc": "Sweet", "rating": 4.5}
#                 ]
#             }
#         }

#         # Add menu items to database
#         items_added = 0
        
#         # Add Week 1 & 3 menu
#         for day, meals in week1_menu.items():
#             for meal_type, items in meals.items():
#                 for item_data in items:
#                     menu_item = models.MessMenuItem(
#                         day_of_week=getattr(models.DayOfWeek, day),
#                         meal_type=getattr(models.MealType, meal_type),
#                         menu_week_type=models.MenuWeekType.WEEK_1,
#                         item_name=item_data["name"],
#                         description=item_data["desc"],
#                         rating=item_data["rating"],
#                         votes=random.randint(15, 150)
#                     )
#                     db.add(menu_item)
#                     items_added += 1

#         # Add Week 2 & 4 menu
#         for day, meals in week2_menu.items():
#             for meal_type, items in meals.items():
#                 for item_data in items:
#                     menu_item = models.MessMenuItem(
#                         day_of_week=getattr(models.DayOfWeek, day),
#                         meal_type=getattr(models.MealType, meal_type),
#                         menu_week_type=models.MenuWeekType.WEEK_2,
#                         item_name=item_data["name"],
#                         description=item_data["desc"],
#                         rating=item_data["rating"],
#                         votes=random.randint(15, 150)
#                     )
#                     db.add(menu_item)
#                     items_added += 1

#         db.commit()
#         print(f"Successfully added {items_added} mess menu items from PDF data!")

#     except Exception as e:
#         db.rollback()
#         print(f"Error populating mess menu data: {e}")
#         raise

# # ================ AUTH ENDPOINTS ================
# @app.post("/register/", response_model=dict)
# async def register(user: UserCreate, db: Session = Depends(get_db)):
#     # Check if user already exists
#     db_user = db.query(models.User).filter(
#         or_(
#             models.User.email == user.email,
#             models.User.college_id == user.college_id
#         )
#     ).first()
    
#     if db_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST, 
#             detail="Email or College ID already registered"
#         )
    
#     otp = generate_otp()
#     otp_expiry = datetime.utcnow() + timedelta(minutes=10)
#     hashed_password = get_password_hash(user.password)
    
#     db_user = models.User(
#         email=user.email,
#         hashed_password=hashed_password,
#         full_name=user.full_name,
#         college_id=user.college_id,
#         department=user.department,
#         year=user.year,
#         phone_number=user.phone_number,
#         verification_otp=otp,
#         otp_expiry=otp_expiry,
#         is_verified=False
#     )
    
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)

#     # In production, send this via email
#     print(f"OTP for {user.email}: {otp}")
    
#     return {"message": "Registration successful. Check your email for the OTP."}

# @app.post("/verify-otp/", response_model=dict)
# async def verify_otp(otp_data: OTPVerify, db: Session = Depends(get_db)):
#     db_user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    
#     if not db_user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
#     if db_user.is_verified:
#         return {"message": "User already verified"}
    
#     if db_user.verification_otp != otp_data.otp:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    
#     if datetime.utcnow() > db_user.otp_expiry:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")
    
#     db_user.is_verified = True
#     db_user.verification_otp = None
#     db_user.otp_expiry = None
#     db.commit()
    
#     return {"message": "Email verified successfully"}

# @app.post("/login/", response_model=dict)
# async def login(login_data: UserLogin, db: Session = Depends(get_db)):
#     db_user = db.query(models.User).filter(
#         or_(
#             models.User.email == login_data.identifier,
#             models.User.college_id == login_data.identifier
#         )
#     ).first()
    
#     if not db_user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, 
#             detail="User not found. Please check email or college ID."
#         )
    
#     if not db_user.is_verified:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST, 
#             detail="Account not verified. Please verify your email first."
#         )
    
#     if not verify_password(login_data.password, db_user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, 
#             detail="Incorrect password."
#         )
    
#     access_token = create_access_token(
#         data={"sub": db_user.email, "user_id": db_user.id},
#         expires_delta=timedelta(days=7)
#     )
    
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "id": db_user.id,
#             "email": db_user.email,
#             "full_name": db_user.full_name,
#             "college_id": db_user.college_id,
#             "department": db_user.department,
#             "year": db_user.year,
#             "phone_number": db_user.phone_number
#         }
#     }

# # ================ TODO ENDPOINTS ================
# @app.get("/todos/{user_id}")
# async def get_todos(user_id: int, db: Session = Depends(get_db)):
#     try:
#         todos = db.query(models.TodoItem).filter(
#             models.TodoItem.user_id == user_id
#         ).order_by(models.TodoItem.created_at.desc()).all()
#         return todos
#     except Exception as e:
#         print(f"Error fetching todos: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching todos"
#         )

# # @app.post("/todos/{user_id}")
# # async def create_todo(user_id: int, todo: TodoItemCreate, db: Session = Depends(get_db)):
# #     try:
# #         db_todo = models.TodoItem(
# #             user_id=user_id,
# #             task=todo.task,
# #             priority=todo.priority,
# #             is_completed=False
# #         )
# #         db.add(db_todo)
# #         db.commit()
# #         db.refresh(db_todo)
# #         return db_todo
# #     except Exception as e:
# #         print(f"Error creating todo: {e}")
# #         raise HTTPException(
# #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
# #             detail="Error creating todo"
# #         )

# @app.put("/todos/{todo_id}")
# async def update_todo(todo_id: int, todo: TodoItemUpdate, db: Session = Depends(get_db)):
#     try:
#         db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
#         if not db_todo:
#             raise HTTPException(status_code=404, detail="Todo not found")
        
#         update_data = todo.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_todo, field, value)
        
#         db.commit()
#         db.refresh(db_todo)
#         return db_todo
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating todo: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating todo"
#         )

# @app.delete("/todos/{todo_id}")
# async def delete_todo(todo_id: int, db: Session = Depends(get_db)):
#     try:
#         db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
#         if not db_todo:
#             raise HTTPException(status_code=404, detail="Todo not found")
        
#         db.delete(db_todo)
#         db.commit()
#         return {"message": "Todo deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting todo: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting todo"
#         )
# # ================ TIMETABLE ENDPOINTS ================
# @app.get("/timetable/{user_id}")
# async def get_timetable(user_id: int, db: Session = Depends(get_db)):
#     try:
#         timetable_entries = db.query(models.TimetableEntry).filter(
#             models.TimetableEntry.user_id == user_id
#         ).all()
#         return timetable_entries
#     except Exception as e:
#         print(f"Error fetching timetable: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching timetable"
#         )

# # Update timetable entry create
# @app.post("/timetable/{user_id}")
# async def create_timetable_entry(user_id: int, entry: TimetableEntryCreate, db: Session = Depends(get_db)):
#     try:
#         # Check if course exists or create one
#         course = db.query(models.Course).filter(
#             models.Course.user_id == user_id,
#             models.Course.course_name == entry.course_name,
#             models.Course.teacher == entry.teacher
#         ).first()
        
#         if not course:
#             course = models.Course(
#                 user_id=user_id,
#                 course_name=entry.course_name,
#                 teacher=entry.teacher
#             )
#             db.add(course)
#             db.commit()
#             db.refresh(course)
        
#         # Create timetable entry linked to course
#         db_entry = models.TimetableEntry(
#             user_id=user_id,
#             course_id=course.id,
#             day_of_week=entry.day_of_week,
#             start_time=entry.start_time,
#             end_time=entry.end_time,
#             course_name=entry.course_name,
#             teacher=entry.teacher,
#             room_number=entry.room_number
#         )
#         db.add(db_entry)
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except Exception as e:
#         print(f"Error creating timetable entry: {e}")
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error creating timetable entry: {str(e)}"
#         )

# @app.put("/timetable/{entry_id}")
# async def update_timetable_entry(entry_id: int, entry: TimetableEntryUpdate, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Timetable entry not found")
        
#         update_data = entry.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_entry, field, value)
        
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating timetable entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating timetable entry"
#         )

# @app.delete("/timetable/{entry_id}")
# async def delete_timetable_entry(entry_id: int, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.TimetableEntry).filter(models.TimetableEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Timetable entry not found")
        
#         db.delete(db_entry)
#         db.commit()
#         return {"message": "Timetable entry deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting timetable entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting timetable entry"
#         )

# # ================ EXAM ENDPOINTS ================
# @app.get("/exams/{user_id}")
# async def get_exams(user_id: int, db: Session = Depends(get_db)):
#     try:
#         exam_entries = db.query(models.ExamEntry).filter(models.ExamEntry.user_id == user_id).all()
#         return exam_entries
#     except Exception as e:
#         print(f"Error fetching exams: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching exams"
#         )

# @app.post("/exams/{user_id}")
# async def create_exam_entry(user_id: int, entry: ExamEntryCreate, db: Session = Depends(get_db)):
#     try:
#         db_entry = models.ExamEntry(
#             user_id=user_id,
#             exam_name=entry.exam_name,
#             date=entry.date,
#             room_number=entry.room_number,
#             additional_notes=entry.additional_notes
#         )
#         db.add(db_entry)
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except Exception as e:
#         print(f"Error creating exam entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error creating exam entry"
#         )

# @app.put("/exams/{entry_id}")
# async def update_exam_entry(entry_id: int, entry: ExamEntryUpdate, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.ExamEntry).filter(models.ExamEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Exam entry not found")
        
#         update_data = entry.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_entry, field, value)
        
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating exam entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating exam entry"
#         )

# @app.delete("/exams/{entry_id}")
# async def delete_exam_entry(entry_id: int, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.ExamEntry).filter(models.ExamEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Exam entry not found")
        
#         db.delete(db_entry)
#         db.commit()
#         return {"message": "Exam entry deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting exam entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting exam entry"
#         )

# # ================ GRADE ENDPOINTS ================
# @app.get("/grades/{user_id}")
# async def get_grades(user_id: int, db: Session = Depends(get_db)):
#     try:
#         grade_entries = db.query(models.GradeEntry).filter(models.GradeEntry.user_id == user_id).all()
#         return grade_entries
#     except Exception as e:
#         print(f"Error fetching grades: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching grades"
#         )

# @app.get("/grades/cgpa/{user_id}")
# async def get_cgpa(user_id: int, db: Session = Depends(get_db)):
#     try:
#         grade_entries = db.query(models.GradeEntry).filter(models.GradeEntry.user_id == user_id).all()
#         return calculate_cgpa(grade_entries)
#     except Exception as e:
#         print(f"Error calculating CGPA: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error calculating CGPA"
#         )

# @app.post("/grades/{user_id}")
# async def create_grade_entry(user_id: int, entry: GradeEntryCreate, db: Session = Depends(get_db)):
#     try:
#         db_entry = models.GradeEntry(
#             user_id=user_id,
#             course_name=entry.course_name,
#             credits=entry.credits,
#             grade=entry.grade,
#             semester=entry.semester,
#             category_id=entry.category_id
#         )
#         db.add(db_entry)
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except Exception as e:
#         print(f"Error creating grade entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error creating grade entry"
#         )

# @app.put("/grades/{entry_id}")
# async def update_grade_entry(entry_id: int, entry: GradeEntryUpdate, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.GradeEntry).filter(models.GradeEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Grade entry not found")
        
#         update_data = entry.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_entry, field, value)
        
#         db.commit()
#         db.refresh(db_entry)
#         return db_entry
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating grade entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating grade entry"
#         )

# @app.delete("/grades/{entry_id}")
# async def delete_grade_entry(entry_id: int, db: Session = Depends(get_db)):
#     try:
#         db_entry = db.query(models.GradeEntry).filter(models.GradeEntry.id == entry_id).first()
        
#         if not db_entry:
#             raise HTTPException(status_code=404, detail="Grade entry not found")
        
#         db.delete(db_entry)
#         db.commit()
#         return {"message": "Grade entry deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting grade entry: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting grade entry"
#         )

# # ================ MESS MENU ENDPOINTS ================
# @app.get("/mess-menu/week/{day_of_week}")
# async def get_full_day_menu(day_of_week: DayOfWeek, db: Session = Depends(get_db)):
#     try:
#         current_week_type = get_current_menu_week_type()
        
#         menu_items = db.query(models.MessMenuItem).filter(
#             models.MessMenuItem.day_of_week == getattr(models.DayOfWeek, day_of_week.upper()),
#             models.MessMenuItem.menu_week_type == getattr(models.MenuWeekType, current_week_type)
#         ).order_by(models.MessMenuItem.meal_type, models.MessMenuItem.item_name).all()
        
#         grouped_menu = {}
#         for item in menu_items:
#             meal_type = item.meal_type.value
#             if meal_type not in grouped_menu:
#                 grouped_menu[meal_type] = []
#             grouped_menu[meal_type].append({
#                 "id": item.id,
#                 "item_name": item.item_name,
#                 "description": item.description,
#                 "rating": item.rating,
#                 "votes": item.votes
#             })
        
#         return {
#             "day": day_of_week,
#             "week_type": current_week_type,
#             "meals": grouped_menu
#         }
#     except Exception as e:
#         print(f"Error fetching full day menu for {day_of_week}: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching day menu"
#         )

# @app.get("/mess-menu/weekly")
# async def get_weekly_menu(db: Session = Depends(get_db)):
#     try:
#         current_week_type = get_current_menu_week_type()
        
#         menu_items = db.query(models.MessMenuItem).filter(
#             models.MessMenuItem.menu_week_type == getattr(models.MenuWeekType, current_week_type)
#         ).order_by(
#             models.MessMenuItem.day_of_week, 
#             models.MessMenuItem.meal_type, 
#             models.MessMenuItem.item_name
#         ).all()
        
#         weekly_menu = {}
#         for item in menu_items:
#             day = item.day_of_week.value
#             meal_type = item.meal_type.value
            
#             if day not in weekly_menu:
#                 weekly_menu[day] = {}
#             if meal_type not in weekly_menu[day]:
#                 weekly_menu[day][meal_type] = []
                
#             weekly_menu[day][meal_type].append({
#                 "id": item.id,
#                 "item_name": item.item_name,
#                 "description": item.description,
#                 "rating": item.rating,
#                 "votes": item.votes
#             })
        
#         return {
#             "week_type": current_week_type,
#             "weekly_menu": weekly_menu
#         }
#     except Exception as e:
#         print(f"Error fetching weekly menu: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching weekly menu"
#         )

# @app.post("/mess-menu/")
# async def add_mess_menu_item(item: MessMenuItemCreate, db: Session = Depends(get_db)):
#     try:
#         db_item = models.MessMenuItem(
#             day_of_week=getattr(models.DayOfWeek, item.day_of_week.upper()),
#             meal_type=getattr(models.MealType, item.meal_type.upper()),
#             menu_week_type=getattr(models.MenuWeekType, item.menu_week_type.replace(" ", "_")),
#             item_name=item.item_name,
#             description=item.description,
#             rating=item.rating,
#             votes=item.votes
#         )
#         db.add(db_item)
#         db.commit()
#         db.refresh(db_item)
#         return db_item
#     except Exception as e:
#         print(f"Error adding mess menu item '{item.item_name}': {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error adding mess menu item"
#         )
# # ================ TODO ENDPOINTS ================
# @app.get("/todos/{user_id}")
# async def get_todos(user_id: int, db: Session = Depends(get_db)):
#     try:
#         todos = db.query(models.TodoItem).filter(
#             models.TodoItem.user_id == user_id
#         ).order_by(models.TodoItem.created_at.desc()).all()
#         return todos
#     except Exception as e:
#         print(f"Error fetching todos: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching todos"
#         )
# @app.post("/todos/{user_id}")
# async def create_todo(user_id: int, todo: TodoItemCreate, db: Session = Depends(get_db)):
#     try:
#         db_todo = models.TodoItem(
#             user_id=user_id,
#             task=todo.task,
#             priority=todo.priority,
#             is_completed=False
#         )
#         db.add(db_todo)
#         db.commit()
#         db.refresh(db_todo)
#         return db_todo
#     except Exception as e:
#         print(f"Error creating todo: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error creating todo"
#         )
# @app.put("/todos/{todo_id}")
# async def update_todo(todo_id: int, todo: TodoItemUpdate, db: Session = Depends(get_db)):
#     try:
#         db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
#         if not db_todo:
#             raise HTTPException(status_code=404, detail="Todo not found")
        
#         update_data = todo.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_todo, field, value)
        
#         db.commit()
#         db.refresh(db_todo)
#         return db_todo
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating todo: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating todo"
#         )
# @app.delete("/todos/{todo_id}")
# async def delete_todo(todo_id: int, db: Session = Depends(get_db)):
#     try:
#         db_todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
        
#         if not db_todo:
#             raise HTTPException(status_code=404, detail="Todo not found")
        
#         db.delete(db_todo)
#         db.commit()
#         return {"message": "Todo deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting todo: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting todo"
#         )
# def ensure_todo_table_exists(db: Session):
#     """Ensure the todo_items table exists with correct schema"""
#     try:
#         # Drop the existing table if it has wrong schema
#         db.execute("DROP TABLE IF EXISTS todo_items")
#         db.commit()
        
#         # Let SQLAlchemy create the table with correct schema
#         models.TodoItem.__table__.create(bind=engine, checkfirst=True)
#         print("TodoItem table recreated successfully")
#     except Exception as e:
#         print(f"Error recreating TodoItem table: {e}")
#         raise
# # ================ STARTUP EVENT ================
# @app.on_event("startup")
# async def startup_event():
#     """Initialize database tables and populate data on startup"""
#     db = SessionLocal()
#     try:
#         # Fix TodoItem table schema first
#         fix_todo_table_schema(db)
        
#         # Populate mess menu data
#         populate_mess_menu_data(db)
#         print("Database initialized successfully!")
        
#     except Exception as e:
#         print(f"Error during startup: {e}")
#     finally:
#         db.close()


# # Add these models to your existing main.py

# # ================ CALENDAR EVENT MODELS ================
# class EventType(str, Enum):
#     ACADEMIC = "Academic"
#     EXAM = "Exam"
#     ASSIGNMENT = "Assignment"
#     CLUB = "Club"
#     SPORTS = "Sports"
#     CULTURAL = "Cultural"
#     WORKSHOP = "Workshop"
#     OTHER = "Other"

# class CalendarEventCreate(BaseModel):
#     title: str
#     description: Optional[str] = None
#     event_type: EventType
#     start_datetime: datetime
#     end_datetime: datetime
#     location: Optional[str] = None
#     is_all_day: Optional[bool] = False
#     reminder_minutes: Optional[int] = 30

# class CalendarEventUpdate(BaseModel):
#     title: Optional[str] = None
#     description: Optional[str] = None
#     event_type: Optional[EventType] = None
#     start_datetime: Optional[datetime] = None
#     end_datetime: Optional[datetime] = None
#     location: Optional[str] = None
#     is_all_day: Optional[bool] = None
#     reminder_minutes: Optional[int] = None

# # ================ CALENDAR EVENT ENDPOINTS ================
# @app.get("/calendar-events/{user_id}")
# async def get_calendar_events(
#     user_id: int, 
#     start_date: Optional[str] = None,
#     end_date: Optional[str] = None,
#     db: Session = Depends(get_db)
# ):
#     """Get calendar events for a user, optionally filtered by date range"""
#     try:
#         query = db.query(models.CalendarEvent).filter(
#             models.CalendarEvent.user_id == user_id
#         )
        
#         if start_date:
#             query = query.filter(models.CalendarEvent.start_datetime >= start_date)
#         if end_date:
#             query = query.filter(models.CalendarEvent.start_datetime <= end_date)
        
#         events = query.order_by(models.CalendarEvent.start_datetime).all()
#         return events
#     except Exception as e:
#         print(f"Error fetching calendar events: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching calendar events"
#         )

# @app.post("/calendar-events/{user_id}")
# async def create_calendar_event(
#     user_id: int, 
#     event: CalendarEventCreate, 
#     db: Session = Depends(get_db)
# ):
#     try:
#         db_event = models.CalendarEvent(
#             user_id=user_id,
#             title=event.title,
#             description=event.description,
#             event_type=event.event_type,
#             start_datetime=event.start_datetime,
#             end_datetime=event.end_datetime,
#             location=event.location,
#             is_all_day=event.is_all_day,
#             reminder_minutes=event.reminder_minutes
#         )
#         db.add(db_event)
#         db.commit()
#         db.refresh(db_event)
#         return db_event
#     except Exception as e:
#         print(f"Error creating calendar event: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error creating calendar event"
#         )

# @app.put("/calendar-events/{event_id}")
# async def update_calendar_event(
#     event_id: int, 
#     event: CalendarEventUpdate, 
#     db: Session = Depends(get_db)
# ):
#     try:
#         db_event = db.query(models.CalendarEvent).filter(
#             models.CalendarEvent.id == event_id
#         ).first()
        
#         if not db_event:
#             raise HTTPException(status_code=404, detail="Event not found")
        
#         update_data = event.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_event, field, value)
        
#         db.commit()
#         db.refresh(db_event)
#         return db_event
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating calendar event: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating calendar event"
#         )

# @app.delete("/calendar-events/{event_id}")
# async def delete_calendar_event(event_id: int, db: Session = Depends(get_db)):
#     try:
#         db_event = db.query(models.CalendarEvent).filter(
#             models.CalendarEvent.id == event_id
#         ).first()
        
#         if not db_event:
#             raise HTTPException(status_code=404, detail="Event not found")
        
#         db.delete(db_event)
#         db.commit()
#         return {"message": "Event deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting calendar event: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting calendar event"
#         )

# # ================ QUICK STATS ENDPOINT ================
# @app.get("/academics/stats/{user_id}")
# async def get_academic_stats(user_id: int, db: Session = Depends(get_db)):
#     """Get quick academic statistics for dashboard"""
#     try:
#         # Count upcoming classes today
#         today = datetime.now().strftime("%A")[:3]
#         classes_today = db.query(models.TimetableEntry).filter(
#             models.TimetableEntry.user_id == user_id,
#             models.TimetableEntry.day_of_week == today
#         ).count()
        
#         # Count upcoming exams (next 30 days)
#         upcoming_exams = db.query(models.ExamEntry).filter(
#             models.ExamEntry.user_id == user_id,
#             models.ExamEntry.date >= datetime.now().strftime("%Y-%m-%d"),
#             models.ExamEntry.date <= (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
#         ).count()
        
#         # Get CGPA
#         grades = db.query(models.GradeEntry).filter(
#             models.GradeEntry.user_id == user_id
#         ).all()
#         cgpa_info = calculate_cgpa(grades)
        
#         # Count total assignments (calendar events of type assignment)
#         assignments = db.query(models.CalendarEvent).filter(
#             models.CalendarEvent.user_id == user_id,
#             models.CalendarEvent.event_type == models.EventType.ASSIGNMENT,
#             models.CalendarEvent.start_datetime >= datetime.now()
#         ).count()
        
#         return {
#             "classes_today": classes_today,
#             "upcoming_exams": upcoming_exams,
#             "cgpa": cgpa_info["cgpa"],
#             "pending_assignments": assignments
#         }
#     except Exception as e:
#         print(f"Error fetching academic stats: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching academic stats"
#         )


# # ================ AI ENDPOINTS ================
# @app.post("/ai/ask")
# async def ask_ai(
#     user_id: int,
#     chat: ChatMessage,
#     db: Session = Depends(get_db)
# ):
#     """Ask AI assistant a question"""
#     try:
#         assistant = AIAssistant(db)
#         response = await assistant.get_response(user_id, chat.message)
#         return response
#     except Exception as e:
#         print(f"AI Error: {e}")
#         return {
#             "response": "Sorry, I'm having trouble right now. Please contact office@iitpkd.ac.in",
#             "confidence": "error"
#         }

# @app.get("/ai/chat-history/{user_id}")
# async def get_chat_history(
#     user_id: int,
#     limit: int = 50,
#     db: Session = Depends(get_db)
# ):
#     """Get user's chat history"""
#     history = db.query(models.ChatHistory).filter(
#         models.ChatHistory.user_id == user_id
#     ).order_by(
#         models.ChatHistory.created_at.desc()
#     ).limit(limit).all()
    
#     return [
#         {
#             "id": msg.id,
#             "message": msg.message,
#             "is_user": msg.is_user,
#             "confidence_score": msg.confidence_score,
#             "created_at": msg.created_at.isoformat()
#         }
#         for msg in reversed(history)
#     ]

# @app.delete("/ai/chat-history/{user_id}")
# async def clear_chat_history(
#     user_id: int,
#     db: Session = Depends(get_db)
# ):
#     """Clear user's chat history"""
#     db.query(models.ChatHistory).filter(
#         models.ChatHistory.user_id == user_id
#     ).delete()
#     db.commit()
#     return {"message": "Chat history cleared"}

# # ================ ADMIN AI ENDPOINTS ================
# @app.get("/ai/question-queue")
# async def get_question_queue(
#     status: Optional[str] = "unanswered",
#     db: Session = Depends(get_db)
# ):
#     """Get unanswered questions (Admin)"""
    
#     query = db.query(models.UnansweredQuestion)
    
#     if status:
#         query = query.filter(
#             models.UnansweredQuestion.status == status
#         )
    
#     questions = query.order_by(
#         models.UnansweredQuestion.ask_count.desc(),
#         models.UnansweredQuestion.created_at.desc()
#     ).all()
    
#     return {
#         "total": len(questions),
#         "questions": [
#             {
#                 "id": q.id,
#                 "question": q.question_text,
#                 "category": q.category,
#                 "ask_count": q.ask_count,
#                 "status": q.status.value,
#                 "created_at": q.created_at.isoformat(),
#                 "confidence_score": q.confidence_score
#             }
#             for q in questions
#         ]
#     }

# @app.post("/ai/add-answer")
# async def add_answer_to_knowledge(
#     request: AddAnswerRequest,
#     db: Session = Depends(get_db)
# ):
#     """Add answer to knowledge base and resolve question (Admin)"""
    
#     # Get the question
#     question = db.query(models.UnansweredQuestion).filter(
#         models.UnansweredQuestion.id == request.question_id
#     ).first()
    
#     if not question:
#         raise HTTPException(status_code=404, detail="Question not found")
    
#     # Add to knowledge base
#     kb_entry = models.KnowledgeBase(
#         category=request.category or question.category,
#         content=f"Q: {question.question_text}\n\nA: {request.answer}",
#         source_url="admin_added",
#         keywords=','.join(question.question_text.lower().split()[:10])
#     )
#     db.add(kb_entry)
    
#     # Mark question as answered
#     question.status = models.QuestionStatus.ANSWERED
#     question.admin_answer = request.answer
#     question.resolved_at = datetime.utcnow()
    
#     # Find and resolve similar questions
#     similar_questions = db.query(models.UnansweredQuestion).filter(
#         models.UnansweredQuestion.status == models.QuestionStatus.UNANSWERED,
#         models.UnansweredQuestion.id != question.id
#     ).all()
    
#     resolved_count = 0
#     for q in similar_questions:
#         similarity = SequenceMatcher(
#             None, 
#             question.question_text.lower(), 
#             q.question_text.lower()
#         ).ratio()
        
#         if similarity > 0.7:  # 70% similar
#             q.status = models.QuestionStatus.DUPLICATE
#             q.similar_question_id = question.id
#             q.resolved_at = datetime.utcnow()
#             resolved_count += 1
    
#     db.commit()
    
#     return {
#         "message": "Answer added successfully",
#         "resolved_similar_questions": resolved_count
#     }

# @app.get("/ai/analytics")
# async def get_ai_analytics(db: Session = Depends(get_db)):
#     """Get AI analytics (Admin)"""
    
#     total_questions = db.query(models.UnansweredQuestion).count()
#     answered = db.query(models.UnansweredQuestion).filter(
#         models.UnansweredQuestion.status == models.QuestionStatus.ANSWERED
#     ).count()
#     pending = db.query(models.UnansweredQuestion).filter(
#         models.UnansweredQuestion.status == models.QuestionStatus.UNANSWERED
#     ).count()
    
#     # Most asked questions
#     top_questions = db.query(models.UnansweredQuestion).order_by(
#         models.UnansweredQuestion.ask_count.desc()
#     ).limit(10).all()
    
#     # Category distribution
#     category_counts = db.query(
#         models.UnansweredQuestion.category,
#         func.count(models.UnansweredQuestion.id)
#     ).group_by(models.UnansweredQuestion.category).all()
    
#     kb_entries = db.query(models.KnowledgeBase).count()
    
#     return {
#         "total_questions": total_questions,
#         "answered": answered,
#         "pending": pending,
#         "knowledge_base_entries": kb_entries,
#         "top_questions": [
#             {
#                 "question": q.question_text,
#                 "ask_count": q.ask_count,
#                 "category": q.category
#             }
#             for q in top_questions
#         ],
#         "categories": [
#             {"category": cat, "count": count}
#             for cat, count in category_counts
#         ]
#     }

# @app.post("/ai/refresh-knowledge")
# async def refresh_knowledge_base(db: Session = Depends(get_db)):
#     """Refresh knowledge base by re-scraping website (Admin)"""
#     try:
#         # Clear old entries
#         db.query(models.KnowledgeBase).filter(
#             models.KnowledgeBase.source_url != "admin_added"
#         ).delete()
#         db.commit()
        
#         # Re-scrape
#         scrape_iitpkd_website(db)
        
#         count = db.query(models.KnowledgeBase).count()
#         return {
#             "message": "Knowledge base refreshed",
#             "total_entries": count
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # Update startup event
# @app.on_event("startup")
# async def startup_event():
#     """Initialize database tables and populate data on startup"""
#     db = SessionLocal()
#     try:
#         # Existing code...
#         fix_todo_table_schema(db)
#         populate_mess_menu_data(db)
        
#         # Initialize AI knowledge base
#         kb_count = db.query(models.KnowledgeBase).count()
#         if kb_count == 0:
#             print("Initializing AI knowledge base by scraping IIT Palakkad website...")
#             scrape_iitpkd_website(db)
#             print(f"Knowledge base initialized with {db.query(models.KnowledgeBase).count()} entries")
#         else:
#             print(f"Knowledge base already exists ({kb_count} entries)")
        
#         print("Database initialized successfully!")
        
#     except Exception as e:
#         print(f"Error during startup: {e}")
#     finally:
#         db.close() 


# @app.get("/attendance/{user_id}")
# async def get_attendance_records(
#     user_id: int,
#     timetable_entry_id: Optional[int] = None,
#     start_date: Optional[str] = None,
#     end_date: Optional[str] = None,
#     db: Session = Depends(get_db)
# ):
#     """Get attendance records for a user, optionally filtered"""
#     try:
#         query = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.user_id == user_id
#         )
        
#         if timetable_entry_id:
#             query = query.filter(
#                 models.AttendanceRecord.timetable_entry_id == timetable_entry_id
#             )
        
#         if start_date:
#             query = query.filter(models.AttendanceRecord.date >= start_date)
        
#         if end_date:
#             query = query.filter(models.AttendanceRecord.date <= end_date)
        
#         records = query.order_by(models.AttendanceRecord.date.desc()).all()
#         return records
#     except Exception as e:
#         print(f"Error fetching attendance: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching attendance records"
#         )
# @app.post("/attendance/{user_id}")
# async def mark_attendance(
#     user_id: int,
#     attendance: AttendanceRecordCreate,
#     db: Session = Depends(get_db)
# ):
#     """Mark attendance for a specific date"""
#     try:
#         # Convert string date to Python date object
#         from datetime import datetime, date
#         attendance_date = date.fromisoformat(attendance.date)
        
#         # Check if attendance already exists for this date and class
#         existing = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.user_id == user_id,
#             models.AttendanceRecord.timetable_entry_id == attendance.timetable_entry_id,
#             models.AttendanceRecord.date == attendance_date
#         ).first()
        
#         if existing:
#             # Update existing record
#             existing.status = attendance.status
#             existing.notes = attendance.notes
#             existing.updated_at = datetime.utcnow()
#             db.commit()
#             db.refresh(existing)
#             return existing
#         else:
#             # Create new record
#             db_record = models.AttendanceRecord(
#                 user_id=user_id,
#                 timetable_entry_id=attendance.timetable_entry_id,
#                 date=attendance_date,
#                 status=attendance.status,
#                 notes=attendance.notes
#             )
#             db.add(db_record)
#             db.commit()
#             db.refresh(db_record)
#             return db_record
#     except Exception as e:
#         print(f"Error marking attendance: {e}")
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error marking attendance: {str(e)}"
#         )
# # Course-based attendance statistics
# @app.get("/attendance/course-stats/{user_id}/{course_id}")
# async def get_course_attendance_stats(
#     user_id: int,
#     course_id: int,
#     start_date: Optional[str] = None,
#     end_date: Optional[str] = None,
#     db: Session = Depends(get_db)
# ):
#     """Get attendance statistics for a specific course"""
#     try:
#         # Get all timetable entries for this course
#         timetable_entries = db.query(models.TimetableEntry).filter(
#             models.TimetableEntry.user_id == user_id,
#             models.TimetableEntry.course_id == course_id
#         ).all()
        
#         if not timetable_entries:
#             return {
#                 "course_id": course_id,
#                 "total_classes": 0,
#                 "present": 0,
#                 "absent": 0,
#                 "cancelled": 0,
#                 "attendance_percentage": 0
#             }
            
#         entry_ids = [entry.id for entry in timetable_entries]
        
#         # Build query for attendance records
#         query = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.user_id == user_id,
#             models.AttendanceRecord.timetable_entry_id.in_(entry_ids)
#         )
        
#         # Add date filters if provided
#         if start_date:
#             query = query.filter(models.AttendanceRecord.date >= start_date)
#         if end_date:
#             query = query.filter(models.AttendanceRecord.date <= end_date)
            
#         records = query.all()
        
#         # Calculate statistics
#         total_classes = len(records)
#         present_count = len([r for r in records if r.status == 'present'])
#         absent_count = len([r for r in records if r.status == 'absent'])
#         cancelled_count = len([r for r in records if r.status == 'cancelled'])
        
#         # Calculate percentage excluding cancelled classes
#         effective_classes = total_classes - cancelled_count
#         attendance_percentage = (
#             (present_count / effective_classes * 100) if effective_classes > 0 else 0
#         )
        
#         # Get course details
#         course = db.query(models.Course).filter(models.Course.id == course_id).first()
        
#         return {
#             "course_id": course_id,
#             "course_name": course.course_name if course else "Unknown Course",
#             "total_classes": total_classes,
#             "present": present_count,
#             "absent": absent_count,
#             "cancelled": cancelled_count,
#             "attendance_percentage": round(attendance_percentage, 2),
#             "detailed_records": [
#                 {
#                     "date": record.date.isoformat(),
#                     "status": record.status,
#                     "timetable_entry_id": record.timetable_entry_id
#                 }
#                 for record in records
#             ]
#         }
#     except Exception as e:
#         print(f"Error getting course attendance stats: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error getting course attendance statistics"
#         )
# @app.put("/attendance/{record_id}")
# async def update_attendance(
#     record_id: int,
#     attendance: AttendanceRecordUpdate,
#     db: Session = Depends(get_db)
# ):
#     """Update an attendance record"""
#     try:
#         db_record = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.id == record_id
#         ).first()
        
#         if not db_record:
#             raise HTTPException(status_code=404, detail="Attendance record not found")
        
#         update_data = attendance.dict(exclude_unset=True)
#         for field, value in update_data.items():
#             setattr(db_record, field, value)
        
#         db_record.updated_at = datetime.utcnow()
#         db.commit()
#         db.refresh(db_record)
#         return db_record
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error updating attendance: {e}")
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error updating attendance"
#         )
# @app.delete("/attendance/{record_id}")
# async def delete_attendance(record_id: int, db: Session = Depends(get_db)):
#     """Delete an attendance record"""
#     try:
#         db_record = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.id == record_id
#         ).first()
        
#         if not db_record:
#             raise HTTPException(status_code=404, detail="Attendance record not found")
        
#         db.delete(db_record)
#         db.commit()
#         return {"message": "Attendance record deleted successfully"}
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error deleting attendance: {e}")
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error deleting attendance"
#         )
# @app.get("/attendance/stats/{user_id}/{timetable_entry_id}")
# async def get_attendance_stats(
#     user_id: int,
#     timetable_entry_id: int,
#     db: Session = Depends(get_db)
# ):
#     """Get attendance statistics for a specific class"""
#     try:
#         records = db.query(models.AttendanceRecord).filter(
#             models.AttendanceRecord.user_id == user_id,
#             models.AttendanceRecord.timetable_entry_id == timetable_entry_id
#         ).all()
        
#         total_classes = len(records)
#         present_count = len([r for r in records if r.status == models.AttendanceStatus.PRESENT])
#         absent_count = len([r for r in records if r.status == models.AttendanceStatus.ABSENT])
#         cancelled_count = len([r for r in records if r.status == models.AttendanceStatus.CANCELLED])
        
#         # Calculate percentage excluding cancelled classes
#         effective_classes = total_classes - cancelled_count
#         attendance_percentage = (
#             (present_count / effective_classes * 100) if effective_classes > 0 else 0
#         )
        
#         return {
#             "total_classes": total_classes,
#             "present": present_count,
#             "absent": absent_count,
#             "cancelled": cancelled_count,
#             "attendance_percentage": round(attendance_percentage, 2)
#         }
#     except Exception as e:
#         print(f"Error getting attendance stats: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error getting attendance statistics"
#         )
# @app.get("/attendance/dashboard/{user_id}")
# async def get_attendance_dashboard(user_id: int, db: Session = Depends(get_db)):
#     """Get overall attendance dashboard for all classes"""
#     try:
#         # Get all timetable entries for user
#         timetable_entries = db.query(models.TimetableEntry).filter(
#             models.TimetableEntry.user_id == user_id
#         ).all()
        
#         dashboard_data = []
        
#         for entry in timetable_entries:
#             records = db.query(models.AttendanceRecord).filter(
#                 models.AttendanceRecord.user_id == user_id,
#                 models.AttendanceRecord.timetable_entry_id == entry.id
#             ).all()
            
#             total_classes = len(records)
#             present_count = len([r for r in records if r.status == models.AttendanceStatus.PRESENT])
#             absent_count = len([r for r in records if r.status == models.AttendanceStatus.ABSENT])
#             cancelled_count = len([r for r in records if r.status == models.AttendanceStatus.CANCELLED])
            
#             effective_classes = total_classes - cancelled_count
#             attendance_percentage = (
#                 (present_count / effective_classes * 100) if effective_classes > 0 else 0
#             )
            
#             dashboard_data.append({
#                 "timetable_entry_id": entry.id,
#                 "course_name": entry.course_name,
#                 "day_of_week": entry.day_of_week,
#                 "start_time": entry.start_time,
#                 "end_time": entry.end_time,
#                 "total_classes": total_classes,
#                 "present": present_count,
#                 "absent": absent_count,
#                 "cancelled": cancelled_count,
#                 "attendance_percentage": round(attendance_percentage, 2)
#             })
        
#         # Calculate overall stats
#         total_effective_classes = sum(max(c["total_classes"] - c["cancelled"], 0) for c in dashboard_data)
#         total_present = sum(c["present"] for c in dashboard_data)
        
#         return {
#             "classes": dashboard_data,
#             "overall_stats": {
#                 "total_classes": sum(c["total_classes"] for c in dashboard_data),
#                 "total_present": total_present,
#                 "total_absent": sum(c["absent"] for c in dashboard_data),
#                 "overall_percentage": round(
#                     (total_present / max(total_effective_classes, 1)) * 100,
#                     2
#                 )
#             }
#         }
#     except Exception as e:
#         print(f"Error getting attendance dashboard: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error getting attendance dashboard"
#         )
# # Add course endpoints
# @app.post("/courses/{user_id}")
# async def create_course(user_id: int, course: CourseCreate, db: Session = Depends(get_db)):
#     """Create a new course"""
#     try:
#         # Convert string date to Python date object if provided
#         start_date = None
#         if course.start_date:
#             start_date = date.fromisoformat(course.start_date)
            
#         # Create course
#         db_course = models.Course(
#             user_id=user_id,
#             course_name=course.course_name,
#             teacher=course.teacher,
#             start_date=start_date
#         )
#         db.add(db_course)
#         db.commit()
#         db.refresh(db_course)
#         return db_course
#     except Exception as e:
#         print(f"Error creating course: {e}")
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error creating course"
#         )

# @app.get("/courses/{user_id}")
# async def get_courses(user_id: int, db: Session = Depends(get_db)):
#     """Get all courses for a user"""
#     try:
#         courses = db.query(models.Course).filter(
#             models.Course.user_id == user_id
#         ).all()
#         return courses
#     except Exception as e:
#         print(f"Error fetching courses: {e}")
#         raise HTTPException(

#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error fetching courses"
#         )


# @app.get("/")
# async def root():
#     return {"message": "College App API is running", "status": "connected"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)