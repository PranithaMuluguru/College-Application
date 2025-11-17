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


# test_study_buddy.py
import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    user_id = 1  # Change to your actual user ID
    
    print("=== TESTING STUDY BUDDY API ===")
    
    # Test 1: Get preferences
    try:
        response = requests.get(f"{base_url}/ai/preferences/{user_id}")
        print(f"✅ GET preferences: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Has preferences: {data.get('has_preferences', False)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ GET preferences failed: {e}")
    
    # Test 2: Get study buddies
    try:
        response = requests.get(f"{base_url}/ai/study-buddies/{user_id}?course_code=CS11321")
        print(f"✅ GET study buddies: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} matches")
            for match in data[:3]:  # Show first 3
                print(f"  - {match['full_name']} ({match['match_score']:.1f}%)")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ GET study buddies failed: {e}")

if __name__ == "__main__":
    test_api()