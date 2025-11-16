# ai_routes.py - Complete matching system

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
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


class StudyGoalInput(BaseModel):
    course_code: str
    target_grade: str
    target_date: str
    description: str


# ==================== HELPER FUNCTIONS ====================

def get_user_preferences(user_id: int, db: Session) -> dict:
    """Get user preferences or return defaults"""
    prefs = db.query(models.StudyPreference).filter(
        models.StudyPreference.user_id == user_id
    ).first()
    
    if not prefs:
        return {
            'environment': 'quiet',
            'preferred_time': 'evening',
            'learning_style': 'visual',
            'session_duration': 120,
            'group_size': 'small',
            'communication_style': 'balanced',
            'primary_goal': 'improve_grades'
        }
    
    return {
        'environment': prefs.study_environment,
        'preferred_time': prefs.preferred_study_time,
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
    if user1_prefs['environment'] == user2_prefs['environment']:
        compatibility_score += 2
    elif is_compatible_environment(user1_prefs['environment'], user2_prefs['environment']):
        compatibility_score += 1
    total_factors += 2
    
    # Time (weight: 2)
    if user1_prefs['preferred_time'] == user2_prefs['preferred_time']:
        compatibility_score += 2
    elif is_adjacent_time(user1_prefs['preferred_time'], user2_prefs['preferred_time']):
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

# ai_routes.py - Update the main endpoint

@router.get("/study-buddies/{user_id}", response_model=List[StudyBuddyMatch])
async def find_study_buddies(
    user_id: int,
    course_code: Optional[str] = Query(None),
    max_results: int = Query(20, le=50),
    db: Session = Depends(get_database)
):
    """AI-powered study buddy matching"""
    try:
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get enrollments
        user_enrollments = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.user_id == user_id,
            models.CourseEnrollment.is_active == True
        ).all()
        
        user_course_ids = [e.course_id for e in user_enrollments]
        
        # FIX: Handle "undefined" or invalid course_code
        if course_code and course_code != "undefined" and course_code.strip():
            course = db.query(models.CourseCatalog).filter(
                models.CourseCatalog.course_code == course_code
            ).first()
            if course:
                user_course_ids = [course.id]
            else:
                # Course not found, return empty
                return []
        
        if not user_course_ids:
            return []
        
        # Find potential buddies
        potential_buddies = db.query(models.User).join(
            models.CourseEnrollment,
            models.CourseEnrollment.user_id == models.User.id
        ).filter(
            models.CourseEnrollment.course_id.in_(user_course_ids),
            models.CourseEnrollment.is_active == True,
            models.User.id != user_id
        ).distinct().all()
        
        if not potential_buddies:
            return []
        
        # Get user data
        user_grades = {}
        for enrollment in user_enrollments:
            if enrollment.grade:
                user_grades[enrollment.course.course_code] = enrollment.grade
        
        user_schedule = []
        user_timetable = db.query(models.TimetableEntry).filter(
            models.TimetableEntry.user_id == user_id
        ).all()
        for tt in user_timetable:
            user_schedule.append(f"{tt.day_of_week} {tt.start_time}-{tt.end_time}")
        
        user_prefs = get_user_preferences(user_id, db)
        
        # Get following status
        following_ids = set()
        follows = db.query(models.Follow).filter(
            models.Follow.follower_id == user_id
        ).all()
        for follow in follows:
            if follow.status == 'accepted':
                following_ids.add(follow.following_id)
        
        matches = []
        
        for buddy in potential_buddies:
            buddy_enrollments = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == buddy.id,
                models.CourseEnrollment.is_active == True
            ).all()
            
            buddy_course_ids = [e.course_id for e in buddy_enrollments]
            common_course_ids = set(user_course_ids) & set(buddy_course_ids)
            
            if not common_course_ids:
                continue
            
            common_courses = []
            for cid in common_course_ids:
                course = db.query(models.CourseCatalog).filter(
                    models.CourseCatalog.id == cid
                ).first()
                if course:
                    common_courses.append(course.course_code)
            
            buddy_grades = {}
            for enrollment in buddy_enrollments:
                if enrollment.grade:
                    buddy_grades[enrollment.course.course_code] = enrollment.grade
            
            buddy_schedule = []
            buddy_timetable = db.query(models.TimetableEntry).filter(
                models.TimetableEntry.user_id == buddy.id
            ).all()
            for tt in buddy_timetable:
                buddy_schedule.append(f"{tt.day_of_week} {tt.start_time}-{tt.end_time}")
            
            buddy_prefs = get_user_preferences(buddy.id, db)
            
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
            
            follow = db.query(models.Follow).filter(
                models.Follow.follower_id == user_id,
                models.Follow.following_id == buddy.id
            ).first()
            
            follow_status = follow.status if follow else None
            
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
        return matches[:max_results]
        
    except Exception as e:
        # Log the actual error
        print(f"ERROR in study-buddies endpoint: {str(e)}")
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
                "preferences": get_user_preferences(user_id, db)
            }
        
        return {
            "has_preferences": True,
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