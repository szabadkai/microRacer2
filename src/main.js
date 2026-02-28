import './style.css';
import { InputManager } from './InputManager.js';
import { Car } from './Car.js';
import { Track } from './Track.js';
import { ParticleSystem } from './ParticleSystem.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const input = new InputManager();
const track = new Track(1500, 10); // Radius 1500, 10 points
const startPos = track.getStartPos();
const car = new Car(startPos.x, startPos.y);
car.heading = startPos.heading;

const particles = new ParticleSystem();

let lastTime = 0;
let score = 0;
const scoreElement = document.getElementById('scoreValue');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function update(dt) {
  car.update(dt, input);
  particles.update(dt);
  
  if (car.isDrifting) {
    score += Math.floor(100 * dt);
    scoreElement.textContent = score;
    
    // Emit smoke
    const speed = Math.hypot(car.velocity.x, car.velocity.y);
    if (speed > 100 && Math.random() < 0.5) {
      // Approximate back tire positions
      const backX = car.x - Math.cos(car.heading) * 10;
      const backY = car.y - Math.sin(car.heading) * 10;
      particles.emit(backX, backY, 10, car.heading + Math.PI + (Math.random()-0.5), 'rgb(200, 200, 200)', 8, 1);
    }
  }
}

function draw() {
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw a cool neon grid background
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 1;
  const gridSize = 100;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Dynamic Camera Zoom based on speed
  const speed = Math.hypot(car.velocity.x, car.velocity.y);
  // Base scale 1.0, zooming out to 0.6 at high speeds
  const targetScale = 1.0 - (speed / 800) * 0.4;
  
  // Smoothly interpolate currentScale (optional feature for later: actual lerping)
  // For now, snap scale or lerp implicitly. Let's do a simple lerp.
  // We'll store currentScale on window or just define it globally.
  if(!window.currentScale) window.currentScale = 1;
  window.currentScale += (targetScale - window.currentScale) * 0.05; // Smoothing
  
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(window.currentScale, window.currentScale);
  ctx.translate(-car.x, -car.y);

  track.draw(ctx);
  particles.draw(ctx);
  car.draw(ctx);
  
  ctx.restore();
}

function gameLoop(timestamp) {
  // Cap dt to avoid huge jumps when tab is inactive
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); 
  lastTime = timestamp;
  
  update(dt);
  draw();
  
  requestAnimationFrame(gameLoop);
}

// Start loop
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});
