from fastapi import APIRouter,Depends,HTTPException
import requests
from sqlalchemy.orm import Session
from .. import models,auth
from ..database import SessionLocal
from pydantic import BaseModel

router = APIRouter()

MOODLE_URL = ""
MOODLE_SERVICE = ""

class MoodleLogin(BaseModel):
    username: str
    password: str
def  get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.post("/moodle-login")
def moodle_login(credentials: MoodleLogin, db: Session = Depends(get_db)):
    payload = {
        'username': credentials.username,
        'password': credentials.password,
        'service': MOODLE_SERVICE
    }
    try:
        response = request.post(f"{MOODLE_URL}/login/token.php", data=payload)
        data  =response.json()
    except:
        raise HTTPException(status_code=500, detail="Error connecting to Moodle")   

    if "token" not in data:
        raise HTTPException(status_code=400, detail="Invalid Moodle credentials")

    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user:
        user =models.User(username=credentials.username,email=f"{credentials.username}@smail.iitpkd.ac.in",hashed_password=auth.hashed_password('dummy_passowrd'))
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "moodle_token": data["token"]}