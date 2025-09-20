from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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
