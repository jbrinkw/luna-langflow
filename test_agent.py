import os
from pprint import pprint

import db
import tools
from agent import create_agent


def reset_db():
    db.init_db()


def run_tests():
    reset_db()
    agent = create_agent()

    print("-- Create plan via agent --")
    prompt = (
        "Use the new_daily_plan tool to create two sets: "
        "bench press order 1 reps 10 load 100 and squat order 2 reps 8 load 150. "
        "Return the tool output."
    )
    res = agent.invoke({"input": prompt})
    print(res)

    print("Current planned_sets:")
    print(tools.run_sql("SELECT * FROM planned_sets"))

    print("-- Fetch today's plan via agent --")
    res = agent.invoke({"input": "Use get_today_plan and echo the result"})
    print(res)

    print("-- Log a completed set via agent --")
    res = agent.invoke({"input":
        "Log a completed set for bench press 10 reps at 100 lb using log_completed_set."
    })
    print(res)
    print("Completed sets:")
    print(tools.run_sql("SELECT * FROM completed_sets"))

    print("-- Update summary via agent --")
    res = agent.invoke({"input": "Summarize today with update_summary: 'Good session'."})
    print(res)
    print(tools.run_sql("SELECT summary FROM daily_logs"))

    print("-- Get recent history via agent --")
    res = agent.invoke({"input": "Get recent history for 1 day using get_recent_history"})
    print(res)

    print("-- Arbitrary update via agent --")
    res = agent.invoke({"input":
        "Use arbitrary_update to change load to 110 in planned_sets where order_num=1"
    })
    print(res)
    print(tools.run_sql("SELECT load FROM planned_sets WHERE order_num=1"))


if __name__ == "__main__":
    run_tests()
