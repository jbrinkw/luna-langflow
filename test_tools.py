import db
import tools
from agent import create_agent


def reset_db():
    db.init_db()


def run_tests():
    reset_db()
    agent = create_agent()

    print("-- Create today's plan --")
    plan = [
        {"exercise": "bench press", "order": 1, "reps": 10, "load": 100},
        {"exercise": "squat", "order": 2, "reps": 8, "load": 150},
    ]
    import json
    plan_json = json.dumps(plan)
    res = agent.invoke({"input": f"Use new_daily_plan with {plan_json}"})
    print(res)
    print(tools.run_sql("SELECT * FROM planned_sets"))

    print("-- Log completed set --")
    res = agent.invoke({"input": 'Use log_completed_set with {"exercise": "bench press", "reps": 10, "load": 100}'})
    print(res)
    print(tools.run_sql("SELECT * FROM completed_sets"))

    print("-- Update summary --")
    agent.invoke({"input": "Use update_summary to say 'Great session'"})
    print(tools.run_sql("SELECT summary FROM daily_logs"))

    print("-- Get recent history --")
    res = agent.invoke({"input": "get_recent_history 1"})
    print(res)


if __name__ == "__main__":
    run_tests()
