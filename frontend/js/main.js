// js/main.js — optimized version (same visuals, smoother performance)

const canvas = document.getElementById("cherryCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const PETAL_COUNT = window.innerWidth < 600 ? 35 : 70; // mobile-friendly count
const petals = [];

function rand(min, max) { return Math.random() * (max - min) + min; }

class Petal {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.w = rand(12, 28);
    this.h = this.w * rand(0.5, 0.7);
    this.x = rand(0, window.innerWidth);
    this.y = initial ? rand(-window.innerHeight, window.innerHeight) : rand(-150, -50);
    this.speedY = rand(0.4, 1.2);
    this.speedX = rand(-0.4, 0.4);
    this.rotation = rand(0, Math.PI * 2);
    this.spin = rand(-0.02, 0.02);
    this.opacity = rand(0.6, 0.9);
    this.tint = [
      Math.floor(rand(230, 255)),
      Math.floor(rand(160, 210)),
      Math.floor(rand(180, 230))
    ];
    this.sway = rand(0.002, 0.006);
    this.phase = rand(0, Math.PI * 2);
  }
  update(delta) {
    this.phase += this.sway * delta;
    this.x += this.speedX + Math.sin(this.phase) * 0.5;
    this.y += this.speedY;
    this.rotation += this.spin;
    if (this.y > window.innerHeight + 50) this.reset();
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const g = ctx.createLinearGradient(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    const [r, gc, b] = this.tint;
    g.addColorStop(0, `rgba(${r},${gc},${b},${this.opacity})`);
    g.addColorStop(1, `rgba(${r},${gc},${b},${this.opacity * 0.6})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.w / 2, this.h / 2, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function init() {
  petals.length = 0;
  for (let i = 0; i < PETAL_COUNT; i++) petals.push(new Petal());
  requestAnimationFrame(loop);
}

let lastTime = performance.now();
function loop(t) {
  const delta = (t - lastTime) / 16.666;
  lastTime = t;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of petals) {
    p.update(delta);
    p.draw(ctx);
  }
  requestAnimationFrame(loop);
}

// Ensure behind content
canvas.style.zIndex = "0";
canvas.style.position = "fixed";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.pointerEvents = "none";

init();
