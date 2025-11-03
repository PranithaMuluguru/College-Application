# reset_db.py
from newapp.database import SessionLocal, engine
from newapp import models

if __name__ == "__main__":
    print("WARNING: This will delete ALL data in the database!")
    confirm = input("Type 'YES' to continue: ")
    
    if confirm == "YES":
        print("Dropping all tables...")
        models.Base.metadata.drop_all(bind=engine)
        print("Recreating all tables...")
        models.Base.metadata.create_all(bind=engine)
        
        # Optionally reinitialize some data
        db = SessionLocal()
        try:
            # You can call your data population functions here
            # from main import populate_mess_menu_data
            # populate_mess_menu_data(db)
            print("Database tables have been reset!")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            db.close()
    else:
        print("Operation cancelled.")