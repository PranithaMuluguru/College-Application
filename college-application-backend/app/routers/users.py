from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,EmailStr
from sqlalchemy.orm import Session

from ..database import SessionLocal,engine,Base
from ..  import models,auth

from fastapi.security import OAuth2PasswordRequestForm

Base.metadata.create_all(bind=engine)



router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



class UserCreate(BaseModel):
    username:str
    email:EmailStr
    password:str

@router.post("/register")
def register(user:UserCreate,db:Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code = 400,detail="Email already registered/exists")
    hashed_password = auth.hash_password(user.password)
    new_user = models.User(username = user.username,email = user.email,hashed_password = hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id":new_user.id,"email":new_user.email,"username":new_user.username}

@router.post("/login")
def login(form_data:OAuth2PasswordRequestForm = Depends(),db:Session =Depends(get_db)):
    user = db.query(models.User).filter(models.User.username ==form_data.username).first()
    if not  user or not auth.verify_password(form_data.password,user.hashed_password):
        raise HTTPException(status_code = 401,detail = "Invalid credentials")
    token = auth.create_access_token({"sub":str(user.id)})
    return {"access_token":token,"token_type":"bearer"}