from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(tags=["club-achievements"])


@router.post("/clubs/{club_id}/achievements", response_model=schemas.ClubAchievementResponse, status_code=201)
async def add_achievement(
    club_id: int,
    achievement: schemas.ClubAchievementCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Add achievement (Club Admin only)"""
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
                detail="Only club admins can add achievements"
            )
        
        new_achievement = models.ClubAchievement(
            club_id=club_id,
            **achievement.dict()
        )
        
        db.add(new_achievement)
        db.commit()
        db.refresh(new_achievement)
        
        return new_achievement
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add achievement: {str(e)}"
        )


@router.get("/clubs/{club_id}/achievements", response_model=List[schemas.ClubAchievementResponse])
async def get_club_achievements(
    club_id: int,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club achievements"""
    try:
        achievements = db.query(models.ClubAchievement).filter(
            models.ClubAchievement.club_id == club_id
        ).order_by(
            models.ClubAchievement.achieved_date.desc()
        ).all()
        
        return achievements
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch achievements: {str(e)}"
        )


@router.put("/achievements/{achievement_id}", response_model=schemas.ClubAchievementResponse)
async def update_achievement(
    achievement_id: int,
    achievement_update: schemas.ClubAchievementCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update achievement"""
    try:
        achievement = db.query(models.ClubAchievement).filter(
            models.ClubAchievement.id == achievement_id
        ).first()
        
        if not achievement:
            raise HTTPException(
                status_code=404,
                detail="Achievement not found"
            )
        
        # Check authorization
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == achievement.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to update this achievement"
            )
        
        # Update fields
        for field, value in achievement_update.dict().items():
            setattr(achievement, field, value)
        
        db.commit()
        db.refresh(achievement)
        
        return achievement
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update achievement: {str(e)}"
        )


@router.delete("/achievements/{achievement_id}", status_code=204)
async def delete_achievement(
    achievement_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete achievement"""
    try:
        achievement = db.query(models.ClubAchievement).filter(
            models.ClubAchievement.id == achievement_id
        ).first()
        
        if not achievement:
            raise HTTPException(
                status_code=404,
                detail="Achievement not found"
            )
        
        # Check authorization
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == achievement.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this achievement"
            )
        
        db.delete(achievement)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete achievement: {str(e)}"
        )