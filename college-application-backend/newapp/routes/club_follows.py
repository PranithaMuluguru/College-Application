from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(prefix="/clubs", tags=["club-follows"])


@router.post("/{club_id}/follow", status_code=201)
async def follow_club(
    club_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Follow a club"""
    try:
        # Check if club exists
        club = db.query(models.Club).filter(
            models.Club.id == club_id,
            models.Club.is_active == True
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Check if already following
        existing = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id,
            models.ClubFollow.user_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Already following this club"
            )
        
        # Create follow
        follow = models.ClubFollow(
            club_id=club_id,
            user_id=current_user.id
        )
        
        # Update followers count
        club.followers_count += 1
        
        db.add(follow)
        db.commit()
        
        return {
            "message": "Successfully followed club",
            "club_id": club_id,
            "followers_count": club.followers_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to follow club: {str(e)}"
        )


@router.delete("/{club_id}/follow", status_code=200)
async def unfollow_club(
    club_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Unfollow a club"""
    try:
        # Get follow record
        follow = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id,
            models.ClubFollow.user_id == current_user.id
        ).first()
        
        if not follow:
            raise HTTPException(
                status_code=400,
                detail="Not following this club"
            )
        
        # Get club
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if club:
            club.followers_count = max(0, club.followers_count - 1)
        
        db.delete(follow)
        db.commit()
        
        return {
            "message": "Successfully unfollowed club",
            "club_id": club_id,
            "followers_count": club.followers_count if club else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to unfollow club: {str(e)}"
        )


@router.get("/{club_id}/followers")
async def get_club_followers(
    club_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club followers"""
    try:
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id
        ).offset(skip).limit(limit).all()
        
        followers = []
        for follow in follows:
            user = db.query(models.User).filter(
                models.User.id == follow.user_id
            ).first()
            
            if user:
                followers.append({
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "department": user.department,
                    "year": user.year,
                    "followed_at": follow.followed_at
                })
        
        total = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id
        ).count()
        
        return {
            "followers": followers,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch followers: {str(e)}"
        )


@router.get("/users/{user_id}/following/clubs")
async def get_user_following_clubs(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get user's followed clubs"""
    try:
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == user_id
        ).offset(skip).limit(limit).all()
        
        clubs = []
        for follow in follows:
            club = db.query(models.Club).filter(
                models.Club.id == follow.club_id
            ).first()
            
            if club:
                clubs.append({
                    "club": club,
                    "followed_at": follow.followed_at
                })
        
        total = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == user_id
        ).count()
        
        return {
            "clubs": clubs,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch followed clubs: {str(e)}"
        )


@router.get("/{club_id}/is-following")
async def check_is_following(
    club_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Check if user follows club"""
    try:
        follow = db.query(models.ClubFollow).filter(
            models.ClubFollow.club_id == club_id,
            models.ClubFollow.user_id == current_user.id
        ).first()
        
        return {
            "is_following": follow is not None,
            "club_id": club_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check follow status: {str(e)}"
        )