import json
import os
import sys

from agent import create_agent, run_agent
from db import save_chat_message, get_recent_chat_messages


def main():
    if len(sys.argv) != 2:
        print("Usage: python chat_agent.py <temp_file>", file=sys.stderr)
        return 1
    temp_file = sys.argv[1]
    with open(temp_file, 'r', encoding='utf-8') as f:
        chat_data = json.load(f)
    message = chat_data.get('message', '')

    recent_messages = get_recent_chat_messages(25)
    context = ""
    if recent_messages:
        context += "Previous conversation context:\n"
        for msg in recent_messages:
            role = "User" if msg['type'] == 'user' else 'Assistant'
            context += f"{role}: {msg['content']}\n"
        context += "\n"

    message_with_context = context + "Current user message: " + message
    save_chat_message('user', message)

    agent = create_agent()
    result = run_agent(agent, message_with_context)

    if hasattr(result, 'final_output') and result.final_output:
        assistant_response = result.final_output
        save_chat_message('assistant', assistant_response)
        print(assistant_response)
    else:
        error_msg = "Error: Could not extract final output"
        save_chat_message('assistant', error_msg)
        print(error_msg)

    os.remove(temp_file)
    return 0


if __name__ == '__main__':
    sys.exit(main())
