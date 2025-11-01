# backend/game_logic.py
import random

def generate_number(level):
    """Increase difficulty each round."""
    if level == 1:
        return random.randint(1, 10)
    elif level == 2:
        return random.randint(1, 50)
    else:
        return random.randint(1, 100)


def _select_random(lst):
    import random
    return random.choice(lst)


def check_guess_with_feedback(guess, correct, level=1):
    """
    Returns a tuple/dict with:
      - result: "correct" / "low" / "high"
      - message: Gen-Z style feedback string
    level influences how 'forgiving' thresholds are and how snarky messages get.
    """
    # Normalize types
    try:
        guess = int(guess)
        correct = int(correct)
    except Exception:
        return {"result": "error", "message": "Invalid numbers."}

    if guess == correct:
        win_msgs = [
            "Bang on! You're a legend. ✨",
            "OMG yes — nailed it! 🔥",
            "Correct! Flex time. 💪"
        ]
        return {"result": "correct", "message": _select_random(win_msgs)}

    # distance and ratio to decide tier
    diff = guess - correct
    abs_diff = abs(diff)
    # avoid division by zero; use small epsilon
    ratio = abs_diff / max(1, correct)

    # set thresholds per level (smaller level => smaller ranges)
    if level == 1:
        tiny = 1       # barely off
        small = 3
        big = 6
    elif level == 2:
        tiny = 2
        small = 8
        big = 20
    else:  # level 3
        tiny = 3
        small = 12
        big = 30

    # LOW (guess < correct)
    if guess < correct:
        if abs_diff <= tiny:
            msgs = [
                "So close, a smidge low — try nudging up a bit.",
                "Almost there! Go just a little higher.",
                "You're grazing it — aim a tiny bit higher."
            ]
        elif abs_diff <= small:
            msgs = [
                "Low-key low. Push it up!",
                "A bit under, not bad. Try a higher guess.",
                "Nah, you're undershooting. Try a higher number."
            ]
        elif abs_diff <= big:
            msgs = [
                "Bro, you're way below. Climb up!",
                "You're searching in the basement — look above.",
                "Too low — try not to live under the radar."
            ]
        else:
            msgs = [
                "Dude, you're digging to China — go up, way up.",
                "You're practically underground with that guess. Zoom up!",
                "Low extreme — are you trying to teleport under the number?"
            ]
        return {"result": "low", "message": _select_random(msgs)}

    # HIGH (guess > correct)
    else:
        # classify high into slight / moderate / huge / absurd
        # use absolute diff thresholds and also ratio
        if abs_diff <= tiny:
            msgs = [
                "Slightly high — you're almost back to Earth.",
                "A tad high. Knock it down a smidge.",
                "Just a hair above — lower it a bit."
            ]
        elif abs_diff <= small:
            msgs = [
                "Too high — you're peeking over the top.",
                "High vibes, but not the right ones. Lower it.",
                "A bit up in clouds — come down a little."
            ]
        elif abs_diff <= big:
            msgs = [
                "Bruh, that's high. You're orbiting — come back down.",
                "You're up in the stratosphere with that guess. Descend!",
                "Whoa, too high. Try searching the planet below."
            ]
        else:
            # absolute extreme — use Gen Z flavour lines
            msgs = [
                "Damn bro, you reached too high — you in space! 🌌 Search below.",
                "No cap, you're skydiving past the number. Land back on Earth.",
                "Woooah that guess is cosmic. Try something grounded."
            ]
        return {"result": "high", "message": _select_random(msgs)}


# Keep old simple check_guess if other parts need it
def check_guess(guess, correct):
    """Backward compatible simple check returning 'correct'/'low'/'high'"""
    try:
        guess = int(guess)
        correct = int(correct)
    except Exception:
        return "error"

    if guess == correct:
        return "correct"
    elif guess < correct:
        return "low"
    else:
        return "high"
