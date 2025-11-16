from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(tags=["club-announcements"])


@router.post("/clubs/{club_id}/announcements", response_model=schemas.ClubAnnouncementResponse, status_code=201)
async def create_announcement(
    club_id: int,
    announcement: schemas.ClubAnnouncementCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create announcement (Club Admin only)"""
    try:
        # Check authorization
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Only club admins can create announcements"
            )
        
        # Get club
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Create announcement
        new_announcement = models.ClubAnnouncement(
            club_id=club_id,
            created_by=current_user.id,
            **announcement.dict()
        )
        
        db.add(new_announcement)
        db.commit()
        db.refresh(new_announcement)
        
        return schemas.ClubAnnouncementResponse(
            **new_announcement.__dict__,
            club_name=club.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create announcement: {str(e)}"
        )


@router.get("/clubs/{club_id}/announcements", response_model=List[schemas.ClubAnnouncementResponse])
async def get_club_announcements(
    club_id: int,
    priority: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club announcements"""
    try:
        query = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.club_id == club_id
        )
        
        if priority:
            query = query.filter(models.ClubAnnouncement.priority == priority)
        
        # Filter out expired announcements
        query = query.filter(
            or_(
                models.ClubAnnouncement.expires_at == None,
                models.ClubAnnouncement.expires_at > datetime.utcnow()
            )
        )
        
        announcements = query.order_by(
            models.ClubAnnouncement.is_pinned.desc(),
            models.ClubAnnouncement.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        result = []
        for ann in announcements:
            result.append(schemas.ClubAnnouncementResponse(
                **ann.__dict__,
                club_name=club.name if club else ""
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch announcements: {str(e)}"
        )


@router.get("/announcements/feed", response_model=List[schemas.ClubAnnouncementResponse])
async def get_announcements_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get announcements from followed clubs"""
    try:
        # Get followed clubs
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == current_user.id
        ).all()
        
        club_ids = [follow.club_id for follow in follows]
        
        if not club_ids:
            return []
        
        # Get announcements from followed clubs
        announcements = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.club_id.in_(club_ids),
            or_(
                models.ClubAnnouncement.expires_at == None,
                models.ClubAnnouncement.expires_at > datetime.utcnow()
            )
        ).order_by(
            models.ClubAnnouncement.is_pinned.desc(),
            models.ClubAnnouncement.priority.desc(),
            models.ClubAnnouncement.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        result = []
        for ann in announcements:
            club = db.query(models.Club).filter(
                models.Club.id == ann.club_id
            ).first()
            
            result.append(schemas.ClubAnnouncementResponse(
                **ann.__dict__,
                club_name=club.name if club else ""
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch announcements feed: {str(e)}"
        )


@router.put("/announcements/{announcement_id}", response_model=schemas.ClubAnnouncementResponse)
async def update_announcement(
    announcement_id: int,
    announcement_update: schemas.ClubAnnouncementUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update announcement (Creator only)"""
    try:
        announcement = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.id == announcement_id
        ).first()
        
        if not announcement:
            raise HTTPException(
                status_code=404,
                detail="Announcement not found"
            )
        
        # Check authorization
        if announcement.created_by != current_user.id:
            # Check if club admin
            is_admin = db.query(models.ClubMember).filter(
                models.ClubMember.club_id == announcement.club_id,
                models.ClubMember.user_id == current_user.id,
                models.ClubMember.is_admin == True
            ).first()
            
            if not is_admin:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to update this announcement"
                )
        
        # Update fields
        update_data = announcement_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(announcement, field, value)
        
        db.commit()
        db.refresh(announcement)
        
        club = db.query(models.Club).filter(
            models.Club.id == announcement.club_id
        ).first()
        
        return schemas.ClubAnnouncementResponse(
            **announcement.__dict__,
            club_name=club.name if club else ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update announcement: {str(e)}"
        )


@router.delete("/announcements/{announcement_id}", status_code=204)
async def delete_announcement(
    announcement_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete announcement (Creator only)"""
    try:
        announcement = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.id == announcement_id
        ).first()
        
        if not announcement:
            raise HTTPException(
                status_code=404,
                detail="Announcement not found"
            )
        
        # Check authorization
        if announcement.created_by != current_user.id:
            is_admin = db.query(models.ClubMember).filter(
                models.ClubMember.club_id == announcement.club_id,
                models.ClubMember.user_id == current_user.id,
                models.ClubMember.is_admin == True
            ).first()
            
            if not is_admin:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to delete this announcement"
                )
        
        db.delete(announcement)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete announcement: {str(e)}"
        )


@router.put("/announcements/{announcement_id}/pin")
async def toggle_pin_announcement(
    announcement_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Pin/unpin announcement (Club Admin)"""
    try:
        announcement = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.id == announcement_id
        ).first()
        
        if not announcement:
            raise HTTPException(
                status_code=404,
                detail="Announcement not found"
            )
        
        # Check authorization
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == announcement.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Only club admins can pin announcements"
            )
        
        # Toggle pin
        announcement.is_pinned = not announcement.is_pinned
        
        db.commit()
        
        return {
            "message": f"Announcement {'pinned' if announcement.is_pinned else 'unpinned'}",
            "announcement_id": announcement_id,
            "is_pinned": announcement.is_pinned
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to pin announcement: {str(e)}"
        )