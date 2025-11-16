from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Float,
    Text,
    Enum as SQLAlchemyEnum,
    Date,
    ForeignKey,
    UniqueConstraint,
    JSON,
    or_,
    and_,
)
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, JSON, Date, UniqueConstraint

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, 
    ForeignKey, JSON, Date, Float
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

# Enum definitions
class DayOfWeek(enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class MealType(enum.Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    SNACKS = "Snacks"
    DINNER = "Dinner"

class MenuWeekType(enum.Enum):
    WEEK_1 = "Week 1"
    WEEK_2 = "Week 2"

class EventType(enum.Enum):
    ACADEMIC = "Academic"
    EXAM = "Exam"
    ASSIGNMENT = "Assignment"
    CLUB = "Club"
    SPORTS = "Sports"
    CULTURAL = "Cultural"
    WORKSHOP = "Workshop"
    OTHER = "Other"
# Add missing columns

# Main User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    college_id = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    phone_number = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    calendar_events = relationship("CalendarEvent", back_populates="user")
    chat_history = relationship(
        "ChatHistory", back_populates="user", cascade="all, delete-orphan"
    )
    unanswered_queries = relationship(
        "UnansweredQuestion", back_populates="user", cascade="all, delete-orphan"
    )
    attendance_records = relationship("AttendanceRecord", back_populates="user")
    timetable_entries = relationship("TimetableEntry", back_populates="user")
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")


    # Social relationships
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")
    
    # Chat relationships
    created_groups = relationship("ChatGroup", back_populates="creator")
    group_memberships = relationship("GroupMember", back_populates="user")
    sent_messages = relationship("ChatMessage", back_populates="sender")
    
    # Feed relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    
    # Discussion relationships
    discussions = relationship("Discussion", back_populates="author", cascade="all, delete-orphan")
    discussion_replies = relationship("DiscussionReply", back_populates="author", cascade="all, delete-orphan")
    
    # Notifications
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    study_preference = relationship("StudyPreference", back_populates="user", uselist=False)

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    course_name = Column(String, nullable=False)
    teacher = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)  # Add start date
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="courses")
    timetable_entries = relationship("TimetableEntry", back_populates="course")

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)  # Add this
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    course_name = Column(String, nullable=False)
    teacher = Column(String, nullable=False)
    room_number = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="timetable_entries")
    course = relationship("Course", back_populates="timetable_entries")  # Add this
    attendance_records = relationship(
        "AttendanceRecord", back_populates="timetable_entry"
    )

class ExamEntry(Base):
    __tablename__ = "exam_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    room_number = Column(String, nullable=False)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class GradeEntry(Base):
    __tablename__ = "grade_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_name = Column(String, nullable=False)
    credits = Column(Float, nullable=False)
    grade = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    category_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class MessMenuItem(Base):
    __tablename__ = "mess_menu_items"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(SQLAlchemyEnum(DayOfWeek), nullable=False)
    meal_type = Column(SQLAlchemyEnum(MealType), nullable=False)
    menu_week_type = Column(SQLAlchemyEnum(MenuWeekType), nullable=False)
    item_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    rating = Column(Float, nullable=True, default=0.0)
    votes = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_type = Column(SQLAlchemyEnum(EventType), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    is_all_day = Column(Boolean, default=False)
    reminder_minutes = Column(Integer, default=30)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="calendar_events")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)
    confidence_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)  # ⭐ Added title field

    source_url = Column(String(500), nullable=True)
    keywords = Column(Text, nullable=True)  # Comma-separated keywords
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class QuestionStatus(enum.Enum):
    UNANSWERED = "unanswered"
    RESEARCHING = "researching"
    ANSWERED = "answered"
    DUPLICATE = "duplicate"

class UnansweredQuestion(Base):
    __tablename__ = "unanswered_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    ask_count = Column(Integer, default=1)
    status = Column(SQLAlchemyEnum(QuestionStatus), default=QuestionStatus.UNANSWERED)
    confidence_score = Column(Float, nullable=True)
    similar_question_id = Column(Integer, nullable=True)  # For duplicate detection
    admin_answer = Column(Text, nullable=True)
    last_asked = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="unanswered_queries")

# Attendance Status Enum
class AttendanceStatus(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    CANCELLED = "cancelled"

# Attendance Record Model
class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timetable_entry_id = Column(
        Integer, ForeignKey("timetable_entries.id"), nullable=False
    )
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="attendance_records")
    timetable_entry = relationship("TimetableEntry", back_populates="attendance_records")

# Add these new enums
class FollowStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class NotificationType(enum.Enum):
    FOLLOW_REQUEST = "follow_request"
    FOLLOW_ACCEPTED = "follow_accepted"
    NEW_MESSAGE = "new_message"
    GROUP_ADDED = "group_added"
    POST_LIKE = "post_like"
    POST_COMMENT = "post_comment"
    POST_MENTION = "post_mention"
    DISCUSSION_REPLY = "discussion_reply"
    EVENT_REMINDER = "event_reminder"
    ADMIN_BROADCAST = "admin_broadcast"

class DiscussionVisibility(enum.Enum):
    PUBLIC = "public"
    RESTRICTED = "restricted"

class ChatType(enum.Enum):
    DIRECT = "direct"
    GROUP = "group"

# New Models

class Follow(Base):
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLAlchemyEnum(FollowStatus), default=FollowStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")

class ChatGroup(Base):
    __tablename__ = "chat_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    chat_type = Column(SQLAlchemyEnum(ChatType), default=ChatType.GROUP)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    creator = relationship("User", back_populates="created_groups")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="group", cascade="all, delete-orphan")

class GroupMember(Base):
    __tablename__ = "group_members"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # member, admin
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("ChatGroup", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("chat_groups.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, image, video, file
    media_url = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("ChatGroup", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    media_type = Column(String, nullable=True)  # image, video
    is_announcement = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan",passive_deletes=True)
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan",passive_deletes=True)

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id",ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("Post", back_populates="comments")
    author = relationship("User", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id",ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")

class Discussion(Base):
    __tablename__ = "discussions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    topic = Column(String, nullable=False)  # hashtag
    content = Column(Text, nullable=False)
    visibility = Column(SQLAlchemyEnum(DiscussionVisibility), default=DiscussionVisibility.PUBLIC)
    allowed_departments = Column(String, nullable=True)  # comma-separated
    allowed_years = Column(String, nullable=True)  # comma-separated
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    author = relationship("User", back_populates="discussions")
    replies = relationship("DiscussionReply", back_populates="discussion", cascade="all, delete-orphan")

class DiscussionReply(Base):
    __tablename__ = "discussion_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_reply_id = Column(Integer, ForeignKey("discussion_replies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    discussion = relationship("Discussion", back_populates="replies")
    author = relationship("User", back_populates="discussion_replies")
    parent = relationship("DiscussionReply", remote_side=[id], backref="child_replies")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SQLAlchemyEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_id = Column(Integer, nullable=True)  # ID of related post/message/event
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
class DiscussionParticipant(Base):
    __tablename__ = "discussion_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('discussion_id', 'user_id', name='unique_participant'),
    )
# models.py


class MarketplaceItem(Base):
    __tablename__ = 'marketplace_items'
    
    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    condition = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    images = Column(JSON, default=[])
    status = Column(String(20), default='active')
    views = Column(Integer, default=0)
    is_negotiable = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    seller = relationship('User', backref='marketplace_items')
    saved_by = relationship('SavedItem', backref='item', cascade='all, delete-orphan')
    
class SavedItem(Base):
    __tablename__ = 'saved_items'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    item_id = Column(Integer, ForeignKey('marketplace_items.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', backref='saved_items')

class MarketplaceChat(Base):
    __tablename__ = 'marketplace_chats'
    
    id = Column(Integer, primary_key=True)
    item_id = Column(Integer, ForeignKey('marketplace_items.id'), nullable=True)
    buyer_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    seller_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    last_message = Column(Text)
    last_message_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    item = relationship('MarketplaceItem', backref='chats')
    buyer = relationship('User', foreign_keys=[buyer_id], backref='buyer_chats')
    seller = relationship('User', foreign_keys=[seller_id], backref='seller_chats')
    messages = relationship('MarketplaceMessage', backref='chat', cascade='all, delete-orphan')

class MarketplaceMessage(Base):
    __tablename__ = 'marketplace_messages'
    
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('marketplace_chats.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default='text')
    offer_amount = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship('User', backref='marketplace_messages')

# Update User model with new relationships
# Add these to your existing User class:
"""
    # Social relationships
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower")
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following")
    
    # Chat relationships
    created_groups = relationship("ChatGroup", back_populates="creator")
    group_memberships = relationship("GroupMember", back_populates="user")
    sent_messages = relationship("ChatMessage", back_populates="sender")
    
    # Feed relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    
    # Discussion relationships
    discussions = relationship("Discussion", back_populates="author", cascade="all, delete-orphan")
    discussion_replies = relationship("DiscussionReply", back_populates="author", cascade="all, delete-orphan")
    
    # Notifications
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
"""#####





############################ ADMINN MODELS BELOW THIS LINE ############################

#Add to your existing models.py

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    admin_level = Column(String, default="admin")  # admin, super_admin
    permissions = Column(JSON, default={})  # Custom permissions
    created_by = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", backref="admin_profile")
    created_by_admin = relationship("AdminUser", remote_side=[id], backref="created_admins")

class AdminActivityLog(Base):
    __tablename__ = "admin_activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)  # user, post, marketplace, etc.
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    admin = relationship("AdminUser", backref="activity_logs")




# Add these to your models.py

class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=False)  # Sports, Technical, Cultural
    description = Column(Text, nullable=False)
    logo_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    club_head_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    club_head = relationship("User", backref="headed_clubs")
    events = relationship("ClubEvent", back_populates="club", cascade="all, delete-orphan")
    announcements = relationship("ClubAnnouncement", back_populates="club", cascade="all, delete-orphan")
    followers = relationship("ClubFollower", back_populates="club", cascade="all, delete-orphan")

class ClubEvent(Base):
    __tablename__ = "club_events"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    event_date = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    registration_required = Column(Boolean, default=False)
    max_participants = Column(Integer, nullable=True)
    status = Column(String, default="scheduled")  # scheduled, ongoing, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    club = relationship("Club", back_populates="events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    likes = relationship("EventLike", back_populates="event", cascade="all, delete-orphan")

class ClubAnnouncement(Base):
    __tablename__ = "club_announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String, default="normal")  # low, normal, high
    created_at = Column(DateTime, default=datetime.utcnow)
    
    club = relationship("Club", back_populates="announcements")

class ClubFollower(Base):
    __tablename__ = "club_followers"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    club = relationship("Club", back_populates="followers")
    user = relationship("User", backref="followed_clubs")
    
    __table_args__ = (
        UniqueConstraint('club_id', 'user_id', name='unique_club_follower'),
    )

class EventRegistration(Base):
    __tablename__ = "event_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("club_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    event = relationship("ClubEvent", back_populates="registrations")
    user = relationship("User", backref="event_registrations")
    
    __table_args__ = (
        UniqueConstraint('event_id', 'user_id', name='unique_event_registration'),
    )

class EventLike(Base):
    __tablename__ = "event_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("club_events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    event = relationship("ClubEvent", back_populates="likes")
    user = relationship("User", backref="liked_events")
    
    __table_args__ = (
        UniqueConstraint('event_id', 'user_id', name='unique_event_like'),
    )
# Add these imports at the top if not present


# ==================== COURSE MANAGEMENT MODELS ====================

class CourseCatalog(Base):
    __tablename__ = "course_catalog"
    
    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), unique=True, nullable=False, index=True)
    course_name = Column(String(200), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    credits = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    year = Column(Integer, nullable=False, index=True)  # 1, 2, 3, 4
    semester = Column(Integer, nullable=False, index=True)  # 1, 2
    prerequisites = Column(Text, nullable=True)  # JSON string of prerequisite course codes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollments = relationship("CourseEnrollment", back_populates="course")
    study_groups = relationship("StudyGroup", back_populates="course")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("course_catalog.id"), nullable=False)
    year = Column(Integer, nullable=False)  # Academic year (e.g., 2024)
    semester = Column(Integer, nullable=False)  # 1 or 2
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", backref="course_enrollments")
    course = relationship("CourseCatalog", back_populates="enrollments")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', 'year', 'semester', name='unique_enrollment'),
    )


class StudyGroup(Base):
    __tablename__ = "study_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_group_id = Column(Integer, ForeignKey("chat_groups.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("course_catalog.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    max_size = Column(Integer, default=6)
    meeting_schedule = Column(JSON, nullable=True)  # {"days": ["Mon", "Wed"], "time": "18:00-20:00"}
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chat_group = relationship("ChatGroup", backref="study_group")
    course = relationship("CourseCatalog", back_populates="study_groups")
    creator = relationship("User", backref="created_study_groups")


class StudyBuddyRequest(Base):
    """Track study buddy requests"""
    __tablename__ = "study_buddy_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_code = Column(String, nullable=False)
    message = Column(Text)
    status = Column(String, default='pending')  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


    # Add these to your models.py - These are the ONLY missing ones

class StudyPreference(Base):
    """Study preferences for matching algorithm"""
    __tablename__ = "study_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Study environment
    study_environment = Column(String, default='quiet')  # quiet, social, library, cafe
    
    # Time preferences
    preferred_study_time = Column(String, default='evening')  # morning, afternoon, evening, night
    
    # Learning style
    learning_style = Column(String, default='visual')  # visual, auditory, kinesthetic, reading
    
    # Session preferences
    session_duration = Column(Integer, default=120)  # minutes: 30, 60, 120, 180
    
    # Group size
    group_size = Column(String, default='small')  # solo, small (2-3), medium (4-6), large (7+)
    
    # Communication style
    communication_style = Column(String, default='balanced')  # silent, minimal, balanced, collaborative
    
    # Primary goal
    primary_goal = Column(String, default='improve_grades')  # improve_grades, understand_concepts, exam_prep, project_help
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="study_preference")


class StudyGoal(Base):
    """Individual and collaborative study goals"""
    __tablename__ = "study_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_code = Column(String, nullable=False)
    target_grade = Column(String)
    target_date = Column(DateTime)
    description = Column(Text)
    is_collaborative = Column(Boolean, default=False)
    status = Column(String, default='active')  # active, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    creator = relationship("User", foreign_keys=[created_by])
    participants = relationship("StudyGoalParticipant", back_populates="goal")


class StudyGoalParticipant(Base):
    """Many-to-many for collaborative goals"""
    __tablename__ = "study_goal_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("study_goals.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    goal = relationship("StudyGoal", back_populates="participants")
    user = relationship("User")


# Add ONLY this line to your existing User class:
# Inside class User(Base):
#     study_preference = relationship("StudyPreference", back_populates="user", uselist=False)