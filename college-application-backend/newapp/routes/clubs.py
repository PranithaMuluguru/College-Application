from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(prefix="/clubs", tags=["clubs"])


def check_club_admin(
    club_id: int, 
    user_id: int, 
    db: Session
) -> bool:
    """Check if user is club admin"""
    member = db.query(models.ClubMember).filter(
        models.ClubMember.club_id == club_id,
        models.ClubMember.user_id == user_id,
        models.ClubMember.is_admin == True
    ).first()
    return member is not None


@router.post("", response_model=schemas.ClubResponse, status_code=201)
async def create_club(
    club: schemas.ClubCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create new club (Admin/Secretary only)"""
    try:
        # Check if user is admin
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.user_id == current_user.id,
            models.AdminUser.is_active == True
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=403,
                detail="Only admins can create clubs"
            )
        
        # Check if club name exists
        existing = db.query(models.Club).filter(
            models.Club.name == club.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Club name already exists"
            )
        
        # Create club
        new_club = models.Club(
            **club.dict(),
            created_by=current_user.id
        )
        
        db.add(new_club)
        db.commit()
        db.refresh(new_club)
        
        return new_club
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create club: {str(e)}"
        )


@router.get("", response_model=List[schemas.ClubResponse])
async def get_clubs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    category: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get all clubs with filters and pagination"""
    try:
        query = db.query(models.Club)
        
        # Apply filters
        if category:
            query = query.filter(models.Club.category == category)
        
        if department:
            query = query.filter(models.Club.department == department)
        
        if is_active is not None:
            query = query.filter(models.Club.is_active == is_active)
        
        if search:
            query = query.filter(
                or_(
                    models.Club.name.ilike(f"%{search}%"),
                    models.Club.description.ilike(f"%{search}%")
                )
            )
        
        # Get clubs with pagination
        clubs = query.order_by(
            models.Club.followers_count.desc()
        ).offset(skip).limit(limit).all()
        
        return clubs
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch clubs: {str(e)}"
        )


@router.get("/{club_id}", response_model=schemas.ClubDetailResponse)
async def get_club_detail(
    club_id: int,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club details with full information"""
    try:
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Get additional counts
        members_count = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id
        ).count()
        
        events_count = db.query(models.ClubEvent).filter(
            models.ClubEvent.club_id == club_id
        ).count()
        
        announcements_count = db.query(models.ClubAnnouncement).filter(
            models.ClubAnnouncement.club_id == club_id
        ).count()
        
        # Check if user follows club
        is_following = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id,
            models.ClubFollow.user_id == current_user.id
        ).first() is not None
        
        # Get user role in club
        member = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == current_user.id
        ).first()
        
        user_role = member.role if member else None
        
        # Build response
        response = schemas.ClubDetailResponse(
            **club.__dict__,
            members_count=members_count,
            events_count=events_count,
            announcements_count=announcements_count,
            is_following=is_following,
            user_role=user_role
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch club: {str(e)}"
        )


@router.put("/{club_id}", response_model=schemas.ClubResponse)
async def update_club(
    club_id: int,
    club_update: schemas.ClubUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update club information (Club Admin only)"""
    try:
        # Check if club exists
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check authorization
        if not check_club_admin(club_id, current_user.id, db):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to update this club"
            )
        
        # Update fields
        update_data = club_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(club, field, value)
        
        club.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(club)
        
        return club
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update club: {str(e)}"
        )


@router.delete("/{club_id}", status_code=204)
async def delete_club(
    club_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete club (Admin only)"""
    try:
        # Check if user is admin
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.user_id == current_user.id,
            models.AdminUser.is_active == True
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=403,
                detail="Only admins can delete clubs"
            )
        
        # Get club
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Delete club (cascade will handle related records)
        db.delete(club)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete club: {str(e)}"
        )


@router.get("/categories/{category}", response_model=List[schemas.ClubResponse])
async def get_clubs_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get clubs by category"""
    try:
        clubs = db.query(models.Club).filter(
            models.Club.category == category,
            models.Club.is_active == True
        ).order_by(
            models.Club.followers_count.desc()
        ).offset(skip).limit(limit).all()
        
        return clubs
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch clubs: {str(e)}"
        )


@router.get("/user/{user_id}/clubs")
async def get_user_clubs(
    user_id: int,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get user's clubs and memberships"""
    try:
        # Get clubs user is member of
        memberships = db.query(models.ClubMember).filter(
            models.ClubMember.user_id == user_id
        ).all()
        
        member_clubs = []
        for membership in memberships:
            club = db.query(models.Club).filter(
                models.Club.id == membership.club_id
            ).first()
            
            if club:
                member_clubs.append({
                    "club": club,
                    "role": membership.role,
                    "is_admin": membership.is_admin,
                    "joined_at": membership.joined_at
                })
        
        # Get clubs user follows
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == user_id
        ).all()
        
        followed_clubs = []
        for follow in follows:
            club = db.query(models.Club).filter(
                models.Club.id == follow.club_id
            ).first()
            
            if club:
                followed_clubs.append({
                    "club": club,
                    "followed_at": follow.followed_at
                })
        
        return {
            "memberships": member_clubs,
            "followed_clubs": followed_clubs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user clubs: {str(e)}"
        )