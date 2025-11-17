# club_routes.py (Fixed version)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from .database import get_database
from .admin_auth import get_current_user, verify_admin_token, get_admin_token
from . import models

router = APIRouter(prefix="/clubs", tags=["clubs"])

# Pydantic Models
class ClubCreate(BaseModel):
    name: str
    category: str
    description: str
    club_head_email: str

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None

class EventCreate(BaseModel):
    title: str
    description: str
    event_date: datetime
    location: str
    registration_required: bool = False
    max_participants: Optional[int] = None
    image_url: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"

# Helper function
def is_club_head(user_id: int, club_id: int, db: Session) -> bool:
    club = db.query(models.Club).filter(
        models.Club.id == club_id,
        models.Club.club_head_id == user_id
    ).first()
    return club is not None

# ==================== PUBLIC ENDPOINTS (NO TOKEN REQUIRED) ====================

@router.get("/")
async def get_all_clubs(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """Get all active clubs - PUBLIC"""
    query = db.query(models.Club).filter(models.Club.is_active == True)
    
    if category:
        query = query.filter(models.Club.category == category)
    
    if search:
        query = query.filter(models.Club.name.contains(search))
    
    clubs = query.all()
    
    result = []
    for club in clubs:
        follower_count = db.query(models.ClubFollower).filter(
            models.ClubFollower.club_id == club.id
        ).count()
        
        upcoming_events = db.query(models.ClubEvent).filter(
            models.ClubEvent.club_id == club.id,
            models.ClubEvent.event_date >= datetime.utcnow(),
            models.ClubEvent.status == "scheduled"
        ).count()
        
        result.append({
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "description": club.description,
            "logo_url": club.logo_url,
            "cover_url": club.cover_url,
            "follower_count": follower_count,
            "event_count": upcoming_events,
            "created_at": club.created_at.isoformat() if club.created_at else None
        })
    
    return result

@router.get("/categories")
async def get_categories(db: Session = Depends(get_database)):
    """Get all club categories - PUBLIC"""
    categories = db.query(models.Club.category).filter(
        models.Club.is_active == True
    ).distinct().all()
    
    return [{"id": cat[0], "name": cat[0]} for cat in categories]

@router.get("/{club_id}")
async def get_club_details(
    club_id: int,
    db: Session = Depends(get_database)
):
    """Get detailed club information - PUBLIC"""
    club = db.query(models.Club).filter(
        models.Club.id == club_id,
        models.Club.is_active == True
    ).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Get club head info
    head = db.query(models.User).filter(
        models.User.id == club.club_head_id
    ).first()
    
    # Get follower count
    follower_count = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club.id
    ).count()
    
    # Get events
    events = db.query(models.ClubEvent).filter(
        models.ClubEvent.club_id == club.id,
        models.ClubEvent.event_date >= datetime.utcnow()
    ).order_by(models.ClubEvent.event_date).limit(10).all()
    
    # Get announcements
    announcements = db.query(models.ClubAnnouncement).filter(
        models.ClubAnnouncement.club_id == club.id
    ).order_by(models.ClubAnnouncement.created_at.desc()).limit(5).all()
    
    return {
        "id": club.id,
        "name": club.name,
        "category": club.category,
        "description": club.description,
        "logo_url": club.logo_url,
        "cover_url": club.cover_url,
        "follower_count": follower_count,
        "is_following": False,  # Default for public view
        "club_head": {
            "name": head.full_name,
            "email": head.email
        } if head else None,
        "events": [{
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "location": event.location,
            "status": event.status,
            "registration_count": db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id
            ).count(),
            "max_participants": event.max_participants,
            "image_url": event.image_url
        } for event in events],
        "announcements": [{
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "priority": ann.priority,
            "created_at": ann.created_at.isoformat()
        } for ann in announcements],
        "created_at": club.created_at.isoformat() if club.created_at else None
    }

@router.get("/{club_id}/events")
async def get_club_events(
    club_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_database)
):
    """Get club events - PUBLIC"""
    query = db.query(models.ClubEvent).filter(
        models.ClubEvent.club_id == club_id
    )
    
    if status:
        query = query.filter(models.ClubEvent.status == status)
    
    events = query.order_by(
        models.ClubEvent.event_date.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for event in events:
        registration_count = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event.id
        ).count()
        
        like_count = db.query(models.EventLike).filter(
            models.EventLike.event_id == event.id
        ).count()
        
        result.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "location": event.location,
            "status": event.status,
            "registration_count": registration_count,
            "max_participants": event.max_participants,
            "like_count": like_count,
            "image_url": event.image_url,
            "created_at": event.created_at.isoformat() if event.created_at else None
        })
    
    return result

@router.get("/events/{event_id}")
async def get_event_details(
    event_id: int,
    db: Session = Depends(get_database)
):
    """Get event details - PUBLIC"""
    event = db.query(models.ClubEvent).filter(
        models.ClubEvent.id == event_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    registration_count = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event.id
    ).count()
    
    like_count = db.query(models.EventLike).filter(
        models.EventLike.event_id == event.id
    ).count()
    
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_date": event.event_date.isoformat(),
        "location": event.location,
        "status": event.status,
        "registration_required": event.registration_required,
        "registration_count": registration_count,
        "max_participants": event.max_participants,
        "like_count": like_count,
        "image_url": event.image_url,
        "club": {
            "id": event.club.id,
            "name": event.club.name,
            "category": event.club.category
        },
        "created_at": event.created_at.isoformat() if event.created_at else None
    }

# ==================== USER ENDPOINTS (TOKEN REQUIRED) ====================

@router.post("/{club_id}/follow")
async def follow_club(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Follow a club - REQUIRES AUTH"""
    logger.info(f"=== FOLLOW REQUEST RECEIVED ===")
    logger.info(f"Club ID: {club_id}")
    logger.info(f"User ID: {user.id}")
    logger.info(f"User Email: {user.email}")
    
    club = db.query(models.Club).filter(
        models.Club.id == club_id,
        models.Club.is_active == True
    ).first()
    
    if not club:
        logger.warning(f"Club not found with id: {club_id}")
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Check if already following
    existing = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    if existing:
        logger.warning(f"User {user.id} already following club {club_id}")
        raise HTTPException(status_code=400, detail="Already following this club")
    
    # Create follow
    follow = models.ClubFollower(
        club_id=club_id,
        user_id=user.id
    )
    db.add(follow)
    db.commit()
    
    # Get updated follower count
    follower_count = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id
    ).count()
    
    logger.info(f"✅ User {user.id} successfully followed club {club_id}. Follower count: {follower_count}")
    
    return {"message": "Successfully followed club", "follower_count": follower_count}

@router.post("/{club_id}/unfollow")
async def unfollow_club(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Unfollow a club - REQUIRES AUTH"""
    logger.info(f"Unfollow request received for club_id: {club_id} by user_id: {user.id}")
    
    follow = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    if not follow:
        logger.warning(f"User {user.id} not following club {club_id}")
        raise HTTPException(status_code=404, detail="Not following this club")
    
    db.delete(follow)
    db.commit()
    
    # Get updated follower count
    follower_count = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id
    ).count()
    
    logger.info(f"User {user.id} successfully unfollowed club {club_id}. New follower count: {follower_count}")
    
    return {"message": "Successfully unfollowed club", "follower_count": follower_count}

@router.get("/{club_id}/is-following")
async def check_following_status(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Check if user follows a club - REQUIRES AUTH"""
    follow = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    return {"is_following": follow is not None}

@router.get("/user/following")
async def get_user_following(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get clubs user is following - REQUIRES AUTH"""
    follows = db.query(models.ClubFollower).filter(
        models.ClubFollower.user_id == user.id
    ).all()
    
    club_ids = [f.club_id for f in follows]
    
    clubs = db.query(models.Club).filter(
        models.Club.id.in_(club_ids),
        models.Club.is_active == True
    ).all()
    
    return [{
        "id": club.id,
        "name": club.name,
        "category": club.category,
        "logo_url": club.logo_url
    } for club in clubs]

@router.post("/events/{event_id}/register")
async def register_for_event(
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Register for event - REQUIRES AUTH"""
    event = db.query(models.ClubEvent).filter(
        models.ClubEvent.id == event_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.status != "scheduled":
        raise HTTPException(status_code=400, detail="Event is not open for registration")
    
    # Check if already registered
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id,
        models.EventRegistration.user_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    # Check capacity
    if event.max_participants:
        count = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id
        ).count()
        
        if count >= event.max_participants:
            raise HTTPException(status_code=400, detail="Event is full")
    
    # Create registration
    registration = models.EventRegistration(
        event_id=event_id,
        user_id=user.id
    )
    db.add(registration)
    db.commit()
    
    return {"message": "Successfully registered for event"}

@router.post("/events/{event_id}/like")
async def toggle_event_like(
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Toggle event like - REQUIRES AUTH"""
    existing = db.query(models.EventLike).filter(
        models.EventLike.event_id == event_id,
        models.EventLike.user_id == user.id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Event unliked", "liked": False}
    
    like = models.EventLike(
        event_id=event_id,
        user_id=user.id
    )
    db.add(like)
    db.commit()
    
    return {"message": "Event liked", "liked": True}

@router.get("/user/my-club")
async def get_my_club(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get club managed by current user - REQUIRES AUTH"""
    club = db.query(models.Club).filter(
        models.Club.club_head_id == user.id,
        models.Club.is_active == True
    ).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="You are not managing any club")
    
    return {
        "id": club.id,
        "name": club.name,
        "category": club.category
    }

# ==================== CLUB HEAD ENDPOINTS ====================

@router.post("/{club_id}/events")
async def create_event(
    club_id: int,
    event: EventCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create event - CLUB HEAD ONLY"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Only club head can create events")
    
    new_event = models.ClubEvent(
        club_id=club_id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        location=event.location,
        registration_required=event.registration_required,
        max_participants=event.max_participants,
        image_url=event.image_url,
        status="scheduled"
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return {
        "message": "Event created successfully",
        "event_id": new_event.id
    }

@router.post("/{club_id}/announcements")
async def create_announcement(
    club_id: int,
    announcement: AnnouncementCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create announcement - CLUB HEAD ONLY"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Only club head can create announcements")
    
    new_announcement = models.ClubAnnouncement(
        club_id=club_id,
        title=announcement.title,
        content=announcement.content,
        priority=announcement.priority
    )
    
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    
    return {
        "message": "Announcement created successfully",
        "announcement_id": new_announcement.id
    }