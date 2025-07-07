import os
from typing import List
from datetime import datetime, timedelta

from agents import Agent, Runner

import tools

# Use environment variable OPENAI_API_KEY by default

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

def get_corrected_time():
    """Get current time corrected for server clock being 4 hours fast"""
    server_time = datetime.now()
    corrected_time = server_time - timedelta(hours=4)
    return corrected_time

def get_timestamp():
    """Get current timestamp in readable format"""
    return get_corrected_time().strftime("[%Y-%m-%d %H:%M:%S]")

def create_agent() -> Agent:
    """Return a CoachByte agent configured with available tools."""
    return Agent(
        name="CoachByte",
        instructions=(
            "You are CoachByte, a fitness tracking assistant that helps manage workout plans and logs. "
            "\n\nKey capabilities:"
            "\n- Create and modify workout plans using new_daily_plan"
            "\n- Log completed exercises using log_completed_set"
            "\n- Complete planned sets using complete_planned_set (finds next set in queue, can override planned reps/load values)"
            "\n- Track progress using get_recent_history"
            "\n- Query workout data using run_sql"
            "\n- Update workout summaries using update_summary"
            "\n- Make database modifications using arbitrary_update"
            "\n- Set workout timers using set_timer (specify duration in minutes)"
            "\n- Check timer status using get_timer"
            "\n\nImportant workflow guidelines:"
            "\n- When a user says they 'completed a planned set' or 'finished a set', ALWAYS use complete_planned_set first"
            "\n- The complete_planned_set tool will automatically find the next planned set and handle cases where none exist"
            "\n- Do NOT check for planned sets manually when the user indicates they completed one - let the tool handle it"
            "\n- If complete_planned_set says no sets are available, then offer to create a new plan"
            "\n\nImportant notes:"
            "\n- User messages include timestamps in format [YYYY-MM-DD HH:MM:SS]. Always acknowledge when you can see these timestamps."
            "\n- Maintain conversation context - if asked a follow-up question, refer back to previous responses in the conversation."
            "\n- For workout analysis, use data from tools to provide specific, data-driven insights."
            "\n- Be encouraging and supportive about fitness progress."
            "\n- Always use tools when they can help answer questions or complete tasks."
        ),
        tools=[
            tools.get_today_plan,
            tools.log_completed_set,
            tools.complete_planned_set,
            tools.new_daily_plan,
            tools.update_summary,
            tools.get_recent_history,
            tools.run_sql,
            tools.arbitrary_update,
            tools.set_timer,
            tools.get_timer,
        ],
        model=MODEL,
    )

def run_agent(agent: Agent, user_input: str):
    """Run agent with automatic timestamp inclusion"""
    timestamped_message = f"{get_timestamp()} {user_input}"
    return Runner.run_sync(agent, timestamped_message)


