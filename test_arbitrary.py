import db
import tools
from agent import create_agent


def reset_db():
    db.init_db(sample=True)


def run_tests():
    reset_db()
    agent = create_agent()

    tables = ["exercises", "daily_logs", "planned_sets", "completed_sets"]
    for table in tables:
        print(f"-- Initial {table} --")
        print(tools.run_sql(f"SELECT * FROM {table}"))

    print("-- Add exercise via arbitrary_update --")
    agent.invoke({"input": 'Use arbitrary_update with {"query": "INSERT INTO exercises(name) VALUES (:n)", "params": {"n": "pull up"}}'})
    print(tools.run_sql("SELECT * FROM exercises"))

    print("-- Update load in planned_sets --")
    agent.invoke({"input": 'Use arbitrary_update with {"query": "UPDATE planned_sets SET load= load+5 WHERE id=1", "params": {}}'})
    print(tools.run_sql("SELECT id, load FROM planned_sets WHERE id=1"))

    print("-- Insert completed_set --")
    agent.invoke({"input": 'Use arbitrary_update with {"query": "INSERT INTO completed_sets(log_id, exercise_id, reps_done, load_done) VALUES ((SELECT id FROM daily_logs LIMIT 1), (SELECT id FROM exercises LIMIT 1), 5, 45)", "params": {}}'})
    print(tools.run_sql("SELECT * FROM completed_sets"))


if __name__ == "__main__":
    run_tests()
