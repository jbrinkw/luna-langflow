import os
import psycopg2
import psycopg2.extras
import uuid
from datetime import datetime, date, timedelta

# Database configuration
DB_HOST = os.environ.get("DB_HOST", "192.168.1.93")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "workout_tracker")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

# Connection helper
def get_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    conn.autocommit = False
    return conn

# Initialize database with schema
SCHEMA = """
DROP TABLE IF EXISTS completed_sets CASCADE;
DROP TABLE IF EXISTS planned_sets CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS timer CASCADE;

CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE daily_logs (
    id TEXT PRIMARY KEY,
    log_date DATE NOT NULL UNIQUE,
    summary TEXT
);

CREATE TABLE planned_sets (
    id SERIAL PRIMARY KEY,
    log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    order_num INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    load REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_planned_order ON planned_sets (log_id, order_num);

CREATE TABLE completed_sets (
    id SERIAL PRIMARY KEY,
    log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    reps_done INTEGER,
    load_done REAL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_completed_time ON completed_sets (log_id, completed_at);

CREATE TABLE timer (
    id SERIAL PRIMARY KEY,
    timer_end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def init_db(sample: bool = False):
    """Create a new database schema. If sample=True, populate with demo data."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        # Execute schema (drops and recreates tables)
        cur.execute(SCHEMA)
        if sample:
            populate_comprehensive_sample_data(conn)
        conn.commit()
    finally:
        conn.close()


def populate_comprehensive_sample_data(conn):
    """Create comprehensive 3-day MMA-focused workout data with dynamic dates"""
    
    # Create dates: current day, current day - 1, current day - 2
    today = date.today()
    dates = [today - timedelta(days=i) for i in range(3)]  # [today, yesterday, day before yesterday]
    dates.reverse()  # [day before yesterday, yesterday, today]
    
    # Create daily logs
    log_ids = []
    summaries = [
        "Solid upper body session. Push-ups felt strong, pull-ups getting easier. Bench press moved well at 135. Ready for legs tomorrow.",
        "Tough leg day. Squats felt heavy but good form. Deadlifts strong for first 2 sets, skipped last set due to form breakdown. Conditioning work tomorrow.",
        ""  # Today - no summary yet
    ]
    
    cur = conn.cursor()
    for i, workout_date in enumerate(dates):
        log_id = str(uuid.uuid4())
        log_ids.append(log_id)
        cur.execute(
            "INSERT INTO daily_logs (id, log_date, summary) VALUES (%s, %s, %s)",
            (log_id, workout_date.isoformat(), summaries[i])
        )
    
    # Create exercises
    exercises = [
        "push-ups", "pull-ups", "bench press", "overhead press", "rows", "dips",
        "squats", "deadlifts", "bodyweight squats", "walking lunges", "calf raises", "plank",
        "burpees", "mountain climbers"
    ]
    
    exercise_ids = {}
    for exercise in exercises:
        cur.execute("INSERT INTO exercises (name) VALUES (%s) RETURNING id", (exercise,))
        exercise_ids[exercise] = cur.fetchone()[0]
    
    # Day 1 (2 days ago) - Upper Body Focus
    day1_planned = [
        ("push-ups", 1, 15, 0),
        ("push-ups", 2, 15, 0),
        ("push-ups", 3, 15, 0),
        ("pull-ups", 4, 8, 0),
        ("pull-ups", 5, 8, 0),
        ("pull-ups", 6, 8, 0),
        ("bench press", 7, 10, 135),
        ("bench press", 8, 10, 135),
        ("bench press", 9, 10, 135),
        ("overhead press", 10, 8, 95),
        ("overhead press", 11, 8, 95),
        ("overhead press", 12, 8, 95),
        ("rows", 13, 12, 115),
        ("rows", 14, 12, 115),
        ("rows", 15, 12, 115),
        ("dips", 16, 12, 0),
        ("dips", 17, 12, 0),
    ]
    
    day1_completed = [
        ("push-ups", 15, 0),
        ("push-ups", 15, 0),
        ("push-ups", 15, 0),
        ("pull-ups", 8, 0),
        ("pull-ups", 8, 0),
        ("pull-ups", 8, 0),
        ("bench press", 10, 135),
        ("bench press", 10, 135),
        ("bench press", 10, 135),
        ("overhead press", 8, 95),
        ("overhead press", 8, 95),
        ("overhead press", 8, 95),
        ("rows", 12, 115),
        ("rows", 12, 115),
        ("rows", 12, 115),
        ("dips", 12, 0),
        ("dips", 12, 0),
    ]
    
    # Day 2 (yesterday) - Lower Body Focus
    day2_planned = [
        ("squats", 1, 12, 185),
        ("squats", 2, 12, 185),
        ("squats", 3, 12, 185),
        ("squats", 4, 12, 185),
        ("deadlifts", 5, 8, 225),
        ("deadlifts", 6, 8, 225),
        ("deadlifts", 7, 8, 225),
        ("bodyweight squats", 8, 20, 0),
        ("bodyweight squats", 9, 20, 0),
        ("walking lunges", 10, 16, 0),
        ("walking lunges", 11, 16, 0),
        ("walking lunges", 12, 16, 0),
        ("calf raises", 13, 15, 45),
        ("calf raises", 14, 15, 45),
        ("calf raises", 15, 15, 45),
        ("plank", 16, 45, 0),
        ("plank", 17, 45, 0),
        ("plank", 18, 45, 0),
    ]
    
    day2_completed = [
        ("squats", 12, 185),
        ("squats", 12, 185),
        ("squats", 12, 185),
        ("squats", 12, 185),
        ("deadlifts", 8, 225),
        ("deadlifts", 8, 225),
        # Third deadlift set skipped
        ("bodyweight squats", 20, 0),
        ("bodyweight squats", 20, 0),
        ("walking lunges", 16, 0),
        ("walking lunges", 16, 0),
        ("walking lunges", 16, 0),
        ("calf raises", 15, 45),
        ("calf raises", 15, 45),
        ("calf raises", 15, 45),
        ("plank", 45, 0),
        ("plank", 45, 0),
        ("plank", 45, 0),
    ]
    
    # Day 3 (today) - Full Body/Conditioning
    day3_planned = [
        ("burpees", 1, 10, 0),
        ("burpees", 2, 10, 0),
        ("burpees", 3, 10, 0),
        ("burpees", 4, 10, 0),
        ("push-ups", 5, 12, 0),
        ("push-ups", 6, 12, 0),
        ("push-ups", 7, 12, 0),
        ("pull-ups", 8, 6, 0),
        ("pull-ups", 9, 6, 0),
        ("pull-ups", 10, 6, 0),
        ("bodyweight squats", 11, 15, 0),
        ("bodyweight squats", 12, 15, 0),
        ("bodyweight squats", 13, 15, 0),
        ("mountain climbers", 14, 20, 0),
        ("mountain climbers", 15, 20, 0),
        ("mountain climbers", 16, 20, 0),
        ("plank", 17, 60, 0),
        ("plank", 18, 60, 0),
        ("plank", 19, 60, 0),
    ]
    
    day3_completed = [
        ("burpees", 10, 0),
        ("burpees", 10, 0),
        ("push-ups", 12, 0),
        ("pull-ups", 6, 0),
        ("bodyweight squats", 15, 0),
        ("mountain climbers", 20, 0),
        ("plank", 60, 0),
    ]
    
    # Insert planned sets
    all_planned = [(day1_planned, log_ids[0]), (day2_planned, log_ids[1]), (day3_planned, log_ids[2])]
    for day_data, log_id in all_planned:
        for exercise, order_num, reps, load in day_data:
            exercise_id = exercise_ids[exercise]
            cur.execute(
                "INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (%s, %s, %s, %s, %s)",
                (log_id, exercise_id, order_num, reps, load)
            )
    
    # Insert completed sets
    all_completed = [(day1_completed, log_ids[0]), (day2_completed, log_ids[1]), (day3_completed, log_ids[2])]
    for day_data, log_id in all_completed:
        for exercise, reps, load in day_data:
            exercise_id = exercise_ids[exercise]
            # Use database default timestamp with timezone correction for sample data
            cur.execute(
                "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done, completed_at) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP - INTERVAL '4 hours')",
                (log_id, exercise_id, reps, load)
            )


def populate_sample_data(conn):
    """Legacy function - kept for compatibility"""
    return populate_comprehensive_sample_data(conn)


def get_today_log_id(conn):
    today = date.today().isoformat()
    cur = conn.cursor()
    cur.execute("SELECT id FROM daily_logs WHERE log_date = %s", (today,))
    row = cur.fetchone()
    if row:
        return row[0]
    log_id = str(uuid.uuid4())
    cur.execute("INSERT INTO daily_logs (id, log_date) VALUES (%s, %s)", (log_id, today))
    conn.commit()
    return log_id
