# In your Python FastAPI backend
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import math
from .database import get_database as get_db
from .models import User, UserLocation

router = APIRouter()

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.post("/users/{user_id}/location")
async def update_user_location(
    user_id: int,
    latitude: float,
    longitude: float,
    timestamp: str,
    db: Session = Depends(get_db)
):
    """Update user's current location"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update or create user location
    location = db.query(UserLocation).filter(
        UserLocation.user_id == user_id
    ).first()
    
    if location:
        location.latitude = latitude
        location.longitude = longitude
        location.last_updated = timestamp
    else:
        location = UserLocation(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            last_updated=timestamp
        )
        db.add(location)
    
    db.commit()
    return {"message": "Location updated successfully"}

@router.get("/users/nearby/{user_id}")
async def get_nearby_users(
    user_id: int,
    latitude: float,
    longitude: float,
    radius: int = 500,  # Default 500 meters
    db: Session = Depends(get_db)
):
    """Get users within specified radius"""
    # Get all users with recent location updates (within last 10 minutes)
    from datetime import datetime, timedelta
    cutoff_time = datetime.now() - timedelta(minutes=10)
    
    all_locations = db.query(UserLocation, User).join(
        User, UserLocation.user_id == User.id
    ).filter(
        UserLocation.user_id != user_id,
        UserLocation.last_updated >= cutoff_time
    ).all()
    
    nearby_users = []
    
    for location, user in all_locations:
        distance = calculate_distance(
            latitude,
            longitude,
            location.latitude,
            location.longitude
        )
        
        if distance <= radius:
            nearby_users.append({
                "id": user.id,
                "full_name": user.full_name,
                "department": user.department,
                "year": user.year,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "last_seen": location.last_updated.isoformat()
            })
    
    return nearby_users