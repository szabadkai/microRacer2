// ---- GhostRecorder ----------------------------------------------------------
// Records a car's state every frame. When a lap completes, if it's the best
// lap, the recording is saved so GhostPlayer can replay it.

export class GhostRecorder {
  constructor() {
    // Current lap being recorded
    this.currentFrames = [];
    // Best (fastest) lap frames saved for playback
    this.bestFrames = null;
  }

  /** Call every frame while the car is racing. */
  recordFrame(car, dt) {
    this.currentFrames.push({
      x: car.x,
      y: car.y,
      heading: car.heading,
      isDrifting: car.isDrifting,
      isBoosting: car.isBoosting,
      dt, // store the dt so the ghost advances at the same pace
    });
  }

  /** Call when a lap is completed. Saves current recording as best if fastest.
   *  Returns true if this was a new best. */
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

  /** Reset everything (new race). */
  reset() {
    this.currentFrames = [];
    this.bestFrames = null;
    this.bestLapTime = Infinity;
  }
}

// ---- GhostPlayer ------------------------------------------------------------
// Replays a recording captured by GhostRecorder.

export class GhostPlayer {
  constructor(frames, color) {
    this.frames = frames;
    this.color = color;
    this.frameIndex = 0;
    this.elapsed = 0;    // time accumulated within current frame
    this.x = frames[0]?.x ?? 0;
    this.y = frames[0]?.y ?? 0;
    this.heading = frames[0]?.heading ?? 0;
    this.isDrifting = false;
    this.isBoosting = false;
    this.done = false;
  }

  /** Advance the ghost forward by dt seconds. */
  update(dt) {
    if (this.done || this.frames.length === 0) return;

    this.elapsed += dt;

    // Consume frames whose stored dt has elapsed
    while (this.frameIndex < this.frames.length) {
      const frame = this.frames[this.frameIndex];
      if (this.elapsed >= frame.dt) {
        this.elapsed -= frame.dt;
        this.x = frame.x;
        this.y = frame.y;
        this.heading = frame.heading;
        this.isDrifting = frame.isDrifting;
        this.isBoosting = frame.isBoosting;
        this.frameIndex++;
      } else {
        // Interpolate between current and next frame for smooth motion
        const next = this.frames[Math.min(this.frameIndex + 1, this.frames.length - 1)];
        const t = this.elapsed / frame.dt;
        this.x = frame.x + (next.x - frame.x) * t;
        this.y = frame.y + (next.y - frame.y) * t;
        // Heading: short-path interpolation
        let dh = next.heading - frame.heading;
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;
        this.heading = frame.heading + dh * t;
        this.isDrifting = frame.isDrifting;
        this.isBoosting = frame.isBoosting;
        break;
      }
    }

    if (this.frameIndex >= this.frames.length) {
      // Loop back to start
      this.frameIndex = 0;
      this.elapsed = 0;
    }
  }

  /** Draw the ghost car as a translucent version of the player car. */
  draw(ctx) {
    if (this.done || this.frames.length === 0) return;

    ctx.save();
    ctx.globalAlpha = 0.35;

    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-12, -8, 24, 16);

    // Body
    const bodyColor = this.isDrifting ? '#ff3366' : this.color;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-15, -10, 30, 20);

    // Windshield
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, -8, 8, 16);

    ctx.restore();

    // Ghost label — drawn at full alpha so it's readable
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('👻', this.x, this.y - 22);
    ctx.restore();
  }
}
