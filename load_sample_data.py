#!/usr/bin/env python3
"""
Load sample data into PostgreSQL database.
This is the Python equivalent of load_sample_data.js
"""

import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import db_config


def generate_uuid():
    """Generate a UUID string"""
    return str(uuid.uuid4())


def get_connection():
    """Get PostgreSQL connection"""
    config = db_config.get_db_config()
    return psycopg2.connect(
        host=config['host'],
        port=config['port'],
        database=config['database'],
        user=config['user'],
        password=config['password']
    )


def load_sample_data():
    """Load sample data into the database"""
    print("Loading sample data...")
    
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Create schema (in case it doesn't exist)
        print("Creating schema...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS exercises (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            );
            CREATE TABLE IF NOT EXISTS daily_logs (
                id VARCHAR(255) PRIMARY KEY,
                log_date DATE NOT NULL UNIQUE,
                summary TEXT
            );
            CREATE TABLE IF NOT EXISTS planned_sets (
                id SERIAL PRIMARY KEY,
                log_id VARCHAR(255) REFERENCES daily_logs(id) ON DELETE CASCADE,
                exercise_id INTEGER REFERENCES exercises(id),
                order_num INTEGER NOT NULL,
                reps INTEGER NOT NULL,
                load REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS completed_sets (
                id SERIAL PRIMARY KEY,
                log_id VARCHAR(255) REFERENCES daily_logs(id) ON DELETE CASCADE,
                exercise_id INTEGER REFERENCES exercises(id),
                reps_done INTEGER,
                load_done REAL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Clear existing data
        print("Clearing existing data...")
        cur.execute("DELETE FROM completed_sets")
        cur.execute("DELETE FROM planned_sets")
        cur.execute("DELETE FROM exercises")
        cur.execute("DELETE FROM daily_logs")
        
        # Create today's log
        today = datetime.now().strftime('%Y-%m-%d')
        today_log_id = generate_uuid()
        cur.execute(
            "INSERT INTO daily_logs (id, log_date, summary) VALUES (%s, %s, %s)",
            (today_log_id, today, '')
        )
        print(f"Created daily log for {today}")
        
        # Create yesterday's log
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        yesterday_log_id = generate_uuid()
        cur.execute(
            "INSERT INTO daily_logs (id, log_date, summary) VALUES (%s, %s, %s)",
            (yesterday_log_id, yesterday, 'Great workout yesterday! Hit all my targets.')
        )
        print(f"Created daily log for {yesterday}")
        
        # Add exercises
        exercises = [
            'bench press',
            'squat',
            'deadlift'
        ]
        
        exercise_ids = {}
        for exercise_name in exercises:
            cur.execute(
                "INSERT INTO exercises (name) VALUES (%s) RETURNING id",
                (exercise_name,)
            )
            result = cur.fetchone()
            if result:
                exercise_id = result['id']
                exercise_ids[exercise_name] = exercise_id
                print(f"Added exercise: {exercise_name} (ID: {exercise_id})")
            else:
                raise Exception(f"Failed to insert exercise: {exercise_name}")
        
        # Add planned sets for today
        planned_sets = [
            {'exercise': 'bench press', 'order_num': 1, 'reps': 10, 'load': 45},
            {'exercise': 'bench press', 'order_num': 2, 'reps': 8, 'load': 65},
            {'exercise': 'bench press', 'order_num': 3, 'reps': 5, 'load': 85},
            {'exercise': 'squat', 'order_num': 4, 'reps': 10, 'load': 95},
            {'exercise': 'squat', 'order_num': 5, 'reps': 8, 'load': 135},
            {'exercise': 'squat', 'order_num': 6, 'reps': 5, 'load': 185},
            {'exercise': 'deadlift', 'order_num': 7, 'reps': 5, 'load': 135},
            {'exercise': 'deadlift', 'order_num': 8, 'reps': 5, 'load': 185},
            {'exercise': 'deadlift', 'order_num': 9, 'reps': 3, 'load': 225}
        ]
        
        for set_data in planned_sets:
            exercise_id = exercise_ids[set_data['exercise']]
            cur.execute(
                "INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (%s, %s, %s, %s, %s)",
                (today_log_id, exercise_id, set_data['order_num'], set_data['reps'], set_data['load'])
            )
        print(f"Added {len(planned_sets)} planned sets for today")
        
        # Add planned sets for yesterday
        yesterday_planned_sets = [
            {'exercise': 'bench press', 'order_num': 1, 'reps': 8, 'load': 50},
            {'exercise': 'bench press', 'order_num': 2, 'reps': 6, 'load': 70},
            {'exercise': 'squat', 'order_num': 3, 'reps': 8, 'load': 100},
            {'exercise': 'squat', 'order_num': 4, 'reps': 6, 'load': 140},
            {'exercise': 'deadlift', 'order_num': 5, 'reps': 5, 'load': 140},
            {'exercise': 'deadlift', 'order_num': 6, 'reps': 3, 'load': 190}
        ]
        
        for set_data in yesterday_planned_sets:
            exercise_id = exercise_ids[set_data['exercise']]
            cur.execute(
                "INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (%s, %s, %s, %s, %s)",
                (yesterday_log_id, exercise_id, set_data['order_num'], set_data['reps'], set_data['load'])
            )
        print(f"Added {len(yesterday_planned_sets)} planned sets for yesterday")
        
        # Add completed sets for today
        completed_sets = [
            {'exercise': 'bench press', 'reps_done': 10, 'load_done': 45},
            {'exercise': 'bench press', 'reps_done': 8, 'load_done': 65},
            {'exercise': 'squat', 'reps_done': 10, 'load_done': 95},
            {'exercise': 'deadlift', 'reps_done': 5, 'load_done': 135}
        ]
        
        for set_data in completed_sets:
            exercise_id = exercise_ids[set_data['exercise']]
            cur.execute(
                "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done) VALUES (%s, %s, %s, %s)",
                (today_log_id, exercise_id, set_data['reps_done'], set_data['load_done'])
            )
        print(f"Added {len(completed_sets)} completed sets for today")
        
        # Add completed sets for yesterday (complete workout)
        yesterday_completed_sets = [
            {'exercise': 'bench press', 'reps_done': 8, 'load_done': 50},
            {'exercise': 'bench press', 'reps_done': 6, 'load_done': 70},
            {'exercise': 'squat', 'reps_done': 8, 'load_done': 100},
            {'exercise': 'squat', 'reps_done': 6, 'load_done': 140},
            {'exercise': 'deadlift', 'reps_done': 5, 'load_done': 140},
            {'exercise': 'deadlift', 'reps_done': 3, 'load_done': 190}
        ]
        
        for set_data in yesterday_completed_sets:
            exercise_id = exercise_ids[set_data['exercise']]
            cur.execute(
                "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done) VALUES (%s, %s, %s, %s)",
                (yesterday_log_id, exercise_id, set_data['reps_done'], set_data['load_done'])
            )
        print(f"Added {len(yesterday_completed_sets)} completed sets for yesterday")
        
        # Commit all changes
        conn.commit()
        
        print("\nSample data loaded successfully!")
        print("Database contains:")
        print("- 3 exercises")
        print("- 15 planned sets (9 for today, 6 for yesterday)")
        print("- 10 completed sets (4 for today, 6 for yesterday)")
        print("- 2 daily logs (today and yesterday)")
        
    except Exception as e:
        print(f"Error loading sample data: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        load_sample_data()
    except Exception as error:
        print(f"Error loading sample data: {error}") 