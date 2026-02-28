export class Car {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
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
    
    // State
    this.isDrifting = false;
    this.throttle = 0;
    this.skidmarks = [];          // Simple trail for visuals
  }

  update(dt, input) {
    // 1. Handle Input
    this.throttle = 0;
    if (input.isDown('ArrowUp') || input.isDown('KeyW')) this.throttle = 1;
    if (input.isDown('ArrowDown') || input.isDown('KeyS')) this.throttle = -0.5;
    
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    // Only steer if moving
    const speedFactor = Math.min(speed / 100, 1);
    
    let steering = 0;
    if (input.isDown('ArrowLeft') || input.isDown('KeyA')) steering = -1;
    if (input.isDown('ArrowRight') || input.isDown('KeyD')) steering = 1;
    
    // If going backward, invert steering for intuitive controls
    const forwardSpeed = this.velocity.x * Math.cos(this.heading) + this.velocity.y * Math.sin(this.heading);
    const steerDir = forwardSpeed >= -10 ? 1 : -1;
    
    this.heading += steering * this.turnSpeed * dt * speedFactor * steerDir;

    // 2. Calculate Slip Angle
    let velocityAngle = speed > 5 ? Math.atan2(this.velocity.y, this.velocity.x) : this.heading;
    
    // Normalize angles
    let slipAngle = Math.abs(velocityAngle - this.heading);
    while (slipAngle > Math.PI) slipAngle -= 2 * Math.PI;
    slipAngle = Math.abs(slipAngle);

    // 3. Determine Drift State
    if (!this.isDrifting && slipAngle > this.driftThreshold && speed > 200) {
      this.isDrifting = true;
    } else if (this.isDrifting && slipAngle < this.recoveryThreshold) {
      this.isDrifting = false;
    }

    // 4. Apply Forces
    // Engine acceleration
    if (this.throttle !== 0) {
      const accelForce = this.throttle * this.acceleration * dt;
      this.velocity.x += Math.cos(this.heading) * accelForce;
      this.velocity.y += Math.sin(this.heading) * accelForce;
    }

    // Apply Drag (air/rolling friction)
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

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
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
    if (currentSpeed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / currentSpeed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / currentSpeed) * this.maxSpeed;
    }

    // Apply velocity to position
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    // Skidmarks
    if (this.isDrifting) {
      this.skidmarks.push({ x: this.x, y: this.y, age: 0 });
    }
    this.skidmarks.forEach(mark => mark.age += dt);
    this.skidmarks = this.skidmarks.filter(mark => mark.age < 2); // Keep marks for 2 seconds
  }

  draw(ctx) {
    // Draw trail
    if (this.skidmarks.length > 1) {
      ctx.beginPath();
      // Only draw continuous lines between close points
      ctx.moveTo(this.skidmarks[0].x, this.skidmarks[0].y);
      for (let i = 1; i < this.skidmarks.length; i++) {
        const p1 = this.skidmarks[i-1];
        const p2 = this.skidmarks[i];
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 50) {
          ctx.lineTo(p2.x, p2.y);
        } else {
          ctx.moveTo(p2.x, p2.y);
        }
      }
      ctx.strokeStyle = `rgba(255, 100, 100, 0.5)`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    // Car shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-12, -8, 24, 16);

    // Car body
    ctx.fillStyle = this.isDrifting ? '#ff3366' : '#00ffcc'; // Turn pink when drifting
    ctx.fillRect(-15, -10, 30, 20);

    // Headlights effect
    ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(80, -40);
    ctx.lineTo(80, 40);
    ctx.lineTo(15, 10);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, -8, 8, 16);

    ctx.restore();
  }
}
