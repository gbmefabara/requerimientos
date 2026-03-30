from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import models, database, schemas
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from datetime import datetime, timedelta


app = FastAPI(title="PhysioCare API")

# Serve static files for exercises
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/exercises", StaticFiles(directory=os.path.join(os.path.dirname(BASE_DIR), "frontend", "exercises")), name="exercises")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper to get the default user (Juan)
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == "juan@example.com").first()
    if not user:
        # Should be created by init_db.py
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/")
def read_root():
    return {"message": "Welcome to PhysioCare API"}

@app.get("/user/me", response_model=schemas.User)
def get_me(user: models.User = Depends(get_current_user)):
    return user

@app.get("/exercises", response_model=List[schemas.Exercise])
def get_exercises(db: Session = Depends(get_db)):
    return db.query(models.Exercise).all()

@app.get("/treatments", response_model=List[schemas.Treatment])
def get_treatments(db: Session = Depends(get_db)):
    return db.query(models.Treatment).all()

@app.post("/user/me/pain", response_model=schemas.PainLog)
def log_pain(pain: schemas.PainLogCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_pain = models.PainLog(user_id=user.id, intensity=pain.intensity)
    db.add(db_pain)
    db.commit()
    db.refresh(db_pain)
    return db_pain

@app.get("/user/me/history", response_model=List[schemas.PainLog])
def get_pain_history(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    # Last month by default
    month_ago = datetime.utcnow() - timedelta(days=30)
    return db.query(models.PainLog)\
             .filter(models.PainLog.user_id == user.id, models.PainLog.date >= month_ago)\
             .order_by(models.PainLog.date.asc())\
             .all()

@app.post("/user/me/complete/{exercise_id}", response_model=schemas.ExerciseCompletion)
def complete_exercise(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_completion = models.ExerciseCompletion(user_id=user.id, exercise_id=exercise_id)
    db.add(db_completion)
    db.commit()
    db.refresh(db_completion)
    return db_completion

@app.get("/user/me/stats", response_model=schemas.UserStats)
def get_user_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    total = db.query(models.ExerciseCompletion).filter(models.ExerciseCompletion.user_id == user.id).count()
    last_pain = db.query(models.PainLog).filter(models.PainLog.user_id == user.id)\
                  .order_by(desc(models.PainLog.date)).first()
    
    # Calculate streak (consecutive days with completions)
    completions = db.query(models.ExerciseCompletion.date)\
                    .filter(models.ExerciseCompletion.user_id == user.id)\
                    .order_by(desc(models.ExerciseCompletion.date)).all()
    
    streak = 0
    if completions:
        current_date = datetime.utcnow().date()
        unique_dates = sorted(list(set([c[0].date() for c in completions])), reverse=True)
        
        # Check if completed today or yesterday
        if unique_dates[0] == current_date or unique_dates[0] == current_date - timedelta(days=1):
            streak = 1
            for i in range(len(unique_dates) - 1):
                if unique_dates[i] - timedelta(days=1) == unique_dates[i+1]:
                    streak += 1
                else:
                    break
    
    return {
        "total_completions": total,
        "current_streak": streak,
        "last_pain_level": last_pain.intensity if last_pain else None
    }

@app.post("/chat/send")
def send_message(message: str):
    msg = message.lower()
    if "dolor" in msg or "duele" in msg:
        reply = "Siento mucho que tengas dolor. ¿Podrías indicarme del 1 al 10 qué tan intenso es en este momento?"
    elif "ejercicio" in msg or "rutina" in msg:
        reply = "Tengo varias rutinas preparadas para ti. ¿En qué zona del cuerpo te gustaría enfocarte hoy?"
    elif "lumbar" in msg or "espalda" in msg:
        reply = "Para la zona lumbar, te recomiendo el 'Estiramiento Lumbar' que ves en la sección de ejercicios. ¿Quieres que te explique cómo hacerlo?"
    else:
        reply = "Entiendo. Estoy aquí para ayudarte con tu rehabilitación. ¿Tienes alguna duda específica sobre tus ejercicios?"
    
    return {"status": "Message sent", "reply": reply}

