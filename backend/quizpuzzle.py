import random

# --- All Puzzle Data ---
puzzles = {
    "round_1": [
        {
            "question": "I have keys but no locks. I have space but no rooms. You can enter but can’t go outside. What am I?",
            "answer": "keyboard",
            "hints": ["Used in computers", "Has letters and numbers"]
        },
        {
            "question": "What has to be broken before you can use it?",
            "answer": "egg",
            "hints": ["Found in kitchens", "Usually eaten at breakfast"]
        }
    ],
    "round_2": [
        {
            "question": "The more you take, the more you leave behind. What am I?",
            "answer": "footsteps",
            "hints": ["You make them while walking", "They can be seen on sand or snow"]
        },
        {
            "question": "What can travel around the world while staying in a corner?",
            "answer": "stamp",
            "hints": ["Found on letters", "Used for sending mail"]
        }
    ],
    "round_3": [
        {
            "question": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
            "answer": "echo",
            "hints": ["It's a sound"]
        }
    ]
}

# --- Puzzle Logic ---
def get_puzzle(round_number):
    """Return a random puzzle based on round number"""
    round_key = f"round_{round_number}"
    if round_key not in puzzles:
        return None
    return random.choice(puzzles[round_key])


def check_answer(puzzle, user_answer):
    """Check if the user's answer is correct"""
    return user_answer.strip().lower() == puzzle["answer"].lower()


def get_hint(puzzle, hint_number):
    """Get a hint by number (1 or 2)"""
    hints = puzzle.get("hints", [])
    if hint_number <= len(hints):
        return hints[hint_number - 1]
    return "No more hints available!"


# --- Example Test (remove when integrating into app.py) ---
if __name__ == "__main__":
    round_num = 1
    puzzle = get_puzzle(round_num)
    print(f"Round {round_num} Question: {puzzle['question']}")

    hint_count = 0
    while True:
        answer = input("Your answer: ")
        if check_answer(puzzle, answer):
            print("✅ Correct! Moving to next round.")
            break
        else:
            hint_count += 1
            if hint_count <= len(puzzle["hints"]):
                print(f"❗Hint {hint_count}: {get_hint(puzzle, hint_count)}")
            else:
                print("❌ Wrong again. No more hints left!")
