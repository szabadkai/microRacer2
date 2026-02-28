import './style.css';
import { InputManager } from './InputManager.js';
import { Car } from './Car.js';
import { Track } from './Track.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AudioManager } from './AudioManager.js';
import { GamepadManager } from './GamepadManager.js';
import { GhostRecorder, GhostPlayer } from './GhostRecorder.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const input = new InputManager();
const gamepadManager = new GamepadManager();
input.gamepadManager = gamepadManager; // Give InputManager access for Car.js

const track = new Track(1000, 30); // 1000 radius, 30 points for trickier turns
const particles = new ParticleSystem();
const audioManager = new AudioManager();

// We won't create a single car up front anymore. We will create them locally based on the lobby.
let cars = [];

// Ghost state
let ghostsEnabled = true;
let ghostRecorders = []; // one per car
let ghostPlayers = [];   // one per car (null until first best lap)

let lastTime = 0;
let score = 0;
const scoreElement = document.getElementById('scoreValue');

// Lap tracking state
let currentLap = 1;
const maxLaps = 3;
let currentLapTime = 0;
let bestLapTime = Infinity;
let totalRaceTime = 0;
let targetSector = 1; // 1, 2, 3, 4, then 0 for finish

// UI Elements
const uiP1 = {
  lapValue: document.getElementById('lapValue1'),
  maxLapsValue: document.getElementById('maxLapsValue1'),
  lapTimeValue: document.getElementById('lapTimeValue1'),
  bestLapValue: document.getElementById('bestLapValue1'),
  speedValue: document.getElementById('speedValue1'),
  boostBar: document.getElementById('boostBar1'),
  score: document.getElementById('scoreValue1')
};

const uiP2 = {
  lapValue: document.getElementById('lapValue2'),
  maxLapsValue: document.getElementById('maxLapsValue2'),
  lapTimeValue: document.getElementById('lapTimeValue2'),
  bestLapValue: document.getElementById('bestLapValue2'),
  speedValue: document.getElementById('speedValue2'),
  boostBar: document.getElementById('boostBar2'),
  score: document.getElementById('scoreValue2')
};

// Menu Elements
const mainMenu = document.getElementById('mainMenu');
const startBtn = document.getElementById('startBtn');
const lobbyMenu = document.getElementById('lobbyMenu');
const playerSlots = document.getElementById('playerSlots');
const startRaceBtn = document.getElementById('startRaceBtn');

const countdownMenu = document.getElementById('countdownMenu');
const countdownText = document.getElementById('countdownText');
const pauseMenu = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const gameOverMenu = document.getElementById('gameOverMenu');
const restartBtn = document.getElementById('restartBtn');
const uiLayer = document.getElementById('ui');

// For now, let's just initialize P1's HTML to prevent crashes. We will split logic fully soon.
uiP1.maxLapsValue.textContent = maxLaps;
uiP2.maxLapsValue.textContent = maxLaps;

uiLayer.classList.add('hidden'); // Hide HUD initially

// Game States
const STATE = {
  MENU: 0,
  LOBBY: 1,
  COUNTDOWN: 2,
  PLAYING: 3,
  PAUSED: 4,
  GAMEOVER: 5
};
let gameState = STATE.MENU;
let countdownTimer = 3;

function setMenuVisible(menu, isVisible) {
  if (isVisible) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// --- LOBBY LOGIC ---
let joinedPlayers = [];
const MAX_PLAYERS = 2;
const playerColors = ['#00ffcc', '#ff00ff'];

function updateLobbyUI() {
  playerSlots.innerHTML = '';
  joinedPlayers.forEach((player, i) => {
    const slot = document.createElement('div');
    slot.style.border = `2px solid ${playerColors[i]}`;
    slot.style.padding = '20px';
    slot.style.borderRadius = '10px';
    slot.style.color = playerColors[i];
    slot.style.textAlign = 'center';
    
    let inputType = 'Keyboard';
    if (player.gamepadIndex !== null) {
      inputType = `Gamepad ${player.gamepadIndex + 1}`;
    } else if (player.controls === 'wasd') {
      inputType = 'Keyboard (WASD)';
    } else {
      inputType = 'Keyboard (Arrows)';
    }
    
    slot.innerHTML = `<h3>PLAYER ${i + 1}</h3><p>${inputType}</p><p style="font-size: 0.8em; margin-top: 10px;">READY</p>`;
    playerSlots.appendChild(slot);
  });
  
  if (joinedPlayers.length > 0) {
    startRaceBtn.classList.remove('hidden');
  } else {
    startRaceBtn.classList.add('hidden');
  }
}

function tryJoinPlayer(inputType, gamepadIndex = null) {
  if (gameState !== STATE.LOBBY) return;
  if (joinedPlayers.length >= MAX_PLAYERS) return;
  
  // Check if this input is already registered
  const alreadyJoined = joinedPlayers.some(p => {
    if (gamepadIndex !== null) return p.gamepadIndex === gamepadIndex;
    return p.controls === inputType;
  });
  
  if (alreadyJoined) return;
  
  const setup = { gamepadIndex: null, controls: null };
  if (gamepadIndex !== null) {
    setup.gamepadIndex = gamepadIndex;
    // Default gamepad controls (gamepad manages itself but needs fallback)
    setup.controls = { up: '', down: '', left: '', right: '', boost: '' };
  } else if (inputType === 'wasd') {
    setup.controls = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', boost: 'Space' };
  } else {
    setup.controls = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'ShiftRight' };
  }
  
  joinedPlayers.push(setup);
  updateLobbyUI();
}

// Global listener for lobby joins
window.addEventListener('keydown', (e) => {
  if (gameState === STATE.LOBBY) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
      tryJoinPlayer('wasd');
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftRight', 'ShiftLeft'].includes(e.code)) {
      tryJoinPlayer('arrows');
    }
  }
});

function pollGamepadsForLobby() {
  if (gameState !== STATE.LOBBY) return;
  
  gamepadManager.poll();
  for (let i = 0; i < 4; i++) { // Max 4 gamepads typically
    const gp = gamepadManager.getGamepad(i);
    if (gp) {
      // Check if any button is pressed to join
      const anyPressed = gp.buttons.some(b => b.pressed);
      if (anyPressed) {
        tryJoinPlayer('gamepad', i);
      }
    }
  }
}

function enterLobby() {
  gameState = STATE.LOBBY;
  joinedPlayers = [];
  setMenuVisible(mainMenu, false);
  setMenuVisible(lobbyMenu, true);
  updateLobbyUI();
}

function startGame() {
  audioManager.init();
  audioManager.resume();
  totalRaceTime = 0;

  // Initialize Cars based on joined players
  cars = [];
  ghostRecorders = [];
  ghostPlayers = [];
  const startPos = track.getStartPos();
  joinedPlayers.forEach((setup, i) => {
    // Offset cars slightly if multiple
    const xOffset = i === 1 ? -30 : 30; // 1 to the left, 1 to the right
    const dirX = Math.cos(startPos.heading + Math.PI/2) * xOffset;
    const dirY = Math.sin(startPos.heading + Math.PI/2) * xOffset;
    
    const car = new Car(startPos.x + dirX, startPos.y + dirY, playerColors[i], setup.controls);
    car.heading = startPos.heading;
    car.gamepadIndex = setup.gamepadIndex;
    car.playerIndex = i; // Store for HUD updates
    
    // Per-player tracking
    car.currentLap = 1;
    car.currentLapTime = 0;
    car.bestLapTime = Infinity;
    car.targetSector = 1;
    car.score = 0;
    
    cars.push(car);
    ghostRecorders.push(new GhostRecorder());
    ghostPlayers.push(null);
  });
  
  // Show right HUDs based on player count
  document.getElementById('hud-p1').style.display = cars.length > 0 ? 'block' : 'none';
  document.getElementById('hud-p2').style.display = cars.length > 1 ? 'block' : 'none';

  gameState = STATE.COUNTDOWN;
  setMenuVisible(lobbyMenu, false);
  setMenuVisible(gameOverMenu, false);
  setMenuVisible(countdownMenu, true);
  uiLayer.classList.remove('hidden');
  
  countdownTimer = 3;
  countdownText.textContent = countdownTimer;
  
  let countInterval = setInterval(() => {
    countdownTimer--;
    if (countdownTimer > 0) {
      countdownText.textContent = countdownTimer;
    } else if (countdownTimer === 0) {
      countdownText.textContent = "GO!";
    } else {
      clearInterval(countInterval);
      setMenuVisible(countdownMenu, false);
      gameState = STATE.PLAYING;
      lastTime = performance.now(); // Reset time right before playing
    }
  }, 1000);
}

startBtn.addEventListener('click', enterLobby);
startRaceBtn.addEventListener('click', startGame);

function pauseGame() {
  if (gameState !== STATE.PLAYING) return;
  gameState = STATE.PAUSED;
  audioManager.suspend();
  setMenuVisible(pauseMenu, true);
}

function resumeGame() {
  if (gameState !== STATE.PAUSED) return;
  gameState = STATE.PLAYING;
  audioManager.resume();
  setMenuVisible(pauseMenu, false);
  lastTime = performance.now(); // Reset lastTime so dt doesn't jump
}

function endGame() {
  gameState = STATE.GAMEOVER;
  audioManager.suspend();
  uiLayer.classList.add('hidden');
  
  const winnerText = document.getElementById('winnerText');
  if (cars.length === 1) {
    winnerText.textContent = "RACE OVER";
  } else if (cars.length === 2) {
    const winnerCar = cars.find(c => c.currentLap > maxLaps) || cars[0];
    winnerText.textContent = `PLAYER ${winnerCar.playerIndex + 1} WINS!`;
  }
  
  cars.forEach((car, i) => {
    const finalTime = document.getElementById(`finalTimeValue${i+1}`);
    const finalBest = document.getElementById(`finalBestValue${i+1}`);
    const finalScore = document.getElementById(`finalScoreValue${i+1}`);
    
    if (finalTime) finalTime.textContent = totalRaceTime.toFixed(2);
    if (finalBest) finalBest.textContent = car.bestLapTime === Infinity ? "--" : car.bestLapTime.toFixed(2);
    if (finalScore) finalScore.textContent = car.score;
  });

  const p2StatsContainer = document.querySelector('.p2-stats');
  if (p2StatsContainer) {
    p2StatsContainer.style.display = cars.length > 1 ? 'block' : 'none';
  }

  setMenuVisible(gameOverMenu, true);
}

function restartRace() {
  startGame(); // We can just call start game to re-initialize the cars based on the joined players
}

resumeBtn.addEventListener('click', resumeGame);
restartBtn.addEventListener('click', restartRace);

// Volume sliders on pause screen
const musicVolumeSlider = document.getElementById('musicVolume');
const sfxVolumeSlider = document.getElementById('sfxVolume');
const musicVolumeLabel = document.getElementById('musicVolumeLabel');
const sfxVolumeLabel = document.getElementById('sfxVolumeLabel');

musicVolumeSlider.addEventListener('input', () => {
  const val = parseFloat(musicVolumeSlider.value);
  musicVolumeLabel.textContent = `${Math.round(val * 100)}%`;
  audioManager.setMusicVolume(val);
});

sfxVolumeSlider.addEventListener('input', () => {
  const val = parseFloat(sfxVolumeSlider.value);
  sfxVolumeLabel.textContent = `${Math.round(val * 100)}%`;
  audioManager.setSfxVolume(val);
});

// Ghost toggle
const ghostToggle = document.getElementById('ghostToggle');
const ghostToggleLabel = document.getElementById('ghostToggleLabel');
ghostToggle.addEventListener('change', () => {
  ghostsEnabled = ghostToggle.checked;
  ghostToggleLabel.textContent = ghostsEnabled ? 'ON' : 'OFF';
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (gameState === STATE.PLAYING) {
      pauseGame();
    } else if (gameState === STATE.PAUSED) {
      resumeGame();
    }
  }
});

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function updateHUD(car) {
  const ui = car.playerIndex === 0 ? uiP1 : uiP2;
  
  const speed = Math.hypot(car.velocity.x, car.velocity.y);
  ui.speedValue.textContent = Math.floor(speed / 10);
  
  car.currentLapTime += lastDt;
  ui.lapTimeValue.textContent = car.currentLapTime.toFixed(2);
  ui.boostBar.style.width = `${car.boostLevel}%`;
  
  const trackInfo = track.getPointInfo(car.x, car.y);
  const totalPoints = track.splinePoints.length;
  const progressRatio = trackInfo.progressIndex / totalPoints;
  
  const sector1 = 0.25;
  const sector2 = 0.50;
  const sector3 = 0.75;
  const lapEnd = 0.95;
  const lapStart = 0.05;

  if (car.targetSector === 1 && progressRatio > sector1 && progressRatio < sector2) car.targetSector = 2;
  if (car.targetSector === 2 && progressRatio > sector2 && progressRatio < sector3) car.targetSector = 3;
  if (car.targetSector === 3 && progressRatio > sector3 && progressRatio < lapEnd) car.targetSector = 4;
  
  if (car.targetSector === 4 && (progressRatio > lapEnd || progressRatio < lapStart)) {
    if (car.currentLapTime > 2.0) {
      const recorder = ghostRecorders[car.playerIndex];
      const isNewBest = recorder && recorder.onLapComplete(car.currentLapTime);
      
      if (isNewBest) {
        // Create/replace ghost player with the new best lap data
        ghostPlayers[car.playerIndex] = new GhostPlayer(recorder.bestFrames, car.color);
      } else if (ghostPlayers[car.playerIndex]) {
        // Reset existing ghost to start of loop
        ghostPlayers[car.playerIndex].frameIndex = 0;
        ghostPlayers[car.playerIndex].elapsed = 0;
      }

      if (car.currentLapTime < car.bestLapTime) {
        car.bestLapTime = car.currentLapTime;
        ui.bestLapValue.textContent = car.bestLapTime.toFixed(2);
      }
      
      car.currentLap++;
      if (car.currentLap <= maxLaps) {
        ui.lapValue.textContent = car.currentLap;
      } else {
        // One player finished! (Could add logic for waiting for P2)
        endGame();
      }
      
      car.currentLapTime = 0;
      car.targetSector = 1;
    }
  }

  if (car.isBoosting) {
    const backX = car.x - Math.cos(car.heading) * 15;
    const backY = car.y - Math.sin(car.heading) * 15;
    particles.emit(backX, backY, 20, car.heading + Math.PI + (Math.random()-0.5)*0.2, car.color, 12, 0.4);
  } else if (car.isDrifting) {
    car.score += Math.floor(100 * lastDt);
    ui.score.textContent = car.score;
    
    if (speed > 100 && Math.random() < 0.5) {
      const backX = car.x - Math.cos(car.heading) * 10;
      const backY = car.y - Math.sin(car.heading) * 10;
      particles.emit(backX, backY, 10, car.heading + Math.PI + (Math.random()-0.5), 'rgb(200, 200, 200)', 8, 1);
    }
  }
}

let lastDt = 0;

function update(dt) {
  if (gameState === STATE.LOBBY) {
    pollGamepadsForLobby();
  }
  
  if (gameState !== STATE.PLAYING) return;
  lastDt = dt;
  totalRaceTime += dt;

  // Audio: Using the first car for simplicity, or finding max speed and any drifter
  let maxSpeed = 0;
  let someoneDrifting = false;

  cars.forEach((car, i) => {
    const trackInfo = track.getPointInfo(car.x, car.y);
    car.update(dt, input, trackInfo);
    updateHUD(car);
    
    // Record ghost frame
    if (ghostRecorders[i]) ghostRecorders[i].recordFrame(car, dt);
    
    // Advance ghost playback
    if (ghostsEnabled && ghostPlayers[i]) ghostPlayers[i].update(dt);
    
    const speed = Math.hypot(car.velocity.x, car.velocity.y);
    if (speed > maxSpeed) maxSpeed = speed;
    if (car.isDrifting) someoneDrifting = true;
  });

  particles.update(dt);
  audioManager.update(maxSpeed, someoneDrifting);
}

function drawWorldForCar(car, viewWidth, viewHeight) {
  const speed = Math.hypot(car.velocity.x, car.velocity.y);
  const targetScale = 1.0 - (speed / 800) * 0.4;
  
  car.currentScale = car.currentScale || 1.0;
  car.currentScale += (targetScale - car.currentScale) * 0.05;

  ctx.save();
  ctx.translate(viewWidth / 2, viewHeight / 2);
  ctx.scale(car.currentScale, car.currentScale);
  ctx.translate(-car.x, -car.y);

  track.draw(ctx);
  particles.draw(ctx);
  
  // Draw ghosts behind real cars
  if (ghostsEnabled) {
    ghostPlayers.forEach(gp => { if (gp) gp.draw(ctx); });
  }
  
  cars.forEach(c => c.draw(ctx)); // Draw all cars in this view

  ctx.restore();
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

  if (cars.length === 1) {
    drawWorldForCar(cars[0], canvas.width, canvas.height);
  } else if (cars.length > 1) {
    const halfWidth = canvas.width / 2;
    
    // P1 Viewport (Left)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, halfWidth, canvas.height);
    ctx.clip();
    drawWorldForCar(cars[0], halfWidth, canvas.height);
    ctx.restore();

    // P2 Viewport (Right)
    ctx.save();
    ctx.beginPath();
    ctx.rect(halfWidth, 0, halfWidth, canvas.height);
    ctx.clip();
    ctx.translate(halfWidth, 0); 
    drawWorldForCar(cars[1], halfWidth, canvas.height);
    ctx.restore();
    
    // Draw split line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, canvas.height);
    ctx.stroke();
  }

  // Draw minimap on top of everything (HUD)
  if (cars.length > 0) {
    track.drawMinimap(ctx, cars[0].x, cars[0].y); 
  }
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
