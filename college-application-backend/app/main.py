from fastapi import FastAPI,Depends,HTTPException
from pydantic import BaseModel,EmailStr
from sqlalchemy.orm import Session

from .routers import users,moodle


# Base.metadata.create_all(bind=engine)



app = FastAPI()
app.include_router(users.router,prefix="/users")
app.include_router(moodle.router,prefix="/moodle")