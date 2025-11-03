# # Create a file: run_scraper.py
# from newapp.database import SessionLocal
# from newapp.web_scraper import scrape_iitpkd_website

# db = SessionLocal()
# try:
#     print("Starting scraper...")
#     scrape_iitpkd_website(db)
#     print("Done!")
# finally:
#     db.close()

# In Python console or script
# from newapp.database import engine
# from newapp import models

# # Drop the tables
# models.KnowledgeBase.__table__.drop(engine, checkfirst=True)
# models.UnansweredQuestion.__table__.drop(engine, checkfirst=True)

# Recreate with new schema
# models.Base.metadata.create_all(bind=engine)

from newapp.database import engine
from newapp import models

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)