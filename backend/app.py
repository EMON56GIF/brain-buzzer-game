# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from game_logic import generate_number, check_guess_with_feedback
from quizpuzzle import get_puzzle, check_answer, get_hint

app = Flask(__name__)
CORS(app)

# ===== Root Endpoint =====
@app.route('/')
def home():
    return jsonify({"message": "Welcome to Brain Buzzer Backend!"})


# ===== NUMBER GAME =====
@app.route('/api/generate', methods=['GET'])
def generate():
    level = int(request.args.get('level', 1))
    number = generate_number(level)
    return jsonify({"correct": number})


@app.route('/api/check', methods=['POST'])
def check():
    data = request.get_json()
    guess = data.get('guess')
    correct = data.get('correct')
    level = int(data.get('level', 1))

    if guess is None or correct is None:
        return jsonify({"error": "Missing guess or correct number"}), 400

    result = check_guess_with_feedback(guess, correct, level)
    return jsonify(result)


# ===== QUIZ PUZZLE GAME =====
@app.route('/api/puzzle', methods=['GET'])
def puzzle():
    """Get a random puzzle for the given round"""
    round_number = int(request.args.get('round', 1))
    puzzle = get_puzzle(round_number)
    if not puzzle:
        return jsonify({"error": "No puzzles available for this round"}), 404

    return jsonify({
        "question": puzzle["question"],
        "hints": puzzle.get("hints", []),
        "round": round_number
    })


@app.route('/api/puzzle/check', methods=['POST'])
def puzzle_check():
    """Check user's answer"""
    data = request.get_json()
    round_number = int(data.get("round", 1))
    answer = data.get("answer", "")
    puzzle_question = data.get("question")

    # Find the corresponding puzzle object
    puzzle = None
    for p in get_puzzle(round_number),:  # safety call
        if p and p["question"] == puzzle_question:
            puzzle = p
            break
    if not puzzle:
        puzzle = get_puzzle(round_number)  # fallback random puzzle

    if check_answer(puzzle, answer):
        return jsonify({"result": "correct", "message": "🔥 That’s right! You crushed it!"})
    else:
        return jsonify({"result": "wrong", "message": "❌ Nope! Try again or use a hint."})


@app.route('/api/puzzle/hint', methods=['GET'])
def puzzle_hint():
    """Return a hint for a given puzzle"""
    round_number = int(request.args.get('round', 1))
    hint_number = int(request.args.get('hint', 1))
    puzzle = get_puzzle(round_number)
    hint_text = get_hint(puzzle, hint_number)
    return jsonify({"hint": hint_text})


# ===== RUN SERVER =====
if __name__ == '__main__':
    app.run(debug=True)
