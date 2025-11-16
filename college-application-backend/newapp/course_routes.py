from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from .database import get_database
from . import models

router = APIRouter(prefix="/courses", tags=["courses"])

# ==================== PYDANTIC SCHEMAS ====================

class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    department: str
    credits: int
    description: Optional[str] = None
    year: int
    semester: int
    prerequisites: Optional[str] = None

class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    prerequisites: Optional[str] = None
    is_active: Optional[bool] = None

class CourseEnrollRequest(BaseModel):
    course_codes: List[str]
    year: int
    semester: int

class CourseResponse(BaseModel):
    id: int
    course_code: str
    course_name: str
    department: str
    credits: int
    description: Optional[str]
    year: int
    semester: int
    prerequisites: Optional[str]
    is_active: bool
    total_enrolled: int = 0

    class Config:
        from_attributes = True

class EnrolledStudentResponse(BaseModel):
    id: int
    name: str
    email: str
    year: Optional[int]
    department: Optional[str]
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    sender_id: int
    message: str
    message_type: str = "text"

# ==================== ADMIN ENDPOINTS ====================

@router.post("/admin/courses", response_model=CourseResponse)
async def create_course(
    course: CourseCreate,
    db: Session = Depends(get_database)
):
    """Admin: Add new course to catalog"""
    try:
        existing = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.course_code == course.course_code
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Course code already exists")
        
        new_course = models.CourseCatalog(**course.dict())
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        
        return CourseResponse(
            **new_course.__dict__,
            total_enrolled=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/courses", response_model=List[CourseResponse])
async def get_course_catalog(
    department: Optional[str] = None,
    year: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_database)
):
    """Admin: Get course catalog with filters"""
    try:
        query = db.query(models.CourseCatalog)
        
        if department:
            query = query.filter(models.CourseCatalog.department == department)
        if year:
            query = query.filter(models.CourseCatalog.year == year)
        if semester:
            query = query.filter(models.CourseCatalog.semester == semester)
        
        courses = query.filter(models.CourseCatalog.is_active == True).all()
        
        result = []
        for course in courses:
            enrollment_count = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.course_id == course.id,
                models.CourseEnrollment.is_active == True
            ).count()
            
            result.append(CourseResponse(
                **course.__dict__,
                total_enrolled=enrollment_count
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: Session = Depends(get_database)
):
    """Admin: Update course information"""
    try:
        course = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.id == course_id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        update_data = course_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)
        
        course.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(course)
        
        enrollment_count = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == course.id,
            models.CourseEnrollment.is_active == True
        ).count()
        
        return CourseResponse(
            **course.__dict__,
            total_enrolled=enrollment_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/courses/{course_id}")
async def delete_course(
    course_id: int,
    db: Session = Depends(get_database)
):
    """Admin: Soft delete course"""
    try:
        course = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.id == course_id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course.is_active = False
        db.commit()
        
        return {"message": "Course deleted successfully", "course_id": course_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== USER ENDPOINTS ====================

@router.post("/enroll/{user_id}")
async def enroll_courses(
    user_id: int,
    enrollment: CourseEnrollRequest,
    db: Session = Depends(get_database)
):
    """User: Enroll in multiple courses with auto-join to study groups"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        enrolled_courses = []
        errors = []
        
        for course_code in enrollment.course_codes:
            course = db.query(models.CourseCatalog).filter(
                models.CourseCatalog.course_code == course_code,
                models.CourseCatalog.is_active == True
            ).first()
            
            if not course:
                errors.append(f"Course {course_code} not found")
                continue
            
            # Check if already enrolled
            existing = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == user_id,
                models.CourseEnrollment.course_id == course.id,
                models.CourseEnrollment.year == enrollment.year,
                models.CourseEnrollment.semester == enrollment.semester
            ).first()
            
            if existing:
                errors.append(f"Already enrolled in {course_code}")
                continue
            
            # Create enrollment
            new_enrollment = models.CourseEnrollment(
                user_id=user_id,
                course_id=course.id,
                year=enrollment.year,
                semester=enrollment.semester
            )
            db.add(new_enrollment)
            db.flush()
            
            # Find or create study group
            study_group = db.query(models.StudyGroup).filter(
                models.StudyGroup.course_id == course.id
            ).first()
            
            if not study_group:
                # Create chat group
                chat_group = models.ChatGroup(
                    name=f"{course.course_code} - {course.course_name}",
                    description=f"Study group for {course.course_name}",
                    chat_type=models.ChatType.GROUP,
                    created_by=user_id
                )
                db.add(chat_group)
                db.flush()
                
                study_group = models.StudyGroup(
                    chat_group_id=chat_group.id,
                    course_id=course.id,
                    created_by=user_id
                )
                db.add(study_group)
                db.flush()
            
            # Add user to group
            existing_member = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == study_group.chat_group_id,
                models.GroupMember.user_id == user_id
            ).first()
            
            if not existing_member:
                group_member = models.GroupMember(
                    group_id=study_group.chat_group_id,
                    user_id=user_id,
                    role='member'
                )
                db.add(group_member)
            
            enrolled_courses.append({
                "course_code": course.course_code,
                "course_name": course.course_name,
                "credits": course.credits
            })
        
        db.commit()
        
        return {
            "message": f"Successfully enrolled in {len(enrolled_courses)} courses",
            "enrolled_courses": enrolled_courses,
            "errors": errors if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-courses/{user_id}")
async def get_user_courses(
    user_id: int,
    year: Optional[int] = None,
    semester: Optional[int] = None,
    db: Session = Depends(get_database)
):
    """User: Get enrolled courses"""
    try:
        query = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.user_id == user_id,
            models.CourseEnrollment.is_active == True
        )
        
        if year:
            query = query.filter(models.CourseEnrollment.year == year)
        if semester:
            query = query.filter(models.CourseEnrollment.semester == semester)
        
        enrollments = query.all()
        
        courses = []
        for enrollment in enrollments:
            course = enrollment.course
            courses.append({
                "enrollment_id": enrollment.id,
                "course_id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
                "department": course.department,
                "credits": course.credits,
                "description": course.description,
                "year": enrollment.year,
                "semester": enrollment.semester,
                "enrollment_date": enrollment.enrollment_date.isoformat()
            })
        
        return courses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/enroll/{enrollment_id}")
async def drop_course(
    enrollment_id: int,
    db: Session = Depends(get_database)
):
    """User: Drop a course"""
    try:
        enrollment = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.id == enrollment_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        enrollment.is_active = False
        db.commit()
        
        return {"message": "Course dropped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available/{user_id}")
async def get_available_courses(
    user_id: int,
    db: Session = Depends(get_database)
):
    """User: Get ALL courses available for enrollment (no year/semester restriction)"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get enrolled course IDs
        enrolled_ids = [
            e.course_id for e in db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.user_id == user_id,
                models.CourseEnrollment.is_active == True
            ).all()
        ]
        
        # Get ALL active courses, excluding already enrolled ones
        all_courses = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.is_active == True,
            models.CourseCatalog.id.notin_(enrolled_ids) if enrolled_ids else True
        ).all()
        
        available = []
        for course in all_courses:
            available.append({
                "id": course.id,
                "course_code": course.course_code,
                "course_name": course.course_name,
                "credits": course.credits,
                "description": course.description,
                "year": course.year,
                "semester": course.semester,
                "prerequisites": course.prerequisites,
                "department": course.department
            })
        
        return available
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/students", response_model=List[EnrolledStudentResponse])
async def get_enrolled_students(
    course_id: int,
    db: Session = Depends(get_database)
):
    """Get all students enrolled in a specific course"""
    try:
        course = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.id == course_id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get all active enrollments for this course
        enrollments = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.course_id == course_id,
            models.CourseEnrollment.is_active == True
        ).all()
        
        students = []
        for enrollment in enrollments:
            user = enrollment.user
            students.append({
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "year": user.year if hasattr(user, 'year') else None,
                "department": user.department if hasattr(user, 'department') else None
            })
        
        return students
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/group")
async def get_or_create_course_group(
    course_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_database)
):
    """Get or create study group for a course"""
    try:
        course = db.query(models.CourseCatalog).filter(
            models.CourseCatalog.id == course_id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check if user is enrolled
        enrollment = db.query(models.CourseEnrollment).filter(
            models.CourseEnrollment.user_id == user_id,
            models.CourseEnrollment.course_id == course_id,
            models.CourseEnrollment.is_active == True
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
        
        # Find existing study group
        study_group = db.query(models.StudyGroup).filter(
            models.StudyGroup.course_id == course_id
        ).first()
        
        if not study_group:
            # Create new chat group
            chat_group = models.ChatGroup(
                name=f"{course.course_code} - {course.course_name}",
                description=f"Study group for {course.course_name}",
                chat_type=models.ChatType.GROUP,
                created_by=user_id
            )
            db.add(chat_group)
            db.flush()
            
            # Create study group
            study_group = models.StudyGroup(
                chat_group_id=chat_group.id,
                course_id=course_id,
                created_by=user_id
            )
            db.add(study_group)
            db.flush()
            
            # Add all enrolled students as members
            enrollments = db.query(models.CourseEnrollment).filter(
                models.CourseEnrollment.course_id == course_id,
                models.CourseEnrollment.is_active == True
            ).all()
            
            for enroll in enrollments:
                member = models.GroupMember(
                    group_id=chat_group.id,
                    user_id=enroll.user_id,
                    role='admin' if enroll.user_id == user_id else 'member'
                )
                db.add(member)
            
            db.commit()
        
        # Check if user is already a member
        existing_member = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == study_group.chat_group_id,
            models.GroupMember.user_id == user_id
        ).first()
        
        if not existing_member:
            # Add user as member
            member = models.GroupMember(
                group_id=study_group.chat_group_id,
                user_id=user_id,
                role='member'
            )
            db.add(member)
            db.commit()
        
        # Get group details
        chat_group = study_group.chat_group
        member_count = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == chat_group.id
        ).count()
        
        return {
            "group_id": chat_group.id,
            "name": chat_group.name,
            "description": chat_group.description,
            "member_count": member_count,
            "created_at": chat_group.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CHAT ENDPOINTS FOR COURSE GROUPS ====================

@router.get("/groups/{group_id}/info")
async def get_group_info(
    group_id: int,
    db: Session = Depends(get_database)
):
    """Get group information"""
    group = db.query(models.ChatGroup).filter(
        models.ChatGroup.id == group_id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    member_count = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).count()
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "member_count": member_count,
        "created_at": group.created_at.isoformat()
    }


@router.get("/groups/{group_id}/messages")
async def get_group_messages(
    group_id: int,
    db: Session = Depends(get_database)
):
    """Get all messages in a group"""
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.group_id == group_id
    ).order_by(models.ChatMessage.created_at).all()
    
    return [
        {
            "id": msg.id,
            "message": msg.message,
            "message_type": msg.message_type,
            "sender": {
                "id": msg.sender.id,
                "full_name": msg.sender.full_name,
                "email": msg.sender.email
            },
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ]


@router.post("/groups/{group_id}/messages")
async def send_message(
    group_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_database)
):
    """Send a message to group"""
    # Check if user is member
    member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == message_data.sender_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    message = models.ChatMessage(
        group_id=group_id,
        sender_id=message_data.sender_id,
        message=message_data.message,
        message_type=message_data.message_type
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"message": "Message sent", "id": message.id}


@router.get("/groups/{group_id}/members")
async def get_group_members(
    group_id: int,
    db: Session = Depends(get_database)
):
    """Get all members of a group"""
    members = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id
    ).all()
    
    return [
        {
            "user_id": member.user_id,
            "role": member.role,
            "joined_at": member.joined_at.isoformat(),
            "user": {
                "id": member.user.id,
                "full_name": member.user.full_name,
                "email": member.user.email,
                "department": member.user.department,
                "year": member.user.year
            }
        }
        for member in members
    ]