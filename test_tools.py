import db
import psycopg2.extras
from db import get_connection
import tools
from agent import create_agent
from agents import Runner


def reset_db():
    db.init_db()


def query(sql: str, params: tuple | None = None):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params or ())
        return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def run_tests():
    reset_db()
    agent = create_agent()

    print("-- Create today's plan --")
    print("Before:", query("SELECT * FROM planned_sets"))
    plan = [
        {"exercise": "bench press", "order": 1, "reps": 10, "load": 100},
        {"exercise": "squat", "order": 2, "reps": 8, "load": 150},
    ]
    res = Runner.run_sync(agent, "Please set up today's workout with bench press for 10 reps at 100 pounds as set 1 and squat for 8 reps at 150 pounds as set 2.")
    print(res.final_output)
    print("After:", query("SELECT * FROM planned_sets"))

    print("-- Log completed set --")
    print("Before:", query("SELECT * FROM completed_sets"))
    res = Runner.run_sync(agent, "I just finished a bench press set of 10 reps at 100 pounds.")
    print(res.final_output)
    print("After:", query("SELECT * FROM completed_sets"))

    print("-- Complete planned set with defaults --")
    res = Runner.run_sync(agent, "Complete the next planned set using the planned values.")
    print(res.final_output)
    print("Completed sets:", query("SELECT cs.id, e.name, cs.reps_done, cs.load_done FROM completed_sets cs JOIN exercises e ON cs.exercise_id = e.id"))

    print("-- Complete planned set with overrides --")
    res = Runner.run_sync(agent, "Complete the next planned set but I only did 6 reps instead of the planned amount.")
    print(res.final_output)
    print("Final completed sets:", query("SELECT cs.id, e.name, cs.reps_done, cs.load_done FROM completed_sets cs JOIN exercises e ON cs.exercise_id = e.id"))

    print("-- Update summary --")
    print("Before:", query("SELECT summary FROM daily_logs"))
    Runner.run_sync(agent, "Please record the summary 'Great session' for today.")
    print("After:", query("SELECT summary FROM daily_logs"))

    print("-- Get recent history --")
    res = Runner.run_sync(agent, "Show me the workout history for the last day.")
    print(res.final_output)


if __name__ == "__main__":
    run_tests()

