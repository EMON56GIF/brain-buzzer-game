// ===== CONFIG =====
const API_BASE = "http://127.0.0.1:5000"; // Flask backend URL

// ===== DOM ELEMENTS =====
const feedback = document.getElementById("feedback");
const attemptsEl = document.getElementById("attempts");
const roundInfo = document.getElementById("roundInfo");
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const nextRoundBtn = document.getElementById("nextRoundBtn");
const startGameBtn = document.getElementById("startGameBtn");
const startSection = document.getElementById("startSection");
const gameSection = document.getElementById("gameSection");

// ===== GAME STATE =====
let level = 1;
let correctNumber = null;
let attempts = 0;
const MAX_ROUNDS = 3;

// ===== FUNCTIONS =====
function showFeedback(text, color = "#fff") {
  feedback.textContent = text;
  feedback.style.color = color;
  feedback.style.opacity = 0;
  feedback.style.transition = "opacity 0.4s ease";
  setTimeout(() => {
    feedback.style.opacity = 1;
  }, 50);
}

async function fetchNewNumber() {
  try {
    const res = await fetch(`${API_BASE}/api/generate?level=${level}`);
    const data = await res.json();
    correctNumber = data.correct;

    const maxRange = level === 1 ? 10 : level === 2 ? 50 : 100;
    roundInfo.textContent = `Round ${level}: Guess a number between 1 and ${maxRange}`;
    showFeedback("Round started! Enter your guess 🎯", "#FFD700");

    attempts = 0;
    attemptsEl.textContent = "";
    guessInput.value = "";
    nextRoundBtn.classList.add("hidden");
  } catch (err) {
    showFeedback("⚠️ Backend not reachable. Run Flask server!", "#ff6b6b");
  }
}

async function checkGuess() {
  const guess = parseInt(guessInput.value);
  if (isNaN(guess)) {
    showFeedback("Enter a valid number!", "#ff6b6b");
    return;
  }

  attempts++;
  attemptsEl.textContent = `Attempts: ${attempts}`;

  try {
    const res = await fetch(`${API_BASE}/api/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess, correct: correctNumber, level })
    });

    const data = await res.json();

    if (data.result === "correct") {
      showFeedback(`🎉 ${data.message}`, "#7CFC00");
      guessBtn.disabled = true;
      guessInput.disabled = true;

      // If final round cleared → Show Play Again
      if (level === MAX_ROUNDS) {
        nextRoundBtn.textContent = "Play Again";
        nextRoundBtn.onclick = resetGame;
      } else {
        nextRoundBtn.textContent = "Next Round";
        nextRoundBtn.onclick = nextRound;
      }

      nextRoundBtn.classList.remove("hidden");
    } else if (data.result === "low") {
      showFeedback(`⬆️ ${data.message}`, "#FFD700");
    } else if (data.result === "high") {
      showFeedback(`⬇️ ${data.message}`, "#FFA500");
    } else {
      showFeedback(data.message || "Keep trying!");
    }
  } catch (err) {
    showFeedback("⚠️ Error contacting backend!", "#ff6b6b");
  }

  guessInput.value = "";
  guessInput.focus();
}

function nextRound() {
  level += 1;
  guessBtn.disabled = false;
  guessInput.disabled = false;
  fetchNewNumber();
}

function resetGame() {
  level = 1;
  attempts = 0;
  guessBtn.disabled = false;
  guessInput.disabled = false;
  nextRoundBtn.classList.add("hidden");
  startSection.classList.remove("hidden");
  gameSection.classList.add("hidden");
  showFeedback("Welcome back! Click Start Game to play again 🎮", "#FFD700");
}

// ===== EVENT HANDLERS =====
startGameBtn.addEventListener("click", () => {
  startSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  fetchNewNumber();
});

guessBtn.addEventListener("click", checkGuess);
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkGuess();
});
