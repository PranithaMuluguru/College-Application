from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List,Optional

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(prefix="/clubs/{club_id}/members", tags=["club-members"])


@router.get("", response_model=List[schemas.ClubMemberResponse])
async def get_club_members(
    club_id: int,
    role: Optional[str] = None,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club members with roles"""
    try:
        query = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id
        )
        
        if role:
            query = query.filter(models.ClubMember.role == role)
        
        members = query.all()
        
        result = []
        for member in members:
            user = db.query(models.User).filter(
                models.User.id == member.user_id
            ).first()
            
            if user:
                result.append(schemas.ClubMemberResponse(
                    **member.__dict__,
                    user_name=user.full_name,
                    user_email=user.email
                ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch members: {str(e)}"
        )


@router.post("", response_model=schemas.ClubMemberResponse, status_code=201)
async def add_club_member(
    club_id: int,
    member: schemas.ClubMemberCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Add member to club (Club Admin only)"""
    try:
        # Check if user is club admin
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Only club admins can add members"
            )
        
        # Check if user already a member
        existing = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == member.user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="User is already a member"
            )
        
        # Add member
        new_member = models.ClubMember(
            club_id=club_id,
            **member.dict()
        )
        
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
        
        # Get user info
        user = db.query(models.User).filter(
            models.User.id == member.user_id
        ).first()
        
        return schemas.ClubMemberResponse(
            **new_member.__dict__,
            user_name=user.full_name,
            user_email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add member: {str(e)}"
        )


@router.put("/{user_id}", response_model=schemas.ClubMemberResponse)
async def update_member_role(
    club_id: int,
    user_id: int,
    member_update: schemas.ClubMemberUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update member role (Club Admin only)"""
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
                detail="Only club admins can update member roles"
            )
        
        # Get member
        member = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == user_id
        ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Update fields
        update_data = member_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(member, field, value)
        
        db.commit()
        db.refresh(member)
        
        # Get user info
        user = db.query(models.User).filter(
            models.User.id == user_id
        ).first()
        
        return schemas.ClubMemberResponse(
            **member.__dict__,
            user_name=user.full_name,
            user_email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update member: {str(e)}"
        )


@router.delete("/{user_id}", status_code=204)
async def remove_club_member(
    club_id: int,
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Remove member from club (Club Admin only)"""
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
                detail="Only club admins can remove members"
            )
        
        # Get member
        member = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == club_id,
            models.ClubMember.user_id == user_id
        ).first()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Cannot remove yourself
        if user_id == current_user.id:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove yourself from club"
            )
        
        db.delete(member)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove member: {str(e)}"
        )