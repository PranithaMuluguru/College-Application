from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(tags=["club-events"])


@router.post("/clubs/{club_id}/events", response_model=schemas.ClubEventResponse, status_code=201)
async def create_club_event(
    club_id: int,
    event: schemas.ClubEventCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Create event (Club Admin only)"""
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
                detail="Only club admins can create events"
            )
        
        # Get club
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        
        # Create event
        new_event = models.ClubEvent(
            club_id=club_id,
            created_by=current_user.id,
            **event.dict()
        )
        
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        
        return schemas.ClubEventResponse(
            **new_event.__dict__,
            is_registered=False,
            club_name=club.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create event: {str(e)}"
        )


@router.get("/clubs/{club_id}/events", response_model=List[schemas.ClubEventResponse])
async def get_club_events(
    club_id: int,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get club events with filters"""
    try:
        query = db.query(models.ClubEvent).filter(
            models.ClubEvent.club_id == club_id
        )
        
        if status:
            query = query.filter(models.ClubEvent.status == status)
        
        events = query.order_by(
            models.ClubEvent.event_date.asc()
        ).offset(skip).limit(limit).all()
        
        # Get club name
        club = db.query(models.Club).filter(
            models.Club.id == club_id
        ).first()
        
        result = []
        for event in events:
            # Check if user is registered
            is_registered = db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id,
                models.EventRegistration.user_id == current_user.id
            ).first() is not None
            
            result.append(schemas.ClubEventResponse(
                **event.__dict__,
                is_registered=is_registered,
                club_name=club.name if club else ""
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch events: {str(e)}"
        )


@router.get("/events", response_model=List[schemas.ClubEventResponse])
async def get_all_events(
    category: Optional[str] = None,
    event_type: Optional[str] = None,
    status: str = "upcoming",
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get all events with filters"""
    try:
        query = db.query(models.ClubEvent).join(models.Club)
        
        # Apply filters
        if category:
            query = query.filter(models.Club.category == category)
        
        if event_type:
            query = query.filter(models.ClubEvent.event_type == event_type)
        
        if status:
            query = query.filter(models.ClubEvent.status == status)
        
        if from_date:
            query = query.filter(models.ClubEvent.event_date >= from_date)
        
        if to_date:
            query = query.filter(models.ClubEvent.event_date <= to_date)
        
        # Only show public events or events from clubs user is member of
        events = query.order_by(
            models.ClubEvent.event_date.asc()
        ).offset(skip).limit(limit).all()
        
        result = []
        for event in events:
            club = db.query(models.Club).filter(
                models.Club.id == event.club_id
            ).first()
            
            is_registered = db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id,
                models.EventRegistration.user_id == current_user.id
            ).first() is not None
            
            result.append(schemas.ClubEventResponse(
                **event.__dict__,
                is_registered=is_registered,
                club_name=club.name if club else ""
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch events: {str(e)}"
        )


@router.get("/events/upcoming", response_model=List[schemas.ClubEventResponse])
async def get_upcoming_events(
    days: int = Query(30, le=365),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get upcoming events"""
    try:
        end_date = datetime.utcnow() + timedelta(days=days)
        
        events = db.query(models.ClubEvent).filter(
            models.ClubEvent.status == 'upcoming',
            models.ClubEvent.event_date >= datetime.utcnow(),
            models.ClubEvent.event_date <= end_date,
            models.ClubEvent.is_public == True
        ).order_by(
            models.ClubEvent.event_date.asc()
        ).offset(skip).limit(limit).all()
        
        result = []
        for event in events:
            club = db.query(models.Club).filter(
                models.Club.id == event.club_id
            ).first()
            
            is_registered = db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id,
                models.EventRegistration.user_id == current_user.id
            ).first() is not None
            
            result.append(schemas.ClubEventResponse(
                **event.__dict__,
                is_registered=is_registered,
                club_name=club.name if club else ""
            ))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch upcoming events: {str(e)}"
        )


@router.get("/events/{event_id}", response_model=schemas.ClubEventResponse)
async def get_event_detail(
    event_id: int,
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get event details with registrations"""
    try:
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        club = db.query(models.Club).filter(
            models.Club.id == event.club_id
        ).first()
        
        is_registered = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id,
            models.EventRegistration.user_id == current_user.id
        ).first() is not None
        
        return schemas.ClubEventResponse(
            **event.__dict__,
            is_registered=is_registered,
            club_name=club.name if club else ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch event: {str(e)}"
        )


@router.put("/events/{event_id}", response_model=schemas.ClubEventResponse)
async def update_event(
    event_id: int,
    event_update: schemas.ClubEventUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Update event (Event creator/Club Admin)"""
    try:
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check authorization
        is_creator = event.created_by == current_user.id
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == event.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not (is_creator or is_admin):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to update this event"
            )
        
        # Update fields
        update_data = event_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(event, field, value)
        
        db.commit()
        db.refresh(event)
        
        club = db.query(models.Club).filter(
            models.Club.id == event.club_id
        ).first()
        
        is_registered = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id,
            models.EventRegistration.user_id == current_user.id
        ).first() is not None
        
        return schemas.ClubEventResponse(
            **event.__dict__,
            is_registered=is_registered,
            club_name=club.name if club else ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update event: {str(e)}"
        )


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete event (Event creator/Club Admin)"""
    try:
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check authorization
        is_creator = event.created_by == current_user.id
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == event.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not (is_creator or is_admin):
            raise HTTPException(
                status_code=403,
                detail="Not authorized to delete this event"
            )
        
        db.delete(event)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete event: {str(e)}"
        )


@router.post("/events/{event_id}/register", status_code=201)
async def register_for_event(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Register for event"""
    try:
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if already registered
        existing = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id,
            models.EventRegistration.user_id == current_user.id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Already registered for this event"
            )
        
        # Check capacity
        if event.max_participants:
            if event.current_participants >= event.max_participants:
                raise HTTPException(
                    status_code=400,
                    detail="Event is full"
                )
        
        # Create registration
        registration = models.EventRegistration(
            event_id=event_id,
            user_id=current_user.id
        )
        
        event.current_participants += 1
        
        db.add(registration)
        db.commit()
        
        return {
            "message": "Successfully registered for event",
            "event_id": event_id,
            "registration_id": registration.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to register for event: {str(e)}"
        )


@router.delete("/events/{event_id}/register", status_code=200)
async def cancel_event_registration(
    event_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Cancel registration"""
    try:
        registration = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id,
            models.EventRegistration.user_id == current_user.id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=400,
                detail="Not registered for this event"
            )
        
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if event:
            event.current_participants = max(0, event.current_participants - 1)
        
        db.delete(registration)
        db.commit()
        
        return {
            "message": "Successfully cancelled registration",
            "event_id": event_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel registration: {str(e)}"
        )


@router.get("/events/{event_id}/registrations")
async def get_event_registrations(
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get event registrations (Club Admin only)"""
    try:
        event = db.query(models.ClubEvent).filter(
            models.ClubEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check authorization
        is_admin = db.query(models.ClubMember).filter(
            models.ClubMember.club_id == event.club_id,
            models.ClubMember.user_id == current_user.id,
            models.ClubMember.is_admin == True
        ).first()
        
        if not is_admin:
            raise HTTPException(
                status_code=403,
                detail="Only club admins can view registrations"
            )
        
        registrations = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id
        ).offset(skip).limit(limit).all()
        
        result = []
        for reg in registrations:
            user = db.query(models.User).filter(
                models.User.id == reg.user_id
            ).first()
            
            if user:
                result.append({
                    "registration_id": reg.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "department": user.department,
                    "year": user.year,
                    "registered_at": reg.registered_at,
                    "attendance_status": reg.attendance_status
                })
        
        total = db.query(models.EventRegistration).filter(
            models.EventRegistration.event_id == event_id
        ).count()
        
        return {
            "registrations": result,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch registrations: {str(e)}"
        )