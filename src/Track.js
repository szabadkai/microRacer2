export class Track {
  constructor(radius = 3000, pointsCount = 35) {
    this.points = [];
    this.trackWidth = 250; // Narrower track for a more challenging experience
    
    this.generateLoop(radius, pointsCount);
    this.generateSpline(15); // Subdivide each segment into 15 parts for smoother curves
    this.generateBoundaries();
    
    // Checkpoints at roughly 25%, 50%, 75% progress
    const len = this.splinePoints.length;
    this.checkpoints = [
      Math.floor(len * 0.25),
      Math.floor(len * 0.50),
      Math.floor(len * 0.75)
    ];
  }

  generateLoop(radius, pointsCount) {
    const angleStep = (Math.PI * 2) / pointsCount;
    
    // Random phases for variety in shape
    const phase2 = Math.random() * Math.PI * 2;
    const phase3 = Math.random() * Math.PI * 2;
    const phase5 = Math.random() * Math.PI * 2;

    for (let i = 0; i < pointsCount; i++) {
        const angle = i * angleStep;
        
        let rVariation = radius;
        // Base shape variations (creates straights and wide corners)
        rVariation += Math.sin(angle * 2 + phase2) * radius * 0.4;
        rVariation += Math.cos(angle * 3 + phase3) * radius * 0.25;
        
        // Chicanes (more frequent variations)
        rVariation += Math.sin(angle * 5 + phase5) * radius * 0.15;
        
        // Small random noise
        rVariation += (Math.random() - 0.5) * radius * 0.1;
        
        this.points.push({
            x: Math.cos(angle) * rVariation,
            y: Math.sin(angle) * rVariation
        });
    }

    // Relax the points to smooth out extreme sharp angles and create better straights
    for (let iter = 0; iter < 4; iter++) {
        const smoothed = [];
        for (let i = 0; i < pointsCount; i++) {
            const prev = this.points[(i - 1 + pointsCount) % pointsCount];
            const curr = this.points[i];
            const next = this.points[(i + 1) % pointsCount];
            smoothed.push({
                x: curr.x * 0.5 + (prev.x + next.x) * 0.25,
                y: curr.y * 0.5 + (prev.y + next.y) * 0.25
            });
        }
        this.points = smoothed;
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

    const len = this.splinePoints.length;

    for (let i = 0; i < len; i++) {
      const p0 = this.splinePoints[(i - 1 + len) % len];
      const p1 = this.splinePoints[i];
      const p2 = this.splinePoints[(i + 1) % len];

      // Calculate the normal perpendicular to the track direction at p1
      // Using p2 - p0 gives a smooth, continuous tangent at p1 across segments
      const dx = p2.x - p0.x;
      const dy = p2.y - p0.y;
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
  
  drawCheckpoints(ctx) {
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; // Neon Cyan glowing lines
    ctx.lineCap = 'round';
    
    for (let c of this.checkpoints) {
      if (c >= this.innerBounds.length || c >= this.outerBounds.length) continue;
      ctx.beginPath();
      ctx.moveTo(this.innerBounds[c].x, this.innerBounds[c].y);
      ctx.lineTo(this.outerBounds[c].x, this.outerBounds[c].y);
      ctx.stroke();
    }
  }

  drawMinimap(ctx, carX, carY) {
    ctx.save();
    
    // Position minimap at top right
    const padding = 20;
    const mapSize = 150;
    
    // Cache bounds
    if (!this.minX) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of this.splinePoints) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
      }
      this.minX = minX; this.maxX = maxX;
      this.minY = minY; this.maxY = maxY;
      this.cx = (minX + maxX) / 2;
      this.cy = (minY + maxY) / 2;
      
      const trackWidth = maxX - minX;
      const trackHeight = maxY - minY;
      this.mapScale = (mapSize - 20) / Math.max(trackWidth, trackHeight);
    }
    
    // Map center on screen
    const screenCx = window.innerWidth - mapSize / 2 - padding;
    const screenCy = padding + mapSize / 2;
    
    ctx.translate(screenCx, screenCy);
    ctx.scale(this.mapScale, this.mapScale);
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(18, 18, 18, 0.7)';
    const scaledMapSize = mapSize / this.mapScale;
    ctx.fillRect(-scaledMapSize/2 - 20, -scaledMapSize/2 - 20, scaledMapSize + 40, scaledMapSize + 40);

    // Draw track path
    ctx.beginPath();
    ctx.moveTo((this.splinePoints[0].x - this.cx), (this.splinePoints[0].y - this.cy));
    for (let i = 1; i < this.splinePoints.length; i++) {
        ctx.lineTo((this.splinePoints[i].x - this.cx), (this.splinePoints[i].y - this.cy));
    }
    ctx.closePath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 150; 
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Draw thin neon line
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#00ffcc';
    ctx.stroke();
    
    // Draw Car dot
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc((carX - this.cx), (carY - this.cy), 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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

      // Checkpoints
      this.drawCheckpoints(ctx);

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

  // Returns { isOffTrack: boolean, progressIndex: number }
  getPointInfo(x, y) {
    if (!this.splinePoints || this.splinePoints.length === 0) return { isOffTrack: true, progressIndex: 0 };
    
    let minSqDist = Infinity;
    let closestIndex = 0;
    
    // Find closest point on the central spline
    for (let i = 0; i < this.splinePoints.length; i++) {
      const sp = this.splinePoints[i];
      const sqDist = (sp.x - x) ** 2 + (sp.y - y) ** 2;
      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        closestIndex = i;
      }
    }
    
    // Track width is used for boundaries, so half of it is the distance to the edge
    const maxSqDist = (this.trackWidth / 2) ** 2;
    // We add a tiny buffer (e.g. 5px) to be forgiving
    return {
      isOffTrack: minSqDist > maxSqDist + 25,
      progressIndex: closestIndex
    };
  }
}
