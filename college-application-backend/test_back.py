# # recreate_clubs_table.py
# from newapp.database import engine, SessionLocal
# from newapp.models import Base, Club
# from sqlalchemy import text

# print("🔥 Recreating clubs table from scratch...")

# # Drop the broken table
# with engine.connect() as conn:
#     try:
#         conn.execute(text("DROP TABLE IF EXISTS clubs"))
#         conn.execute(text("DROP TABLE IF EXISTS club_events"))
#         conn.execute(text("DROP TABLE IF EXISTS club_announcements"))
#         conn.execute(text("DROP TABLE IF EXISTS club_followers"))
#         conn.execute(text("DROP TABLE IF EXISTS event_registrations"))
#         conn.execute(text("DROP TABLE IF EXISTS event_likes"))
#         conn.commit()
#         print("✅ Dropped old tables")
#     except Exception as e:
#         print(f"Error dropping tables: {e}")

# # Recreate the clubs table with proper schema
# Club.__table__.create(engine, checkfirst=True)
# print("✅ Created clubs table with all columns")

# # Verify
# with engine.connect() as conn:
#     result = conn.execute(text("PRAGMA table_info(clubs)"))
#     columns = [row[1] for row in result.fetchall()]
#     print(f"\n✅ Clubs table columns: {columns}")
    
#     expected = ['id', 'name', 'category', 'description', 'logo_url', 'cover_url', 
#                 'club_head_id', 'is_active', 'created_at', 'updated_at']
    
#     missing = set(expected) - set(columns)
#     if missing:
#         print(f"❌ Still missing columns: {missing}")
#     else:
#         print("✅ All columns present!")

# print("\n🎯 Done! Restart your FastAPI server now.")


# check_table.py
# import sqlite3

# def check_study_preferences_table(db_path="college_app.db"):
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()
    
#     # Check if table exists
#     cursor.execute("""
#         SELECT name FROM sqlite_master 
#         WHERE type='table' AND name='study_preferences'
#     """)
    
#     if not cursor.fetchone():
#         print("❌ Study preferences table doesn't exist!")
#         return
    
#     print("✅ Study preferences table exists!")
    
#     # Get table schema
#     cursor.execute("PRAGMA table_info(study_preferences)")
#     columns = cursor.fetchall()
    
#     print("\nTable columns:")
#     for col in columns:
#         print(f"  {col[1]} ({col[2]}) - {'NOT NULL' if col[3] else 'NULL'}")
    
#     conn.close()

# if __name__ == "__main__":
#     check_study_preferences_table()

# database_helper.py
import sqlite3
from datetime import datetime

def check_database_structure(db_path="college_app.db"):
    """Check and report database structure"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== DATABASE STRUCTURE CHECK ===")
    
    # Check all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"Total tables: {len(tables)}")
    
    # Check key tables
    key_tables = ['users', 'course_enrollments', 'course_catalog', 'study_preferences']
    for table_name in key_tables:
        table_exists = any(t[0] == table_name for t in tables)
        status = "✅" if table_exists else "❌"
        print(f"{status} {table_name}: {table_exists}")
        
        if table_exists:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print(f"   Columns: {len(columns)}")
            for col in columns[:5]:  # Show first 5 columns
                print(f"     - {col[1]} ({col[2]})")
    
    # Check sample data
    print("\n=== SAMPLE DATA ===")
    try:
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"Users: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM course_enrollments")
        enrollment_count = cursor.fetchone()[0]
        print(f"Enrollments: {enrollment_count}")
        
        cursor.execute("SELECT COUNT(*) FROM study_preferences")
        pref_count = cursor.fetchone()[0]
        print(f"Study preferences: {pref_count}")
    except Exception as e:
        print(f"Data check failed: {e}")
    
    conn.close()

def create_missing_tables(db_path="app.db"):
    """Create any missing tables"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== CREATING MISSING TABLES ===")
    
    # Create study_preferences if missing
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='study_preferences'
    """)
    
    if not cursor.fetchone():
        print("Creating study_preferences table...")
        cursor.execute("""
            CREATE TABLE study_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                study_environment TEXT,
                preferred_study_time TEXT,
                learning_style TEXT,
                session_duration INTEGER DEFAULT 120,
                group_size TEXT DEFAULT 'small',
                communication_style TEXT DEFAULT 'balanced',
                primary_goal TEXT DEFAULT 'improve_grades',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id)
            )
        """)
        
        # Create trigger for auto-updating updated_at
        cursor.execute("""
            CREATE TRIGGER update_study_preferences_timestamp 
            AFTER UPDATE ON study_preferences
            FOR EACH ROW
            BEGIN
                UPDATE study_preferences 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = OLD.id;
            END
        """)
        
        print("✅ study_preferences table created")
    
    conn.commit()
    conn.close()
    print("Database check complete!")

if __name__ == "__main__":
    check_database_structure()
    create_missing_tables()