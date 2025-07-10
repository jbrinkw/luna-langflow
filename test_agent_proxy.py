#!/usr/bin/env python3
"""
Proxy script to test the agent directly and diagnose issues with workout plan creation
"""

import sys
import traceback
from agent import create_agent, run_agent

def test_agent_directly():
    """Test the agent with the workout plan input"""
    
    # The exact input the user is trying to use
    user_input = """| # | Exercise | Reps × Load | Rest to next set |
| -- | --------------------- | ------------ | ---------------- |
| 1 | Jumping jacks | 20 × BW | 30 s |
| 2 | Cat-camel | 10/side × BW | 30 s |
| 3 | Body-weight squats | 10 × BW | 30 s |
| 4 | Walking lunges | 10/leg × BW | 30 s |
| 5 | Band pull-aparts | 20 × Band | 60 s |
| 6 | **Squat — empty bar** | 10 × 45 lb | 60 s |
| 7 | Squat warm-up | 5 × 95 lb | 90 s |
| 8 | Squat warm-up | 5 × 135 lb | 120 s |
| 9 | **Squat work set 1** | 5 × 165 lb | 150 s |
| 10 | **Squat work set 2** | 5 × 165 lb | 150 s |
| 11 | **Squat work set 3** | 5 × 165 lb | 180 s |
| 12 | **Bench — empty bar** | 10 × 45 lb | 60 s |
| 13 | Bench warm-up | 5 × 95 lb | 90 s |
| 14 | Bench warm-up | 3 × 115 lb | 120 s |
| 15 | **Bench work set 1** | 5 × 145 lb | 150 s |
| 16 | **Bench work set 2** | 5 × 145 lb | 150 s |
| 17 | **Bench work set 3** | 5 × 145 lb | 180 s |
| 18 | Deadlift warm-up | 5 × 135 lb | 120 s |
| 19 | Deadlift warm-up | 3 × 165 lb | 120 s |
| 20 | **Deadlift work set** | 5 × 185 lb | — |
add this into planned for today"""

    print("=" * 60)
    print("TESTING AGENT DIRECTLY")
    print("=" * 60)
    
    print("Input:")
    print(user_input)
    print("\n" + "=" * 60)
    
    try:
        # Create agent
        print("Creating agent...")
        agent = create_agent()
        print("Agent created successfully!")
        
        # Test the agent
        print("\nRunning agent...")
        result = run_agent(agent, user_input)
        
        print("\nAgent Response:")
        print("-" * 40)
        if hasattr(result, 'final_output'):
            print(result.final_output)
        else:
            print("Result object:")
            print(result)
            
        print("-" * 40)
        
        # Check result structure
        print(f"\nResult type: {type(result)}")
        print(f"Result attributes: {dir(result)}")
        if hasattr(result, 'messages'):
            print(f"Number of messages: {len(result.messages)}")
        if hasattr(result, 'all_messages'):
            print(f"Number of all_messages: {len(result.all_messages)}")
        
        return result
        
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return None

def test_tools_directly():
    """Test the tools directly to see if they work"""
    print("\n" + "=" * 60)
    print("TESTING TOOLS DIRECTLY")
    print("=" * 60)
    
    try:
        from tools import new_daily_plan, get_today_plan
        
        # Test creating a simple plan
        print("Testing new_daily_plan with simple data...")
        test_items = [
            {
                "exercise": "Squat",
                "reps": 5,
                "load": 165,
                "rest": 150,
                "order": 1
            },
            {
                "exercise": "Bench Press",
                "reps": 5,
                "load": 145,
                "rest": 150,
                "order": 2
            }
        ]
        
        result = new_daily_plan.func(test_items)
        print(f"new_daily_plan result: {result}")
        
        # Test getting today's plan
        print("\nTesting get_today_plan...")
        plan = get_today_plan.func()
        print(f"get_today_plan result: {plan}")
        
        return True
        
    except Exception as e:
        print(f"\nERROR testing tools: {str(e)}")
        traceback.print_exc()
        return False

def main():
    print("Agent Proxy Test Script")
    print("Testing workout plan creation...")
    
    # Test tools first
    tools_work = test_tools_directly()
    
    # Test agent
    agent_result = test_agent_directly()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Tools working: {tools_work}")
    print(f"Agent completed: {agent_result is not None}")
    
    if agent_result is None:
        print("❌ Agent failed to complete")
    else:
        print("✅ Agent completed successfully")
        
    print("\nIf the agent isn't creating plans, check:")
    print("1. Database connection issues")
    print("2. Tool function decorators")
    print("3. Agent instructions and tool availability")

if __name__ == "__main__":
    main() 