# admin_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text
from typing import Optional
from datetime import datetime, timedelta
import logging

from .database import get_db
from . import models
from .web_scraper import scrape_iitpkd_website

router = APIRouter(prefix="/admin", tags=["admin"])

# ================ ADMIN MODELS ================
from pydantic import BaseModel
from typing import List, Optional

class AdminStatsResponse(BaseModel):
    total_users: int
    total_posts: int
    total_marketplace_items: int
    total_discussions: int
    active_chats: int
    new_users_today: int
    pending_follow_requests: int

class UserManagementResponse(BaseModel):
    id: int
    email: str
    full_name: str
    college_id: str
    department: str
    year: int
    is_verified: bool
    created_at: str
    last_login: Optional[str]
    post_count: int
    is_active: bool

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    department: Optional[str] = None
    year: Optional[int] = None

# ================ ADMIN DASHBOARD ENDPOINTS ================

@router.get("/stats")
async def get_admin_stats(db: Session = Depends(get_db)):
    """Get overall admin statistics"""
    try:
        total_users = db.query(models.User).count()
        total_posts = db.query(models.Post).count()
        total_marketplace_items = db.query(models.MarketplaceItem).count()
        total_discussions = db.query(models.Discussion).count()
        
        # Active chats (chats with messages in last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        active_chats = db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.last_message_time >= week_ago
        ).count()
        
        # New users today
        today = datetime.utcnow().date()
        new_users_today = db.query(models.User).filter(
            func.date(models.User.created_at) == today
        ).count()
        
        # Pending follow requests
        pending_follow_requests = db.query(models.Follow).filter(
            models.Follow.status == models.FollowStatus.PENDING
        ).count()
        
        return AdminStatsResponse(
            total_users=total_users,
            total_posts=total_posts,
            total_marketplace_items=total_marketplace_items,
            total_discussions=total_discussions,
            active_chats=active_chats,
            new_users_today=new_users_today,
            pending_follow_requests=pending_follow_requests
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    department: Optional[str] = None,
    year: Optional[int] = None,
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all users for admin management"""
    try:
        query = db.query(models.User)
        
        if department:
            query = query.filter(models.User.department == department)
        if year:
            query = query.filter(models.User.year == year)
        if is_verified is not None:
            query = query.filter(models.User.is_verified == is_verified)
        
        users = query.order_by(models.User.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for user in users:
            post_count = db.query(models.Post).filter(models.Post.user_id == user.id).count()
            
            result.append(UserManagementResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                college_id=user.college_id,
                department=user.department,
                year=user.year,
                is_verified=user.is_verified,
                created_at=user.created_at.isoformat(),
                last_login=user.last_login.isoformat() if user.last_login else None,
                post_count=post_count,
                is_active=getattr(user, 'is_active', True)
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: AdminUserUpdate,
    db: Session = Depends(get_db)
):
    """Admin update user details"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        return {"message": "User updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Admin delete user (soft delete)"""
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Soft delete by setting is_active to False
        user.is_active = False
        db.commit()
        
        return {"message": "User deactivated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts")
async def get_all_posts(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    is_announcement: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all posts for admin management"""
    try:
        query = db.query(models.Post)
        
        if user_id:
            query = query.filter(models.Post.user_id == user_id)
        if is_announcement is not None:
            query = query.filter(models.Post.is_announcement == is_announcement)
        
        posts = query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for post in posts:
            author = db.query(models.User).filter(models.User.id == post.user_id).first()
            likes_count = db.query(models.Like).filter(models.Like.post_id == post.id).count()
            comments_count = db.query(models.Comment).filter(models.Comment.post_id == post.id).count()
            
            result.append({
                "id": post.id,
                "content": post.content[:100] + "..." if len(post.content) > 100 else post.content,
                "author": {
                    "id": author.id,
                    "name": author.full_name,
                    "college_id": author.college_id
                },
                "is_announcement": post.is_announcement,
                "likes_count": likes_count,
                "comments_count": comments_count,
                "created_at": post.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/posts/{post_id}")
async def delete_post_admin(post_id: int, db: Session = Depends(get_db)):
    """Admin delete any post"""
    try:
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Delete related records
        db.query(models.Like).filter(models.Like.post_id == post_id).delete()
        db.query(models.Comment).filter(models.Comment.post_id == post_id).delete()
        
        db.delete(post)
        db.commit()
        
        return {"message": "Post deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/marketplace")
async def get_all_marketplace_items(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all marketplace items for admin"""
    try:
        query = db.query(models.MarketplaceItem)
        
        if status:
            query = query.filter(models.MarketplaceItem.status == status)
        if category:
            query = query.filter(models.MarketplaceItem.category == category)
        
        items = query.order_by(models.MarketplaceItem.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for item in items:
            seller = db.query(models.User).filter(models.User.id == item.seller_id).first()
            chats_count = db.query(models.MarketplaceChat).filter(
                models.MarketplaceChat.item_id == item.id
            ).count()
            
            result.append({
                "id": item.id,
                "title": item.title,
                "price": item.price,
                "category": item.category,
                "status": item.status,
                "views": item.views,
                "seller": {
                    "id": seller.id,
                    "name": seller.full_name,
                    "college_id": seller.college_id
                },
                "chats_count": chats_count,
                "created_at": item.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/marketplace/{item_id}")
async def delete_marketplace_item_admin(item_id: int, db: Session = Depends(get_db)):
    """Admin delete marketplace item"""
    try:
        item = db.query(models.MarketplaceItem).filter(models.MarketplaceItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Delete related chats and messages
        chats = db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.item_id == item_id
        ).all()
        
        for chat in chats:
            db.query(models.MarketplaceMessage).filter(
                models.MarketplaceMessage.chat_id == chat.id
            ).delete()
        
        db.query(models.MarketplaceChat).filter(
            models.MarketplaceChat.item_id == item_id
        ).delete()
        
        db.query(models.SavedItem).filter(
            models.SavedItem.item_id == item_id
        ).delete()
        
        db.delete(item)
        db.commit()
        
        return {"message": "Marketplace item deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/discussions")
async def get_all_discussions(
    skip: int = 0,
    limit: int = 50,
    topic: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all discussions for admin"""
    try:
        query = db.query(models.Discussion)
        
        if topic:
            query = query.filter(models.Discussion.topic == topic)
        
        discussions = query.order_by(models.Discussion.created_at.desc()).offset(skip).limit(limit).all()
        
        result = []
        for discussion in discussions:
            author = db.query(models.User).filter(models.User.id == discussion.user_id).first()
            replies_count = db.query(models.DiscussionReply).filter(
                models.DiscussionReply.discussion_id == discussion.id
            ).count()
            participants_count = db.query(models.DiscussionParticipant).filter(
                models.DiscussionParticipant.discussion_id == discussion.id
            ).count()
            
            result.append({
                "id": discussion.id,
                "title": discussion.title,
                "topic": discussion.topic,
                "author": {
                    "id": author.id,
                    "name": author.full_name
                },
                "replies_count": replies_count,
                "participants_count": participants_count,
                "visibility": discussion.visibility.value,
                "created_at": discussion.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/discussions/{discussion_id}")
async def delete_discussion_admin(discussion_id: int, db: Session = Depends(get_db)):
    """Admin delete discussion"""
    try:
        discussion = db.query(models.Discussion).filter(models.Discussion.id == discussion_id).first()
        if not discussion:
            raise HTTPException(status_code=404, detail="Discussion not found")
        
        # Delete related records
        db.query(models.DiscussionReply).filter(
            models.DiscussionReply.discussion_id == discussion_id
        ).delete()
        
        db.query(models.DiscussionParticipant).filter(
            models.DiscussionParticipant.discussion_id == discussion_id
        ).delete()
        
        db.delete(discussion)
        db.commit()
        
        return {"message": "Discussion deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ================ ADMIN ANALYTICS ENDPOINTS ================

@router.get("/analytics/user-growth")
async def get_user_growth_analytics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get user growth analytics"""
    try:
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Get daily user registrations
        daily_registrations = db.query(
            func.date(models.User.created_at).label('date'),
            func.count(models.User.id).label('count')
        ).filter(
            func.date(models.User.created_at) >= start_date,
            func.date(models.User.created_at) <= end_date
        ).group_by(
            func.date(models.User.created_at)
        ).order_by('date').all()
        
        # Get department distribution
        department_distribution = db.query(
            models.User.department,
            func.count(models.User.id).label('count')
        ).group_by(models.User.department).all()
        
        # Get year distribution
        year_distribution = db.query(
            models.User.year,
            func.count(models.User.id).label('count')
        ).group_by(models.User.year).all()
        
        return {
            "daily_registrations": [
                {"date": str(reg.date), "count": reg.count}
                for reg in daily_registrations
            ],
            "department_distribution": [
                {"department": dist.department, "count": dist.count}
                for dist in department_distribution
            ],
            "year_distribution": [
                {"year": dist.year, "count": dist.count}
                for dist in year_distribution
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/engagement")
async def get_engagement_analytics(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get engagement analytics"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Daily posts
        daily_posts = db.query(
            func.date(models.Post.created_at).label('date'),
            func.count(models.Post.id).label('count')
        ).filter(
            models.Post.created_at >= start_date,
            models.Post.created_at <= end_date
        ).group_by(
            func.date(models.Post.created_at)
        ).order_by('date').all()
        
        # Daily marketplace items
        daily_marketplace = db.query(
            func.date(models.MarketplaceItem.created_at).label('date'),
            func.count(models.MarketplaceItem.id).label('count')
        ).filter(
            models.MarketplaceItem.created_at >= start_date,
            models.MarketplaceItem.created_at <= end_date
        ).group_by(
            func.date(models.MarketplaceItem.created_at)
        ).order_by('date').all()
        
        # Active users (users with any activity in period)
        active_users = db.query(models.User).filter(
            or_(
                models.User.id.in_(
                    db.query(models.Post.user_id).filter(
                        models.Post.created_at >= start_date
                    )
                ),
                models.User.id.in_(
                    db.query(models.MarketplaceItem.seller_id).filter(
                        models.MarketplaceItem.created_at >= start_date
                    )
                ),
                models.User.id.in_(
                    db.query(models.Discussion.user_id).filter(
                        models.Discussion.created_at >= start_date
                    )
                )
            )
        ).count()
        
        total_users = db.query(models.User).count()
        
        return {
            "daily_posts": [
                {"date": str(post.date), "count": post.count}
                for post in daily_posts
            ],
            "daily_marketplace": [
                {"date": str(item.date), "count": item.count}
                for item in daily_marketplace
            ],
            "user_engagement": {
                "active_users": active_users,
                "total_users": total_users,
                "engagement_rate": round((active_users / total_users * 100) if total_users > 0 else 0, 2)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================ ADMIN SYSTEM ENDPOINTS ================

@router.post("/system/refresh-knowledge-base")
async def admin_refresh_knowledge_base(db: Session = Depends(get_db)):
    """Admin refresh AI knowledge base"""
    try:
        # Clear old entries (keep admin added ones)
        db.query(models.KnowledgeBase).filter(
            models.KnowledgeBase.source_url != "admin_added"
        ).delete()
        
        # Re-scrape website
        scrape_iitpkd_website(db)
        
        count = db.query(models.KnowledgeBase).count()
        return {
            "message": "Knowledge base refreshed successfully",
            "total_entries": count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/health")
async def get_system_health(db: Session = Depends(get_db)):
    """Get system health status"""
    try:
        # Database connection check
        db.execute(text("SELECT 1"))
        
        # Table counts
        tables = {
            "users": db.query(models.User).count(),
            "posts": db.query(models.Post).count(),
            "marketplace_items": db.query(models.MarketplaceItem).count(),
            "discussions": db.query(models.Discussion).count(),
            "knowledge_base": db.query(models.KnowledgeBase).count(),
            "unanswered_questions": db.query(models.UnansweredQuestion).filter(
                models.UnansweredQuestion.status == models.QuestionStatus.UNANSWERED
            ).count()
        }
        
        # System info
        system_info = {
            "database_status": "healthy",
            "total_tables": len(tables),
            "server_time": datetime.utcnow().isoformat(),
            "memory_usage": "normal"
        }
        
        return {
            "system_info": system_info,
            "table_counts": tables
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System health check failed: {str(e)}")