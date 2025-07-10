#!/usr/bin/env python3
"""
Detailed agent testing to see exact errors and responses
"""

from agent import create_agent, run_agent

def test_agent_with_simple_request():
    """Test agent with a very simple workout plan request"""
    
    simple_input = "Create a workout plan with 1 set: Squat, 5 reps, 135 lbs, 60 seconds rest"
    
    print("=" * 60)
    print("TESTING AGENT WITH SIMPLE REQUEST")
    print("=" * 60)
    print(f"Input: {simple_input}")
    print()
    
    try:
        agent = create_agent()
        result = run_agent(agent, simple_input)
        
        print("FULL RESULT OBJECT:")
        print("-" * 40)
        print(f"Final output: {result.final_output}")
        print()
        
        if hasattr(result, 'raw_responses') and result.raw_responses:
            print(f"Number of raw responses: {len(result.raw_responses)}")
            for i, response in enumerate(result.raw_responses):
                print(f"\nRaw Response {i+1}:")
                print(f"  Type: {type(response)}")
                if hasattr(response, 'content'):
                    print(f"  Content: {response.content}")
                if hasattr(response, 'tool_calls'):
                    print(f"  Tool calls: {response.tool_calls}")
                if hasattr(response, 'message'):
                    print(f"  Message: {response.message}")
                print(f"  All attributes: {dir(response)}")
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_specific_tool_parsing():
    """Test if the agent can parse workout data correctly"""
    
    # Test with explicit instruction
    explicit_input = """Please use the new_daily_plan tool to create this workout:
    - Exercise: Squat
    - Reps: 5  
    - Load: 135
    - Rest: 60
    - Order: 1"""
    
    print("\n" + "=" * 60)
    print("TESTING WITH EXPLICIT TOOL REQUEST")
    print("=" * 60)
    print(f"Input: {explicit_input}")
    print()
    
    try:
        agent = create_agent()
        result = run_agent(agent, explicit_input)
        
        print(f"Response: {result.final_output}")
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    print("Detailed Agent Error Analysis")
    print("Investigating why workout plan creation fails...\n")
    
    # Test simple request
    result1 = test_agent_with_simple_request()
    
    # Test explicit tool request  
    result2 = test_specific_tool_parsing()
    
    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main() 