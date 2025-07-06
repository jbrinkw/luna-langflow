from typing import List, Dict, Any, Optional
from datetime import date, timedelta, datetime
import psycopg2.extras

from db import get_connection, get_today_log_id
from agents import function_tool

# Helper validation
MAX_LOAD = 2000
MAX_REPS = 100


def _get_exercise_id(conn, name: str) -> int:
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id FROM exercises WHERE name = %s", (name,))
    row = cur.fetchone()
    if row:
        return row['id']
    cur.execute("INSERT INTO exercises (name) VALUES (%s) RETURNING id", (name,))
    return cur.fetchone()['id']


@function_tool(strict_mode=False)
def new_daily_plan(items: List[Dict[str, Any]]):
    """Create today's daily log and planned sets"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        log_id = get_today_log_id(conn)
        for item in items:
            reps = int(item["reps"])
            load = float(item["load"])
            if not (1 <= reps <= MAX_REPS):
                raise ValueError("reps out of range")
            if not (0 <= load <= MAX_LOAD):
                raise ValueError("load out of range")
            exercise_id = _get_exercise_id(conn, item["exercise"])
            order_num = int(item["order"])
            cur.execute(
                "INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load) VALUES (%s, %s, %s, %s, %s)",
                (log_id, exercise_id, order_num, reps, load),
            )
        conn.commit()
    finally:
        conn.close()
    return f"planned {len(items)} sets for today"


@function_tool(strict_mode=False)
def get_today_plan() -> List[Dict[str, Any]]:
    """Return today's planned sets in workout order."""
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        log_id = get_today_log_id(conn)
        cur.execute(
            "SELECT e.name as exercise, reps, load, order_num FROM planned_sets ps JOIN exercises e ON ps.exercise_id = e.id WHERE log_id = %s ORDER BY order_num",
            (log_id,),
        )
        rows = [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
    return rows


@function_tool(strict_mode=False)
def log_completed_set(exercise: str, reps: int, load: float):
    """Record a completed set for today."""
    if not (1 <= reps <= MAX_REPS):
        raise ValueError("reps out of range")
    if not (0 <= load <= MAX_LOAD):
        raise ValueError("load out of range")
    conn = get_connection()
    try:
        cur = conn.cursor()
        log_id = get_today_log_id(conn)
        exercise_id = _get_exercise_id(conn, exercise)
        cur.execute(
            "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done) VALUES (%s, %s, %s, %s)",
            (log_id, exercise_id, reps, load),
        )
        conn.commit()
    finally:
        conn.close()
    return "logged"


@function_tool(strict_mode=False)
def update_summary(text: str):
    """Update today's daily log summary."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        log_id = get_today_log_id(conn)
        cur.execute("UPDATE daily_logs SET summary = %s WHERE id = %s", (text, log_id))
        conn.commit()
    finally:
        conn.close()
    return "summary updated"


@function_tool(strict_mode=False)
def get_recent_history(days: int) -> List[Dict[str, Any]]:
    """Return planned and completed sets for the last ``days`` calendar days."""
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        start = date.today() - timedelta(days=days)
        cur.execute(
            """
            SELECT dl.log_date, e.name as exercise, ps.reps, ps.load, cs.reps_done, cs.load_done
            FROM planned_sets ps
            JOIN daily_logs dl ON ps.log_id = dl.id
            JOIN exercises e ON ps.exercise_id = e.id
            LEFT JOIN completed_sets cs ON cs.log_id = ps.log_id AND cs.exercise_id = ps.exercise_id
            WHERE dl.log_date >= %s
            ORDER BY dl.log_date, ps.order_num
            """,
            (start.isoformat(),),
        )
        rows = [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
    return rows


@function_tool(strict_mode=False)
def run_sql(query: str, params: Optional[Dict[str, Any]] = None, confirm: bool = False):
    """Run arbitrary SQL. Reject mutations unless confirm=True"""
    if params is None:
        params = {}
    lowered = query.strip().lower()
    if not lowered.startswith("select") and not confirm:
        raise ValueError("updates require confirm=True")
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Convert params dict to list if needed for PostgreSQL
        if params:
            # PostgreSQL uses %(name)s format for named parameters
            cur.execute(query, params)
        else:
            cur.execute(query)
            
        if lowered.startswith("select"):
            rows = [dict(row) for row in cur.fetchall()]
        else:
            conn.commit()
            rows = {"rows_affected": cur.rowcount}
    finally:
        conn.close()
    return rows


@function_tool(strict_mode=False)
def arbitrary_update(query: str, params: Optional[Dict[str, Any]] = None):
    """Execute a confirmed SQL statement for updates or inserts."""
    if params is None:
        params = {}
    return run_sql(query, params=params, confirm=True)


@function_tool(strict_mode=False)
def set_timer(minutes: int):
    """Set a workout timer for the specified number of minutes."""
    if not (1 <= minutes <= 180):  # Max 3 hours
        raise ValueError("Timer duration must be between 1 and 180 minutes")
    
    conn = get_connection()
    try:
        cur = conn.cursor()
        # Clear any existing timers first
        cur.execute("DELETE FROM timer")
        
        # Calculate end time
        end_time = datetime.now() + timedelta(minutes=minutes)
        
        # Insert new timer
        cur.execute(
            "INSERT INTO timer (timer_end_time) VALUES (%s)",
            (end_time,)
        )
        conn.commit()
    finally:
        conn.close()
    
    return f"Timer set for {minutes} minutes (until {end_time.strftime('%H:%M:%S')})"


@function_tool(strict_mode=False)
def get_timer() -> Dict[str, Any]:
    """Get current timer status - shows remaining time or if timer has expired."""
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT timer_end_time, created_at FROM timer ORDER BY created_at DESC LIMIT 1"
        )
        row = cur.fetchone()
        
        if not row:
            return {"status": "no_timer", "message": "No timer currently set"}
        
        end_time = row['timer_end_time']
        created_at = row['created_at']
        now = datetime.now()
        
        if now >= end_time:
            # Timer has expired
            time_expired = int((now - end_time).total_seconds())
            return {
                "status": "expired",
                "message": f"Timer expired {time_expired} seconds ago",
                "end_time": end_time.isoformat(),
                "created_at": created_at.isoformat()
            }
        else:
            # Timer is still running
            remaining_seconds = int((end_time - now).total_seconds())
            remaining_minutes = remaining_seconds // 60
            remaining_seconds = remaining_seconds % 60
            
            return {
                "status": "running",
                "message": f"Timer running - {remaining_minutes}:{remaining_seconds:02d} remaining",
                "remaining_seconds": int((end_time - now).total_seconds()),
                "end_time": end_time.isoformat(),
                "created_at": created_at.isoformat()
            }
    finally:
        conn.close()


__all__ = [
    "new_daily_plan",
    "get_today_plan",
    "log_completed_set",
    "update_summary",
    "get_recent_history",
    "run_sql",
    "arbitrary_update",
    "set_timer",
    "get_timer",
]
