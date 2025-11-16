from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from datetime import datetime

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(tags=["club-photos"])

UPLOAD_DIR = "uploads/clubs/photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/clubs/{club_id}/photos", response_model=schemas.ClubPhotoResponse, status_code=201)
async def upload_club_photo(
    club_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    album_name: Optional[str] = None,
    event_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Upload photo (Club Admin only)"""
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
                detail="Only club admins can upload photos"
            )
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed"
            )
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{club_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create photo record
        image_url = f"/uploads/clubs/photos/{filename}"
        
        new_photo = models.ClubPhoto(
            club_id=club_id,
            event_id=event_id,
            image_url=image_url,
            caption=caption,
            album_name=album_name,
            uploaded_by=current_user.id
        )
        
        db.add(new_photo)
        db.commit()
        db.refresh(new_photo)
        
        return new_photo
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.get("/clubs/{club_id}/photos", response_model=List[schemas.ClubPhotoResponse])
async def get_club_photos(
    club_id: int,
    album_name: Optional[str] = None,
    event_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club photos with pagination"""
    try:
        query = db.query(models.ClubPhoto).filter(
            models.ClubPhoto.club_id == club_id
        )
        
        if album_name:
            query = query.filter(models.ClubPhoto.album_name == album_name)
        
        if event_id:
            query = query.filter(models.ClubPhoto.event_id == event_id)
        
        photos = query.order_by(
            models.ClubPhoto.uploaded_at.desc()
        ).offset(skip).limit(limit).all()
        
        return photos
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch photos: {str(e)}"
        )


@router.get("/clubs/{club_id}/albums")
async def get_club_albums(
    club_id: int,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get photo albums"""
    try:
        # Get unique album names with photo counts
        from sqlalchemy import func
        
        albums = db.query(
            models.ClubPhoto.album_name,
            func.count(models.ClubPhoto.id).label('photo_count'),
            func.max(models.ClubPhoto.uploaded_at).label('last_updated')
        ).filter(
            models.ClubPhoto.club_id == club_id,
            models.ClubPhoto.album_name != None
        ).group_by(
            models.ClubPhoto.album_name
        ).all()
        
        result = []
        for album in albums:
            # Get cover photo (most recent)
            cover_photo = db.query(models.ClubPhoto).filter(
                models.ClubPhoto.club_id == club_id,
                models.ClubPhoto.album_name == album.album_name
            ).order_by(
                models.ClubPhoto.uploaded_at.desc()
            ).first()
            
            result.append({
                "album_name": album.album_name,
                "photo_count": album.photo_count,
                "last_updated": album.last_updated,
                "cover_photo_url": cover_photo.image_url if cover_photo else None
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch albums: {str(e)}"
        )


@router.delete("/photos/{photo_id}", status_code=204)
async def delete_photo(
    photo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete photo (Uploader/Club Admin)"""
    try:
        photo = db.query(models.ClubPhoto).filter(
            models.ClubPhoto.id == photo_id
        ).first()
        
        if not photo:
            raise HTTPException(status_code=404, detail="Photo not found")
        
        # Check authorization
        is_uploader = photo.uploaded_by == current_user.id
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == photo.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not (is_uploader or is_admin):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this photo"
            )
        
        # Delete file
        file_path = photo.image_url.replace("/uploads/", "uploads/")
        if os.path.exists(file_path):
            os.remove(file_path)
        
        db.delete(photo)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete photo: {str(e)}"
        )


@router.post("/clubs/{club_id}/photos/albums")
async def create_photo_album(
    club_id: int,
    album_name: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create photo album"""
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
                detail="Only club admins can create albums"
            )
        
        # Check if album exists
        existing = db.query(models.ClubPhoto).filter(
            models.ClubPhoto.club_id == club_id,
            models.ClubPhoto.album_name == album_name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Album already exists"
            )
        
        return {
            "message": "Album created successfully",
            "album_name": album_name,
            "club_id": club_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create album: {str(e)}"
        )