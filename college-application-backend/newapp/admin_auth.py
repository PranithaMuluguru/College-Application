# admin_auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt
from jwt import DecodeError

from .database import get_database
from . import models

# Initialize router
router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])

# Configuration
SECRET_KEY = "your-secret-key-here"  # TODO: Use environment variable
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic Models
class AdminLoginRequest(BaseModel):
    identifier: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    admin_user: dict
    user: dict

class CreateAdminRequest(BaseModel):
    user_id: int
    admin_level: str = "admin"
    permissions: Optional[dict] = {}

# Helper Functions
def create_admin_token(admin_id: int, user_id: int) -> str:
    """Create JWT token for admin"""
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {
        "admin_id": admin_id,
        "user_id": user_id,
        "exp": expire,
        "type": "admin"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_admin_token(token: str, db: Session):
    """Verify admin JWT token and return admin object"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = payload.get("admin_id")
        
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.id == admin_id,
            models.AdminUser.is_active == True
        ).first()
        
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_token(authorization: str = Header(None)) -> str:
    """Extract token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return authorization.replace("Bearer ", "")

def get_current_user(token: str = Depends(get_admin_token), db: Session = Depends(get_database)) -> models.User:
    """Get current authenticated user"""
    admin = verify_admin_token(token, db)
    user = db.query(models.User).filter(models.User.id == admin.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Routes
@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify router is working"""
    return {
        "message": "Admin auth routes are working!",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminLoginRequest,
    db: Session = Depends(get_database)
):
    """Admin login endpoint"""
    try:
        user = db.query(models.User).filter(
            (models.User.email == request.identifier) |
            (models.User.college_id == request.identifier)
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not pwd_context.verify(request.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect password")
        
        admin = db.query(models.AdminUser).filter(
            models.AdminUser.user_id == user.id,
            models.AdminUser.is_active == True
        ).first()
        
        if not admin:
            raise HTTPException(
                status_code=403,
                detail="User is not authorized as admin"
            )
        
        admin.last_login = datetime.utcnow()
        user.last_login = datetime.utcnow()
        
        try:
            activity_log = models.AdminActivityLog(
                admin_id=admin.id,
                action="login",
                details={"identifier": request.identifier}
            )
            db.add(activity_log)
        except:
            pass  # Non-critical
        
        db.commit()
        
        token = create_admin_token(admin.id, user.id)
        
        return AdminLoginResponse(
            access_token=token,
            admin_user={
                "id": admin.id,
                "admin_level": admin.admin_level,
                "permissions": admin.permissions or {},
                "created_at": admin.created_at.isoformat(),
                "last_login": admin.last_login.isoformat()
            },
            user={
                "id": user.id,
                "email": user.email,
                "college_id": user.college_id,
                "full_name": user.full_name,
                "department": user.department,
                "year": user.year
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-admin")
async def create_new_admin(
    request: CreateAdminRequest,
    token: str = Depends(get_admin_token),
    db: Session = Depends(get_database)
):
    """
    Create new admin user
    
    Requires super_admin level permission
    """
    try:
        # Verify requesting admin has permission
        requesting_admin = verify_admin_token(token, db)
        
        if requesting_admin.admin_level != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Only super admins can create new admins"
            )
        
        # Verify target user exists
        user = db.query(models.User).filter(
            models.User.id == request.user_id
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Check if user is already an admin
        existing_admin = db.query(models.AdminUser).filter(
            models.AdminUser.user_id == request.user_id
        ).first()
        
        if existing_admin:
            raise HTTPException(
                status_code=400,
                detail="User is already an admin"
            )
        
        # Create new admin
        new_admin = models.AdminUser(
            user_id=request.user_id,
            admin_level=request.admin_level,
            permissions=request.permissions or {},
            created_by=requesting_admin.id
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        # Log activity
        activity_log = models.AdminActivityLog(
            admin_id=requesting_admin.id,
            action="create_admin",
            target_type="admin",
            target_id=new_admin.id,
            details={
                "new_admin_user_id": request.user_id,
                "admin_level": request.admin_level
            }
        )
        db.add(activity_log)
        db.commit()
        
        return {
            "message": "Admin created successfully",
            "admin": {
                "id": new_admin.id,
                "user_id": new_admin.user_id,
                "admin_level": new_admin.admin_level,
                "user_name": user.full_name,
                "user_email": user.email
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create admin: {str(e)}"
        )

@router.get("/admins")
async def get_all_admins(
    authorization: str = Header(None),
    db: Session = Depends(get_database)
):
    """Get list of all active admins"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing token")
        
        token = authorization.replace("Bearer ", "")
        requesting_admin = verify_admin_token(token, db)
        
        # Query all active admins
        admins = db.query(models.AdminUser).filter(
            models.AdminUser.is_active == True
        ).all()
        
        result = []
        for admin in admins:
            user = db.query(models.User).filter(
                models.User.id == admin.user_id
            ).first()
            
            if user:
                result.append({
                    "id": admin.id,
                    "user_id": admin.user_id,
                    "admin_level": admin.admin_level,
                    "permissions": admin.permissions or {},
                    "created_at": admin.created_at.isoformat(),
                    "last_login": admin.last_login.isoformat() if admin.last_login else None,
                    "user": {
                        "full_name": user.full_name,
                        "email": user.email,
                        "college_id": user.college_id,
                        "department": user.department
                    }
                })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch admins: {str(e)}"
        )

@router.delete("/admins/{admin_id}")
async def remove_admin(
    admin_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_database)
):
    """
    Remove admin (soft delete)
    
    Requires super_admin permission
    Cannot remove yourself
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing token")
        
        token = authorization.replace("Bearer ", "")
        requesting_admin = verify_admin_token(token, db)
        
        # Check permission
        if requesting_admin.admin_level != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Only super admins can remove admins"
            )
        
        # Prevent self-removal
        if requesting_admin.id == admin_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove yourself"
            )
        
        # Find admin to remove
        admin_to_remove = db.query(models.AdminUser).filter(
            models.AdminUser.id == admin_id
        ).first()
        
        if not admin_to_remove:
            raise HTTPException(
                status_code=404,
                detail="Admin not found"
            )
        
        # Soft delete
        admin_to_remove.is_active = False
        
        # Log activity
        activity_log = models.AdminActivityLog(
            admin_id=requesting_admin.id,
            action="remove_admin",
            target_type="admin",
            target_id=admin_id,
            details={"removed_admin_id": admin_id}
        )
        db.add(activity_log)
        db.commit()
        
        return {
            "message": "Admin removed successfully",
            "admin_id": admin_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove admin: {str(e)}"
        )

@router.get("/activity-logs")
async def get_activity_logs(
    authorization: str = Header(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_database)
):
    """Get admin activity logs with pagination"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing token")
        
        token = authorization.replace("Bearer ", "")
        requesting_admin = verify_admin_token(token, db)
        
        # Query logs with pagination
        logs = db.query(models.AdminActivityLog).order_by(
            models.AdminActivityLog.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        result = []
        for log in logs:
            admin = db.query(models.AdminUser).filter(
                models.AdminUser.id == log.admin_id
            ).first()
            
            if admin:
                user = db.query(models.User).filter(
                    models.User.id == admin.user_id
                ).first()
                
                if user:
                    result.append({
                        "id": log.id,
                        "action": log.action,
                        "target_type": log.target_type,
                        "target_id": log.target_id,
                        "details": log.details or {},
                        "created_at": log.created_at.isoformat(),
                        "admin": {
                            "name": user.full_name,
                            "email": user.email
                        }
                    })
        
        return {
            "logs": result,
            "total": len(result),
            "skip": skip,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch activity logs: {str(e)}"
        )