# admin_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from .database import get_database
from . import models

router = APIRouter(prefix="/admin", tags=["admin"])

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
    is_active: Optional[bool] = None

class ClubHeadUpdate(BaseModel):
    club_head_email: str

# Helper Functions
def get_admin_stats(db: Session):
    """Get comprehensive admin stats"""
    # Get user stats
    total_users = db.query(models.User).filter(models.User.is_active == True).count()
    
    # Get today's new users
    today = datetime.utcnow().date()
    new_users_today = db.query(models.User).filter(
        func.date(models.User.created_at) == today,
        models.User.is_active == True
    ).count()
    
    # Get club stats
    total_clubs = db.query(models.Club).filter(models.Club.is_active == True).count()
    
    # Get event stats
    total_events = db.query(models.ClubEvent).count()
    
    # Get post stats
    total_posts = db.query(models.Post).count()
    
    # Get marketplace stats
    total_marketplace_items = db.query(models.MarketplaceItem).filter(
        models.MarketplaceItem.status == 'active'
    ).count()
    
    # Get discussion stats
    total_discussions = db.query(models.Discussion).count()
    
    # Get course stats
    total_courses = db.query(models.CourseCatalog).filter(
        models.CourseCatalog.is_active == True
    ).count()
    
    # Get admin stats
    active_admins = db.query(models.AdminUser).filter(
        models.AdminUser.is_active == True
    ).count()
    
    # Get active chats (groups with recent messages)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_chats = db.query(models.ChatGroup).join(models.ChatMessage).filter(
        models.ChatMessage.created_at >= thirty_days_ago
    ).distinct().count()
    
    # Get pending follow requests
    pending_follow_requests = db.query(models.Follow).filter(
        models.Follow.status == 'pending'
    ).count()
    
    # Get recent admin activity
    recent_activity = db.query(models.AdminActivityLog).order_by(
        models.AdminActivityLog.created_at.desc()
    ).limit(10).all()
    
    activity_list = []
    for activity in recent_activity:
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.id == activity.admin_id
        ).first()
        
        if admin:
            user = db.query(models.User).filter(
                models.User.id == admin.user_id
            ).first()
            
            if user:
                activity_list.append({
                    "id": activity.id,
                    "action": activity.action,
                    "target_type": activity.target_type,
                    "target_id": activity.target_id,
                    "details": activity.details or {},
                    "created_at": activity.created_at.isoformat(),
                    "admin": {
                        "name": user.full_name,
                        "email": user.email
                    }
                })
    
    return {
        "total_users": total_users,
        "new_users_today": new_users_today,
        "totalClubs": total_clubs,
        "totalEvents": total_events,
        "total_posts": total_posts,
        "total_marketplace_items": total_marketplace_items,
        "total_discussions": total_discussions,
        "total_courses": total_courses,
        "activeAdmins": active_admins,
        "active_chats": active_chats,
        "pending_follow_requests": pending_follow_requests,
        "recentActivity": activity_list
    }

# Admin Routes
@router.get("/stats")
async def get_admin_dashboard_stats(
    db: Session = Depends(get_database)
):
    """Get admin dashboard statistics"""
    return get_admin_stats(db)

# Club Management Routes
@router.get("/clubs")
async def get_all_clubs_admin(
    db: Session = Depends(get_database)
):
    """Get all clubs (including inactive ones) for admin management"""
    
    clubs = db.query(models.Club).all()
    
    result = []
    for club in clubs:
        # Get club head info
        head = db.query(models.User).filter(
            models.User.id == club.club_head_id
        ).first()
        
        # Get follower count
        follower_count = db.query(models.ClubFollower).filter(
            models.ClubFollower.club_id == club.id
        ).count()
        
        # Get event count
        event_count = db.query(models.ClubEvent).filter(
            models.ClubEvent.club_id == club.id
        ).count()
        
        result.append({
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "description": club.description,
            "logo_url": club.logo_url,
            "cover_url": club.cover_url,
            "is_active": club.is_active,
            "follower_count": follower_count,
            "event_count": event_count,
            "created_at": club.created_at.isoformat(),
            "club_head": {
                "id": head.id,
                "name": head.full_name,
                "email": head.email
            } if head else None
        })
    
    return result

@router.get("/clubs/{club_id}")
async def get_club_details_admin(
    club_id: int,
    db: Session = Depends(get_database)
):
    """Get detailed club information for admin"""
    
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Get club head info
    head = db.query(models.User).filter(
        models.User.id == club.club_head_id
    ).first()
    
    # Get followers
    followers = db.query(models.ClubFollower).filter(
        models.ClubFollower.club_id == club.id
    ).all()
    
    follower_list = []
    for follower in followers:
        user = db.query(models.User).filter(
            models.User.id == follower.user_id
        ).first()
        
        if user:
            follower_list.append({
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "department": user.department,
                "year": user.year,
                "joined_at": follower.created_at.isoformat()
            })
    
    # Get events
    events = db.query(models.ClubEvent).filter(
        models.ClubEvent.club_id == club.id
    ).order_by(models.ClubEvent.created_at.desc()).all()
    
    event_list = []
    for event in events:
        registration_count = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event.id
        ).count()
        
        like_count = db.query(models.EventLike).filter(
            models.EventLike.event_id == event.id
        ).count()
        
        event_list.append({
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
    
    return {
        "id": club.id,
        "name": club.name,
        "category": club.category,
        "description": club.description,
        "logo_url": club.logo_url,
        "cover_url": club.cover_url,
        "is_active": club.is_active,
        "created_at": club.created_at.isoformat(),
        "updated_at": club.updated_at.isoformat(),
        "club_head": {
            "id": head.id,
            "name": head.full_name,
            "email": head.email,
            "department": head.department,
            "year": head.year
        } if head else None,
        "followers": follower_list,
        "events": event_list
    }

@router.post("/clubs")
async def create_club_admin(
    club: ClubCreate,
    db: Session = Depends(get_database)
):
    """Create new club (Admin only)"""
    try:
        # Check if club exists
        existing_club = db.query(models.Club).filter(
            models.Club.name == club.name
        ).first()
        
        if existing_club:
            raise HTTPException(
                status_code=400,
                detail="Club with this name already exists"
            )
        
        # Find club head
        head = db.query(models.User).filter(
            models.User.email == club.club_head_email
        ).first()
        
        if not head:
            raise HTTPException(
                status_code=404,
                detail=f"User with email {club.club_head_email} not found"
            )
        
        # Create club
        new_club = models.Club(
            name=club.name,
            category=club.category,
            description=club.description,
            club_head_id=head.id,
            is_active=True
        )
        
        db.add(new_club)
        db.commit()
        db.refresh(new_club)
        
        return {
            "message": "Club created successfully",
            "club": {
                "id": new_club.id,
                "name": new_club.name,
                "category": new_club.category,
                "description": new_club.description,
                "club_head": {
                    "id": head.id,
                    "name": head.full_name,
                    "email": head.email
                }
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/clubs/{club_id}")
async def update_club_admin(
    club_id: int,
    club_update: ClubUpdate,
    db: Session = Depends(get_database)
):
    """Update club information (Admin only)"""
    
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Update fields
    for field, value in club_update.dict(exclude_unset=True).items():
        setattr(club, field, value)
    
    db.commit()
    
    return {"message": "Club updated successfully"}

@router.put("/clubs/{club_id}/head")
async def update_club_head_admin(
    club_id: int,
    head_update: ClubHeadUpdate,
    db: Session = Depends(get_database)
):
    """Update club head (Admin only)"""
    
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Find new club head user
    new_head = db.query(models.User).filter(
        models.User.email == head_update.club_head_email
    ).first()
    
    if not new_head:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update club head
    club.club_head_id = new_head.id
    
    db.commit()
    
    return {"message": "Club head updated successfully"}

@router.delete("/clubs/{club_id}")
async def delete_club_admin(
    club_id: int,
    db: Session = Depends(get_database)
):
    """Delete club (Admin only)"""
    
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Soft delete
    club.is_active = False
    
    db.commit()
    
    return {"message": "Club deleted successfully"}

@router.post("/clubs/{club_id}/restore")
async def restore_club_admin(
    club_id: int,
    db: Session = Depends(get_database)
):
    """Restore deleted club (Admin only)"""
    
    club = db.query(models.Club).filter(models.Club.id == club_id).first()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Restore
    club.is_active = True
    
    db.commit()
    
    return {"message": "Club restored successfully"}