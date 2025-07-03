# CoachByte Agent Demo

This demo shows a simple LangChain agent connected to a SQLite database for tracking workouts. Tools mirror the planned production API.

## Setup
1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
2. Set an `OPENAI_API_KEY` environment variable for the agent.

## Running Tests
There are two test scripts. Each one sends natural language prompts so the agent chooses the right tools:

```bash
python test_tools.py       # exercises all dedicated tools
python test_arbitrary.py   # demonstrates the arbitrary_update escape hatch
```

Run `demo_chat.py` to interact with the agent in a simple console chat.

