export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, speed, angle, color, size, life) {
    this.particles.push({
      x, y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 20,
      vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 20,
      color,
      size,
      life,
      maxLife: life
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size *= Math.pow(1.05, dt * 60); // expand over time
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
