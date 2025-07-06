import os
from typing import List
from datetime import datetime

from agents import Agent, Runner

import tools

# Use environment variable OPENAI_API_KEY by default

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

def get_timestamp():
    """Get current timestamp in readable format"""
    return datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")

def create_agent() -> Agent:
    """Return a CoachByte agent configured with available tools."""
    return Agent(
        name="CoachByte",
        instructions=(
            "You are CoachByte, a fitness tracking assistant that helps manage workout plans and logs. "
            "\n\nKey capabilities:"
            "\n- Create and modify workout plans using new_daily_plan"
            "\n- Log completed exercises using log_completed_set"
            "\n- Track progress using get_recent_history"
            "\n- Query workout data using run_sql"
            "\n- Update workout summaries using update_summary"
            "\n- Make database modifications using arbitrary_update"
            "\n- Set workout timers using set_timer (specify duration in minutes)"
            "\n- Check timer status using get_timer"
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


