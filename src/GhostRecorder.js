// ---- GhostRecorder ----------------------------------------------------------
// Records a car's state every frame. When a lap completes, if it's the best
// lap, the recording is saved so GhostPlayer can replay it.

export class GhostRecorder {
  constructor() {
    this.currentFrames = [];
    this.bestFrames = null;
    this.bestLapTime = Infinity;
  }

  recordFrame(car, dt) {
    this.currentFrames.push({
      x: car.x,
      y: car.y,
      heading: car.heading,
      isDrifting: car.isDrifting,
      isBoosting: car.isBoosting,
      dt,
    });
  }

  onLapComplete(lapTime) {
    const frames = this.currentFrames.slice();
    this.currentFrames = [];

    if (this.bestFrames === null || lapTime < this.bestLapTime) {
      this.bestFrames = frames;
      this.bestLapTime = lapTime;
      return true;
    }
    return false;
  }

  reset() {
    this.currentFrames = [];
    this.bestFrames = null;
    this.bestLapTime = Infinity;
  }
}

// ---- GhostPlayer ------------------------------------------------------------
// Replays a recording captured by GhostRecorder with a hologram-style render.

export class GhostPlayer {
  constructor(frames, color) {
    this.frames = frames;
    this.color = color;
    this.trail = [];
    this.time = 0;
    this.sampleTimer = 0;
    this.restart();
  }

  restart() {
    this.frameIndex = 0;
    this.elapsed = 0;
    this.x = this.frames[0]?.x ?? 0;
    this.y = this.frames[0]?.y ?? 0;
    this.heading = this.frames[0]?.heading ?? 0;
    this.isDrifting = false;
    this.isBoosting = false;
    this.done = false;
    this.fade = 1;
    this.spawnPulse = 1;
    this.finishPulse = 0;
    this.trail = [];
    this.sampleTimer = 0;
  }

  update(dt) {
    if (this.frames.length === 0) return;

    this.time += dt;
    this.spawnPulse = Math.max(0, this.spawnPulse - dt * 1.65);
    this.finishPulse = Math.max(0, this.finishPulse - dt * 1.1);

    this.trail.forEach((point) => {
      point.life -= dt;
    });
    this.trail = this.trail.filter((point) => point.life > 0);

    if (this.done) {
      this.fade = Math.max(0, this.fade - dt * 1.75);
      return;
    }

    this.elapsed += dt;

    while (this.frameIndex < this.frames.length) {
      const frame = this.frames[this.frameIndex];
      const safeDt = Math.max(frame.dt || 0.016, 0.001);

      if (this.elapsed >= safeDt) {
        this.elapsed -= safeDt;
        this.x = frame.x;
        this.y = frame.y;
        this.heading = frame.heading;
        this.isDrifting = frame.isDrifting;
        this.isBoosting = frame.isBoosting;
        this.frameIndex++;
      } else {
        const next = this.frames[Math.min(this.frameIndex + 1, this.frames.length - 1)];
        const t = this.elapsed / safeDt;
        this.x = frame.x + (next.x - frame.x) * t;
        this.y = frame.y + (next.y - frame.y) * t;

        let dh = next.heading - frame.heading;
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        this.heading = frame.heading + dh * t;
        this.isDrifting = frame.isDrifting;
        this.isBoosting = frame.isBoosting;
        break;
      }
    }

    this.sampleTimer += dt;
    if (this.sampleTimer >= 0.03) {
      this.sampleTimer = 0;
      this.trail.push({
        x: this.x,
        y: this.y,
        life: this.isBoosting ? 0.48 : 0.34,
        maxLife: this.isBoosting ? 0.48 : 0.34,
        radius: this.isBoosting ? 11 : 8
      });
      if (this.trail.length > 24) {
        this.trail.shift();
      }
    }

    if (this.frameIndex >= this.frames.length) {
      this.done = true;
      this.finishPulse = 1;
    }
  }

  draw(ctx) {
    if (this.frames.length === 0) return;
    if (this.done && this.fade <= 0.02 && this.trail.length === 0) return;

    const core = hexToRgb(this.color);
    const bodyAlpha = 0.42 * Math.max(this.fade, 0.24);
    const lineAlpha = 0.85 * Math.max(this.fade, 0.28);
    const pulseScale = 1 + this.spawnPulse * 0.55 + this.finishPulse * 0.3;

    drawTrail(ctx, this.trail, core);

    if (this.spawnPulse > 0.01 || this.finishPulse > 0.01) {
      const pulseAlpha = Math.max(this.spawnPulse * 0.24, this.finishPulse * 0.22);
      ctx.save();
      ctx.strokeStyle = `rgba(${core.r}, ${core.g}, ${core.b}, ${pulseAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 16 * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    const shimmer = 0.78 + Math.sin(this.time * 10.5) * 0.12;
    const glowColor = `rgba(${core.r}, ${core.g}, ${core.b}, ${0.24 * Math.max(this.fade, 0.25)})`;

    // Hologram underglow.
    const floorGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 42);
    floorGlow.addColorStop(0, `rgba(${core.r}, ${core.g}, ${core.b}, ${0.18 * Math.max(this.fade, 0.25)})`);
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boost/draft trail cone.
    if (this.isBoosting) {
      const boostGradient = ctx.createLinearGradient(-15, 0, -88, 0);
      boostGradient.addColorStop(0, `rgba(255, 255, 255, ${0.55 * this.fade})`);
      boostGradient.addColorStop(0.25, `rgba(${core.r}, ${core.g}, ${core.b}, ${0.32 * this.fade})`);
      boostGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = boostGradient;
      ctx.beginPath();
      ctx.moveTo(-14, -8);
      ctx.lineTo(-88, -18);
      ctx.lineTo(-88, 18);
      ctx.lineTo(-14, 8);
      ctx.closePath();
      ctx.fill();
    }

    // Body shell.
    ctx.fillStyle = `rgba(${core.r}, ${core.g}, ${core.b}, ${bodyAlpha * shimmer})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    drawGhostBodyPath(ctx);
    ctx.fill();
    ctx.stroke();

    // Inner hologram ribs.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${core.r}, ${core.g}, ${core.b}, ${0.45 * this.fade})`;
    ctx.lineWidth = 1.2;
    for (let y = -8; y <= 8; y += 4) {
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.lineTo(10, y);
      ctx.stroke();
    }

    // Windshield core.
    ctx.fillStyle = `rgba(10, 18, 28, ${0.7 * this.fade})`;
    ctx.fillRect(-1, -7, 10, 14);
    ctx.strokeStyle = `rgba(${core.r}, ${core.g}, ${core.b}, ${0.55 * this.fade})`;
    ctx.strokeRect(-1, -7, 10, 14);

    // Edge nodes.
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * this.fade})`;
    ctx.fillRect(10, -7, 4, 3);
    ctx.fillRect(10, 4, 4, 3);
    ctx.fillRect(-16, -7, 4, 3);
    ctx.fillRect(-16, 4, 4, 3);

    // Drift side flares.
    if (this.isDrifting) {
      ctx.strokeStyle = `rgba(255, 80, 160, ${0.55 * this.fade})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, Math.PI * 0.8, Math.PI * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 24, -Math.PI * 0.2, Math.PI * 0.2);
      ctx.stroke();
    }

    // Scanline slash.
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * this.fade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18, Math.sin(this.time * 8) * 4);
    ctx.lineTo(18, Math.sin(this.time * 8) * 4);
    ctx.stroke();

    ctx.restore();
  }
}

function drawTrail(ctx, trail, core) {
  for (const point of trail) {
    const alpha = Math.max(0, point.life / point.maxLife);
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.28})`);
    gradient.addColorStop(0.35, `rgba(${core.r}, ${core.g}, ${core.b}, ${alpha * 0.24})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGhostBodyPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-15, -8);
  ctx.lineTo(-5, -10);
  ctx.lineTo(10, -10);
  ctx.lineTo(15, -4);
  ctx.lineTo(15, 4);
  ctx.lineTo(10, 10);
  ctx.lineTo(-5, 10);
  ctx.lineTo(-15, 8);
  ctx.closePath();
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255
  };
}
