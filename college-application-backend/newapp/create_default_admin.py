# create_default_admin.py
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from newapp.database import SessionLocal, engine
from newapp import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_default_admin():
    """Create default admin user if not exists"""
    db = SessionLocal()
    try:
        # Check if super admin already exists
        existing_user = db.query(models.User).filter(
            models.User.college_id == "DEFAULT_ADMIN"
        ).first()
        
        if existing_user:
            print("✓ Default admin already exists")
            return existing_user.id
        
        # Create default admin user
        email = "admin@college.edu"
        college_id = "DEFAULT_ADMIN"
        password = "admin123"
        
        hashed_password = pwd_context.hash(password)
        
        # Create user WITHOUT is_active field
        user = models.User(
            email=email,
            college_id=college_id,
            hashed_password=hashed_password,
            full_name="Default Administrator",
            department="Administration",
            year=1,
            is_verified=True
            # Remove: is_active=True  ← This field doesn't exist
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create admin profile
        admin = models.AdminUser(
            user_id=user.id,
            admin_level="super_admin",
            permissions={}
        )
        db.add(admin)
        db.commit()
        
        print("\n" + "="*50)
        print("✅ DEFAULT ADMIN CREATED")
        print("="*50)
        print(f"Email: {email}")
        print(f"College ID: {college_id}")
        print(f"Password: {password}")
        print("="*50)
        print("\n⚠️  Change this password after first login!")
        
        return user.id
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating default admin: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def ensure_tables():
    """Ensure database tables exist"""
    try:
        models.Base.metadata.create_all(bind=engine)
        print("✓ Database tables verified/created")
    except Exception as e:
        print(f"✗ Error creating tables: {str(e)}")

if __name__ == "__main__":
    print("Setting up default admin...")
    ensure_tables()
    create_default_admin()