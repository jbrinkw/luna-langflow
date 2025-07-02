# CoachByte Agent Demo

This demo shows a simple LangChain agent connected to a SQLite database for tracking workouts. Tools mirror the planned production API.

## Setup
1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Set an `OPENAI_API_KEY` environment variable for the agent.

## Running Tests
Execute the test script which resets the database and exercises each tool via the agent:
```bash
python test_agent.py
```
The script prints agent interactions and resulting database rows.
