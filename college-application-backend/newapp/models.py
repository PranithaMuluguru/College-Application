from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, Enum as SQLAlchemyEnum, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

# Enum definitions
class DayOfWeek(enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class MealType(enum.Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACKS = "Snacks"
    DINNER = "Dinner"

class MenuWeekType(enum.Enum):
    WEEK_1 = "Week 1"
    WEEK_2 = "Week 2"

class EventType(enum.Enum):
    ACADEMIC = "Academic"
    EXAM = "Exam"
    ASSIGNMENT = "Assignment"
    CLUB = "Club"
    SPORTS = "Sports"
    CULTURAL = "Cultural"
    WORKSHOP = "Workshop"
    OTHER = "Other"

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
    
    # Relationships
    calendar_events = relationship("CalendarEvent", back_populates="user")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    unanswered_queries = relationship("UnansweredQuestion", back_populates="user", cascade="all, delete-orphan")


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

class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    task = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class MessMenuItem(Base):
    __tablename__ = "mess_menu_items"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(SQLAlchemyEnum(DayOfWeek), nullable=False)
    meal_type = Column(SQLAlchemyEnum(MealType), nullable=False)
    menu_week_type = Column(SQLAlchemyEnum(MenuWeekType), nullable=False)
    item_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rating = Column(Float, nullable=True, default=0.0)
    votes = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_type = Column(SQLAlchemyEnum(EventType), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    is_all_day = Column(Boolean, default=False)
    reminder_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="calendar_events")


# Add these classes to your models.py file

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)  # ⭐ ADD THIS LINE

    source_url = Column(String(500), nullable=True)
    keywords = Column(Text, nullable=True)  # Comma-separated keywords
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class QuestionStatus(enum.Enum):
    UNANSWERED = "unanswered"
    RESEARCHING = "researching"
    ANSWERED = "answered"
    DUPLICATE = "duplicate"

class UnansweredQuestion(Base):
    __tablename__ = "unanswered_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    ask_count = Column(Integer, default=1)
    status = Column(SQLAlchemyEnum(QuestionStatus), default=QuestionStatus.UNANSWERED)
    confidence_score = Column(Float, nullable=True)
    similar_question_id = Column(Integer, nullable=True)  # For duplicate detection
    admin_answer = Column(Text, nullable=True)
    last_asked = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="unanswered_queries")

    