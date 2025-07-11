from typing import List, Dict, Any, Optional
from datetime import date, timedelta, datetime, timezone
import psycopg2.extras

from db import get_connection, get_today_log_id
from agents import function_tool

def get_corrected_time():
    """Get the current UTC time"""
    return datetime.now(timezone.utc)

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
            rest = int(item.get("rest", 60))  # Default to 60 seconds if not provided
            if not (1 <= reps <= MAX_REPS):
                raise ValueError("reps out of range")
            if not (0 <= load <= MAX_LOAD):
                raise ValueError("load out of range")
            if not (0 <= rest <= 600):  # Max 10 minutes rest
                raise ValueError("rest time out of range")
            exercise_id = _get_exercise_id(conn, item["exercise"])
            order_num = int(item["order"])
            cur.execute(
                "INSERT INTO planned_sets (log_id, exercise_id, order_num, reps, load, rest) VALUES (%s, %s, %s, %s, %s, %s)",
                (log_id, exercise_id, order_num, reps, load, rest),
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
            "SELECT e.name as exercise, reps, load, rest, order_num FROM planned_sets ps JOIN exercises e ON ps.exercise_id = e.id WHERE log_id = %s ORDER BY order_num",
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
            "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done, completed_at) VALUES (%s, %s, %s, %s, %s)",
            (log_id, exercise_id, reps, load, datetime.now(timezone.utc)),
        )
        conn.commit()
    finally:
        conn.close()
    return "logged"


@function_tool(strict_mode=False)
def complete_planned_set(exercise: Optional[str] = None, reps: Optional[int] = None, load: Optional[float] = None):
    """Complete the next planned set, optionally overriding the planned values."""
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        log_id = get_today_log_id(conn)
        
        # Find the next planned set to complete (same logic as UI)
        if exercise:
            # Complete specific exercise - find first planned set for that exercise
            cur.execute("""
                SELECT ps.id, ps.exercise_id, e.name as exercise, ps.reps, ps.load, ps.rest, ps.order_num
                FROM planned_sets ps
                JOIN exercises e ON ps.exercise_id = e.id
                WHERE ps.log_id = %s AND e.name = %s
                ORDER BY ps.order_num
                LIMIT 1
            """, (log_id, exercise))
        else:
            # Complete next planned set in order (first in queue, same as UI)
            cur.execute("""
                SELECT ps.id, ps.exercise_id, e.name as exercise, ps.reps, ps.load, ps.rest, ps.order_num
                FROM planned_sets ps
                JOIN exercises e ON ps.exercise_id = e.id
                WHERE ps.log_id = %s
                ORDER BY ps.order_num
                LIMIT 1
            """, (log_id,))
        
        planned_set = cur.fetchone()
        if not planned_set:
            if exercise:
                return f"No planned sets found for exercise: {exercise}"
            else:
                return "No planned sets remaining for today"
        
        # Use planned values as defaults, override if provided
        actual_reps = reps if reps is not None else planned_set['reps']
        actual_load = load if load is not None else planned_set['load']
        
        # Validate overrides
        if not (1 <= actual_reps <= MAX_REPS):
            raise ValueError("reps out of range")
        if not (0 <= actual_load <= MAX_LOAD):
            raise ValueError("load out of range")
        
        # Record the completion
        cur.execute(
            "INSERT INTO completed_sets (log_id, exercise_id, reps_done, load_done, completed_at) VALUES (%s, %s, %s, %s, %s)",
            (log_id, planned_set['exercise_id'], actual_reps, actual_load, datetime.now(timezone.utc)),
        )
        
        # Delete the completed planned set (same as UI behavior)
        cur.execute(
            "DELETE FROM planned_sets WHERE id = %s",
            (planned_set['id'],)
        )
        
        conn.commit()
        
        # Set timer for rest period if there's a rest time
        rest_time = planned_set.get('rest', 60)  # Default to 60 seconds
        if rest_time > 0:
            try:
                import subprocess
                import os
                # Ensure we're in the correct directory for the timer script
                script_dir = os.path.dirname(os.path.abspath(__file__))
                timer_script = os.path.join(script_dir, 'timer_temp.py')
                result = subprocess.run(['python', timer_script, 'set', str(rest_time), 'seconds'], 
                                       capture_output=True, text=True, cwd=script_dir)
                if result.returncode == 0:
                    rest_info = f" Rest timer set for {rest_time} seconds."
                else:
                    rest_info = f" (Timer error: {result.stderr.strip()})"
            except Exception as e:
                rest_info = f" (Timer error: {e})"
        else:
            rest_info = ""
        
        # Return completion summary
        result = f"Completed {planned_set['exercise']}: {actual_reps} reps @ {actual_load} load"
        if reps is not None or load is not None:
            result += f" (planned: {planned_set['reps']} reps @ {planned_set['load']} load)"
        result += rest_info
        return result
        
    finally:
        conn.close()


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


def _execute_sql(query: str, params: Optional[Dict[str, Any]] = None, confirm: bool = False):
    """Internal SQL execution function"""
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
def run_sql(query: str, params: Optional[Dict[str, Any]] = None, confirm: bool = False):
    """Run arbitrary SQL. Reject mutations unless confirm=True"""
    return _execute_sql(query, params, confirm)


@function_tool(strict_mode=False)
def arbitrary_update(query: str, params: Optional[Dict[str, Any]] = None):
    """Execute a confirmed SQL statement for updates or inserts."""
    if params is None:
        params = {}
    return _execute_sql(query, params=params, confirm=True)


@function_tool(strict_mode=False)
def set_timer(minutes: int):
    """Set a workout timer for the specified number of minutes."""
    if not (1 <= minutes <= 180):  # Max 3 hours
        raise ValueError("Timer duration must be between 1 and 180 minutes")
    
    try:
        import subprocess
        import os
        # Ensure we're in the correct directory for the timer script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timer_script = os.path.join(script_dir, 'timer_temp.py')
        result = subprocess.run(['python', timer_script, 'set', str(minutes)], 
                               capture_output=True, text=True, cwd=script_dir)
        if result.returncode == 0:
            return f"Timer set for {minutes} minutes"
        else:
            return f"Timer error: {result.stderr.strip()}"
    except Exception as e:
        return f"Timer error: {e}"


@function_tool(strict_mode=False)
def get_timer() -> Dict[str, Any]:
    """Get current timer status - shows remaining time or if timer has expired."""
    try:
        import subprocess
        import os
        import json
        # Ensure we're in the correct directory for the timer script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timer_script = os.path.join(script_dir, 'timer_temp.py')
        result = subprocess.run(['python', timer_script, 'get'], 
                               capture_output=True, text=True, cwd=script_dir)
        if result.returncode == 0:
            try:
                # Parse the JSON output from timer_temp.py
                timer_data = json.loads(result.stdout.strip())
                return timer_data
            except json.JSONDecodeError:
                # If it's not JSON, treat it as a simple message
                return {"status": "no_timer", "message": result.stdout.strip()}
        else:
            return {"status": "error", "message": f"Timer error: {result.stderr.strip()}"}
    except Exception as e:
        return {"status": "error", "message": f"Timer error: {e}"}


__all__ = [
    "new_daily_plan",
    "get_today_plan",
    "log_completed_set",
    "complete_planned_set",
    "update_summary",
    "get_recent_history",
    "run_sql",
    "arbitrary_update",
    "set_timer",
    "get_timer",
]
