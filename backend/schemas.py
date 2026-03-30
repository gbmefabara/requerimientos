from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class PainLogBase(BaseModel):
    intensity: int

class PainLogCreate(PainLogBase):
    pass

class PainLog(PainLogBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True

class ExerciseCompletionBase(BaseModel):
    exercise_id: int

class ExerciseCompletion(ExerciseCompletionBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        from_attributes = True

class ExerciseBase(BaseModel):
    title: str
    description: str
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    body_part: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[int] = None

class Exercise(ExerciseBase):
    id: int

    class Config:
        from_attributes = True

class TreatmentBase(BaseModel):
    name: str
    description: str

class Treatment(TreatmentBase):
    id: int

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_completions: int
    current_streak: int
    last_pain_level: Optional[int]
