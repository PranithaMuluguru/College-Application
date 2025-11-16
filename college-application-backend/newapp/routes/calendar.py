from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from calendar import monthrange

from ..database import get_database
from .. import models, schemas
from ..admin_auth import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events")
async def get_calendar_events(
    year: int,
    month: int,
    view: str = "monthly",
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get events for calendar view (monthly/weekly)"""
    try:
        # Calculate date range based on view
        if view == "monthly":
            start_date = datetime(year, month, 1)
            _, last_day = monthrange(year, month)
            end_date = datetime(year, month, last_day, 23, 59, 59)
        elif view == "weekly":
            # Get current week
            today = datetime.now()
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6, hours=23, minutes=59)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid view type. Use 'monthly' or 'weekly'"
            )
        
        # Get followed clubs
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == current_user.id
        ).all()
        
        club_ids = [follow.club_id for follow in follows]
        
        # Get events
        query = db.query(models.ClubEvent).filter(
            models.ClubEvent.event_date >= start_date,
            models.ClubEvent.event_date <= end_date,
            models.ClubEvent.status == 'upcoming'
        )
        
        # Filter by followed clubs or public events
        if club_ids:
            query = query.filter(
                or_(
                    models.ClubEvent.club_id.in_(club_ids),
                    models.ClubEvent.is_public == True
                )
            )
        else:
            query = query.filter(models.ClubEvent.is_public == True)
        
        events = query.order_by(models.ClubEvent.event_date.asc()).all()
        
        # Group events by date
        events_by_date = {}
        for event in events:
            date_key = event.event_date.strftime("%Y-%m-%d")
            
            if date_key not in events_by_date:
                events_by_date[date_key] = []
            
            club = db.query(models.Club).filter(
                models.Club.id == event.club_id
            ).first()
            
            is_registered = db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id,
                models.EventRegistration.user_id == current_user.id
            ).first() is not None
            
            events_by_date[date_key].append({
                "id": event.id,
                "title": event.title,
                "event_date": event.event_date,
                "venue": event.venue,
                "club_name": club.name if club else "",
                "club_category": club.category if club else "",
                "event_type": event.event_type,
                "is_registered": is_registered
            })
        
        return {
            "view": view,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "events_by_date": events_by_date,
            "total_events": len(events)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch calendar events: {str(e)}"
        )


@router.get("/upcoming")
async def get_upcoming_timeline(
    days: int = Query(7, le=30),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get upcoming events timeline"""
    try:
        end_date = datetime.utcnow() + timedelta(days=days)
        
        # Get followed clubs
        follows = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == current_user.id
        ).all()
        
        club_ids = [follow.club_id for follow in follows]
        
        # Get events
        query = db.query(models.ClubEvent).filter(
            models.ClubEvent.event_date >= datetime.utcnow(),
            models.ClubEvent.event_date <= end_date,
            models.ClubEvent.status == 'upcoming'
        )
        
        if club_ids:
            query = query.filter(
                or_(
                    models.ClubEvent.club_id.in_(club_ids),
                    models.ClubEvent.is_public == True
                )
            )
        else:
            query = query.filter(models.ClubEvent.is_public == True)
        
        events = query.order_by(models.ClubEvent.event_date.asc()).all()
        
        result = []
        for event in events:
            club = db.query(models.Club).filter(
                models.Club.id == event.club_id
            ).first()
            
            is_registered = db.query(models.EventRegistration).filter(
                models.EventRegistration.event_id == event.id,
                models.EventRegistration.user_id == current_user.id
            ).first() is not None
            
            # Calculate time until event
            time_diff = event.event_date - datetime.utcnow()
            hours_until = int(time_diff.total_seconds() / 3600)
            
            result.append({
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "event_date": event.event_date,
                "venue": event.venue,
                "club_id": event.club_id,
                "club_name": club.name if club else "",
                "club_logo": club.logo_url if club else None,
                "event_type": event.event_type,
                "is_registered": is_registered,
                "hours_until": hours_until,
                "is_today": event.event_date.date() == datetime.utcnow().date()
            })
        
        return {
            "events": result,
            "total": len(result),
            "days": days
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch upcoming events: {str(e)}"
        )


@router.get("/discover/recommended")
async def get_recommended_clubs(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get recommended clubs for user"""
    try:
        # Get user's department and already followed clubs
        followed = db.query(models.ClubFollow).filter(
            models.ClubFollow.user_id == current_user.id
        ).all()
        
        followed_club_ids = [f.club_id for f in followed]
        
        # Recommendation algorithm:
        # 1. Clubs from user's department (high priority)
        # 2. Popular clubs (most followers)
        # 3. Recently active clubs
        
        department_clubs = db.query(models.Club).filter(
            models.Club.department == current_user.department,
            models.Club.is_active == True,
            ~models.Club.id.in_(followed_club_ids) if followed_club_ids else True
        ).order_by(
            models.Club.followers_count.desc()
        ).limit(limit // 2).all()
        
        popular_clubs = db.query(models.Club).filter(
            models.Club.is_active == True,
            ~models.Club.id.in_(followed_club_ids) if followed_club_ids else True,
            models.Club.department != current_user.department
        ).order_by(
            models.Club.followers_count.desc()
        ).limit(limit // 2).all()
        
        recommended = []
        seen_ids = set()
        
        for club in department_clubs + popular_clubs:
            if club.id not in seen_ids:
                seen_ids.add(club.id)
                recommended.append({
                    "club": club,
                    "reason": "Same department" if club.department == current_user.department else "Popular club",
                    "match_score": 0.9 if club.department == current_user.department else 0.7
                })
        
        return {
            "recommendations": recommended[:limit],
            "total": len(recommended)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendations: {str(e)}"
        )


@router.get("/trending")
async def get_trending_clubs(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get trending clubs (most followed)"""
    try:
        # Get clubs with highest follower count
        clubs = db.query(models.Club).filter(
            models.Club.is_active == True
        ).order_by(
            models.Club.followers_count.desc()
        ).limit(limit).all()
        
        result = []
        for club in clubs:
            # Check if user follows
            is_following = db.query(models.ClubFollow).filter(
                models.ClubFollow.club_id == club.id,
                models.ClubFollow.user_id == current_user.id
            ).first() is not None
            
            # Get recent activity count
            recent_events = db.query(models.ClubEvent).filter(
                models.ClubEvent.club_id == club.id,
                models.ClubEvent.created_at >= datetime.utcnow() - timedelta(days=30)
            ).count()
            
            result.append({
                "club": club,
                "is_following": is_following,
                "recent_events": recent_events,
                "trend_score": club.followers_count + (recent_events * 10)
            })
        
        return {
            "trending_clubs": result,
            "total": len(result)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trending clubs: {str(e)}"
        )


@router.get("/search")
async def search_clubs(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    department: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Search clubs with advanced filters"""
    try:
        query = db.query(models.Club).filter(
            models.Club.is_active == True
        )
        
        # Search in name, description, tags
        search_filter = or_(
            models.Club.name.ilike(f"%{q}%"),
            models.Club.description.ilike(f"%{q}%")
        )
        
        query = query.filter(search_filter)
        
        # Apply filters
        if category:
            query = query.filter(models.Club.category == category)
        
        if department:
            query = query.filter(models.Club.department == department)
        
        # Order by relevance (followers count for now)
        clubs = query.order_by(
            models.Club.followers_count.desc()
        ).offset(skip).limit(limit).all()
        
        total = query.count()
        
        result = []
        for club in clubs:
            is_following = db.query(models.ClubFollow).filter(
                models.ClubFollow.club_id == club.id,
                models.ClubFollow.user_id == current_user.id
            ).first() is not None
            
            result.append({
                "club": club,
                "is_following": is_following
            })
        
        return {
            "clubs": result,
            "total": total,
            "skip": skip,
            "limit": limit,
            "query": q
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search clubs: {str(e)}"
        )


@router.get("/categories")
async def get_club_categories(
    db: Session = Depends(get_database),
    current_user: models.User = Depends(get_current_user)
):
    """Get all club categories with counts"""
    try:
        categories = db.query(
            models.Club.category,
            func.count(models.Club.id).label('count')
        ).filter(
            models.Club.is_active == True
        ).group_by(
            models.Club.category
        ).all()
        
        result = []
        for category, count in categories:
            # Get sample clubs
            sample_clubs = db.query(models.Club).filter(
                models.Club.category == category,
                models.Club.is_active == True
            ).order_by(
                models.Club.followers_count.desc()
            ).limit(3).all()
            
            result.append({
                "category": category,
                "count": count,
                "sample_clubs": [
                    {
                        "id": club.id,
                        "name": club.name,
                        "logo_url": club.logo_url
                    }
                    for club in sample_clubs
                ]
            })
        
        return {
            "categories": result,
            "total_categories": len(result)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch categories: {str(e)}"
        )