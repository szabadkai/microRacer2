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
input.gamepadManager = gamepadManager;

let track = null; // Will be created when game starts
const particles = new ParticleSystem();
const audioManager = new AudioManager();

let cars = [];

// Ghost state
let ghostsEnabled = localStorage.getItem('ghostsEnabled') !== 'false';
let ghostRecorders = [];
let ghostPlayers = [];

let lastTime = 0;
let lastDt = 0;
let totalRaceTime = 0;
let maxLaps = 3;

// ============================================
// GAME STATE
// ============================================

const STATE = {
  STUDIO_SPLASH: -1,
  SPLASH: 0,
  MENU: 1,
  LOBBY: 2,
  COUNTDOWN: 3,
  PLAYING: 4,
  PAUSED: 5,
  GAMEOVER: 6,
  SETTINGS: 7,
  LEADERBOARD: 8,
  FINISHING: 9,
  CAMPAIGN: 10,
  ONBOARDING: 11
};

const GAMEMODE = {
  QUICKRACE: 0,
  CAMPAIGN: 1
};

let currentGameMode = GAMEMODE.QUICKRACE;
let currentCampaignLevelIndex = 0;

const CAMPAIGN_LEVELS = [
  // SECTION 1: Rookie
  { id: 'c1', name: 'Rookie Run', trackIndex: 0, laps: 3, ai: ['bronze', 'bronze'], challengeText: 'Win 1st against 2 Bronze AIs', onboarding: { title: 'Welcome to microRacer 2', text: 'Use the Arrow Keys, WASD, or a Gamepad to steer and accelerate. Win 1st place to advance!' } },
  { id: 'c2', name: 'Drift Initiation', trackIndex: 1, laps: 3, ai: [], targetDriftScore: 5000, challengeText: 'Score 5,000 drift points', onboarding: { title: 'Drift Initiation', text: 'Drift by releasing acceleration, turning sharply, and accelerating again. Chaining drifts builds a combo multiplier!' } },
  { id: 'c3', name: 'Desert Dash', trackIndex: 3, laps: 3, ai: ['bronze', 'bronze', 'bronze'], challengeText: 'Beat 3 Bronze AIs' },
  { id: 'c4', name: 'Boost Basics', trackIndex: 0, laps: 2, ai: [], targetTime: 85, challengeText: 'Finish 2 laps in under 1:25', onboarding: { title: 'Boost Power', text: 'Press SHIFT, SPACE, or the bottom gamepad button to use your boost. Boosting uses your energy meter, which slowly refills over time.' } },
  { id: 'c5', name: 'Silver Scramble', trackIndex: 1, laps: 3, ai: ['silver', 'bronze'], challengeText: 'Beat the Silver AI' },
  { id: 'c6', name: 'BOSS: Neon Knight', trackIndex: 0, laps: 5, ai: ['boss'], challengeText: 'Defeat the Boss' },
  
  // SECTION 2: Intermediate
  { id: 'c7', name: 'Ice Capades', trackIndex: 4, laps: 3, ai: ['silver', 'silver'], challengeText: 'Win 1st against 2 Silver AIs', onboarding: { title: 'Slipstream Master', text: 'Draft closely behind opponents to gain a speed boost. Use it to slingshot past them!' } },
  { id: 'c8', name: 'Midnight Drifter', trackIndex: 2, laps: 3, ai: [], targetDriftScore: 10000, challengeText: 'Score 10,000 drift points' },
  { id: 'c9', name: 'Slipstream Test', trackIndex: 2, laps: 3, ai: ['gold'], targetDraftTime: 5, challengeText: 'Draft behind AI for 5 seconds total.' },
  { id: 'c10', name: 'Synthwave Showdown', trackIndex: 8, laps: 3, ai: ['silver', 'silver', 'bronze'], challengeText: 'Win 1st on the new track', onboarding: { title: 'Clean Racing', text: 'Try to stay on the track. Driving on the grass or hitting walls slows you down significantly!' } },
  { id: 'c11', name: 'Clean Sweep', trackIndex: 0, laps: 2, ai: [], isCleanRacing: true, challengeText: 'Finish without touching the grass!' },
  { id: 'c12', name: 'BOSS: Ice King', trackIndex: 4, laps: 5, ai: ['boss', 'silver'], challengeText: 'Defeat the Boss & his minion' },

  // SECTION 3: Advanced
  { id: 'c13', name: 'Cyber Sprint', trackIndex: 5, laps: 4, ai: ['gold', 'gold'], challengeText: 'Win 1st against 2 Gold AIs' },
  { id: 'c14', name: 'Elimination Rumble', trackIndex: 1, laps: 5, ai: ['gold', 'silver', 'silver'], isElimination: true, challengeText: 'Survive! Last place drops every 20s.', onboarding: { title: 'Elimination', text: 'A timer is ticking down. When it hits zero, the player in last place is eliminated! Stay ahead!' } },
  { id: 'c15', name: 'Crystal Drifter', trackIndex: 9, laps: 3, ai: [], targetDriftScore: 18000, challengeText: 'Score 18,000 drift points' },
  { id: 'c16', name: 'Time Attack: Cyber', trackIndex: 5, laps: 3, ai: [], targetTime: 125, challengeText: 'Finish 3 laps in under 2:05' },
  { id: 'c17', name: 'Desert Endurance', trackIndex: 3, laps: 5, ai: ['gold', 'gold', 'silver'], challengeText: 'Win 1st in the Desert' },
  { id: 'c18', name: 'BOSS: Cyber Phantom', trackIndex: 5, laps: 6, ai: ['boss', 'gold'], challengeText: 'Defeat the Boss' },

  // SECTION 4: Master
  { id: 'c19', name: 'Volcanic Warmup', trackIndex: 7, laps: 4, ai: ['gold', 'gold', 'gold'], challengeText: 'Win 1st against 3 Gold AIs' },
  { id: 'c20', name: 'Toxic Drifter', trackIndex: 6, laps: 4, ai: [], targetDriftScore: 25000, challengeText: 'Score 25,000 drift points' },
  { id: 'c21', name: 'Time Attack: Synth', trackIndex: 8, laps: 4, ai: [], targetTime: 155, challengeText: 'Finish 4 laps in under 2:35' },
  { id: 'c22', name: 'Crystal Gauntlet', trackIndex: 9, laps: 5, ai: ['boss', 'gold', 'gold'], challengeText: 'Survive the Canyon' },
  { id: 'c23', name: 'Volcanic Endurance', trackIndex: 7, laps: 6, ai: ['boss', 'boss', 'gold'], challengeText: 'Beat the Twin Bosses' },
  { id: 'c24', name: 'FINAL BOSS: Inferno', trackIndex: 7, laps: 10, ai: ['boss', 'boss', 'boss'], challengeText: 'Ultimate Grand Prix' },

  // SECTION 5: Legend
  { id: 'c25', name: 'Legendary Drift', trackIndex: 7, laps: 4, ai: [], targetDriftScore: 40000, challengeText: 'Score 40,000 drift points' },
  { id: 'c26', name: 'Clean Legend', trackIndex: 9, laps: 3, ai: [], isCleanRacing: true, targetTime: 140, challengeText: 'Clean Race under 2:20' },
  { id: 'c27', name: 'Ultimate Elimination', trackIndex: 8, laps: 7, ai: ['boss', 'gold', 'gold'], isElimination: true, challengeText: 'Survive the ultimate elimination!' },
  { id: 'c28', name: 'Slipstream Legend', trackIndex: 5, laps: 5, ai: ['boss'], targetDraftTime: 10, challengeText: 'Draft behind the Boss for 10 seconds total.' },
  { id: 'c29', name: 'Golden Grand Prix', trackIndex: 6, laps: 6, ai: ['boss', 'gold', 'gold'], challengeText: 'Win 1st in the Toxic Tunnels' },
  { id: 'c30', name: 'TRUE FINAL BOSS', trackIndex: 2, laps: 12, ai: ['boss', 'boss', 'boss'], challengeText: 'The Ultimate Racing Challenge' }
];

let eliminationTimer = 0;
const ELIMINATION_INTERVAL = 20;

function getUnlockedCampaignLevel() {
  return parseInt(localStorage.getItem('unlockedCampaignLevel') || '0');
}
function unlockCampaignLevel(levelIndex) {
  const current = getUnlockedCampaignLevel();
  if (levelIndex > current) {
    localStorage.setItem('unlockedCampaignLevel', levelIndex.toString());
  }
}

let gameState = STATE.STUDIO_SPLASH;
let countdownTimer = 3;

// ============================================
// TRACK DATA
// ============================================

const tracks = [
  { id: 'neon_circuit', name: 'Neon Circuit', theme: 'neon_circuit', shape: 'loop', seed: 12345, radius: 1000, pointsCount: 30 },
  { id: 'sunset_speedway', name: 'Sunset Speedway', theme: 'sunset_strip', shape: 'oval', seed: 54321, radius: 1500, pointsCount: 40 },
  { id: 'midnight_maze', name: 'Midnight Maze', theme: 'midnight_run', shape: 'complex', seed: 11111, radius: 2500, pointsCount: 60 },
  { id: 'desert_dunes', name: 'Desert Dunes', theme: 'desert_storm', shape: 'kidney', seed: 22222, radius: 2000, pointsCount: 50 },
  { id: 'ice_circuit', name: 'Ice Circuit', theme: 'ice_circuit', shape: 'loop', seed: 33333, radius: 1200, pointsCount: 35 },
  { id: 'cyber_circuit', name: 'Cyber Circuit', theme: 'cyber_grid', shape: 'figure8', seed: 44444, radius: 1800, pointsCount: 45 },
  { id: 'toxic_tunnels', name: 'Toxic Tunnels', theme: 'toxic_waste', shape: 'star', seed: 55555, radius: 3000, pointsCount: 70 },
  { id: 'volcanic_venture', name: 'Volcanic Venture', theme: 'volcanic', shape: 'complex', seed: 66666, radius: 4000, pointsCount: 80 },
  { id: 'synthwave_sprint', name: 'Synthwave Sprint', theme: 'sunset_strip', shape: 'synthwave', seed: 77777, radius: 2500, pointsCount: 65 },
  { id: 'crystal_canyon', name: 'Crystal Canyon', theme: 'ice_circuit', shape: 'complex', seed: 88888, radius: 3200, pointsCount: 75 }
];

let currentTrackIndex = 0;
let selectedPlayerCount = 1;

// ============================================
// UI ELEMENTS
// ============================================

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

const uiP3 = {
  lapValue: document.getElementById('lapValue3'),
  maxLapsValue: document.getElementById('maxLapsValue3'),
  lapTimeValue: document.getElementById('lapTimeValue3'),
  bestLapValue: document.getElementById('bestLapValue3'),
  speedValue: document.getElementById('speedValue3'),
  boostBar: document.getElementById('boostBar3'),
  score: document.getElementById('scoreValue3')
};

const uiP4 = {
  lapValue: document.getElementById('lapValue4'),
  maxLapsValue: document.getElementById('maxLapsValue4'),
  lapTimeValue: document.getElementById('lapTimeValue4'),
  bestLapValue: document.getElementById('bestLapValue4'),
  speedValue: document.getElementById('speedValue4'),
  boostBar: document.getElementById('boostBar4'),
  score: document.getElementById('scoreValue4')
};

// Menu Elements
const studioSplashScreen = document.getElementById('studioSplashScreen');
const studioVideo = document.getElementById('studioVideo');
const splashScreen = document.getElementById('splashScreen');
const mainMenu = document.getElementById('mainMenu');
const settingsScreen = document.getElementById('settingsScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const campaignMenu = document.getElementById('campaignMenu');
const lobbyMenu = document.getElementById('lobbyMenu');
const countdownMenu = document.getElementById('countdownMenu');
const onboardingScreen = document.getElementById('onboardingScreen');
const onboardingTitle = document.getElementById('onboardingTitle');
const onboardingText = document.getElementById('onboardingText');
const onboardingContinueBtn = document.getElementById('onboardingContinueBtn');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const uiLayer = document.getElementById('ui');

// Buttons
const startBtn = document.getElementById('startBtn');
const campaignBtn = document.getElementById('campaignBtn');
const campaignBackBtn = document.getElementById('campaignBackBtn');
const campaignLevelGrid = document.getElementById('campaignLevelGrid');
const settingsBtn = document.getElementById('settingsBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const settingsBackBtn = document.getElementById('settingsBackBtn');
const leaderboardBackBtn = document.getElementById('leaderboardBackBtn');
const leaderboardClearBtn = document.getElementById('leaderboardClearBtn');
const startRaceBtn = document.getElementById('startRaceBtn');
const lobbyBackBtn = document.getElementById('lobbyBackBtn');
const resumeBtn = document.getElementById('resumeBtn');
const pauseRestartBtn = document.getElementById('pauseRestartBtn');
const quitBtn = document.getElementById('quitBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');

// Track selector
const prevTrackBtn = document.getElementById('prevTrack');
const nextTrackBtn = document.getElementById('nextTrack');
const trackNumber = document.getElementById('trackNumber');
const trackName = document.getElementById('trackName');

// Player buttons
const playerButtons = document.querySelectorAll('.player-btn');

// Controls info
const controlsInfo = document.getElementById('controlsInfo');

// Leaderboard
const leaderboardList = document.getElementById('leaderboardList');
const leaderboardTrackName = document.getElementById('leaderboardTrackName');
const mobileControls = document.getElementById('mobileControls');

// Touch Support State
let touchEnabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || new URLSearchParams(window.location.search).has('mobile');

// Initialize HUD
uiP1.maxLapsValue.textContent = maxLaps;
uiP2.maxLapsValue.textContent = maxLaps;
uiP3.maxLapsValue.textContent = maxLaps;
uiP4.maxLapsValue.textContent = maxLaps;
uiLayer.classList.add('hidden');

// ============================================
// MENU VISIBILITY HELPERS
// ============================================

function hideAllMenus() {
  if (studioSplashScreen) studioSplashScreen.classList.add('hidden');
  splashScreen.classList.add('hidden');
  mainMenu.classList.add('hidden');
  settingsScreen.classList.add('hidden');
  leaderboardScreen.classList.add('hidden');
  campaignMenu.classList.add('hidden');
  lobbyMenu.classList.add('hidden');
  countdownMenu.classList.add('hidden');
  onboardingScreen.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  gameOverMenu.classList.add('hidden');
}

function showMenu(menu) {
  hideAllMenus();
  menu.classList.remove('hidden');
}

// ============================================
// SPLASH SCREEN
// ============================================

function showStudioSplash() {
  gameState = STATE.STUDIO_SPLASH;
  showMenu(studioSplashScreen);
  
  if (studioVideo) {
    studioVideo.play().catch(e => {
        // Autoplay might be blocked by browser due to audio.
        // We'll show an overlay or just let them click to play.
        const prompt = document.createElement('h1');
        prompt.textContent = "Click to Start";
        prompt.style.position = 'absolute';
        prompt.style.color = 'white';
        prompt.style.fontFamily = "'Press Start 2P', monospace";
        prompt.style.textShadow = '0 0 10px #00ffcc';
        prompt.id = 'studioPlayPrompt';
        studioSplashScreen.appendChild(prompt);
        
        studioVideo.style.opacity = '0.5';
    });
    
    studioVideo.onended = () => {
      showSplash();
    };
    
    // Click to start/skip
    studioSplashScreen.onclick = () => {
      const prompt = document.getElementById('studioPlayPrompt');
      if (studioVideo.paused) {
        if (prompt) prompt.remove();
        studioVideo.style.opacity = '1';
        studioVideo.play();
      } else {
        studioVideo.pause();
        showSplash();
      }
    };
  } else {
    showSplash();
  }
}

function showSplash() {
  gameState = STATE.SPLASH;
  showMenu(splashScreen);
}

function skipSplash() {
  showMainMenu();
}

// ============================================
// MAIN MENU
// ============================================

function showMainMenu() {
  gameState = STATE.MENU;
  currentGameMode = GAMEMODE.QUICKRACE;
  showMenu(mainMenu);
  updateTrackDisplay();
  updateControlsDisplay();
}

// ============================================
// CAMPAIGN MENU
// ============================================

function showCampaignMenu() {
  gameState = STATE.CAMPAIGN;
  showMenu(campaignMenu);
  
  const unlockedLevel = getUnlockedCampaignLevel();
  campaignLevelGrid.innerHTML = '';
  
  // Group levels into sections of 6
  const numSections = Math.ceil(CAMPAIGN_LEVELS.length / 6);
  
  for (let s = 0; s < numSections; s++) {
    const sectionStart = s * 6;
    const sectionEnd = Math.min(sectionStart + 6, CAMPAIGN_LEVELS.length);
    
    // A section is unlocked if the player has unlocked at least the first level of this section
    const isSectionUnlocked = unlockedLevel >= sectionStart;
    
    if (!isSectionUnlocked && s > 0) {
       // Stop rendering further sections if this one isn't unlocked
       // We'll just show a "locked section" placeholder
       const sectionWrapper = document.createElement('div');
       sectionWrapper.className = 'campaign-section locked-section';
       sectionWrapper.innerHTML = `<h2>Section ${s + 1} - Locked</h2><p>Defeat the previous section's boss to unlock.</p>`;
       campaignLevelGrid.appendChild(sectionWrapper);
       break;
    }
    
    const sectionWrapper = document.createElement('div');
    sectionWrapper.className = 'campaign-section';
    
    const sectionTitles = ['Section 1: Rookie', 'Section 2: Intermediate', 'Section 3: Advanced', 'Section 4: Master'];
    sectionWrapper.innerHTML = `<h2>${sectionTitles[s] || 'Section ' + (s + 1)}</h2>`;
    
    const levelsContainer = document.createElement('div');
    levelsContainer.className = 'section-levels-grid';

    for (let i = sectionStart; i < sectionEnd; i++) {
        const level = CAMPAIGN_LEVELS[i];
        const isLocked = i > unlockedLevel;
        const isCompleted = i < unlockedLevel; // If unlockedLevel has advanced past this i, it's completed
        const isBoss = (i % 6) === 5;
        
        const card = document.createElement('div');
        card.className = `level-card ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''} ${isBoss ? 'boss-level' : ''}`;
        
        card.innerHTML = `
          ${isCompleted ? '<div class="completion-stamp">COMPLETED</div>' : ''}
          <h3>${i + 1}. ${level.name}</h3>
          <p>Track: ${tracks[level.trackIndex].name}</p>
          <div class="challenge">${level.challengeText}</div>
        `;
        
        if (!isLocked) {
          card.addEventListener('click', () => {
            currentCampaignLevelIndex = i;
            currentGameMode = GAMEMODE.CAMPAIGN;
            currentTrackIndex = level.trackIndex;
            selectedPlayerCount = 1; // Always single player
            joinedPlayers = [];
            maxLaps = level.laps;
            startGame();
          });
        }
        levelsContainer.appendChild(card);
    }
    
    sectionWrapper.appendChild(levelsContainer);
    campaignLevelGrid.appendChild(sectionWrapper);
  }
}

function updateTrackDisplay() {
  trackNumber.textContent = `${currentTrackIndex + 1}/${tracks.length}`;
  trackName.textContent = tracks[currentTrackIndex].name;
}

function updateControlsDisplay() {
  const controlItems = [];

  for (let i = 0; i < selectedPlayerCount; i++) {
    const controls = getPlayerControls(i);
    controlItems.push(`
      <div class="control-item" data-player="${i + 1}">
        <span class="player-label">Player ${i + 1}</span>
        <span class="keys">${controls.display}</span>
        <span class="boost-key">Boost: ${controls.boostDisplay}</span>
      </div>
    `);
  }

  controlsInfo.innerHTML = controlItems.join('');
  controlsInfo.classList.toggle('single-player', selectedPlayerCount === 1);
}

function getPlayerControls(playerIndex) {
  switch (playerIndex) {
    case 0:
      return { keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'ShiftRight' }, display: '↑ ↓ ← →', boostDisplay: '⇧ Shift' };
    case 1:
      return { keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', boost: 'Space' }, display: 'W A S D', boostDisplay: 'Space' };
    case 2:
      return { keys: { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', boost: 'KeyU' }, display: 'I J K L', boostDisplay: 'U' };
    case 3:
      return { keys: { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', boost: 'Numpad0' }, display: 'Numpad 8456', boostDisplay: 'Numpad 0' };
    default:
      return { keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'ShiftRight' }, display: '↑ ↓ ← →', boostDisplay: '⇧ Shift' };
  }
}

// Player count selection
playerButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    playerButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPlayerCount = parseInt(btn.dataset.players);
    updateControlsDisplay();
  });
});

// Track navigation
prevTrackBtn.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  updateTrackDisplay();
});

nextTrackBtn.addEventListener('click', () => {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  updateTrackDisplay();
});

// ============================================
// SETTINGS SCREEN
// ============================================

// Volume state (persisted)
let musicVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');
let sfxVolume = parseFloat(localStorage.getItem('sfxVolume') ?? '0.4');

function showSettings() {
  gameState = STATE.SETTINGS;
  showMenu(settingsScreen);

  // Sync toggle states
  const ghostToggleSettings = document.getElementById('ghostToggleSettings');
  const ghostToggleSettingsLabel = document.getElementById('ghostToggleSettingsLabel');
  ghostToggleSettings.checked = ghostsEnabled;
  ghostToggleSettingsLabel.textContent = ghostsEnabled ? 'ON' : 'OFF';

  // Sync volume sliders
  const musicVolumeSettings = document.getElementById('musicVolumeSettings');
  const sfxVolumeSettings = document.getElementById('sfxVolumeSettings');
  musicVolumeSettings.value = musicVolume;
  sfxVolumeSettings.value = sfxVolume;
  document.getElementById('musicVolumeSettingsLabel').textContent = Math.round(musicVolume * 100) + '%';
  document.getElementById('sfxVolumeSettingsLabel').textContent = Math.round(sfxVolume * 100) + '%';
}

// Settings ghost toggle
document.getElementById('ghostToggleSettings').addEventListener('change', (e) => {
  ghostsEnabled = e.target.checked;
  localStorage.setItem('ghostsEnabled', ghostsEnabled.toString());
  document.getElementById('ghostToggleSettingsLabel').textContent = ghostsEnabled ? 'ON' : 'OFF';
  // Also sync with pause menu toggle
  const pauseToggle = document.getElementById('ghostTogglePause');
  if (pauseToggle) {
    pauseToggle.checked = ghostsEnabled;
    document.getElementById('ghostToggleLabel').textContent = ghostsEnabled ? 'ON' : 'OFF';
  }
});

// Settings volume sliders
document.getElementById('musicVolumeSettings').addEventListener('input', (e) => {
  musicVolume = parseFloat(e.target.value);
  document.getElementById('musicVolumeSettingsLabel').textContent = Math.round(musicVolume * 100) + '%';
  audioManager.setMusicVolume(musicVolume);
  localStorage.setItem('musicVolume', musicVolume.toString());
  // Sync with pause menu slider
  const pauseSlider = document.getElementById('musicVolume');
  if (pauseSlider) {
    pauseSlider.value = musicVolume;
    document.getElementById('musicVolumeLabel').textContent = Math.round(musicVolume * 100) + '%';
  }
});

document.getElementById('sfxVolumeSettings').addEventListener('input', (e) => {
  sfxVolume = parseFloat(e.target.value);
  document.getElementById('sfxVolumeSettingsLabel').textContent = Math.round(sfxVolume * 100) + '%';
  audioManager.setSfxVolume(sfxVolume);
  localStorage.setItem('sfxVolume', sfxVolume.toString());
  // Sync with pause menu slider
  const pauseSlider = document.getElementById('sfxVolume');
  if (pauseSlider) {
    pauseSlider.value = sfxVolume;
    document.getElementById('sfxVolumeLabel').textContent = Math.round(sfxVolume * 100) + '%';
  }
});

settingsBackBtn.addEventListener('click', showMainMenu);

// ============================================
// LEADERBOARD SCREEN
// ============================================

function showLeaderboard() {
  gameState = STATE.LEADERBOARD;
  showMenu(leaderboardScreen);
  leaderboardTrackName.textContent = tracks[currentTrackIndex].name;
  loadLeaderboard();
}

function loadLeaderboard() {
  const trackId = tracks[currentTrackIndex].id;
  const records = getLeaderboardRecords(trackId);

  if (records.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-empty">No records yet. Complete a race!</li>';
    return;
  }

  leaderboardList.innerHTML = records.map((record, index) => `
    <li class="leaderboard-item ${index === 0 ? 'rank-1' : ''}">
      <span class="leaderboard-rank">${index + 1}.</span>
      <span class="leaderboard-time">${formatTime(record.time)}</span>
      <span class="leaderboard-score">${record.score || 0}</span>
      <span class="leaderboard-meta">${record.playerName}</span>
    </li>
  `).join('');
}

function getLeaderboardRecords(trackId) {
  const key = `leaderboard_${trackId}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to parse leaderboard data:', e);
    return [];
  }
}

function saveLeaderboardRecord(trackId, time, score, playerName) {
  try {
    const key = `leaderboard_${trackId}`;
    const records = getLeaderboardRecords(trackId);
    records.push({ time, score, playerName, date: Date.now() });
    records.sort((a, b) => a.time - b.time);
    const topRecords = records.slice(0, 10); // Keep top 10
    localStorage.setItem(key, JSON.stringify(topRecords));
  } catch (e) {
    console.warn('Failed to save leaderboard record:', e);
  }
}

function clearLeaderboard() {
  try {
    const trackId = tracks[currentTrackIndex].id;
    const key = `leaderboard_${trackId}`;
    localStorage.removeItem(key);
    loadLeaderboard();
  } catch (e) {
    console.warn('Failed to clear leaderboard:', e);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

leaderboardBackBtn.addEventListener('click', showMainMenu);
leaderboardClearBtn.addEventListener('click', () => {
  if (confirm('Clear all records for this track?')) {
    clearLeaderboard();
  }
});

// ============================================
// LOBBY SYSTEM
// ============================================

let joinedPlayers = [];
const playerColors = ['#00ffcc', '#ff00ff', '#ffff00', '#00ff00'];
const MAX_PLAYERS = 4;

function showLobby() {
  gameState = STATE.LOBBY;
  joinedPlayers = [];
  showMenu(lobbyMenu);
  updateLobbyUI();
}

function updateLobbyUI() {
  const playerSlots = document.getElementById('playerSlots');
  playerSlots.innerHTML = '';

  for (let i = 0; i < selectedPlayerCount; i++) {
    const slot = document.createElement('div');
    slot.className = `player-slot ${i < joinedPlayers.length ? `p${i + 1}` : ''}`;

    if (i < joinedPlayers.length) {
      const player = joinedPlayers[i];
      let inputType = 'Keyboard';
      if (player.gamepadIndex !== null) {
        inputType = `Gamepad ${player.gamepadIndex + 1}`;
      } else if (player.controls === 'wasd') {
        inputType = 'WASD';
      } else if (player.controls === 'arrows') {
        inputType = 'Arrows';
      } else if (player.controls === 'ijkl') {
        inputType = 'IJKL';
      } else if (player.controls === 'numpad') {
        inputType = 'Numpad';
      }

      slot.innerHTML = `
        <h3>PLAYER ${i + 1}</h3>
        <p>${inputType}</p>
        <p class="ready-text">READY</p>
      `;
    } else {
      slot.innerHTML = `
        <h3>PLAYER ${i + 1}</h3>
        <p>Waiting...</p>
        <p style="color: #555;">Press any key</p>
      `;
    }

    playerSlots.appendChild(slot);
  }

  startRaceBtn.classList.toggle('hidden', joinedPlayers.length < selectedPlayerCount);
}

const VALID_INPUT_TYPES = ['arrows', 'wasd', 'ijkl', 'numpad', 'gamepad'];

function tryJoinPlayer(inputType, gamepadIndex = null) {
  if (gameState !== STATE.LOBBY) return;
  if (joinedPlayers.length >= selectedPlayerCount) return;

  // Validate inputType
  if (gamepadIndex === null && !VALID_INPUT_TYPES.includes(inputType)) {
    console.warn(`Invalid input type: ${inputType}`);
    return;
  }

  const alreadyJoined = joinedPlayers.some(p => {
    if (gamepadIndex !== null) return p.gamepadIndex === gamepadIndex;
    return p.controls === inputType;
  });

  if (alreadyJoined) return;

  const setup = { gamepadIndex: null, controls: null, controlKeys: null };

  if (gamepadIndex !== null) {
    setup.gamepadIndex = gamepadIndex;
    setup.controls = 'gamepad';
    setup.controlKeys = { up: '', down: '', left: '', right: '', boost: '' };
  } else {
    setup.controls = inputType;
    setup.controlKeys = getPlayerControls(joinedPlayers.length).keys;
  }

  joinedPlayers.push(setup);
  updateLobbyUI();
}

function pollGamepadsForLobby() {
  if (gameState !== STATE.LOBBY) return;

  gamepadManager.poll();
  for (let i = 0; i < 4; i++) {
    const gp = gamepadManager.getGamepad(i);
    if (gp) {
      const anyPressed = gp.buttons.some(b => b.pressed);
      if (anyPressed) {
        tryJoinPlayer('gamepad', i);
      }
    }
  }
}

// ============================================
// GAME START / END
// ============================================

function startGame() {
  audioManager.init();
  audioManager.resume();
  totalRaceTime = 0;

  if (currentGameMode === GAMEMODE.QUICKRACE) {
    // Keep maxLaps default or read from settings if we add them later
    maxLaps = 3;
  } else if (currentGameMode === GAMEMODE.CAMPAIGN) {
    const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
    if (level.isElimination) {
       eliminationTimer = ELIMINATION_INTERVAL;
    }
  }
  
  // Update HUD
  uiP1.maxLapsValue.textContent = maxLaps;
  uiP2.maxLapsValue.textContent = maxLaps;
  uiP3.maxLapsValue.textContent = maxLaps;
  uiP4.maxLapsValue.textContent = maxLaps;

  // Initialize Cars based on joined players
  cars = [];
  ghostRecorders = [];
  ghostPlayers = [];

  // Create track with selected theme, shape, and seed
  const selectedTrack = tracks[currentTrackIndex];
  track = new Track(selectedTrack.radius || 1000, selectedTrack.pointsCount || 30, selectedTrack.theme, selectedTrack.shape, selectedTrack.seed);

  const startPos = track.getStartPos();

  // If no players joined via lobby (single player quick start), create default player
  if (joinedPlayers.length === 0 && selectedPlayerCount === 1) {
    const controls = getPlayerControls(0);
    joinedPlayers.push({ gamepadIndex: null, controls: 'arrows', controlKeys: controls.keys });
    
    // Add AI if campaign mode
    if (currentGameMode === GAMEMODE.CAMPAIGN) {
      const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
      if (level.ai && level.ai.length > 0) {
        level.ai.forEach(difficulty => {
           joinedPlayers.push({ isAI: true, difficulty });
        });
      }
    }
  }

  joinedPlayers.forEach((setup, i) => {
    const xOffset = i === 1 ? -30 : (i === 2 ? 30 : (i === 3 ? -60 : 0));
    const dirX = Math.cos(startPos.heading + Math.PI / 2) * xOffset;
    const dirY = Math.sin(startPos.heading + Math.PI / 2) * xOffset;

    const car = new Car(startPos.x + dirX, startPos.y + dirY, playerColors[i % playerColors.length], setup.controlKeys || getPlayerControls(i).keys);
    car.heading = startPos.heading;
    car.gamepadIndex = setup.gamepadIndex;
    car.playerIndex = i;
    
    if (setup.isAI) {
      car.isAI = true;
      car.aiDifficulty = setup.difficulty;
      if (setup.difficulty === 'bronze') {
         car.maxSpeed = 650;
         car.acceleration = 500;
      } else if (setup.difficulty === 'silver') {
         car.maxSpeed = 750;
         car.acceleration = 550;
      } else if (setup.difficulty === 'gold') {
         car.maxSpeed = 820;
         car.acceleration = 620;
      } else if (setup.difficulty === 'boss') {
         car.maxSpeed = 900;
         car.acceleration = 700;
         car.turnSpeed = 4.0;
         car.grip = 1000;
      }
    }

    car.currentLap = 1;
    car.currentLapTime = 0;
    car.bestLapTime = Infinity;
    car.targetSector = 1;
    car.score = 0;
    car.finished = false;
    car.finishTime = null;

    cars.push(car);
    ghostRecorders.push(new GhostRecorder());
    ghostPlayers.push(null);
  });

  // Show appropriate HUDs
  if (currentGameMode === GAMEMODE.CAMPAIGN) {
    document.getElementById('hud-p1').style.display = 'block';
    document.getElementById('hud-p2').style.display = 'none';
    document.getElementById('hud-p3').style.display = 'none';
    document.getElementById('hud-p4').style.display = 'none';
    document.getElementById('campaign-hud').classList.remove('hidden');
  } else {
    document.getElementById('campaign-hud').classList.add('hidden');
    document.getElementById('hud-p1').style.display = cars.length > 0 ? 'block' : 'none';
    document.getElementById('hud-p2').style.display = cars.length > 1 ? 'block' : 'none';
    document.getElementById('hud-p3').style.display = cars.length > 2 ? 'block' : 'none';
    document.getElementById('hud-p4').style.display = cars.length > 3 ? 'block' : 'none';
  }

  if (currentGameMode === GAMEMODE.CAMPAIGN) {
    const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
    if (level.onboarding) {
      gameState = STATE.ONBOARDING;
      hideAllMenus();
      onboardingTitle.textContent = level.onboarding.title;
      onboardingText.textContent = level.onboarding.text;
      onboardingScreen.classList.remove('hidden');
      uiLayer.classList.remove('hidden'); // Keep UI visible behind it if desired
      audioManager.setEngineMuted(true);
      return; // Wait for continue button
    }
  }

  startCountdown();
}

function startCountdown() {
  gameState = STATE.COUNTDOWN;
  hideAllMenus();
  countdownMenu.classList.remove('hidden');
  uiLayer.classList.remove('hidden');
  if (touchEnabled) mobileControls.classList.remove('hidden');

  audioManager.setEngineMuted(true);

  countdownTimer = 3;
  const countdownText = document.getElementById('countdownText');
  countdownText.textContent = countdownTimer;
  audioManager.playBeep(440, 'short');

  let countInterval = setInterval(() => {
    countdownTimer--;
    if (countdownTimer > 0) {
      countdownText.textContent = countdownTimer;
      audioManager.playBeep(440, 'short');
    } else if (countdownTimer === 0) {
      countdownText.textContent = "GO!";
      audioManager.playBeep(880, 'long');
    } else {
      clearInterval(countInterval);
      countdownMenu.classList.add('hidden');
      gameState = STATE.PLAYING;
      lastTime = performance.now();
      audioManager.setEngineMuted(false);
    }
  }, 1000);
}

// Onboarding logic
onboardingContinueBtn.addEventListener('click', () => {
  if (gameState === STATE.ONBOARDING) {
    onboardingScreen.classList.add('hidden');
    startCountdown();
  }
});

let previousState = STATE.PLAYING;

function pauseGame() {
  if (gameState !== STATE.PLAYING && gameState !== STATE.FINISHING) return;
  previousState = gameState;
  gameState = STATE.PAUSED;
  audioManager.suspend();
  showMenu(pauseMenu);
}

function resumeGame() {
  if (gameState !== STATE.PAUSED) return;
  gameState = previousState;
  audioManager.resume();
  hideAllMenus();
  lastTime = performance.now();
}

function endGame() {
  gameState = STATE.GAMEOVER;
  audioManager.setEngineMuted(true);
  // Don't suspend audio immediately - let music continue during game over screen
  // audioManager.suspend();
  uiLayer.classList.add('hidden');
  mobileControls.classList.add('hidden');

  // Save leaderboard records
  cars.forEach((car, i) => {
    if (car.bestLapTime < Infinity && !car.isGhost && !car.isAI) {
      saveLeaderboardRecord(tracks[currentTrackIndex].id, car.bestLapTime, car.score, `Player ${i + 1}`);
    }
  });

  const winnerText = document.getElementById('winnerText');
  const campaignResultText = document.getElementById('campaignResultText');
  const quickRaceActions = document.getElementById('quickRaceActions');
  const campaignActions = document.getElementById('campaignActions');

  let p1Car = cars.find(c => c.playerIndex === 0 && !c.isGhost && !c.isAI);

  if (currentGameMode === GAMEMODE.CAMPAIGN) {
    const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
    let challengePassed = true;
    
    // Evaluate logic based on challenge setup
    let playerPos = 1;
    cars.forEach(c => {
      if (c !== p1Car && !c.isGhost && c.finished && (c.finishTime < p1Car.finishTime || !p1Car.finished)) playerPos++;
    });

    if (level.targetDriftScore && p1Car.score < level.targetDriftScore) challengePassed = false;
    if (level.targetTime && totalRaceTime > level.targetTime) challengePassed = false;
    if (level.targetDraftTime && p1Car.draftTime < level.targetDraftTime) challengePassed = false;
    if (level.ai && level.ai.length > 0 && playerPos > 1 && !level.isElimination && !level.targetDraftTime) challengePassed = false; // Requires 1st place if there are AI (except elimination/drafting)
    if (!p1Car.finished) challengePassed = false; // Must finish
    if (level.isCleanRacing && p1Car.hasHitGrass) challengePassed = false;
    if (level.isElimination && p1Car.eliminated) challengePassed = false;

    if (challengePassed) {
      if (campaignResultText) {
        campaignResultText.textContent = 'Challenge Complete!';
        campaignResultText.style.color = '#00ffcc';
        campaignResultText.style.textShadow = '0 0 10px #00ffcc';
      }
      unlockCampaignLevel(currentCampaignLevelIndex + 1);
      const nBtn = document.getElementById('nextLevelBtn');
      if (nBtn) nBtn.style.display = (currentCampaignLevelIndex < CAMPAIGN_LEVELS.length - 1) ? 'inline-block' : 'none';
    } else {
      if (campaignResultText) {
        campaignResultText.textContent = 'Challenge Failed!';
        campaignResultText.style.color = '#ff3366';
        campaignResultText.style.textShadow = '0 0 10px #ff3366';
      }
      const nBtn = document.getElementById('nextLevelBtn');
      if (nBtn) nBtn.style.display = 'none';
    }
    
    if (campaignResultText) campaignResultText.classList.remove('hidden');
    if (quickRaceActions) quickRaceActions.classList.add('hidden');
    if (campaignActions) campaignActions.classList.remove('hidden');
    
    winnerText.textContent = level.name;

  } else {
    // Quick Race
    if (campaignResultText) campaignResultText.classList.add('hidden');
    if (quickRaceActions) quickRaceActions.classList.remove('hidden');
    if (campaignActions) campaignActions.classList.add('hidden');
    
    if (cars.length === 1) {
      winnerText.textContent = "RACE OVER";
    } else if (cars.length > 1) {
      const winnerCar = cars.find(c => c.finished) || cars.reduce((best, c) =>
        c.bestLapTime < best.bestLapTime ? c : best, cars[0]);
      winnerText.textContent = `PLAYER ${winnerCar.playerIndex + 1} WINS!`;
    }
  }

  cars.forEach((car, i) => {
    const finalTime = document.getElementById(`finalTimeValue${i + 1}`);
    const finalBest = document.getElementById(`finalBestValue${i + 1}`);
    const finalScore = document.getElementById(`finalScoreValue${i + 1}`);

    if (finalTime) finalTime.textContent = totalRaceTime.toFixed(2);
    if (finalBest) finalBest.textContent = car.bestLapTime === Infinity ? "--" : car.bestLapTime.toFixed(2);
    if (finalScore) finalScore.textContent = car.score;
  });

  const humanCarsForStats = cars.filter(c => !c.isAI);
  const p2StatsContainer = document.querySelector('.p2-stats');
  if (p2StatsContainer) {
    p2StatsContainer.style.display = humanCarsForStats.length > 1 ? 'block' : 'none';
  }

  showMenu(gameOverMenu);
}

function quitToMenu() {
  gameState = STATE.MENU;
  cars = [];
  joinedPlayers = [];
  uiLayer.classList.add('hidden');
  mobileControls.classList.add('hidden');
  audioManager.setEngineMuted(true);
  audioManager.suspend();
  showMainMenu();
}

// ============================================
// EVENT LISTENERS
// ============================================

// Splash screen
splashScreen.addEventListener('click', skipSplash);

// Main menu buttons
startBtn.addEventListener('click', () => {
  currentGameMode = GAMEMODE.QUICKRACE;
  if (selectedPlayerCount === 1) {
    joinedPlayers = [];
    startGame();
  } else {
    showLobby();
  }
});
campaignBtn.addEventListener('click', showCampaignMenu);
campaignBackBtn.addEventListener('click', showMainMenu);
settingsBtn.addEventListener('click', showSettings);
leaderboardBtn.addEventListener('click', showLeaderboard);

// Lobby buttons
startRaceBtn.addEventListener('click', startGame);
lobbyBackBtn.addEventListener('click', showMainMenu);

// Pause menu buttons
resumeBtn.addEventListener('click', resumeGame);
pauseRestartBtn.addEventListener('click', startGame);
quitBtn.addEventListener('click', quitToMenu);

// Game over buttons
restartBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', quitToMenu);

const nextLevelBtn = document.getElementById('nextLevelBtn');
if(nextLevelBtn) nextLevelBtn.addEventListener('click', () => {
  currentCampaignLevelIndex++;
  const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
  currentTrackIndex = level.trackIndex;
  maxLaps = level.laps;
  startGame();
});
const retryLevelBtn = document.getElementById('retryLevelBtn');
if(retryLevelBtn) retryLevelBtn.addEventListener('click', startGame);
const campaignMenuBtn = document.getElementById('campaignMenuBtn');
if(campaignMenuBtn) campaignMenuBtn.addEventListener('click', () => {
  quitToMenu();
  showCampaignMenu();
});

// Keyboard events
window.addEventListener('keydown', (e) => {
  // Skip splash on any key
  if (gameState === STATE.SPLASH) {
    skipSplash();
    return;
  }

  // Lobby join
  if (gameState === STATE.LOBBY) {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
      tryJoinPlayer('wasd');
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftRight', 'ShiftLeft'].includes(e.code)) {
      tryJoinPlayer('arrows');
    } else if (['KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyU'].includes(e.code)) {
      tryJoinPlayer('ijkl');
    } else if (['Numpad8', 'Numpad5', 'Numpad4', 'Numpad6', 'Numpad0'].includes(e.code)) {
      tryJoinPlayer('numpad');
    }
    return;
  }

  // Pause toggle
  if (e.code === 'Escape') {
    if (gameState === STATE.PLAYING) {
      pauseGame();
    } else if (gameState === STATE.PAUSED) {
      resumeGame();
    }
  }
});

// Mobile Controls (Action Buttons)
const mobileBtns = document.querySelectorAll('.control-btn');
mobileBtns.forEach(btn => {
  const key = btn.dataset.key;
  if (!key) return;

  const handleStart = (e) => {
    if (e.cancelable) e.preventDefault();
    input.keys[key] = true;
    btn.classList.add('pressed');

    if (key === 'Escape') {
      if (gameState === STATE.PLAYING) pauseGame();
      else if (gameState === STATE.PAUSED) resumeGame();
    }
  };

  const handleEnd = (e) => {
    if (e.cancelable) e.preventDefault();
    input.keys[key] = false;
    btn.classList.remove('pressed');
  };

  btn.addEventListener('touchstart', handleStart, { passive: false });
  btn.addEventListener('touchend', handleEnd, { passive: false });
  btn.addEventListener('touchcancel', handleEnd, { passive: false });

  // Mouse fallback for testing
  btn.addEventListener('mousedown', handleStart);
  btn.addEventListener('mouseup', handleEnd);
  btn.addEventListener('mouseleave', handleEnd);
});

// Steering Zone (Touch-to-accelerate, pull-to-steer)
const steeringZone = document.getElementById('steeringZone');
const steerIndicator = document.getElementById('steerIndicator');

if (steeringZone) {
  let activeTouchId = null;
  let startX = 0;
  let startY = 0;
  const steerThreshold = 25; // Deadzone: pixels to drag before steering registers
  const maxSteerDistance = 120; // pixels to drag for full steering (lower value = higher sensitivity)

  const updateSteering = (currentX, currentY) => {
    if (steerIndicator) {
      steerIndicator.style.left = `${currentX}px`;
      steerIndicator.style.top = `${currentY}px`;
    }

    const deltaX = currentX - startX;
    let steeringValue = 0;

    if (deltaX < -steerThreshold) {
      input.keys['ArrowLeft'] = true;
      input.keys['ArrowRight'] = false;
      steeringValue = -Math.min((Math.abs(deltaX) - steerThreshold) / (maxSteerDistance - steerThreshold), 1.0);
    } else if (deltaX > steerThreshold) {
      input.keys['ArrowRight'] = true;
      input.keys['ArrowLeft'] = false;
      steeringValue = Math.min((deltaX - steerThreshold) / (maxSteerDistance - steerThreshold), 1.0);
    } else {
      input.keys['ArrowLeft'] = false;
      input.keys['ArrowRight'] = false;
    }

    input.analogSteering = steeringValue;
  };

  const handleSteerStart = (e) => {
    if (e.cancelable) e.preventDefault();
    if (activeTouchId !== null) return; // already tracking a touch

    const touch = e.changedTouches ? e.changedTouches[0] : e;
    activeTouchId = e.changedTouches ? touch.identifier : 'mouse';

    startX = touch.clientX;
    startY = touch.clientY;

    // Accelerate
    input.keys['ArrowUp'] = true;

    if (steerIndicator) {
      steerIndicator.style.left = `${startX}px`;
      steerIndicator.style.top = `${startY}px`;
      steerIndicator.classList.remove('hidden');
    }
  };

  const handleSteerMove = (e) => {
    if (e.cancelable) e.preventDefault();
    if (activeTouchId === null) return;

    let touch;
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          touch = e.changedTouches[i];
          break;
        }
      }
    } else {
      touch = e;
    }

    if (touch) {
      updateSteering(touch.clientX, touch.clientY);
    }
  };

  const handleSteerEnd = (e) => {
    if (e.cancelable) e.preventDefault();
    if (activeTouchId === null) return;

    let isOurTouchEnding = false;
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          isOurTouchEnding = true;
          break;
        }
      }
    } else {
      isOurTouchEnding = true; // mouse event
    }

    if (isOurTouchEnding) {
      activeTouchId = null;
      input.keys['ArrowUp'] = false;
      input.keys['ArrowLeft'] = false;
      input.keys['ArrowRight'] = false;
      input.analogSteering = 0;

      if (steerIndicator) {
        steerIndicator.classList.add('hidden');
      }
    }
  };

  steeringZone.addEventListener('touchstart', handleSteerStart, { passive: false });
  steeringZone.addEventListener('touchmove', handleSteerMove, { passive: false });
  steeringZone.addEventListener('touchend', handleSteerEnd, { passive: false });
  steeringZone.addEventListener('touchcancel', handleSteerEnd, { passive: false });

  // Mouse fallback
  steeringZone.addEventListener('mousedown', handleSteerStart);
  window.addEventListener('mousemove', handleSteerMove);
  window.addEventListener('mouseup', handleSteerEnd);
}

// Volume sliders
const musicVolumeSlider = document.getElementById('musicVolume');
const sfxVolumeSlider = document.getElementById('sfxVolume');
const musicVolumeLabel = document.getElementById('musicVolumeLabel');
const sfxVolumeLabel = document.getElementById('sfxVolumeLabel');

musicVolumeSlider.addEventListener('input', () => {
  const val = parseFloat(musicVolumeSlider.value);
  musicVolumeLabel.textContent = `${Math.round(val * 100)}%`;
  audioManager.setMusicVolume(val);
  
  musicVolume = val;
  localStorage.setItem('musicVolume', musicVolume.toString());
  
  const settingsSlider = document.getElementById('musicVolumeSettings');
  if (settingsSlider) {
    settingsSlider.value = val;
    document.getElementById('musicVolumeSettingsLabel').textContent = `${Math.round(val * 100)}%`;
  }
});

sfxVolumeSlider.addEventListener('input', () => {
  const val = parseFloat(sfxVolumeSlider.value);
  sfxVolumeLabel.textContent = `${Math.round(val * 100)}%`;
  audioManager.setSfxVolume(val);

  sfxVolume = val;
  localStorage.setItem('sfxVolume', sfxVolume.toString());

  const settingsSlider = document.getElementById('sfxVolumeSettings');
  if (settingsSlider) {
    settingsSlider.value = val;
    document.getElementById('sfxVolumeSettingsLabel').textContent = `${Math.round(val * 100)}%`;
  }
});

// Ghost toggle in pause menu
const ghostTogglePause = document.getElementById('ghostTogglePause');
const ghostToggleLabel = document.getElementById('ghostToggleLabel');
ghostTogglePause.addEventListener('change', () => {
  ghostsEnabled = ghostTogglePause.checked;
  localStorage.setItem('ghostsEnabled', ghostsEnabled.toString());
  ghostToggleLabel.textContent = ghostsEnabled ? 'ON' : 'OFF';
  // Also sync with settings menu toggle
  const settingsToggle = document.getElementById('ghostToggleSettings');
  if (settingsToggle) {
    settingsToggle.checked = ghostsEnabled;
    document.getElementById('ghostToggleSettingsLabel').textContent = ghostsEnabled ? 'ON' : 'OFF';
  }
});

// ============================================
// CANVAS RESIZE
// ============================================

// Reference resolution for consistent gameplay across displays
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 1080;
let resolutionScale = 1.0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Calculate resolution scale factor based on reference resolution
  // This ensures the car feels the same speed regardless of display resolution
  const widthScale = canvas.width / REFERENCE_WIDTH;
  const heightScale = canvas.height / REFERENCE_HEIGHT;
  
  if (canvas.width > canvas.height) {
    // Landscape: fix the height to reference, extend the width natively (prevents zoomed-in look on ultra-wides)
    resolutionScale = heightScale;
  } else {
    // Portrait: Use Math.max to ensure the view "covers" the screen without zooming out too much on mobile
    resolutionScale = Math.max(widthScale, heightScale);
  }
}

window.addEventListener('resize', resize);
resize();

// ============================================
// HUD UPDATE
// ============================================

function updateHUD(car) {
  let ui;
  switch (car.playerIndex) {
    case 0: ui = uiP1; break;
    case 1: ui = uiP2; break;
    case 2: ui = uiP3; break;
    case 3: ui = uiP4; break;
    default: ui = uiP1;
  }

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

  if (car.targetSector === 4 && progressRatio < lapStart) {
    if (car.currentLapTime > 2.0) {
      const recorder = ghostRecorders[car.playerIndex];
      const isNewBest = recorder && recorder.onLapComplete(car.currentLapTime);

      if (isNewBest) {
        ghostPlayers[car.playerIndex] = new GhostPlayer(recorder.bestFrames, car.color);
      } else if (ghostPlayers[car.playerIndex]) {
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
        // Mark this player as finished
        car.bankPendingScore(); // Cash in any active drift combo
        car.finished = true;
        car.finishTime = totalRaceTime;
        ui.lapValue.textContent = maxLaps;

        // Check if all human players have finished
        const humanCars = cars.filter(c => !c.isAI);
        const allFinished = humanCars.every(c => c.finished);
        if (allFinished) {
          endGame();
        } else {
          // Switch to FINISHING state - let other players continue
          gameState = STATE.FINISHING;
        }
      }

      car.currentLapTime = 0;
      car.targetSector = 1;
    }
  }

  // Update score display with pending score and multiplier
  if (car.pendingDriftScore > 0) {
    let pendingStr = Math.floor(car.pendingDriftScore);
    let multStr = car.comboMultiplier > 1 ? ` x${car.comboMultiplier}` : '';
    ui.score.innerHTML = `${car.score || 0} <span style="color: #ff3366; font-size: 0.9em;">+${pendingStr}${multStr}</span>`;
  } else {
    ui.score.textContent = car.score || 0;
  }

  if (car.isBoosting) {
    car.boostParticleTimer = (car.boostParticleTimer || 0) + lastDt;
    while (car.boostParticleTimer > 0.016) {
      car.boostParticleTimer -= 0.016;
      const backX = car.x - Math.cos(car.heading) * 15;
      const backY = car.y - Math.sin(car.heading) * 15;
      particles.emit(backX, backY, 20, car.heading + Math.PI + (Math.random() - 0.5) * 0.2, car.color, 12, 0.4);
    }
  } else if (car.isDrifting) {
    if (speed > 100) {
      car.driftParticleTimer = (car.driftParticleTimer || 0) + lastDt;
      while (car.driftParticleTimer > 0.032) {
        car.driftParticleTimer -= 0.032;
        const backX = car.x - Math.cos(car.heading) * 10;
        const backY = car.y - Math.sin(car.heading) * 10;
        
        let particleColor = 'rgb(200, 200, 200)';
        
        // Increase particle size slightly based on multiplier (cap it)
        const particleSize = 8 + Math.min(car.comboMultiplier - 1, 3) * 2;
        
        particles.emit(backX, backY, 10, car.heading + Math.PI + (Math.random() - 0.5), particleColor, particleSize, 1);
      }
    }
  }

  // Update Campaign Progress HUD if applicable
  if (currentGameMode === GAMEMODE.CAMPAIGN && car.playerIndex === 0) {
    const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
    const goalTitle = document.getElementById('campaignGoalTitle');
    const goalObjective = document.getElementById('campaignGoalObjective');
    const goalStatus = document.getElementById('campaignGoalStatus');
    
    // Set the static objective text
    if (goalObjective.textContent !== level.challengeText) {
      goalObjective.textContent = level.challengeText;
    }
    
    if (level.targetDriftScore) {
      goalTitle.textContent = `TARGET: ${level.targetDriftScore.toLocaleString()} PTS`;
      
      const currentPoints = car.score || 0;
      const totalPoints = currentPoints + Math.floor(car.pendingDriftScore || 0);
      goalStatus.textContent = totalPoints.toLocaleString();
      
      if (totalPoints >= level.targetDriftScore) {
        goalStatus.style.color = 'var(--success-color)';
        goalStatus.style.textShadow = '0 0 10px var(--success-color)';
      } else {
        goalStatus.style.color = 'var(--tertiary-accent)';
        goalStatus.style.textShadow = '0 0 10px var(--tertiary-accent)';
      }
    } else if (level.targetTime) {
      goalTitle.textContent = `TIME LIMIT: ${level.targetTime}s`;
      const elapsed = totalRaceTime.toFixed(1);
      goalStatus.textContent = `${elapsed}s`;
      
      if (totalRaceTime > level.targetTime) {
         goalStatus.style.color = 'rgba(255, 51, 102, 1)';
         goalStatus.style.textShadow = '0 0 10px rgba(255, 51, 102, 0.8)';
      } else {
         goalStatus.style.color = 'var(--primary-accent)';
         goalStatus.style.textShadow = '0 0 10px var(--primary-accent)';
      }
    } else if (level.targetDraftTime) {
      goalTitle.textContent = `TARGET: ${level.targetDraftTime}s`;
      goalStatus.textContent = car.draftTime.toFixed(1) + 's';
      if (car.draftTime >= level.targetDraftTime) {
        goalStatus.style.color = 'var(--success-color)';
        goalStatus.style.textShadow = '0 0 10px var(--success-color)';
      } else {
        goalStatus.style.color = 'var(--tertiary-accent)';
        goalStatus.style.textShadow = '0 0 10px var(--tertiary-accent)';
      }
    } else if (level.isCleanRacing) {
      goalTitle.textContent = 'STATUS';
      if (car.hasHitGrass) {
        goalStatus.textContent = 'FAILED';
        goalStatus.style.color = 'rgba(255, 51, 102, 1)';
        goalStatus.style.textShadow = '0 0 10px rgba(255, 51, 102, 0.8)';
      } else {
        goalStatus.textContent = 'CLEAN';
        goalStatus.style.color = 'var(--success-color)';
        goalStatus.style.textShadow = '0 0 10px var(--success-color)';
      }
    } else if (level.isElimination) {
      goalTitle.textContent = `ELIMINATION: ${Math.ceil(eliminationTimer)}s`;
      
      const activeCars = cars.filter(c => !c.eliminated && !c.finished);
      goalStatus.textContent = `${activeCars.length} LEFT`;
      if (activeCars.length <= 1) {
        goalStatus.style.color = 'var(--success-color)';
        goalStatus.style.textShadow = '0 0 10px var(--success-color)';
      } else if (eliminationTimer < 5) {
        goalStatus.style.color = 'rgba(255, 51, 102, 1)';
        goalStatus.style.textShadow = '0 0 10px rgba(255, 51, 102, 0.8)';
      } else {
        goalStatus.style.color = 'var(--player1-color)';
        goalStatus.style.textShadow = '0 0 10px var(--player1-color)';
      }
    } else {
      // Race Challenges (Win 1st place)
      goalTitle.textContent = 'POSITION';
      
      // Calculate current position
      // Sort all cars based on laps completed, then lap progress
      const sortedCars = [...cars].sort((a, b) => {
        if (a.currentLap !== b.currentLap) {
          return b.currentLap - a.currentLap; // Higher lap first
        }
        
        // Same lap: use progressIndex
        const aInfo = track.getPointInfo(a.x, a.y);
        const bInfo = track.getPointInfo(b.x, b.y);
        return bInfo.progressIndex - aInfo.progressIndex; // Higher progress first
      });
      
      const playerPos = sortedCars.findIndex(c => c === car) + 1;
      
      let suffix = 'th';
      if (playerPos % 10 === 1 && playerPos % 100 !== 11) suffix = 'st';
      else if (playerPos % 10 === 2 && playerPos % 100 !== 12) suffix = 'nd';
      else if (playerPos % 10 === 3 && playerPos % 100 !== 13) suffix = 'rd';
      
      goalStatus.textContent = `${playerPos}${suffix} / ${cars.length}`;
      if (playerPos === 1) {
         goalStatus.style.color = 'var(--success-color)';
         goalStatus.style.textShadow = '0 0 10px var(--success-color)';
      } else {
         goalStatus.style.color = 'var(--player1-color)';
         goalStatus.style.textShadow = '0 0 10px var(--player1-color)';
      }
    }
  }
}

// ============================================
// GAME LOOP
// ============================================

function update(dt) {
  if (gameState === STATE.LOBBY) {
    pollGamepadsForLobby();
  }

  if (gameState !== STATE.PLAYING && gameState !== STATE.FINISHING) return;
  if (!track) return;

  lastDt = dt;
  totalRaceTime += dt;

  let maxSpeed = 0;
  let someoneDrifting = false;

  if (currentGameMode === GAMEMODE.CAMPAIGN && totalRaceTime > 0) {
     const level = CAMPAIGN_LEVELS[currentCampaignLevelIndex];
     
     if (level.isElimination) {
         eliminationTimer -= dt;
         if (eliminationTimer <= 0) {
            // Find last place active car
            const activeCars = cars.filter(c => !c.eliminated && !c.finished);
            if (activeCars.length > 1) {
                activeCars.sort((a,b) => {
                   const aSp = track.getPointInfo(a.x, a.y).progressIndex / track.splinePoints.length;
                   const bSp = track.getPointInfo(b.x, b.y).progressIndex / track.splinePoints.length;
                   return (b.currentLap + bSp) - (a.currentLap + aSp);
                });
                
                const lastCar = activeCars[activeCars.length - 1];
                lastCar.eliminated = true;
                eliminationTimer = ELIMINATION_INTERVAL;
                
                // if player is eliminated, game over
                if (!lastCar.isAI) {
                   lastCar.finished = true; 
                   showGameOver(); 
                   return; 
                } else if (activeCars.length === 2) {
                   const winner = activeCars[0];
                   winner.finished = true;
                   if (!winner.isAI) setTimeout(() => showGameOver(), 1000); 
                }
            }
         }
     }
     
     if (level.isCleanRacing) {
         const p1Car = cars.find(c => c.playerIndex === 0 && !c.isGhost && !c.isAI);
         if (p1Car && p1Car.hasHitGrass) {
             p1Car.finished = true; 
             showGameOver();
             return;
         }
     }
  }

  cars.forEach((car, i) => {
    // Skip finished or eliminated players
    if (car.finished || car.eliminated) {
      // Keep the car stationary
      car.velocity.x = 0;
      car.velocity.y = 0;
      return;
    }

    const trackInfo = track.getPointInfo(car.x, car.y);
    trackInfo.splinePoints = track.splinePoints;
    car.update(dt, input, trackInfo, cars);
    updateHUD(car);

    if (ghostRecorders[i]) ghostRecorders[i].recordFrame(car, dt);
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
  // Apply smoothing factor based on 60 FPS for framerate independence
  const smoothingFactor = 1.0 - Math.pow(1.0 - 0.05, (window.lastDt || 0.016) * 60);
  car.currentScale += (targetScale - car.currentScale) * smoothingFactor;

  // Apply resolution scale to make gameplay consistent across displays
  const finalScale = car.currentScale * resolutionScale;

  ctx.save();
  ctx.translate(viewWidth / 2, viewHeight / 2);
  ctx.scale(finalScale, finalScale);
  ctx.translate(-car.x, -car.y);

  track.draw(ctx);

  // Draw skidmarks before particles (smoke)
  cars.forEach(c => {
    if (!c.eliminated) c.drawSkidmarks(ctx);
  });

  particles.draw(ctx);

  if (ghostsEnabled) {
    ghostPlayers.forEach(gp => { if (gp) gp.draw(ctx); });
  }

  cars.forEach(c => c.draw(ctx));

  ctx.restore();
}

function draw() {
  // Use theme background color or default
  const bgColor = track?.theme?.backgroundColor || '#0a0a0a';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw neon grid background with theme-aware colors
  const gridColor = track?.theme?.patternColor?.replace(/[\d.]+\)$/, '0.3)') || 'rgba(40, 40, 40, 0.5)';
  ctx.strokeStyle = gridColor;
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

  // Only draw world if track exists and we're in a game state
  if (!track || cars.length === 0) return;

  const humanCars = cars.filter(c => !c.isAI);
  const carsToDraw = humanCars.length > 0 ? humanCars : cars;

  if (carsToDraw.length === 1) {
    drawWorldForCar(carsToDraw[0], canvas.width, canvas.height);
  } else if (carsToDraw.length === 2) {
    // 2 players: side by side
    const halfWidth = canvas.width / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, halfWidth, canvas.height);
    ctx.clip();
    drawWorldForCar(carsToDraw[0], halfWidth, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(halfWidth, 0, halfWidth, canvas.height);
    ctx.clip();
    ctx.translate(halfWidth, 0);
    drawWorldForCar(carsToDraw[1], halfWidth, canvas.height);
    ctx.restore();

    // Draw split line
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, canvas.height);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (carsToDraw.length === 3 || carsToDraw.length === 4) {
    // 3-4 players: 2x2 grid
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    // Player 1: Top Left
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, halfWidth, halfHeight);
    ctx.clip();
    drawWorldForCar(carsToDraw[0], halfWidth, halfHeight);
    ctx.restore();

    // Player 2: Top Right
    ctx.save();
    ctx.beginPath();
    ctx.rect(halfWidth, 0, halfWidth, halfHeight);
    ctx.clip();
    ctx.translate(halfWidth, 0);
    drawWorldForCar(carsToDraw[1], halfWidth, halfHeight);
    ctx.restore();

    // Player 3: Bottom Left
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, halfHeight, halfWidth, halfHeight);
    ctx.clip();
    ctx.translate(0, halfHeight);
    drawWorldForCar(carsToDraw[2], halfWidth, halfHeight);
    ctx.restore();

    // Player 4: Bottom Right (if exists)
    if (carsToDraw.length > 3) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(halfWidth, halfHeight, halfWidth, halfHeight);
      ctx.clip();
      ctx.translate(halfWidth, halfHeight);
      drawWorldForCar(carsToDraw[3], halfWidth, halfHeight);
      ctx.restore();
    }

    // Draw split lines
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, canvas.height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(canvas.width, halfHeight);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  if (cars.length > 0) {
    track.drawMinimap(ctx, cars[0].x, cars[0].y);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize UI elements and audio based on persisted settings
musicVolumeSlider.value = musicVolume;
musicVolumeLabel.textContent = Math.round(musicVolume * 100) + '%';
audioManager.setMusicVolume(musicVolume);

sfxVolumeSlider.value = sfxVolume;
sfxVolumeLabel.textContent = Math.round(sfxVolume * 100) + '%';
audioManager.setSfxVolume(sfxVolume);

ghostTogglePause.checked = ghostsEnabled;
ghostToggleLabel.textContent = ghostsEnabled ? 'ON' : 'OFF';

const syncSettingsMenuOnInit = document.getElementById('ghostToggleSettings');
if (syncSettingsMenuOnInit) {
  syncSettingsMenuOnInit.checked = ghostsEnabled;
  document.getElementById('ghostToggleSettingsLabel').textContent = ghostsEnabled ? 'ON' : 'OFF';

  document.getElementById('musicVolumeSettings').value = musicVolume;
  document.getElementById('musicVolumeSettingsLabel').textContent = Math.round(musicVolume * 100) + '%';

  document.getElementById('sfxVolumeSettings').value = sfxVolume;
  document.getElementById('sfxVolumeSettingsLabel').textContent = Math.round(sfxVolume * 100) + '%';
}

requestAnimationFrame((timestamp) => {
  lastTime = timestamp;
  showStudioSplash();
  gameLoop(timestamp);
});
