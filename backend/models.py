from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)

    pain_logs = relationship("PainLog", back_populates="user")
    completions = relationship("ExerciseCompletion", back_populates="user")

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    video_url = Column(String)
    image_url = Column(String)
    
    # Nuevos campos para Fase 2
    body_part = Column(String, index=True) # ej: "lumbar", "hombro"
    difficulty = Column(String) # "Baja", "Media", "Alta"
    duration = Column(Integer) # Minutos

    completions = relationship("ExerciseCompletion", back_populates="exercise")


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)

class PainLog(Base):
    __tablename__ = "pain_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    intensity = Column(Integer)
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pain_logs")

class ExerciseCompletion(Base):
    __tablename__ = "exercise_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="completions")
    exercise = relationship("Exercise", back_populates="completions")
