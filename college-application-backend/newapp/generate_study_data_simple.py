# generate_study_data_simple.py (FIXED VERSION)

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import random
import string
from datetime import datetime, timedelta
from newapp.database import SessionLocal, engine
from newapp import models
from newapp.models import Base

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Simple data generators
def random_email():
    username = ''.join(random.choices(string.ascii_lowercase, k=10))
    domain = random.choice(['gmail.com', 'yahoo.com', 'college.edu'])
    return f"{username}@{domain}"

def random_name():
    first_names = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 
                   'James', 'Maria', 'Robert', 'Jennifer', 'Raj', 'Priya',
                   'Ahmed', 'Fatima', 'Wei', 'Yuki', 'Carlos', 'Ana']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 
                  'Kumar', 'Patel', 'Chen', 'Garcia', 'Rodriguez',
                  'Singh', 'Lee', 'Kim', 'Nguyen', 'Ali']
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def random_phone():
    return f"+1-{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}"

# FIX: Generate unique college IDs
def generate_unique_college_ids(count):
    """Generate unique college IDs"""
    existing_ids = set()
    existing_in_db = db.query(models.User.college_id).all()
    for (cid,) in existing_in_db:
        existing_ids.add(cid)
    
    new_ids = []
    while len(new_ids) < count:
        new_id = f"COL{random.randint(100000, 999999)}"
        if new_id not in existing_ids and new_id not in new_ids:
            new_ids.append(new_id)
    
    return new_ids

# Grade mappings
GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C']
DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'IT']
STUDY_ENVS = ['quiet', 'social', 'library', 'cafe']
STUDY_TIMES = ['morning', 'afternoon', 'evening', 'night']
LEARNING_STYLES = ['visual', 'auditory', 'kinesthetic', 'reading']
COMM_STYLES = ['silent', 'minimal', 'balanced', 'collaborative']

# 1. Create courses
courses_data = [
    ("CS101", "Data Structures", "Computer Science", 4, 2, 1),
    ("CS201", "Algorithms", "Computer Science", 4, 2, 2),
    ("CS301", "Machine Learning", "Computer Science", 4, 3, 1),
    ("CS302", "Deep Learning", "Computer Science", 3, 3, 2),
    ("MATH201", "Linear Algebra", "Mathematics", 3, 2, 1),
    ("DB301", "Database Systems", "Computer Science", 4, 3, 1),
    ("OS201", "Operating Systems", "Computer Science", 4, 2, 2),
    ("WEB301", "Web Development", "Computer Science", 3, 3, 1),
    ("AI401", "Artificial Intelligence", "Computer Science", 4, 4, 1),
]

print("Creating courses...")
for code, name, dept, credits, year, sem in courses_data:
    existing = db.query(models.CourseCatalog).filter(
        models.CourseCatalog.course_code == code
    ).first()
    
    if not existing:
        course = models.CourseCatalog(
            course_code=code,
            course_name=name,
            department=dept,
            credits=credits,
            year=year,
            semester=sem,
            is_active=True
        )
        db.add(course)

db.commit()
print(f"✅ Created {len(courses_data)} courses")

# Get your 3 real users
real_user_ids = [1, 2, 3]  # ⚠️ CHANGE THESE TO YOUR ACTUAL USER IDs

# 2. Generate 200 fake users with UNIQUE college IDs
print("Generating 200 unique college IDs...")
unique_college_ids = generate_unique_college_ids(200)

print("Creating 200 fake users...")
created_count = 0
for i in range(200):
    try:
        user = models.User(
            email=random_email(),
            college_id=unique_college_ids[i],  # FIX: Use pre-generated unique IDs
            hashed_password="$2b$12$fake_hash",
            full_name=random_name(),
            department=random.choice(DEPARTMENTS),
            year=random.randint(2, 4),
            phone_number=random_phone(),
            is_verified=True,
            is_active=True
        )
        db.add(user)
        created_count += 1
        
        if (i + 1) % 50 == 0:
            db.commit()
            print(f"  Created {created_count} users...")
    except Exception as e:
        print(f"  Error creating user {i}: {str(e)}")
        db.rollback()
        continue

db.commit()
print(f"✅ Created {created_count} fake users")

# Get all users for next steps
all_fake_users = db.query(models.User).filter(
    models.User.id.notin_(real_user_ids)
).all()

print(f"Found {len(all_fake_users)} fake users to process")

# 3. Enroll users in courses
print("Enrolling users in courses...")
all_courses = db.query(models.CourseCatalog).all()

if not all_courses:
    print("❌ No courses found! Something went wrong.")
    db.close()
    exit(1)

for idx, user in enumerate(all_fake_users):
    try:
        num_courses = random.randint(3, 5)
        selected_courses = random.sample(all_courses, min(num_courses, len(all_courses)))
        
        for course in selected_courses:
            enrollment = models.CourseEnrollment(
                user_id=user.id,
                course_id=course.id,
                year=2024,
                semester=1,
                is_active=True
            )
            db.add(enrollment)
        
        if (idx + 1) % 50 == 0:
            db.commit()
            print(f"  Enrolled {idx + 1} users...")
    except Exception as e:
        print(f"  Error enrolling user {user.id}: {str(e)}")
        db.rollback()

db.commit()

# Enroll your real users
print("Enrolling your real users...")
for user_id in real_user_ids:
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            print(f"⚠️ User {user_id} not found - skipping")
            continue
            
        # Give them 4-5 courses
        selected_courses = random.sample(all_courses, min(4, len(all_courses)))
        for course in selected_courses:
            existing = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == user_id,
                models.CourseEnrollment.course_id == course.id
            ).first()
            
            if not existing:
                enrollment = models.CourseEnrollment(
                    user_id=user_id,
                    course_id=course.id,
                    year=2024,
                    semester=1,
                    is_active=True
                )
                db.add(enrollment)
        db.commit()
        print(f"  ✅ Enrolled user {user_id}")
    except Exception as e:
        print(f"  ❌ Error with user {user_id}: {str(e)}")
        db.rollback()

print("✅ Course enrollments complete")

# 4. Add study preferences
print("Creating study preferences...")
all_users = db.query(models.User).all()

for idx, user in enumerate(all_users):
    try:
        existing = db.query(models.StudyPreference).filter(
            models.StudyPreference.user_id == user.id
        ).first()
        
        if not existing:
            pref = models.StudyPreference(
                user_id=user.id,
                study_environment=random.choice(STUDY_ENVS),
                preferred_study_time=random.choice(STUDY_TIMES),
                learning_style=random.choice(LEARNING_STYLES),
                session_duration=random.choice([60, 120, 180]),
                group_size=random.choice(['small', 'medium']),
                communication_style=random.choice(COMM_STYLES),
                primary_goal='improve_grades'
            )
            db.add(pref)
        
        if (idx + 1) % 50 == 0:
            db.commit()
            print(f"  Added preferences for {idx + 1} users...")
    except Exception as e:
        print(f"  Error adding preferences for user {user.id}: {str(e)}")
        db.rollback()

db.commit()
print("✅ Study preferences created")

# 5. Add timetable entries
print("Creating timetables...")
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

for idx, user in enumerate(all_users):
    try:
        user_courses = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.user_id == user.id
        ).all()
        
        if not user_courses:
            continue
        
        num_classes = min(len(user_courses), random.randint(3, 5))
        
        for _ in range(num_classes):
            day = random.choice(DAYS)
            start_hour = random.randint(9, 15)
            course = random.choice(user_courses).course
            
            entry = models.TimetableEntry(
                user_id=user.id,
                course_id=course.id,
                day_of_week=day,
                start_time=f"{start_hour:02d}:00",
                end_time=f"{start_hour+1:02d}:00",
                course_name=course.course_name,
                teacher=random_name(),
                room_number=f"R{random.randint(100, 500)}"
            )
            db.add(entry)
        
        if (idx + 1) % 50 == 0:
            db.commit()
            print(f"  Added timetables for {idx + 1} users...")
    except Exception as e:
        db.rollback()

db.commit()
print("✅ Timetables created")

# Summary
print("\n" + "="*50)
print("📊 DATA GENERATION COMPLETE!")
print("="*50)

user_count = db.query(models.User).count()
course_count = db.query(models.CourseCatalog).count()
enrollment_count = db.query(models.CourseEnrollment).count()
pref_count = db.query(models.StudyPreference).count()
timetable_count = db.query(models.TimetableEntry).count()

print(f"👥 Total Users: {user_count}")
print(f"📚 Total Courses: {course_count}")
print(f"📝 Total Enrollments: {enrollment_count}")
print(f"⚙️ Study Preferences: {pref_count}")
print(f"📅 Timetable Entries: {timetable_count}")
print("\n✅ You can now test the study buddy endpoint!")
print(f"   Example: GET /ai/study-buddies/1?course_code=CS301")

db.close()