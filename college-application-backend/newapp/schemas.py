from pydantic import BaseModel,EmailStr,Field
from typing import Optional, List, Dict, Any 
from datetime import datetime,date




class TimetableEntryCreate(BaseModel):
    day: str
    class_name: str
    start_time: str
    end_time: str
    teacher: Optional[str] = None
    room: Optional[str] = None
    exam_date: Optional[datetime] = None

class TimetableEntryOut(TimetableEntryCreate):
    id: int

    class Config:
        orm_mode = True

class GradeCreate(BaseModel):
    course_name: str
    credits: float
    grade: float

class GradeOut(GradeCreate):
    id: int

    class Config:
        orm_mode = True

class CGPAOut(BaseModel):
    total_credits: float
    cgpa: float




# # Club Schemas
# class ClubBase(BaseModel):
#     name: str = Field(..., max_length=100)
#     category: str
#     description: Optional[str] = None
#     logo_url: Optional[str] = None
#     banner_url: Optional[str] = None
#     contact_email: Optional[EmailStr] = None
#     social_links: Optional[Dict[str, str]] = None
#     department: Optional[str] = None
#     tags: Optional[List[str]] = None


# class ClubCreate(ClubBase):
#     pass


# class ClubUpdate(BaseModel):
#     name: Optional[str] = None
#     category: Optional[str] = None
#     description: Optional[str] = None
#     logo_url: Optional[str] = None
#     banner_url: Optional[str] = None
#     contact_email: Optional[EmailStr] = None
#     social_links: Optional[Dict[str, str]] = None
#     department: Optional[str] = None
#     tags: Optional[List[str]] = None
#     is_active: Optional[bool] = None


# class ClubResponse(ClubBase):
#     id: int
#     created_by: int
#     created_at: datetime
#     updated_at: datetime
#     is_active: bool
#     followers_count: int
    
#     class Config:
#         from_attributes = True


# class ClubDetailResponse(ClubResponse):
#     members_count: int
#     events_count: int
#     announcements_count: int
#     is_following: bool
#     user_role: Optional[str] = None


# # Club Member Schemas
# class ClubMemberBase(BaseModel):
#     role: str
#     permissions: Optional[Dict[str, bool]] = None


# class ClubMemberCreate(ClubMemberBase):
#     user_id: int


# class ClubMemberUpdate(BaseModel):
#     role: Optional[str] = None
#     permissions: Optional[Dict[str, bool]] = None
#     is_admin: Optional[bool] = None


# class ClubMemberResponse(ClubMemberBase):
#     id: int
#     club_id: int
#     user_id: int
#     joined_at: datetime
#     is_admin: bool
#     user_name: str
#     user_email: str
    
#     class Config:
#         from_attributes = True


# # Event Schemas
# class ClubEventBase(BaseModel):
#     title: str = Field(..., max_length=200)
#     description: Optional[str] = None
#     event_date: datetime
#     end_date: Optional[datetime] = None
#     venue: Optional[str] = None
#     registration_link: Optional[str] = None
#     max_participants: Optional[int] = None
#     event_type: Optional[str] = None
#     is_public: bool = True
#     tags: Optional[List[str]] = None


# class ClubEventCreate(ClubEventBase):
#     pass


# class ClubEventUpdate(BaseModel):
#     title: Optional[str] = None
#     description: Optional[str] = None
#     event_date: Optional[datetime] = None
#     end_date: Optional[datetime] = None
#     venue: Optional[str] = None
#     registration_link: Optional[str] = None
#     max_participants: Optional[int] = None
#     event_type: Optional[str] = None
#     is_public: Optional[bool] = None
#     status: Optional[str] = None
#     tags: Optional[List[str]] = None


# class ClubEventResponse(ClubEventBase):
#     id: int
#     club_id: int
#     created_by: int
#     created_at: datetime
#     status: str
#     current_participants: int
#     is_registered: bool
#     club_name: str
    
#     class Config:
#         from_attributes = True


# # Announcement Schemas
# class ClubAnnouncementBase(BaseModel):
#     title: str = Field(..., max_length=200)
#     content: str
#     priority: str = 'normal'
#     is_pinned: bool = False
#     expires_at: Optional[datetime] = None
#     target_audience: Optional[Dict[str, List[str]]] = None


# class ClubAnnouncementCreate(ClubAnnouncementBase):
#     pass


# class ClubAnnouncementUpdate(BaseModel):
#     title: Optional[str] = None
#     content: Optional[str] = None
#     priority: Optional[str] = None
#     is_pinned: Optional[bool] = None
#     expires_at: Optional[datetime] = None


# class ClubAnnouncementResponse(ClubAnnouncementBase):
#     id: int
#     club_id: int
#     created_by: int
#     created_at: datetime
#     club_name: str
    
#     class Config:
#         from_attributes = True


# # Photo Schemas
# class ClubPhotoBase(BaseModel):
#     caption: Optional[str] = None
#     album_name: Optional[str] = None


# class ClubPhotoCreate(ClubPhotoBase):
#     image_url: str
#     event_id: Optional[int] = None


# class ClubPhotoResponse(ClubPhotoBase):
#     id: int
#     club_id: int
#     event_id: Optional[int]
#     image_url: str
#     uploaded_by: int
#     uploaded_at: datetime
    
#     class Config:
#         from_attributes = True


# # Achievement Schemas
# class ClubAchievementBase(BaseModel):
#     title: str = Field(..., max_length=200)
#     description: Optional[str] = None
#     achieved_date: Optional[date] = None
#     evidence_url: Optional[str] = None


# class ClubAchievementCreate(ClubAchievementBase):
#     pass


# class ClubAchievementResponse(ClubAchievementBase):
#     id: int
#     club_id: int
#     created_at: datetime
    
#     class Config:
#         from_attributes = True


# # Admin Schemas
# class AdminUserCreate(BaseModel):
#     user_id: int
#     admin_level: str
#     permissions: Optional[Dict[str, bool]] = None


# class AdminUserResponse(BaseModel):
#     id: int
#     user_id: int
#     admin_level: str
#     permissions: Dict[str, bool]
#     created_at: datetime
#     last_login: Optional[datetime]
#     is_active: bool
    
#     class Config:
#         from_attributes = True