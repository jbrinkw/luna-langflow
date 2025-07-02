import os
import sqlite3
import uuid
from datetime import datetime, date

DB_PATH = os.environ.get("WORKOUT_DB", "workout.db")

# Connection helper
def get_connection():
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database with schema
SCHEMA = """
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    log_date DATE NOT NULL UNIQUE,
    summary TEXT
);

CREATE TABLE IF NOT EXISTS planned_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    order_num INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    load REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_planned_order ON planned_sets (log_id, order_num);

CREATE TABLE IF NOT EXISTS completed_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id TEXT REFERENCES daily_logs(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    reps_done INTEGER,
    load_done REAL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_completed_time ON completed_sets (log_id, completed_at);
"""


def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def get_today_log_id(conn):
    today = date.today().isoformat()
    cur = conn.execute("SELECT id FROM daily_logs WHERE log_date = ?", (today,))
    row = cur.fetchone()
    if row:
        return row[0]
    log_id = str(uuid.uuid4())
    conn.execute("INSERT INTO daily_logs (id, log_date) VALUES (?, ?)", (log_id, today))
    conn.commit()
    return log_id
