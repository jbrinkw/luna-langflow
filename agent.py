import os
from typing import List

from agents import Agent

import tools

# Use environment variable OPENAI_API_KEY by default

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

def create_agent() -> Agent:
    """Return a CoachByte agent configured with available tools."""
    return Agent(
        name="CoachByte",
        instructions=(
            "You manage workout plans and logs. Use tools whenever they can help"
        ),
        tools=[
            tools.get_today_plan,
            tools.log_completed_set,
            tools.new_daily_plan,
            tools.update_summary,
            tools.get_recent_history,
            tools.run_sql,
            tools.arbitrary_update,
        ],
        model=MODEL,
    )


