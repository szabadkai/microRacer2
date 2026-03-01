# MicroRacer 2 🏎️💨

An action-packed top-down racing game focusing on drifting mechanics and procedural track generation. Built as a spiritual successor to `microRacer`.

## Features

### Core Gameplay
- **Drifting Mechanics**: Slide around corners, manage your slip angle, and maintain grip. Build boost by drifting!
- **Boost System**: Charge your boost meter by drifting, then unleash it for explosive acceleration.
- **Procedural Tracks**: Endless possibilities with a custom Bezier curve-based procedural track generator.

### Tracks
8 unique themed tracks with different shapes:
- **Neon Circuit** - Classic loop with cyan/magenta neon aesthetics
- **Sunset Speedway** - Oval track with warm orange/gold tones
- **Midnight Maze** - Complex layout with purple/cyan midnight theme
- **Desert Dunes** - Kidney-shaped track with golden desert vibes
- **Ice Circuit** - Slippery loop with cool blue ice crystals
- **Cyber Circuit** - Figure-8 with green/magenta cyber grid
- **Toxic Tunnels** - Star-shaped track with toxic green theme
- **Volcanic Venture** - Complex track with fiery red/orange volcanic theme

### Multiplayer
- **Local Multiplayer**: Up to 4 players on the same screen
- **Ghost System**: Race against your best lap times as ghost replays

### Controls
#### Keyboard
- **Up Arrow / W**: Accelerate
- **Down Arrow / S**: Brake / Reverse
- **Left Arrow / A**: Steer Left
- **Right Arrow / D**: Steer Right
- **Space**: Boost

#### Gamepad
- Full gamepad support with analog steering and triggers

### Technical Features
- **Modern Performance**: Built with plain HTML5 Canvas and vanilla JavaScript for a lightweight, high-performance experience
- **Vite Build System**: Fast development with hot module replacement
- **Dynamic Lighting**: Real-time headlight and taillight effects
- **Skidmark System**: Persistent tire marks during drifts
- **Particle Effects**: Smoke and drift particles
- **Adaptive Audio**: Background music integration

## Development Setup

1. Make sure you have Node.js installed.
2. Clone this repository (or navigate to this directory).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open the game in your browser at the URL provided by Vite (usually `http://localhost:5173`).

## Project Structure

```
microRacer2/
├── src/
│   ├── main.js           # Game loop, state management, UI handling
│   ├── Car.js            # Car physics, rendering, drifting mechanics
│   ├── Track.js          # Procedural track generation, themes
│   ├── InputManager.js   # Keyboard input handling
│   ├── GamepadManager.js # Gamepad/controller support
│   ├── AudioManager.js   # Sound and music management
│   ├── ParticleSystem.js # Visual effects
│   ├── GhostRecorder.js  # Ghost replay system
│   └── style.css         # UI styling
├── public/
│   ├── favicon.svg       # Game icon
│   ├── splash.png        # Splash screen image
│   └── music.mp3         # Background music
├── index.html            # Main HTML with game canvas and UI
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Game States

- **Splash Screen**: Animated intro with press-to-start
- **Main Menu**: Start race, settings, leaderboard
- **Lobby**: Track selection, player count
- **Countdown**: 3-2-1-GO! before race starts
- **Playing**: Active racing gameplay
- **Paused**: Pause menu with resume/quit options
- **Game Over**: Results screen with lap times and scores

## Physics

The game features realistic arcade physics:
- Velocity-based movement with momentum
- Slip angle calculation for drift detection
- Grip vs drift grip for realistic sliding
- Steering smoothing for responsive yet predictable controls
- Grass penalty (reduced speed and grip off-track)

Get ready to burn some rubber! 🔥
