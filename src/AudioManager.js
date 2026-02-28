export class AudioManager {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;

    // Master volume
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);

    // Engine Sound
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.1;

    // Filter to make engine less harsh
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 800;

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // Tire Squeal
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    this.squealSrc = this.ctx.createBufferSource();
    this.squealSrc.buffer = noiseBuffer;
    this.squealSrc.loop = true;
    
    this.squealGain = this.ctx.createGain();
    this.squealGain.gain.value = 0;
    
    this.squealFilter = this.ctx.createBiquadFilter();
    this.squealFilter.type = 'bandpass';
    this.squealFilter.frequency.value = 1200;
    this.squealFilter.Q.value = 1.5;
    
    this.squealSrc.connect(this.squealFilter);
    this.squealFilter.connect(this.squealGain);
    this.squealGain.connect(this.masterGain);
    this.squealSrc.start();

    // Music setup
    this.isPlaying = true;
  }

  suspend() {
    if (this.initialized && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isPlaying = false;
    this.stopBassline();
  }

  resume() {
    if (this.initialized && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    // reset music timing to avoid catching up on missed notes
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
    }
    this.startBassline();
  }

  startBassline() {
    if (!this.initialized) return;
    if (!this.musicElement) {
      this.musicElement = document.getElementById('bgMusic');
      if (this.musicElement) this.musicElement.volume = 0.5;
    }
    if (this.musicElement) {
      this.musicElement.play().catch(e => console.warn('Autoplay blocked:', e));
    }
  }

  stopBassline() {
    if (!this.musicElement) {
      this.musicElement = document.getElementById('bgMusic');
    }
    if (this.musicElement) {
      this.musicElement.pause();
    }
  }

  update(speed, isDrifting) {
    if (!this.initialized) return;

    // Engine sound based on speed. Pitch mapping.
    const maxSpeed = 800; // Expected max speed before boost
    const speedRatio = Math.min(Math.abs(speed) / maxSpeed, 1);
    
    // Smooth the target set to avoid clicks, ~50Hz base to ~200Hz
    const targetFreq = 50 + speedRatio * 150;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    // Add some grit at high speeds
    const targetEngineVol = 0.1 + speedRatio * 0.1;
    this.engineGain.gain.setTargetAtTime(targetEngineVol, this.ctx.currentTime, 0.1);

    // Tire Squeal
    const targetSquealGain = isDrifting ? 0.3 : 0;
    this.squealGain.gain.setTargetAtTime(targetSquealGain, this.ctx.currentTime, 0.05);
  }

  setMusicVolume(value) {
    if (!this.musicElement) {
      this.musicElement = document.getElementById('bgMusic');
    }
    if (this.musicElement) {
      this.musicElement.volume = value;
    }
  }

  setSfxVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }
  }
}
