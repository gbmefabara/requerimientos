import database, models
from datetime import datetime, timedelta
import random

def init_db():
    # Clear existing tables for a clean start with new models
    database.Base.metadata.drop_all(bind=database.engine)
    database.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()

    # Add default user
    user = models.User(name="Juan", email="juan@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    # Add sample exercises for Phase 2
    exercises = [
        models.Exercise(title="Estiramiento Cervical", description="Libera la tensión acumulada en el cuello y trapecios.", body_part="cuello", difficulty="Baja", duration=5, video_url="https://example.com/cuello"),
        models.Exercise(title="Fortalecimiento Lumbar", description="Estabilización profunda para la espalda baja.", body_part="espalda", difficulty="Media", duration=12, video_url="https://example.com/lumbar"),
        models.Exercise(title="Movilidad de Hombros", description="Mejora el rango de movimiento articular.", body_part="hombros", difficulty="Baja", duration=8, video_url="https://example.com/hombros"),
        models.Exercise(title="Estabilización de Rodilla", description="Ideal para post-operatorios o recuperación de ligamentos.", body_part="rodillas", difficulty="Media", duration=15, video_url="https://example.com/rodillas"),
        models.Exercise(title="Apertura de Cadera", description="Mejora la flexibilidad y reduce el dolor pélvico.", body_part="cadera", difficulty="Media", duration=10, video_url="https://example.com/cadera"),
        models.Exercise(title="Refuerzo de Tobillos", description="Previene esguinces y mejora la propiocepción del pie.", body_part="pies", difficulty="Media", duration=6, video_url="https://example.com/pies"),
        models.Exercise(title="Core Avanzado", description="Control motor para estabilidad de la columna.", body_part="espalda", difficulty="Alta", duration=20, video_url="https://example.com/core"),
        models.Exercise(title="Rotadores de Hombro", description="Específico para lesiones del manguito rotador.", body_part="hombros", difficulty="Media", duration=10, video_url="https://example.com/rotadores"),
    ]

    db.add_all(exercises)
    
    # Add sample treatments
    treatments = [
        models.Treatment(name="Terapia Manual", description="Técnicas prácticas para la movilización de articulaciones y músculos."),
        models.Treatment(name="Electroterapia", description="Uso de energía eléctrica para la curación y alivio del dolor."),
    ]
    db.add_all(treatments)
    db.commit()

    # Add sample pain history (last 30 days)
    pain_logs = []
    base_date = datetime.utcnow()
    for i in range(30):
        # Create a trend: pain decreasing over time
        intensity = max(1, min(10, random.randint(5, 8) - (i // 5)))
        log_date = base_date - timedelta(days=29-i)
        pain_logs.append(models.PainLog(user_id=user.id, intensity=intensity, date=log_date))
    
    db.add_all(pain_logs)

    # Add sample exercise completions (last 10 days, with a streak)
    completions = []
    for i in range(10):
        # Complete 1-3 exercises per day
        daily_count = random.randint(1, 3)
        comp_date = base_date - timedelta(days=i)
        for _ in range(daily_count):
            ex = random.choice(exercises)
            completions.append(models.ExerciseCompletion(user_id=user.id, exercise_id=ex.id, date=comp_date))
    
    db.add_all(completions)
    
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
