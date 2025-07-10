#!/usr/bin/env python3
"""
Test database connection to diagnose workout plan creation issues
"""

import traceback

def test_database_connection():
    """Test if we can connect to the database"""
    print("=" * 60)
    print("TESTING DATABASE CONNECTION")
    print("=" * 60)
    
    try:
        from db import get_connection
        print("Attempting to get database connection...")
        
        conn = get_connection()
        print("✅ Database connection successful!")
        
        # Test a simple query
        cur = conn.cursor()
        cur.execute("SELECT 1")
        result = cur.fetchone()
        print(f"✅ Simple query successful: {result}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        traceback.print_exc()
        return False

def test_tools_with_database():
    """Test tools that depend on database"""
    print("\n" + "=" * 60)
    print("TESTING TOOLS WITH DATABASE ACCESS")
    print("=" * 60)
    
    try:
        # Import the actual function implementations
        from tools import get_today_plan, new_daily_plan
        
        print("Testing get_today_plan...")
        plan = get_today_plan()
        print(f"✅ get_today_plan succeeded: {len(plan)} items")
        
        print("\nTesting new_daily_plan with one simple item...")
        test_items = [{
            "exercise": "Test Exercise",
            "reps": 5,
            "load": 100,
            "rest": 60,
            "order": 1
        }]
        
        result = new_daily_plan(test_items)
        print(f"✅ new_daily_plan succeeded: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Tool testing failed: {str(e)}")
        traceback.print_exc()
        return False

def test_agent_tools_available():
    """Test if agent has access to tools"""
    print("\n" + "=" * 60)
    print("TESTING AGENT TOOL ACCESS")
    print("=" * 60)
    
    try:
        from agent import create_agent
        
        agent = create_agent()
        print(f"Agent created: {agent.name}")
        print(f"Number of tools: {len(agent.tools)}")
        
        for i, tool in enumerate(agent.tools):
            print(f"  {i+1}. {tool.name if hasattr(tool, 'name') else str(tool)}")
            
        return True
        
    except Exception as e:
        print(f"❌ Agent tool access failed: {str(e)}")
        traceback.print_exc()
        return False

def main():
    print("Database and Agent Diagnostic Test")
    print("Checking why workout plan creation isn't working...\n")
    
    # Test database
    db_works = test_database_connection()
    
    # Test tools
    tools_work = test_tools_with_database()
    
    # Test agent tools
    agent_tools_work = test_agent_tools_available()
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC SUMMARY")
    print("=" * 60)
    print(f"Database connection: {'✅ Working' if db_works else '❌ Failed'}")
    print(f"Tools functionality: {'✅ Working' if tools_work else '❌ Failed'}")
    print(f"Agent tool access: {'✅ Working' if agent_tools_work else '❌ Failed'}")
    
    if not db_works:
        print("\n🔥 ROOT CAUSE: Database connection issues!")
        print("The agent can't create workout plans because it can't access the database.")
        print("Check your PostgreSQL server or switch to SQLite.")
    elif not tools_work:
        print("\n🔥 ROOT CAUSE: Tool execution issues!")
        print("The database connects but tools can't execute properly.")
    elif not agent_tools_work:
        print("\n🔥 ROOT CAUSE: Agent tool configuration issues!")
        print("The agent doesn't have proper access to tools.")
    else:
        print("\n🤔 All components seem to work individually...")
        print("The issue might be in the agent's decision-making or error handling.")

if __name__ == "__main__":
    main() 