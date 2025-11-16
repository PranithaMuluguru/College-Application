# club_routes.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
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
    priority: str = "normal"  # low, normal, high

# Helper function
def is_club_head(user_id: int, club_id: int, db: Session) -> bool:
    club = db.query(models.Club).filter(
        models.Club.id == club_id,
        models.Club.club_head_id == user_id
    ).first()
    return club is not None

# ==================== PUBLIC ENDPOINTS ====================

@router.get("/")
async def get_all_clubs(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_database)
):
    """Get all active clubs with optional filtering"""
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
            "upcoming_events": upcoming_events,
            "created_at": club.created_at.isoformat()
        })
    
    return result

@router.get("/trending")
async def get_trending_clubs(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_database)
):
    """Get trending clubs based on recent activity"""
    # Get clubs with most recent events and follower growth
    query = db.query(models.Club).filter(
        models.Club.is_active == True
    ).join(models.ClubEvent).filter(
        models.ClubEvent.event_date >= datetime.utcnow() - timedelta(days=30)
    ).group_by(models.Club.id).order_by(
        func.count(models.ClubEvent.id).desc()
    ).limit(limit)
    
    clubs = query.all()
    
    result = []
    for club in clubs:
        follower_count = db.query(models.ClubFollower).filter(
            models.ClubFollower.club_id == club.id
        ).count()
        
        recent_events = db.query(models.ClubEvent).filter(
            models.ClubEvent.club_id == club.id,
            models.ClubEvent.event_date >= datetime.utcnow()
        ).count()
        
        result.append({
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "follower_count": follower_count,
            "upcoming_events": recent_events,
            "logo_url": club.logo_url
        })
    
    return result

@router.get("/upcoming-events")
async def get_upcoming_events(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database)
):
    """Get all upcoming events across clubs"""
    events = db.query(models.ClubEvent).join(models.Club).filter(
        models.ClubEvent.event_date >= datetime.utcnow(),
        models.Club.is_active == True
    ).order_by(
        models.ClubEvent.event_date.asc()
    ).limit(limit).all()
    
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
            "description": event.description[:100] + "...",
            "event_date": event.event_date.isoformat(),
            "location": event.location,
            "club_name": event.club.name,
            "club_id": event.club_id,
            "registration_count": registration_count,
            "max_participants": event.max_participants,
            "like_count": like_count,
            "image_url": event.image_url,
            "category": event.club.category
        })
    
    return result

@router.get("/recent-announcements")
async def get_recent_announcements(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_database)
):
    """Get recent announcements from all clubs"""
    announcements = db.query(models.ClubAnnouncement).join(models.Club).filter(
        models.Club.is_active == True
    ).order_by(
        models.ClubAnnouncement.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for ann in announcements:
        result.append({
            "id": ann.id,
            "title": ann.title,
            "content": ann.content[:100] + "...",
            "priority": ann.priority,
            "club_name": ann.club.name,
            "club_id": ann.club_id,
            "created_at": ann.created_at.isoformat()
        })
    
    return result

@router.get("/{club_id}")
async def get_club_details(
    club_id: int,
    db: Session = Depends(get_database)
):
    """Get detailed information about a specific club"""
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
    
    # Get upcoming events
    upcoming_events = db.query(models.ClubEvent).filter(
        models.ClubEvent.club_id == club.id,
        models.ClubEvent.event_date >= datetime.utcnow(),
        models.ClubEvent.status == "scheduled"
    ).order_by(models.ClubEvent.event_date).limit(5).all()
    
    return {
        "id": club.id,
        "name": club.name,
        "category": club.category,
        "description": club.description,
        "logo_url": club.logo_url,
        "cover_url": club.cover_url,
        "follower_count": follower_count,
        "club_head": {
            "name": head.full_name,
            "email": head.email
        } if head else None,
        "upcoming_events": [{
            "id": event.id,
            "title": event.title,
            "date": event.event_date.isoformat(),
            "location": event.location
        } for event in upcoming_events],
        "created_at": club.created_at.isoformat()
    }

@router.get("/{club_id}/events")
async def get_club_events(
    club_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_database)
):
    """Get all events for a club"""
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
            "created_at": event.created_at.isoformat()
        })
    
    return result

@router.get("/{club_id}/announcements")
async def get_club_announcements(
    club_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_database)
):
    """Get club announcements"""
    announcements = db.query(models.ClubAnnouncement).filter(
        models.ClubAnnouncement.club_id == club_id
    ).order_by(
        models.ClubAnnouncement.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [{
        "id": ann.id,
        "title": ann.title,
        "content": ann.content,
        "priority": ann.priority,
        "created_at": ann.created_at.isoformat()
    } for ann in announcements]

# ==================== USER ENDPOINTS ====================

@router.post("/{club_id}/follow")
async def follow_club(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Follow a club"""
    # Check if club exists
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Check if already following
    existing = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    
    # Create follow
    follow = models.ClubFollower(
        club_id=club_id,
        user_id=user.id
    )
    db.add(follow)
    db.commit()
    
    return {"message": "Successfully followed club"}

@router.delete("/{club_id}/follow")
async def unfollow_club(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Unfollow a club"""
    follow = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this club")
    
    db.delete(follow)
    db.commit()
    
    return {"message": "Successfully unfollowed club"}

@router.get("/{club_id}/is-following")
async def check_following_status(
    club_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Check if user is following a club"""
    follow = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club_id,
        models.ClubFollower.user_id == user.id
    ).first()
    
    return {"is_following": follow is not None}

@router.post("/events/{event_id}/register")
async def register_for_event(
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Register for an event"""
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
async def like_event(
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Like an event"""
    # Check if already liked
    existing = db.query(models.EventLike).filter(
        models.EventLike.event_id == event_id,
        models.EventLike.user_id == user.id
    ).first()
    
    if existing:
        # Unlike
        db.delete(existing)
        db.commit()
        return {"message": "Event unliked"}
    
    # Like
    like = models.EventLike(
        event_id=event_id,
        user_id=user.id
    )
    db.add(like)
    db.commit()
    
    return {"message": "Event liked"}

# ==================== CLUB HEAD ENDPOINTS ====================

@router.post("/{club_id}/events")
async def create_event(
    club_id: int,
    event: EventCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create a new event (Club Head only)"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_event = models.ClubEvent(
        club_id=club_id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        location=event.location,
        registration_required=event.registration_required,
        max_participants=event.max_participants,
        image_url=event.image_url
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return {
        "message": "Event created successfully",
        "event_id": new_event.id
    }

@router.put("/{club_id}/events/{event_id}")
async def update_event(
    club_id: int,
    event_id: int,
    event_update: EventUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update an event (Club Head only)"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event = db.query(models.ClubEvent).filter(
        models.ClubEvent.id == event_id,
        models.ClubEvent.club_id == club_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields
    for field, value in event_update.dict(exclude_unset=True).items():
        setattr(event, field, value)
    
    db.commit()
    
    return {"message": "Event updated successfully"}

@router.delete("/{club_id}/events/{event_id}")
async def delete_event(
    club_id: int,
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete an event (Club Head only)"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event = db.query(models.ClubEvent).filter(
        models.ClubEvent.id == event_id,
        models.ClubEvent.club_id == club_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}

@router.post("/{club_id}/announcements")
async def create_announcement(
    club_id: int,
    announcement: AnnouncementCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create announcement (Club Head only)"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_announcement = models.ClubAnnouncement(
        club_id=club_id,
        title=announcement.title,
        content=announcement.content,
        priority=announcement.priority
    )
    
    db.add(new_announcement)
    db.commit()
    
    return {"message": "Announcement created successfully"}

@router.get("/{club_id}/registrations")
async def get_event_registrations(
    club_id: int,
    event_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get event registrations (Club Head only)"""
    if not is_club_head(user.id, club_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    registrations = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id
    ).all()
    
    result = []
    for reg in registrations:
        user_data = db.query(models.User).filter(
            models.User.id == reg.user_id
        ).first()
        
        if user_data:
            result.append({
                "id": reg.id,
                "user": {
                    "name": user_data.full_name,
                    "email": user_data.email,
                    "department": user_data.department,
                    "year": user_data.year
                },
                "registered_at": reg.created_at.isoformat()
            })
    
    return result

# # ==================== ADMIN ENDPOINTS ====================

# @router.post("/")
# async def create_club(
#     club: ClubCreate,
#     token: str = Depends(get_admin_token),
#     db: Session = Depends(get_database)
# ):
#     """Create new club (Admin only)"""
#     verify_admin_token(token, db)
    
#     # Find club head user
#     head = db.query(models.User).filter(
#         models.User.email == club.club_head_email
#     ).first()
    
#     if not head:
#         raise HTTPException(status_code=404, detail="Club head user not found")
    
#     new_club = models.Club(
#         name=club.name,
#         category=club.category,
#         description=club.description,
#         club_head_id=head.id
#     )
    
#     db.add(new_club)
#     db.commit()
#     db.refresh(new_club)
    
#     return {
#         "message": "Club created successfully",
#         "club_id": new_club.id
#     }

# @router.put("/{club_id}")
# async def update_club(
#     club_id: int,
#     club_update: ClubUpdate,
#     token: str = Depends(get_admin_token),
#     db: Session = Depends(get_database)
# ):
#     """Update club (Admin only)"""
#     verify_admin_token(token, db)
    
#     club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
#     if not club:
#         raise HTTPException(status_code=404, detail="Club not found")
    
#     for field, value in club_update.dict(exclude_unset=True).items():
#         setattr(club, field, value)
    
#     db.commit()
    
#     return {"message": "Club updated successfully"}

# @router.delete("/{club_id}")
# async def delete_club(
#     club_id: int,
#     token: str = Depends(get_admin_token),
#     db: Session = Depends(get_database)
# ):
#     """Delete club (Admin only)"""
#     verify_admin_token(token, db)
    
#     club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
#     if not club:
#         raise HTTPException(status_code=404, detail="Club not found")
    
#     club.is_active = False
#     db.commit()
    
#     return {"message": "Club deleted successfully"}