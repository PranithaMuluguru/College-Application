from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_,text
from newapp.database import SessionLocal, engine
from newapp import models
import random
import string
from passlib.context import CryptContext
import jwt
from typing import Optional, List
from enum import Enum

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
def ensure_todo_table_exists(db: Session):
    """Ensure the todo_items table exists with correct schema"""
    try:
        # Drop the existing table if it has wrong schema
        db.execute("DROP TABLE IF EXISTS todo_items")
        db.commit()
        
        # Let SQLAlchemy create the table with correct schema
        models.TodoItem.__table__.create(bind=engine, checkfirst=True)
        print("TodoItem table recreated successfully")
    except Exception as e:
        print(f"Error recreating TodoItem table: {e}")
        raise
# ================ STARTUP EVENT ================
@app.on_event("startup")
async def startup_event():
    """Initialize database tables and populate data on startup"""
    db = SessionLocal()
    try:
        # Fix TodoItem table schema first
        fix_todo_table_schema(db)
        
        # Populate mess menu data
        populate_mess_menu_data(db)
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error during startup: {e}")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "College App API is running", "status": "connected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)