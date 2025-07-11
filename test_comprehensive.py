import os
import db
from agent import create_agent, run_agent, get_timestamp
from psycopg2.extras import RealDictCursor


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


def run_with_agent(agent, prompt, test_name):
    """Run a test with the agent and return results"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    
    print(f"PROMPT: {prompt}")
    
    # Use the wrapper function with automatic timestamp inclusion
    result = run_agent(agent, prompt)
    print(f"RESPONSE: {result.final_output}")
    
    return result


def run_comprehensive_tests():
    """Run all comprehensive tests"""
    
    print("="*80)
    print("COMPREHENSIVE WORKOUT AGENT TESTING")
    print("="*80)
    
    # Initialize database with sample data
    print("\nInitializing database with comprehensive sample data...")
    db.init_db(sample=True)
    print("Sample data loaded successfully!")
    
    # Create agent
    agent = create_agent()
    
    # =================================================================
    # SECTION A: BASIC TOOL FUNCTIONS (7 tests)
    # =================================================================
    
    print("\n" + "="*80)
    print("SECTION A: BASIC TOOL FUNCTIONS")
    print("="*80)
    
    # A1: Create Daily Plan
    run_with_agent(
        agent,
        "Create a new workout plan for tomorrow with these exercises: push-ups 3 sets of 12 reps, pull-ups 2 sets of 8 reps, and squats 3 sets of 15 reps at 100 pounds. Use the new_daily_plan tool.",
        "A1: Create Daily Plan"
    )
    
    # A2: Retrieve Today's Plan
    run_with_agent(
        agent,
        "Show me today's workout plan using get_today_plan. I want to see what exercises are scheduled.",
        "A2: Retrieve Today's Plan"
    )
    
    # A3: Log Completed Set
    run_with_agent(
        agent,
        "I just finished a set of push-ups - 15 reps at bodyweight. Log this completed set using log_completed_set.",
        "A3: Log Completed Set"
    )
    
    # A4: Update Daily Summary
    run_with_agent(
        agent,
        "Update today's workout summary using update_summary. Write: 'Great conditioning session, felt strong on all exercises.'",
        "A4: Update Daily Summary"
    )
    
    # A5: Get Recent History
    run_with_agent(
        agent,
        "Show me my workout history for the last 3 days using get_recent_history. I want to see my progress.",
        "A5: Get Recent History"
    )
    
    # A6: Run SQL Query
    run_with_agent(
        agent,
        "Run a SQL query using run_sql to show me all the exercises in the database. Query: SELECT * FROM exercises",
        "A6: Run SQL Query"
    )
    
    # A7: Update Data
    run_with_agent(
        agent,
        "Use arbitrary_update to change the weight on my first squat set to 200 pounds. Update planned_sets table where order_num=1 and exercise is squats.",
        "A7: Update Data"
    )
    
    # =================================================================
    # SECTION C: AGENT INTELLIGENCE TESTS (3 tests)
    # =================================================================
    
    print("\n" + "="*80)
    print("SECTION C: AGENT INTELLIGENCE TESTS")
    print("="*80)
    
    # C1: Natural Language Understanding
    run_with_agent(
        agent,
        "I did some pushups and pullups this morning, maybe like 20 pushups and 10 pullups, can you log that for me?",
        "C1: Natural Language Understanding"
    )
    
    # C2: Contextual Responses
    result = run_with_agent(
        agent,
        "What's my strongest exercise based on my recent workouts?",
        "C2: Contextual Responses (Part 1)"
    )
    
    # Follow-up question with explicit context
    run_with_agent(
        agent,
        "How can I improve my deadlift further? You mentioned that deadlifts are my strongest exercise based on recent workouts.",
        "C2: Contextual Responses (Part 2)"
    )
    
    # C3: Timestamp Integration
    run_with_agent(
        agent,
        "Can you see the timestamp at the beginning of this message? Please acknowledge if you can see when I sent this message.",
        "C3: Timestamp Integration"
    )
    
    # =================================================================
    # VALIDATION QUERIES
    # =================================================================
    
    print("\n" + "="*80)
    print("VALIDATION: DATABASE STATE AFTER TESTS")
    print("="*80)
    
    print("\nAll Exercises:")
    exercises = run_sql_direct("SELECT * FROM exercises")
    for exercise in exercises:
        print(f"  - {exercise['name']} (ID: {exercise['id']})")
    
    print("\nDaily Logs:")
    logs = run_sql_direct("SELECT log_date, summary FROM daily_logs ORDER BY log_date")
    for log in logs:
        print(f"  - {log['log_date']}: {log['summary'][:50]}...")
    
    print("\nPlanned Sets Count:")
    planned_count = run_sql_direct("SELECT COUNT(*) as count FROM planned_sets")
    print(f"  - Total planned sets: {planned_count[0]['count']}")
    
    print("\nCompleted Sets Count:")
    completed_count = run_sql_direct("SELECT COUNT(*) as count FROM completed_sets")
    print(f"  - Total completed sets: {completed_count[0]['count']}")
    
    print("\nRecent Completed Sets:")
    recent_sets = run_sql_direct("""
        SELECT e.name, cs.reps_done, cs.load_done, cs.completed_at 
        FROM completed_sets cs 
        JOIN exercises e ON cs.exercise_id = e.id 
        ORDER BY cs.completed_at DESC 
        LIMIT 5
    """)
    for set_info in recent_sets:
        weight_str = f" @ {set_info['load_done']} lbs" if set_info['load_done'] > 0 else " (bodyweight)"
        print(f"  - {set_info['name']}: {set_info['reps_done']} reps{weight_str}")
    
    print("\n" + "="*80)
    print("COMPREHENSIVE TESTING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    run_comprehensive_tests() 