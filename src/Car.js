export class Car {
  constructor(x, y, color = '#00ffcc', controls = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'Space' }) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.controls = controls;

    // Physics properties
    this.heading = 0; // Where the nose points (radians)
    this.velocity = { x: 0, y: 0 };

    // Configurable specs
    this.acceleration = 600;      // Pixels/s^2
    this.maxSpeed = 800;          // Pixels/s
    this.friction = 0.98;         // Forward friction 
    this.turnSpeed = 3.5;         // Radians/s
    this.grip = 800;              // How strongly the tires pull velocity toward heading
    this.driftGrip = 200;         // Grip when sliding
    this.driftThreshold = 0.4;    // Slip angle (radians) at which traction breaks
    this.recoveryThreshold = 0.2; // Slip angle at which traction is regained

    // Steering smoothing
    this.smoothedSteering = 0;    // Current smoothed steering value
    this.steeringSmoothing = 8;   // How fast steering responds (higher = faster, more direct)

    // State
    this.isDrifting = false;
    this.onGrass = false;
    this.throttle = 0;
    this.skidmarks = [];          // Simple trail for visuals

    // Drift Scoring
    this.pendingDriftScore = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.driftDuration = 0;
    this.floatingTexts = [];      // Floating score visual flares
    this.comboBreakCooldown = 0;  // Cooldown for splash text

    // Boost
    this.boostLevel = 0;
    this.maxBoost = 100;
    this.isBoosting = false;

    // AI
    this.isAI = false;
    this.aiDifficulty = 'bronze';
  }

  update(dt, input, trackInfo = { isOffTrack: false }) {
    this.onGrass = trackInfo.isOffTrack;

    this.throttle = 0;
    let steering = 0;
    let attemptingBoost = false;

    if (this.isAI && trackInfo.splinePoints) {
      // AI Logic
      let lookaheadNodes = 5;
      if (this.aiDifficulty === 'bronze') lookaheadNodes = 7;
      else if (this.aiDifficulty === 'silver') lookaheadNodes = 5;
      else if (this.aiDifficulty === 'gold') lookaheadNodes = 4;
      else if (this.aiDifficulty === 'boss') lookaheadNodes = 6;
      
      const targetIndex = (trackInfo.progressIndex + lookaheadNodes) % trackInfo.splinePoints.length;
      const targetPoint = trackInfo.splinePoints[targetIndex];
      
      let targetAngle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
      let angleDiff = targetAngle - this.heading;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      if (angleDiff > 0.1) steering = Math.min(1, angleDiff * 3);
      else if (angleDiff < -0.1) steering = Math.max(-1, angleDiff * 3);
      else steering = angleDiff * 5;
      
      // Throttle logic
      if (Math.abs(angleDiff) > Math.PI / 4) {
         this.throttle = 0.6;
         if (Math.abs(angleDiff) > Math.PI / 2) this.throttle = -0.5;
      } else {
         this.throttle = 1;
      }
      
      // Bronze wobble
      if (this.aiDifficulty === 'bronze' && Math.random() < 0.05) steering += (Math.random() - 0.5) * 0.5;
      // Gold boost
      if (this.aiDifficulty === 'gold' && Math.abs(angleDiff) < 0.15 && this.boostLevel > 15) attemptingBoost = true;
      // Boss boost (more aggressive)
      if (this.aiDifficulty === 'boss' && Math.abs(angleDiff) < 0.2 && this.boostLevel > 10) attemptingBoost = true;

    } else {
      // Human Input
      if (input.isDown(this.controls.up)) this.throttle = 1;
      if (input.isDown(this.controls.down)) this.throttle = -0.5;
      if (input.isDown(this.controls.left)) steering = -1;
      if (input.isDown(this.controls.right)) steering = 1;

      // Analog steering override (for mobile touch steering)
      if (input.analogSteering !== undefined && input.analogSteering !== 0) {
        steering = input.analogSteering;
      }
      // Allow both left and right shift for boost (for player 1 / single player)
      if (input.isDown(this.controls.boost) ||
        (this.controls.boost === 'ShiftRight' && input.isDown('ShiftLeft'))) {
        attemptingBoost = true;
      }

      // Gamepad Input overlay
      if (this.gamepadIndex !== undefined) {
        if (input.gamepadManager) {
          const gpThrottle = input.gamepadManager.getThrottle(this.gamepadIndex);
          if (gpThrottle !== 0) this.throttle = gpThrottle;

          const gpSteer = input.gamepadManager.getSteer(this.gamepadIndex);
          if (gpSteer !== 0) steering = gpSteer;

          if (input.gamepadManager.isBoosting(this.gamepadIndex)) attemptingBoost = true;
        }
      }
    }

    // Apply steering smoothing for more gradual feel
    // Exact exponential interpolation for perfect framerate independence
    const smoothingFactor = 1.0 - Math.exp(-this.steeringSmoothing * dt);
    this.smoothedSteering += (steering - this.smoothedSteering) * smoothingFactor;

    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    // Only steer if moving
    const speedFactor = Math.min(speed / 100, 1);

    // If going backward, invert steering for intuitive controls
    const forwardSpeed = this.velocity.x * Math.cos(this.heading) + this.velocity.y * Math.sin(this.heading);
    const steerDir = forwardSpeed >= -10 ? 1 : -1;

    this.heading += this.smoothedSteering * this.turnSpeed * dt * speedFactor * steerDir;

    // 2. Calculate Slip Angle
    let velocityAngle = speed > 5 ? Math.atan2(this.velocity.y, this.velocity.x) : this.heading;

    // Normalize angles
    let slipAngle = Math.abs(velocityAngle - this.heading);
    while (slipAngle > Math.PI) slipAngle -= 2 * Math.PI;
    slipAngle = Math.abs(slipAngle);

    // 3. Determine Drift State
    if (!this.isDrifting && slipAngle > this.driftThreshold && speed > 200) {
      this.isDrifting = true;
      this.driftDuration = 0;
    } else if (this.isDrifting && slipAngle < this.recoveryThreshold) {
      this.isDrifting = false;
      this.comboTimer = 2.0; // 2 seconds to resume drift or bank score
    }

    // Drift Scoring Logic
    if (this.isDrifting) {
      this.driftDuration += dt;
      this.comboTimer = 0; // Reset timer while actively drifting

      // Increase multiplier every 1.5 seconds of continuous drifting
      const newMultiplier = 1 + Math.floor(this.driftDuration / 1.5);
      if (newMultiplier > this.comboMultiplier) {
        this.comboMultiplier = newMultiplier;
        let color = '#00ffff'; // x2 cyan
        if (this.comboMultiplier === 3) color = '#ff00ff'; // x3 magenta
        if (this.comboMultiplier >= 4) color = '#ff3300'; // x4+ bold red-orange
        const size = 20 + (this.comboMultiplier * 4);
        this.addFloatingText(`x${this.comboMultiplier} COMBO!`, color, 1.5, size);
      }

      // Add pending score based on speed and angle
      const driftScoreRate = (speed / 100) * (slipAngle * 10) * 10;
      this.pendingDriftScore += driftScoreRate * dt;

    } else if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.bankPendingScore();
      }
    }

    if (this.comboBreakCooldown > 0) {
        this.comboBreakCooldown -= dt;
    }

    if (this.onGrass && (this.pendingDriftScore > 0 || this.comboMultiplier > 1)) {
        // Break combo
        this.pendingDriftScore = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.driftDuration = 0;
        if (this.comboBreakCooldown <= 0) {
            this.addFloatingText("COMBO BROKEN!", '#ff0000', 1.5, 26);
            this.comboBreakCooldown = 3.0; // Prevent spam for 3 seconds
        }
    }
    
    // Update floating texts
    for(let i = this.floatingTexts.length - 1; i >= 0; i--) {
        let ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y -= 30 * dt; // Float up relative to car
        if(ft.life <= 0) {
            this.floatingTexts.splice(i, 1);
        }
    }

    // 4. Boost Logic
    this.isBoosting = false;
    if (attemptingBoost && this.boostLevel > 0) {
      this.isBoosting = true;
      this.boostLevel -= 30 * dt; // Drain rate
      if (this.boostLevel < 0) this.boostLevel = 0;
    } else if (this.isDrifting) {
      this.boostLevel += 15 * dt; // Fill rate when drifting (and not boosting)
      if (this.boostLevel > this.maxBoost) this.boostLevel = this.maxBoost;
    }

    // 5. Apply Forces
    let activeAcceleration = this.acceleration;
    let activeMaxSpeed = this.maxSpeed;
    if (this.isBoosting) {
      activeAcceleration *= 2;
      activeMaxSpeed *= 1.5;
    }

    // Engine acceleration
    if (this.throttle !== 0) {
      const finalAccel = this.onGrass ? activeAcceleration * 0.75 : activeAcceleration;
      const accelForce = this.throttle * finalAccel * dt;
      this.velocity.x += Math.cos(this.heading) * accelForce;
      this.velocity.y += Math.sin(this.heading) * accelForce;
    }

    // Apply Drag (air/rolling friction) frame-rate independently
    // Assuming original tuning was at ~60 FPS
    const activeFriction = this.onGrass ? 0.96 : this.friction; // Mild friction on grass
    const frictionFactor = Math.pow(activeFriction, dt * 60);
    this.velocity.x *= frictionFactor;
    this.velocity.y *= frictionFactor;

    // Apply Lateral Grip (pull velocity toward heading)
    if (speed > 10) {
      const currentGrip = this.isDrifting ? this.driftGrip : this.grip;

      // Desired velocity is the current speed in the direction of heading
      const desiredVelocityX = Math.cos(this.heading) * speed;
      const desiredVelocityY = Math.sin(this.heading) * speed;

      this.velocity.x += (desiredVelocityX - this.velocity.x) * currentGrip * dt / speed;
      this.velocity.y += (desiredVelocityY - this.velocity.y) * currentGrip * dt / speed;
    }

    // Cap at max speed
    const finalMaxSpeed = this.onGrass ? activeMaxSpeed * 0.8 : activeMaxSpeed;
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
    if (currentSpeed > finalMaxSpeed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * finalMaxSpeed;
      this.velocity.y = (this.velocity.y / currentSpeed) * finalMaxSpeed;
    }

    // Apply velocity to position
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    // Skidmarks - two tracks for left and right tires
    if (this.isDrifting) {
      // Calculate tire positions relative to car center
      // Tires are at the rear of the car, offset to left and right
      const rearOffset = -12; // Rear of car
      const trackWidth = 7;   // Distance from center to each tire

      // Left tire position
      const leftTireX = this.x + Math.cos(this.heading) * rearOffset - Math.sin(this.heading) * trackWidth;
      const leftTireY = this.y + Math.sin(this.heading) * rearOffset + Math.cos(this.heading) * trackWidth;

      // Right tire position
      const rightTireX = this.x + Math.cos(this.heading) * rearOffset - Math.sin(this.heading) * (-trackWidth);
      const rightTireY = this.y + Math.sin(this.heading) * rearOffset + Math.cos(this.heading) * (-trackWidth);

      this.skidmarks.push({
        left: { x: leftTireX, y: leftTireY },
        right: { x: rightTireX, y: rightTireY },
        age: 0
      });
    }
    this.skidmarks.forEach(mark => mark.age += dt);
    this.skidmarks = this.skidmarks.filter(mark => mark.age < 3); // Keep marks for 3 seconds
  }

  addFloatingText(text, color, maxLife, size = 16) {
    this.floatingTexts.push({ text, color, life: maxLife, maxLife, y: -20, size });
  }

  bankPendingScore() {
    if (this.pendingDriftScore > 50) {
      const finalScore = Math.floor(this.pendingDriftScore * this.comboMultiplier);
      this.score = (this.score || 0) + finalScore;
      this.addFloatingText(`+${finalScore}`, '#00ffcc', 2.0, 22);
    }
    
    // Reset combo
    this.pendingDriftScore = 0;
    this.comboMultiplier = 1;
    this.driftDuration = 0;
    this.comboTimer = 0;
  }

  drawSkidmarks(ctx) {
    // Draw two tire mark tracks (called before particles/smoke)
    if (this.skidmarks.length > 1) {
      // Draw left tire track
      ctx.beginPath();
      ctx.moveTo(this.skidmarks[0].left.x, this.skidmarks[0].left.y);
      for (let i = 1; i < this.skidmarks.length; i++) {
        const p1 = this.skidmarks[i - 1].left;
        const p2 = this.skidmarks[i].left;
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 50) {
          ctx.lineTo(p2.x, p2.y);
        } else {
          ctx.moveTo(p2.x, p2.y);
        }
      }
      ctx.strokeStyle = `rgba(60, 50, 40, 0.85)`;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw right tire track
      ctx.beginPath();
      ctx.moveTo(this.skidmarks[0].right.x, this.skidmarks[0].right.y);
      for (let i = 1; i < this.skidmarks.length; i++) {
        const p1 = this.skidmarks[i - 1].right;
        const p2 = this.skidmarks[i].right;
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 50) {
          ctx.lineTo(p2.x, p2.y);
        } else {
          ctx.moveTo(p2.x, p2.y);
        }
      }
      ctx.strokeStyle = `rgba(60, 50, 40, 0.85)`;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  draw(ctx) {

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    // Calculate speed for light intensity
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    const speedRatio = Math.min(speed / this.maxSpeed, 1);

    // Determine if braking (throttle < 0)
    const isBraking = this.throttle < 0;
    const isAccelerating = this.throttle > 0;

    // === TAILLIGHTS ===
    // Red glow when braking, dimmer when not
    const taillightIntensity = isBraking ? 0.8 : 0.15 + speedRatio * 0.1;
    const taillightRadius = isBraking ? 60 : 30 + speedRatio * 15;

    // Left taillight glow
    const taillightGradientL = ctx.createRadialGradient(-15, -7, 0, -15, -7, taillightRadius);
    taillightGradientL.addColorStop(0, `rgba(255, ${isBraking ? 50 : 100}, ${isBraking ? 50 : 100}, ${taillightIntensity})`);
    taillightGradientL.addColorStop(0.3, `rgba(255, ${isBraking ? 30 : 60}, ${isBraking ? 30 : 60}, ${taillightIntensity * 0.5})`);
    taillightGradientL.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = taillightGradientL;
    ctx.beginPath();
    ctx.arc(-15, -7, taillightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Right taillight glow
    const taillightGradientR = ctx.createRadialGradient(-15, 7, 0, -15, 7, taillightRadius);
    taillightGradientR.addColorStop(0, `rgba(255, ${isBraking ? 50 : 100}, ${isBraking ? 50 : 100}, ${taillightIntensity})`);
    taillightGradientR.addColorStop(0.3, `rgba(255, ${isBraking ? 30 : 60}, ${isBraking ? 30 : 60}, ${taillightIntensity * 0.5})`);
    taillightGradientR.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = taillightGradientR;
    ctx.beginPath();
    ctx.arc(-15, 7, taillightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Taillight bulbs (small rectangles on car back)
    ctx.fillStyle = isBraking ? '#ff3333' : '#660000';
    ctx.fillRect(-17, -9, 4, 4);
    ctx.fillRect(-17, 5, 4, 4);

    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-12, -8, 24, 16);

    // Car body
    ctx.fillStyle = this.isDrifting ? '#ff3366' : this.color; // Turn pink when drifting, otherwise use designated color
    ctx.fillRect(-15, -10, 30, 20);

    // === HEADLIGHTS ===
    // Dynamic headlight color based on acceleration
    // Yellow-tinted headlights that get brighter with acceleration
    let lightR = 255, lightG = 240, lightB = 180; // Warm yellow base
    let lightAlpha = 0.12 + speedRatio * 0.12;
    let coneLength = 70 + speedRatio * 30;
    let coneWidth = 35 + speedRatio * 15;

    if (isAccelerating) {
      // Brighter and more intense when accelerating
      lightAlpha = 0.18 + speedRatio * 0.12;
      coneLength = 85 + speedRatio * 35;
      coneWidth = 42 + speedRatio * 18;
    }

    if (this.isBoosting) {
      // Intense bright yellow-white when boosting
      lightR = 255; lightG = 250; lightB = 220;
      lightAlpha = 0.3;
      coneLength = 120;
      coneWidth = 60;
    }

    // Main headlight cone - triangular shape with gradient for soft edges
    const headlightGradient = ctx.createLinearGradient(15, 0, 15 + coneLength, 0);
    headlightGradient.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${lightAlpha})`);
    headlightGradient.addColorStop(0.4, `rgba(${lightR}, ${lightG}, ${lightB}, ${lightAlpha * 0.6})`);
    headlightGradient.addColorStop(0.7, `rgba(${lightR}, ${lightG}, ${lightB}, ${lightAlpha * 0.25})`);
    headlightGradient.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0)`);

    ctx.fillStyle = headlightGradient;
    ctx.beginPath();
    // Traditional cone shape with slightly rounded edges
    ctx.moveTo(15, -8);
    ctx.lineTo(15 + coneLength, -coneWidth);
    // Soft bottom edge with slight curve
    ctx.quadraticCurveTo(15 + coneLength * 0.5, 0, 15 + coneLength, coneWidth);
    ctx.lineTo(15, 8);
    ctx.closePath();
    ctx.fill();

    // Soft outer glow for depth
    const outerGlow = ctx.createLinearGradient(15, 0, 15 + coneLength * 1.2, 0);
    outerGlow.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, ${lightAlpha * 0.4})`);
    outerGlow.addColorStop(0.5, `rgba(${lightR}, ${lightG}, ${lightB}, ${lightAlpha * 0.15})`);
    outerGlow.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0)`);

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(15 + coneLength * 1.2, -coneWidth * 1.3);
    ctx.quadraticCurveTo(15 + coneLength * 0.6, 0, 15 + coneLength * 1.2, coneWidth * 1.3);
    ctx.lineTo(15, 10);
    ctx.closePath();
    ctx.fill();

    // Bright headlight source points
    const bulbGlow = ctx.createRadialGradient(15, -6, 0, 15, -6, 10);
    bulbGlow.addColorStop(0, `rgba(255, 255, 240, 0.9)`);
    bulbGlow.addColorStop(0.4, `rgba(${lightR}, ${lightG}, ${lightB}, 0.5)`);
    bulbGlow.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0)`);
    ctx.fillStyle = bulbGlow;
    ctx.beginPath();
    ctx.arc(15, -6, 10, 0, Math.PI * 2);
    ctx.fill();

    const bulbGlow2 = ctx.createRadialGradient(15, 6, 0, 15, 6, 10);
    bulbGlow2.addColorStop(0, `rgba(255, 255, 240, 0.9)`);
    bulbGlow2.addColorStop(0.4, `rgba(${lightR}, ${lightG}, ${lightB}, 0.5)`);
    bulbGlow2.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0)`);
    ctx.fillStyle = bulbGlow2;
    ctx.beginPath();
    ctx.arc(15, 6, 10, 0, Math.PI * 2);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, -8, 8, 16);

    ctx.restore();

    // Draw Floating Texts (unrotated)
    if (this.floatingTexts && this.floatingTexts.length > 0) {
      ctx.save();
      ctx.translate(this.x, this.y); // Translate to car pos
      // We don't rotate
      ctx.textAlign = 'center';
      
      for (const ft of this.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        
        ctx.font = `900 ${ft.size}px "Orbitron", sans-serif`; // bolder
        
        // Adding a subtle shadow/outline for readability
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(ft.text, 0, ft.y);
        
        ctx.shadowBlur = 0;
        ctx.fillText(ft.text, 0, ft.y);
      }
      ctx.restore();
    }
  }
}
