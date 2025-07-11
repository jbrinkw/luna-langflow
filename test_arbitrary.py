import db
from db import get_connection
import tools
from agent import create_agent
from agents import Runner

def reset_db():
    db.init_db(sample=True)


def query(sql: str, params: tuple | None = None):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        columns = [desc[0] for desc in cur.description]
        rows = [dict(zip(columns, r)) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()


def run_tests():
    reset_db()
    agent = create_agent()

    tables = ["exercises", "daily_logs", "planned_sets", "completed_sets"]
    for table in tables:
        print(f"-- Initial {table} --")
        print(query(f"SELECT * FROM {table}"))

    print("-- Add exercise via arbitrary_update --")
    print("Before:", query("SELECT * FROM exercises"))
    Runner.run_sync(agent, "Add an exercise called pull up. Use the arbitrary update tool with {\"query\": \"INSERT INTO exercises(name) VALUES (:n)\", \"params\": {\"n\": \"pull up\"}}")
    print("After:", query("SELECT * FROM exercises"))

    print("-- Update load in planned_sets --")
    print("Before:", query("SELECT id, load FROM planned_sets WHERE id=1"))
    Runner.run_sync(agent, "Increase the load of the first planned set by five. Use the arbitrary update tool with {\"query\": \"UPDATE planned_sets SET load = load + 5 WHERE id = 1\", \"params\": {}}")
    print("After:", query("SELECT id, load FROM planned_sets WHERE id=1"))

    print("-- Insert completed_set --")
    print("Before:", query("SELECT * FROM completed_sets"))
    Runner.run_sync(agent, "Insert a completed set of 5 reps at 45 pounds for the first exercise. Use the arbitrary update tool exactly with this JSON: {\"query\": \"INSERT INTO completed_sets(log_id, exercise_id, reps_done, load_done) VALUES ((SELECT id FROM daily_logs LIMIT 1), (SELECT id FROM exercises LIMIT 1), 5, 45)\", \"params\": {}}")
    print("After:", query("SELECT * FROM completed_sets"))


if __name__ == "__main__":
    run_tests()

