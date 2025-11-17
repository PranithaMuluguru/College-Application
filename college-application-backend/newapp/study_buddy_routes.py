# ai_routes.py - Complete with preference requirement

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import numpy as np
from collections import defaultdict

from .database import get_database
from . import models

router = APIRouter(prefix="/ai", tags=["ai"])

# ==================== PYDANTIC SCHEMAS ====================

class StudyBuddyMatch(BaseModel):
    user_id: int
    full_name: str
    department: str
    year: int
    college_id: str
    match_score: float
    common_courses: List[str]
    complementary_skills: List[str]
    common_availability: List[str]
    study_style_compatibility: float
    grade_similarity: float
    is_following: bool
    follow_status: Optional[str]

    class Config:
        from_attributes = True


class StudyPreferencesInput(BaseModel):
    study_environment: str
    preferred_study_time: str
    learning_style: str
    session_duration: int = 120
    group_size: str = 'small'
    communication_style: str = 'balanced'
    primary_goal: str = 'improve_grades'


class StudyBuddyRequestInput(BaseModel):
    target_user_id: int
    course_code: str
    message: Optional[str] = None


# ==================== HELPER FUNCTIONS ====================

def get_user_preferences(user_id: int, db: Session) -> Optional[dict]:
    """Get user preferences - returns None if not set"""
    prefs = db.query(models.StudyPreference).filter(
        models.StudyPreference.user_id == user_id
    ).first()
    
    if not prefs:
        return None
    
    return {
        'study_environment': prefs.study_environment,
        'preferred_study_time': prefs.preferred_study_time,
        'learning_style': prefs.learning_style,
        'session_duration': prefs.session_duration,
        'group_size': prefs.group_size,
        'communication_style': prefs.communication_style,
        'primary_goal': prefs.primary_goal
    }


def calculate_grade_similarity(user1_grades: dict, user2_grades: dict) -> float:
    """Calculate similarity based on grade patterns"""
    if not user1_grades or not user2_grades:
        return 0.5
    
    grade_map = {'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 2}
    
    common_courses = set(user1_grades.keys()) & set(user2_grades.keys())
    if not common_courses:
        return 0.5
    
    differences = []
    for course in common_courses:
        g1 = grade_map.get(user1_grades[course], 5)
        g2 = grade_map.get(user2_grades[course], 5)
        differences.append(abs(g1 - g2))
    
    avg_diff = np.mean(differences)
    similarity = max(0, 1 - (avg_diff / 5))
    return similarity


def parse_time_slot(time_str: str):
    """Parse time slot like 'MON 09:00-10:00'"""
    parts = time_str.split()
    if len(parts) < 2:
        return None, None, None
    
    day = parts[0]
    time_range = parts[1].split('-')
    if len(time_range) != 2:
        return None, None, None
    
    return day, time_range[0], time_range[1]


def find_common_free_slots(user1_schedule: List[str], user2_schedule: List[str]) -> List[str]:
    """Find overlapping free time"""
    all_days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    
    user1_busy = defaultdict(set)
    user2_busy = defaultdict(set)
    
    for slot in user1_schedule:
        day, start, end = parse_time_slot(slot)
        if day:
            user1_busy[day].add((start, end))
    
    for slot in user2_schedule:
        day, start, end = parse_time_slot(slot)
        if day:
            user2_busy[day].add((start, end))
    
    common_free = []
    for day in all_days:
        if day not in user1_busy and day not in user2_busy:
            common_free.append(f"{day} (Full day)")
        elif len(user1_busy[day]) < 5 and len(user2_busy[day]) < 5:
            common_free.append(f"{day} (Some slots)")
    
    return common_free[:5]


def is_compatible_environment(env1: str, env2: str) -> bool:
    """Check environment compatibility"""
    compatible_pairs = {
        'quiet': ['library'],
        'library': ['quiet'],
        'social': ['cafe'],
        'cafe': ['social']
    }
    return env2 in compatible_pairs.get(env1, [])


def is_adjacent_time(time1: str, time2: str) -> bool:
    """Check if times are adjacent"""
    time_order = ['morning', 'afternoon', 'evening', 'night']
    try:
        idx1 = time_order.index(time1)
        idx2 = time_order.index(time2)
        return abs(idx1 - idx2) == 1
    except:
        return False


def is_compatible_communication(comm1: str, comm2: str) -> bool:
    """Check communication compatibility"""
    if 'balanced' in [comm1, comm2]:
        return True
    compatible = {
        'silent': ['minimal'],
        'minimal': ['silent', 'balanced'],
        'collaborative': ['balanced']
    }
    return comm2 in compatible.get(comm1, [])


def calculate_study_style_compatibility(user1_prefs: dict, user2_prefs: dict) -> float:
    """Enhanced compatibility calculation"""
    compatibility_score = 0
    total_factors = 0
    
    # Environment (weight: 2)
    if user1_prefs['study_environment'] == user2_prefs['study_environment']:
        compatibility_score += 2
    elif is_compatible_environment(user1_prefs['study_environment'], user2_prefs['study_environment']):
        compatibility_score += 1
    total_factors += 2
    
    # Time (weight: 2)
    if user1_prefs['preferred_study_time'] == user2_prefs['preferred_study_time']:
        compatibility_score += 2
    elif is_adjacent_time(user1_prefs['preferred_study_time'], user2_prefs['preferred_study_time']):
        compatibility_score += 1
    total_factors += 2
    
    # Learning style (weight: 1.5)
    if user1_prefs['learning_style'] == user2_prefs['learning_style']:
        compatibility_score += 1.5
    total_factors += 1.5
    
    # Communication (weight: 1.5)
    if user1_prefs['communication_style'] == user2_prefs['communication_style']:
        compatibility_score += 1.5
    elif is_compatible_communication(user1_prefs['communication_style'], user2_prefs['communication_style']):
        compatibility_score += 0.75
    total_factors += 1.5
    
    # Group size (weight: 1)
    if user1_prefs['group_size'] == user2_prefs['group_size']:
        compatibility_score += 1
    total_factors += 1
    
    # Session duration (weight: 1)
    duration_diff = abs(user1_prefs['session_duration'] - user2_prefs['session_duration'])
    if duration_diff <= 30:
        compatibility_score += 1
    elif duration_diff <= 60:
        compatibility_score += 0.5
    total_factors += 1
    
    return compatibility_score / total_factors


def find_complementary_skills(user1_grades: dict, user2_grades: dict) -> List[str]:
    """Find complementary skills"""
    grade_map = {'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 2}
    
    complementary = []
    for course, grade1 in user1_grades.items():
        if course not in user2_grades:
            continue
        
        grade2 = user2_grades[course]
        score1 = grade_map.get(grade1, 5)
        score2 = grade_map.get(grade2, 5)
        
        if abs(score1 - score2) >= 2:
            if score1 > score2:
                complementary.append(f"{course} (You can help)")
            else:
                complementary.append(f"{course} (They can help)")
    
    return complementary[:5]


# ==================== MAIN ENDPOINTS ====================

@router.get("/study-buddies/{user_id}", response_model=List[StudyBuddyMatch])
async def find_study_buddies(
    user_id: int,
    course_code: Optional[str] = Query(None),
    max_results: int = Query(20, le=50),
    db: Session = Depends(get_database)
):
    """AI-powered study buddy matching - FIXED"""
    try:
        print(f"\n=== STUDY BUDDY REQUEST ===")
        print(f"User ID: {user_id}")
        print(f"Course Code: {course_code}")
        
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not current_user:
            print(f"ERROR: User {user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"Current user: {current_user.full_name}")
        
        # Check if user has preferences
        user_prefs = get_user_preferences(user_id, db)
        if not user_prefs:
            print(f"ERROR: User {user_id} has no preferences")
            raise HTTPException(
                status_code=400, 
                detail="Please set your study preferences first"
            )
        
        print(f"User preferences: {user_prefs}")
        
        # FIX: Try different table names and approaches
        user_course_ids = []
        
        # Method 1: Try CourseEnrollment
        try:
            user_enrollments = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == user_id,
                models.CourseEnrollment.is_active == True
            ).all()
            
            if user_enrollments:
                user_course_ids = [e.course_id for e in user_enrollments]
                print(f"✅ Method 1 (CourseEnrollment): Found {len(user_course_ids)} course IDs")
            else:
                print("❌ Method 1: No enrollments found")
        except Exception as e:
            print(f"❌ Method 1 failed: {e}")
        
        # Method 2: Try Course model
        if not user_course_ids:
            try:
                user_courses = db.query(models.Course).filter(
                    models.Course.user_id == user_id
                ).all()
                
                if user_courses:
                    user_course_ids = [c.id for c in user_courses]
                    print(f"✅ Method 2 (Course): Found {len(user_course_ids)} course IDs")
                else:
                    print("❌ Method 2: No courses found")
            except Exception as e:
                print(f"❌ Method 2 failed: {e}")
        
        # Method 3: Direct SQL query
        if not user_course_ids:
            try:
                # Check if course_enrollments table exists
                result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='course_enrollments'"))
                if result.fetchone():
                    query = text(f"SELECT course_id FROM course_enrollments WHERE user_id = {user_id} AND is_active = 1")
                    result = db.execute(query)
                    rows = result.fetchall()
                    if rows:
                        user_course_ids = [row[0] for row in rows]
                        print(f"✅ Method 3 (SQL): Found {len(user_course_ids)} course IDs")
                    else:
                        print("❌ Method 3: No enrollments found")
                else:
                    print("❌ Method 3: course_enrollments table doesn't exist")
            except Exception as e:
                print(f"❌ Method 3 failed: {e}")
        
        # Method 4: Check if course_catalog table exists
        if not user_course_ids:
            try:
                result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='course_catalog'"))
                if result.fetchone():
                    print("✅ course_catalog table exists")
                else:
                    print("❌ course_catalog table doesn't exist")
            except Exception as e:
                print(f"❌ Method 4 failed: {e}")
        
        # Filter by course_code if provided
        if course_code and course_code != "undefined" and course_code.strip():
            print(f"Filtering by course: {course_code}")
            try:
                course = db.query(models.CourseCatalog).filter(
                    models.CourseCatalog.course_code == course_code
                ).first()
                if course:
                    user_course_ids = [course.id]
                    print(f"✅ Found course: {course.course_name} (ID: {course.id})")
                else:
                    print(f"❌ Course {course_code} not found")
                    return []
            except Exception as e:
                print(f"❌ Course lookup failed: {e}")
                return []
        
        if not user_course_ids:
            print("❌ No course IDs to match")
            return []
        
        print(f"Target course IDs: {user_course_ids}")
        
        # Find potential buddies - try different approaches
        potential_buddies = []
        
        # Method 1: Using CourseEnrollment
        try:
            potential_buddies = db.query(models.User).join(
                models.CourseEnrollment,
                models.CourseEnrollment.user_id == models.User.id
            ).filter(
                models.CourseEnrollment.course_id.in_(user_course_ids),
                models.CourseEnrollment.is_active == True,
                models.User.id != user_id
            ).distinct().all()
            
            if potential_buddies:
                print(f"✅ Found {len(potential_buddies)} potential buddies using CourseEnrollment")
            else:
                print("❌ No potential buddies found with CourseEnrollment")
        except Exception as e:
            print(f"❌ CourseEnrollment join failed: {e}")
        
        # Method 2: Using Course model
        if not potential_buddies:
            try:
                potential_buddies = db.query(models.User).join(
                    models.Course,
                    models.Course.user_id == models.User.id
                ).filter(
                    models.Course.id.in_(user_course_ids),
                    models.User.id != user_id
                ).distinct().all()
                
                if potential_buddies:
                    print(f"✅ Found {len(potential_buddies)} potential buddies using Course")
                else:
                    print("❌ No potential buddies found with Course")
            except Exception as e:
                print(f"❌ Course join failed: {e}")
        
        # Method 3: Direct SQL
        if not potential_buddies:
            try:
                course_ids_str = ','.join(map(str, user_course_ids))
                query = text(f"""
                    SELECT DISTINCT u.* FROM users u
                    JOIN course_enrollments ce ON ce.user_id = u.id
                    WHERE ce.course_id IN ({course_ids_str})
                    AND ce.is_active = 1
                    AND u.id != {user_id}
                """)
                result = db.execute(query)
                rows = result.fetchall()
                
                if rows:
                    # Convert to User objects
                    potential_buddies = []
                    for row in rows:
                        user = models.User()
                        user.id = row[0]
                        user.full_name = row[3]  # Adjust based on your actual column order
                        user.department = row[4]
                        user.year = row[5]
                        user.college_id = row[2]
                        potential_buddies.append(user)
                    print(f"✅ Found {len(potential_buddies)} potential buddies using SQL")
                else:
                    print("❌ No potential buddies found with SQL")
            except Exception as e:
                print(f"❌ SQL query failed: {e}")
        
        if not potential_buddies:
            print("❌ No potential buddies found - returning empty list")
            return []
        
        print(f"✅ Total potential buddies: {len(potential_buddies)}")
        
        # Get user data
        user_grades = {}
        user_schedule = []
        
        # Try to get grades from GradeEntry
        try:
            grade_entries = db.query(models.GradeEntry).filter(
                models.GradeEntry.user_id == user_id
            ).all()
            for entry in grade_entries:
                user_grades[entry.course_name] = entry.grade
            print(f"Found {len(user_grades)} grade entries")
        except Exception as e:
            print(f"Grade lookup failed: {e}")
        
        # Try to get schedule from TimetableEntry
        try:
            timetable_entries = db.query(models.TimetableEntry).filter(
                models.TimetableEntry.user_id == user_id
            ).all()
            for tt in timetable_entries:
                user_schedule.append(f"{tt.day_of_week} {tt.start_time}-{tt.end_time}")
            print(f"Found {len(user_schedule)} timetable entries")
        except Exception as e:
            print(f"Timetable lookup failed: {e}")
        
        # Get following status
        following_ids = set()
        try:
            follows = db.query(models.Follow).filter(
                models.Follow.follower_id == user_id
            ).all()
            for follow in follows:
                if follow.status == 'accepted':
                    following_ids.add(follow.following_id)
            print(f"Following {len(following_ids)} users")
        except Exception as e:
            print(f"Follow lookup failed: {e}")
        
        matches = []
        
        for buddy in potential_buddies:
            print(f"\n--- Processing buddy: {buddy.full_name} ---")
            
            # Skip buddies without preferences
            buddy_prefs = get_user_preferences(buddy.id, db)
            if not buddy_prefs:
                print("Skipping - no preferences")
                continue
            
            # Get buddy courses - try different models
            buddy_course_ids = []
            common_courses = []
            
            # Try CourseEnrollment first
            try:
                buddy_enrollments = db.query(models.CourseEnrollment).filter(
                    models.CourseEnrollment.user_id == buddy.id,
                    models.CourseEnrollment.is_active == True
                ).all()
                buddy_course_ids = [e.course_id for e in buddy_enrollments]
                common_course_ids = set(user_course_ids) & set(buddy_course_ids)
                print(f"Buddy enrollments: {len(buddy_enrollments)}")
            except Exception as e:
                print(f"Buddy enrollment lookup failed: {e}")
            
            # Try Course model if CourseEnrollment fails
            if not buddy_course_ids:
                try:
                    buddy_courses = db.query(models.Course).filter(
                        models.Course.user_id == buddy.id
                    ).all()
                    buddy_course_ids = [c.id for c in buddy_courses]
                    common_course_ids = set(user_course_ids) & set(buddy_course_ids)
                    print(f"Buddy courses: {len(buddy_courses)}")
                except Exception as e:
                    print(f"Buddy course lookup failed: {e}")
            
            if not common_course_ids:
                print("Skipping - no common courses")
                continue
            
            # Get course names for common courses
            for cid in common_course_ids:
                try:
                    course = db.query(models.CourseCatalog).filter(
                        models.CourseCatalog.id == cid
                    ).first()
                    if course:
                        common_courses.append(course.course_code)
                except Exception as e:
                    print(f"Course name lookup failed: {e}")
            
            # Get buddy grades and schedule
            buddy_grades = {}
            buddy_schedule = []
            
            try:
                buddy_grade_entries = db.query(models.GradeEntry).filter(
                    models.GradeEntry.user_id == buddy.id
                ).all()
                for entry in buddy_grade_entries:
                    buddy_grades[entry.course_name] = entry.grade
            except Exception as e:
                print(f"Buddy grade lookup failed: {e}")
            
            try:
                buddy_timetable = db.query(models.TimetableEntry).filter(
                    models.TimetableEntry.user_id == buddy.id
                ).all()
                for tt in buddy_timetable:
                    buddy_schedule.append(f"{tt.day_of_week} {tt.start_time}-{tt.end_time}")
            except Exception as e:
                print(f"Buddy timetable lookup failed: {e}")
            
            # Calculate scores
            grade_similarity = calculate_grade_similarity(user_grades, buddy_grades)
            study_compatibility = calculate_study_style_compatibility(user_prefs, buddy_prefs)
            complementary_skills = find_complementary_skills(user_grades, buddy_grades)
            common_availability = find_common_free_slots(user_schedule, buddy_schedule)
            
            course_overlap_score = len(common_course_ids) / max(len(user_course_ids), 1)
            availability_score = len(common_availability) / 7
            
            match_score = (
                course_overlap_score * 0.3 +
                grade_similarity * 0.25 +
                study_compatibility * 0.25 +
                availability_score * 0.2
            ) * 100
            
            print(f"Match score: {match_score:.2f}%")
            
            # Check follow status
            follow_status = None
            try:
                follow = db.query(models.Follow).filter(
                    models.Follow.follower_id == user_id,
                    models.Follow.following_id == buddy.id
                ).first()
                follow_status = follow.status if follow else None
            except Exception as e:
                print(f"Follow status lookup failed: {e}")
            
            matches.append(StudyBuddyMatch(
                user_id=buddy.id,
                full_name=buddy.full_name,
                department=buddy.department,
                year=buddy.year,
                college_id=buddy.college_id,
                match_score=match_score,
                common_courses=common_courses,
                complementary_skills=complementary_skills,
                common_availability=common_availability,
                study_style_compatibility=study_compatibility * 100,
                grade_similarity=grade_similarity * 100,
                is_following=buddy.id in following_ids,
                follow_status=follow_status
            ))
        
        matches.sort(key=lambda x: x.match_score, reverse=True)
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Total matches: {len(matches)}")
        print(f"Returning: {min(len(matches), max_results)} matches")
        
        return matches[:max_results]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n=== ERROR ===")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preferences/{user_id}")
async def save_study_preferences(
    user_id: int,
    preferences: StudyPreferencesInput,
    db: Session = Depends(get_database)
):
    """Save user study preferences"""
    try:
        existing = db.query(models.StudyPreference).filter(
            models.StudyPreference.user_id == user_id
        ).first()
        
        if existing:
            for key, value in preferences.dict().items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
        else:
            new_prefs = models.StudyPreference(
                user_id=user_id,
                **preferences.dict()
            )
            db.add(new_prefs)
        
        db.commit()
        return {"message": "Preferences saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preferences/{user_id}")
async def get_study_preferences(
    user_id: int,
    db: Session = Depends(get_database)
):
    """Get user preferences"""
    try:
        prefs = db.query(models.StudyPreference).filter(
            models.StudyPreference.user_id == user_id
        ).first()
        
        if not prefs:
            return {
                "has_preferences": False,
                "preferences": {}
            }
        
        return {"has_preferences": True,
        "preferences": {
            "study_environment": prefs.study_environment,
            "preferred_study_time": prefs.preferred_study_time,
            "learning_style": prefs.learning_style,
            "session_duration": prefs.session_duration,
            "group_size": prefs.group_size,
            "communication_style": prefs.communication_style,
            "primary_goal": prefs.primary_goal
        }
    }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/study-buddies/request/{user_id}")
async def send_study_buddy_request(
    user_id: int,
    request: StudyBuddyRequestInput,
    db: Session = Depends(get_database)
):
    """Send study buddy request"""
    try:
        existing = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id,
            models.Follow.following_id == request.target_user_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Request already sent")
        
        follow = models.Follow(
            follower_id=user_id,
            following_id=request.target_user_id,
            status='pending'
        )
        db.add(follow)
        db.commit()
        
        return {"message": "Study buddy request sent", "request_id": follow.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/study-buddies/{user_id}/active")
async def get_active_study_buddies(
    user_id: int,
    db: Session = Depends(get_database)
):
    """Get active study buddies"""
    try:
        buddies = db.query(models.User).join(
            models.Follow,
            and_(
                models.Follow.following_id == models.User.id,
                models.Follow.follower_id == user_id,
                models.Follow.status == 'accepted'
            )
        ).all()
        
        result = []
        for buddy in buddies:
            user_courses = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == user_id,
                models.CourseEnrollment.is_active == True
            ).all()
            
            buddy_courses = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == buddy.id,
                models.CourseEnrollment.is_active == True
            ).all()
            
            user_course_ids = {e.course_id for e in user_courses}
            buddy_course_ids = {e.course_id for e in buddy_courses}
            common = user_course_ids & buddy_course_ids
            
            common_course_names = []
            for cid in common:
                course = db.query(models.CourseCatalog).filter(
                    models.CourseCatalog.id == cid
                ).first()
                if course:
                    common_course_names.append(course.course_code)
            
            result.append({
                "id": buddy.id,
                "full_name": buddy.full_name,
                "college_id": buddy.college_id,
                "department": buddy.department,
                "year": buddy.year,
                "common_courses": common_course_names
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))