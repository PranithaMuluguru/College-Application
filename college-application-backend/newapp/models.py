
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    college_id = Column(String)
    department = Column(String)
    year = Column(Integer)
    phone_number = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    timetable_entries = relationship("TimetableEntry", back_populates="user")
    exam_entries = relationship("ExamEntry", back_populates="user")
    grade_entries = relationship("GradeEntry", back_populates="user")
    course_categories = relationship("CourseCategory", back_populates="user")

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    day_of_week = Column(String)  # Monday, Tuesday, etc.
    start_time = Column(String)
    end_time = Column(String)
    course_name = Column(String)
    teacher = Column(String)
    room_number = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="timetable_entries")

class ExamEntry(Base):
    __tablename__ = "exam_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exam_name = Column(String)
    date = Column(DateTime)
    room_number = Column(String)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="exam_entries")

class CourseCategory(Base):
    __tablename__ = "course_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_name = Column(String)  # e.g., Core Courses, Electives, etc.
    required_credits = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="course_categories")
    grade_entries = relationship("GradeEntry", back_populates="category")

class GradeEntry(Base):
    __tablename__ = "grade_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("course_categories.id"))
    course_name = Column(String)
    credits = Column(Float)
    grade = Column(String)  # e.g., A, B+, C, etc.
    semester = Column(String)  # e.g., Fall 2023, Spring 2024
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="grade_entries")
    category = relationship("CourseCategory", back_populates="grade_entries")