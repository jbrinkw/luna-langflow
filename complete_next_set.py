import sys
import json
import os

# Ensure we can import tools from project root
sys.path.append(os.path.dirname(__file__))

from tools import complete_planned_set


def main():
    try:
        result = complete_planned_set()
        print(json.dumps({"message": result}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
