import os
from pprint import pprint

import db
from agent import create_agent, run_agent
from psycopg2.extras import RealDictCursor


def reset_db():
    db.init_db()


def run_sql_direct(query: str):
    """Direct SQL execution for testing purposes"""
    conn = db.get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query)
        rows = [dict(row) for row in cur.fetchall()]
        return rows
    finally:
        conn.close()


def run_tests():
    reset_db()
    agent = create_agent()

    print("-- Create plan via agent --")
    prompt = (
        "Use the new_daily_plan tool to create two sets: "
        "bench press order 1 reps 10 load 100 and squat order 2 reps 8 load 150. "
        "Return the tool output."
    )
    res = run_agent(agent, prompt)
    print(res.final_output)

    print("Current planned_sets:")
    print(run_sql_direct("SELECT * FROM planned_sets"))

    print("-- Fetch today's plan via agent --")
    res = run_agent(agent, "Use get_today_plan and echo the result")
    print(res.final_output)

    print("-- Log a completed set via agent --")
    res = run_agent(agent, 
        "Log a completed set for bench press 10 reps at 100 lb using log_completed_set."
    )
    print(res.final_output)
    print("Completed sets:")
    print(run_sql_direct("SELECT * FROM completed_sets"))

    print("-- Update summary via agent --")
    res = run_agent(agent, "Summarize today with update_summary: 'Good session'.")
    print(res.final_output)
    print(run_sql_direct("SELECT summary FROM daily_logs"))

    print("-- Get recent history via agent --")
    res = run_agent(agent, "Get recent history for 1 day using get_recent_history")
    print(res.final_output)

    print("-- Arbitrary update via agent --")
    res = run_agent(agent, 
        "Use arbitrary_update to change load to 110 in planned_sets where order_num=1"
    )
    print(res.final_output)
    print(run_sql_direct("SELECT load FROM planned_sets WHERE order_num=1"))


if __name__ == "__main__":
    run_tests()
