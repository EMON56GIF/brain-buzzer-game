// puzzle.js
// Requires HTML ids: question, round, answerInput, submitBtn, hintBtn, feedback, hint,
// victory, fireworks (canvas), victoryText, nextBtn, backBtn
// Backend endpoints:
// GET  /api/puzzle?round=1
// POST /api/puzzle/check  { round, question, answer } -> { result: "correct"/"wrong", message: "..."}
//
// Behavior:
// - first hint available anytime (hintBtn shows hint1)
// - second hint only unlocked after a wrong attempt
// - correct -> show victory overlay + fireworks + Next / Back buttons
// - wrong -> show "OOPS U ARE WRONG" big overlay with Try Again button

(() => {
  const API_BASE = "http://127.0.0.1:5000";

  // DOM
  const roundEl = document.getElementById("round");
  const questionEl = document.getElementById("question");
  const answerInput = document.getElementById("answerInput");
  const submitBtn = document.getElementById("submitBtn");
  const hintBtn = document.getElementById("hintBtn");
  const feedbackEl = document.getElementById("feedback");
  const hintEl = document.getElementById("hint");

  const victoryOverlay = document.getElementById("victory");
  const fireCanvas = document.getElementById("fireworks");
  const victoryText = document.getElementById("victoryText");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");

  // State
  let round = 1;
  const MAX_ROUNDS = 3;
  let currentPuzzle = null;
  let wrongAttempts = 0;
  let hintShown = 0; // 0 -> none, 1 -> first shown, 2 -> second shown
  let fireworksRunning = false;
  let fwAnimHandle = null;

  // ---------- Helpers ----------
  function setFeedback(text, cls = "") {
    feedbackEl.textContent = text || "";
    feedbackEl.className = cls ? `feedback ${cls}` : "feedback";
  }

  function setHint(text) {
    hintEl.textContent = text || "";
  }

  async function loadPuzzle(r) {
    round = r;
    roundEl.textContent = `Round ${round}`;
    setFeedback("Loading puzzle...", "loading");
    setHint("");
    hintShown = 0;
    wrongAttempts = 0;
    currentPuzzle = null;
    answerInput.value = "";
    submitBtn.disabled = true;
    hintBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/puzzle?round=${round}`);
      if (!res.ok) throw new Error("No puzzle for this round");
      const data = await res.json();
      currentPuzzle = data;
      questionEl.textContent = data.question;
      setFeedback("Solve the puzzle! (You get 1 hint; 2nd hint unlocks after a wrong attempt)", "");
      submitBtn.disabled = false;
      hintBtn.disabled = false;
    } catch (err) {
      questionEl.textContent = "No puzzle available.";
      setFeedback("Error loading puzzle. Try again later.", "error");
      submitBtn.disabled = true;
      hintBtn.disabled = true;
    }
  }

  // ---------- Hints ----------
  hintBtn.addEventListener("click", async () => {
    if (!currentPuzzle) return;
    // first hint always available
    if (hintShown === 0) {
      const h = (currentPuzzle.hints && currentPuzzle.hints[0]) || "No hint available.";
      setHint(`Hint 1: ${h}`);
      hintShown = 1;
      return;
    }

    // second hint only after a wrong attempt
    if (hintShown === 1) {
      if (wrongAttempts > 0) {
        const h2 = (currentPuzzle.hints && currentPuzzle.hints[1]) || "No more hints.";
        setHint(`Hint 2: ${h2}`);
        hintShown = 2;
      } else {
        setFeedback("Second hint unlocks after you attempt and get it wrong once.", "info");
        setTimeout(() => setFeedback("", ""), 2200);
      }
      return;
    }

    // already shown both
    setFeedback("No more hints available!", "info");
  });

  // ---------- Submit / Check ----------
  submitBtn.addEventListener("click", async () => {
    if (!currentPuzzle) return;
    const answer = (answerInput.value || "").trim();
    if (!answer) {
      setFeedback("Enter an answer first.", "warn");
      return;
    }

    submitBtn.disabled = true;
    setFeedback("Checking...", "loading");

    try {
      const res = await fetch(`${API_BASE}/api/puzzle/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          question: currentPuzzle.question,
          answer
        })
      });

      const data = await res.json();

      if (data.result === "correct") {
        // show victory overlay
        showVictory(data.message || "Correct!");
      } else {
        // wrong
        wrongAttempts++;
        setFeedback(data.message || "Wrong! Try again.", "wrong");
        // show OOPS overlay with Try Again button
        showWrongPopup();
      }
    } catch (err) {
      setFeedback("Network error. Check backend.", "error");
    } finally {
      submitBtn.disabled = false;
      answerInput.focus();
    }
  });

  // allow Enter key to submit
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });

  // ---------- Overlays: Victory and Wrong ----------
  function showVictory(msg) {
    // prepare overlay text
    victoryText.textContent = `🎉 CORRECT ANSWER!!!`;
    // show optional server message as smaller feedback under big text:
    setFeedback(msg, "success");

    // show overlay and start fireworks
    victoryOverlay.style.display = "flex";
    startFireworks();

    // configure next & back buttons:
    if (round < MAX_ROUNDS) {
      nextBtn.textContent = "Next Round";
      nextBtn.onclick = () => {
        stopFireworks();
        victoryOverlay.style.display = "none";
        loadPuzzle(round + 1);
      };
    } else {
      nextBtn.textContent = "Play Again";
      nextBtn.onclick = () => {
        stopFireworks();
        victoryOverlay.style.display = "none";
        loadPuzzle(1);
      };
    }

    backBtn.onclick = () => {
      stopFireworks();
      victoryOverlay.style.display = "none";
      // go back to main: navigate to index.html (same as your other pages)
      window.location.href = "index.html";
    };
  }

  function showWrongPopup() {
    // reuse victory overlay but with different look & single Try Again button
    victoryText.textContent = `OOPS, YOU ARE WRONG!`;
    setFeedback("That was incorrect. You can try again or use the hint.", "wrong");
    // show overlay and play a small pop animation (no fireworks)
    victoryOverlay.style.display = "flex";
    // hide fireworks canvas (in case any running), ensure not running
    stopFireworks();
    fireCanvas.style.display = "none";

    // modify buttons: only show Try Again (nextBtn) and hide Back if you want
    nextBtn.textContent = "Try Again";
    nextBtn.onclick = () => {
      // dismiss overlay and resume
      victoryOverlay.style.display = "none";
      fireCanvas.style.display = "block";
      // after a wrong attempt, allow second hint
      if (hintShown === 1) {
        setFeedback("Second hint unlocked! Click Hint to see it.", "info");
      }
    };

    // keep Back button as navigation home
    backBtn.textContent = "Back";
    backBtn.onclick = () => {
      victoryOverlay.style.display = "none";
      window.location.href = "index.html";
    };
  }

  // ---------- Fireworks (simple particle system) ----------
  function startFireworks() {
    const canvas = fireCanvas;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    const DPR = window.devicePixelRatio || 1;
    function resize() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    fireworksRunning = true;
    const particles = [];

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function spawnFirework() {
      const cx = rand(100, window.innerWidth - 100);
      const cy = rand(100, window.innerHeight / 2);
      const count = Math.floor(rand(20, 40));
      const hue = Math.floor(rand(0, 360));
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(1, 5);
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: rand(60, 120),
          age: 0,
          hue,
          size: rand(1.5, 3.5)
        });
      }
    }

    let ticks = 0;
    function loop() {
      if (!fireworksRunning) return;
      ticks++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // occasionally spawn
      if (ticks % 30 === 0) spawnFirework();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age++;
        p.vy += 0.02; // gravity
        p.x += p.vx;
        p.y += p.vy;
        const alpha = Math.max(0, 1 - p.age / p.life);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.age >= p.life) particles.splice(i, 1);
      }

      fwAnimHandle = requestAnimationFrame(loop);
    }

    // run for a limited time then stop automatically (e.g., 6s)
    loop();
    setTimeout(() => stopFireworks(), 6500);
  }

  function stopFireworks() {
    fireworksRunning = false;
    if (fwAnimHandle) cancelAnimationFrame(fwAnimHandle);
    const ctx = fireCanvas.getContext("2d");
    ctx && ctx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);
    fireCanvas.style.display = "none";
  }

  // ---------- Init ----------
  // ensure overlay hidden initially
  victoryOverlay.style.display = "none";
  fireCanvas.style.display = "block"; // canvas available; overlay hides it when not used

  // load first puzzle
  loadPuzzle(1);

  // expose reset by window if needed
  window.puzzle_reset = () => loadPuzzle(1);
})();
