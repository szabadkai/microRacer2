export class Track {
  constructor(radius = 1500, pointsCount = 12) {
    this.points = [];
    this.trackWidth = 400; // Wide track for drifting
    
    this.generateLoop(radius, pointsCount);
    this.generateSpline(6); // Subdivide each segment into 6 parts
    this.generateBoundaries();
  }

  generateLoop(radius, pointsCount) {
    const angleStep = (Math.PI * 2) / pointsCount;
    for (let i = 0; i < pointsCount; i++) {
        const angle = i * angleStep;
        // Add some random variation to the radius for an irregular shape
        // Keep the variation huge for sharp corners and straightaways
        const rVariation = radius + (Math.random() - 0.5) * radius * 0.8;
        
        this.points.push({
            x: Math.cos(angle) * rVariation,
            y: Math.sin(angle) * rVariation
        });
    }
  }
  
  // Custom Catmull-Rom spline implementation for smoothness
  generateSpline(subdivisions) {
    this.splinePoints = [];
    const len = this.points.length;
    
    for (let i = 0; i < len; i++) {
      const p0 = this.points[(i - 1 + len) % len];
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % len];
      const p3 = this.points[(i + 2) % len];

      for (let t = 0; t < 1; t += 1/subdivisions) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        this.splinePoints.push({ x, y });
      }
    }
  }

  generateBoundaries() {
    this.innerBounds = [];
    this.outerBounds = [];

    for (let i = 0; i < this.splinePoints.length; i++) {
      const p1 = this.splinePoints[i];
      const p2 = this.splinePoints[(i + 1) % this.splinePoints.length];

      // Calculate the normal perpendicular to the track direction
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      
      const nx = -dy / length;
      const ny = dx / length;

      this.outerBounds.push({
        x: p1.x + nx * (this.trackWidth / 2),
        y: p1.y + ny * (this.trackWidth / 2)
      });
      
      this.innerBounds.push({
        x: p1.x - nx * (this.trackWidth / 2),
        y: p1.y - ny * (this.trackWidth / 2)
      });
    }
  }
  
  // Return a safe starting position and heading
  getStartPos() {
      const p1 = this.splinePoints[0];
      const p2 = this.splinePoints[1];
      const heading = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      return { x: p1.x, y: p1.y, heading };
  }

  draw(ctx) {
      // Draw track surface
      ctx.beginPath();
      ctx.moveTo(this.outerBounds[0].x, this.outerBounds[0].y);
      for(let i=1; i < this.outerBounds.length; i++) {
          ctx.lineTo(this.outerBounds[i].x, this.outerBounds[i].y);
      }
      ctx.closePath();
      
      // Cut out the inner shape using non-zero winding rule
      ctx.moveTo(this.innerBounds[0].x, this.innerBounds[0].y);
      // To cut out, we must draw the inner boundary in the opposite direction
      for(let i=this.innerBounds.length - 1; i >= 0; i--) {
          ctx.lineTo(this.innerBounds[i].x, this.innerBounds[i].y);
      }
      ctx.closePath();
      
      // Fill the track
      ctx.fillStyle = '#222';
      ctx.fill('evenodd');

      // Draw outer boundary lines
      ctx.beginPath();
      ctx.moveTo(this.outerBounds[0].x, this.outerBounds[0].y);
      for(let i=1; i < this.outerBounds.length; i++) {
          ctx.lineTo(this.outerBounds[i].x, this.outerBounds[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#00ffcc';
      ctx.stroke();

      // Draw inner boundary lines
      ctx.beginPath();
      ctx.moveTo(this.innerBounds[0].x, this.innerBounds[0].y);
      for(let i=1; i < this.innerBounds.length; i++) {
          ctx.lineTo(this.innerBounds[i].x, this.innerBounds[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ff3366';
      ctx.stroke();
      
      // Draw checkered finish line at the start point
      const p1 = this.innerBounds[0];
      const p2 = this.outerBounds[0];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([20, 20]);
      ctx.stroke();
      ctx.setLineDash([]);
  }
}
