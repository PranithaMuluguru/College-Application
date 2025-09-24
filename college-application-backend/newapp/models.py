from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, Enum as SQLAlchemyEnum, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from enum import Enum as PythonEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, Enum as SQLAlchemyEnum
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    college_id = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    phone_number = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    teacher = Column(String, nullable=False)
    room_number = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ExamEntry(Base):
    __tablename__ = "exam_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    exam_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    room_number = Column(String, nullable=False)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GradeEntry(Base):
    __tablename__ = "grade_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    course_name = Column(String, nullable=False)
    credits = Column(Float, nullable=False)
    grade = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    category_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# ToDo Model
class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    task = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")  # low, medium, high
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Enum definitions
class DayOfWeek(PythonEnum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class MealType(PythonEnum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACKS = "Snacks"
    DINNER = "Dinner"

class MenuWeekType(PythonEnum):
    WEEK_1 = "Week 1"
    WEEK_2 = "Week 2"

# Add this model
class MessMenuItem(Base):
    __tablename__ = "mess_menu_items"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(SQLAlchemyEnum(DayOfWeek, name='day_of_week'), nullable=False)
    meal_type = Column(SQLAlchemyEnum(MealType, name='meal_type'), nullable=False)
    menu_week_type = Column(SQLAlchemyEnum(MenuWeekType, name='menu_week_type'), nullable=False)
    item_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rating = Column(Float, nullable=True, default=0.0)
    votes = Column(Integer, nullable=True, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())