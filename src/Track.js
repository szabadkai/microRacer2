// Seeded random number generator for reproducible tracks
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  range(min, max) {
    return min + this.next() * (max - min);
  }
}

// Track themes with neon arcade aesthetic
const TRACK_THEMES = {
  neon_circuit: {
    name: 'Neon Circuit',
    trackColor: '#1a1a2e',
    trackPattern: 'grid',
    patternColor: 'rgba(0, 255, 204, 0.1)',
    outerBorder: '#00ffcc',
    innerBorder: '#ff3366',
    outerGlow: 'rgba(0, 255, 204, 0.5)',
    innerGlow: 'rgba(255, 51, 102, 0.5)',
    checkpointColor: 'rgba(0, 255, 255, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#0a0a15',
    minimapTrack: '#00ffcc'
  },
  sunset_strip: {
    name: 'Sunset Strip',
    trackColor: '#2d1b3d',
    trackPattern: 'stripes',
    patternColor: 'rgba(255, 102, 0, 0.15)',
    outerBorder: '#ff6600',
    innerBorder: '#ffcc00',
    outerGlow: 'rgba(255, 102, 0, 0.5)',
    innerGlow: 'rgba(255, 204, 0, 0.5)',
    checkpointColor: 'rgba(255, 204, 0, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#1a0a20',
    minimapTrack: '#ff6600'
  },
  midnight_run: {
    name: 'Midnight Run',
    trackColor: '#0d1b2a',
    trackPattern: 'dots',
    patternColor: 'rgba(138, 43, 226, 0.2)',
    outerBorder: '#8a2be2',
    innerBorder: '#00ffff',
    outerGlow: 'rgba(138, 43, 226, 0.6)',
    innerGlow: 'rgba(0, 255, 255, 0.6)',
    checkpointColor: 'rgba(0, 255, 255, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#050a12',
    minimapTrack: '#8a2be2'
  },
  desert_storm: {
    name: 'Desert Storm',
    trackColor: '#2a1f10',
    trackPattern: 'sand',
    patternColor: 'rgba(255, 215, 0, 0.12)',
    outerBorder: '#ffd700',
    innerBorder: '#ff4500',
    outerGlow: 'rgba(255, 215, 0, 0.5)',
    innerGlow: 'rgba(255, 69, 0, 0.5)',
    checkpointColor: 'rgba(255, 215, 0, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#0f0a05',
    minimapTrack: '#ffd700'
  },
  ice_circuit: {
    name: 'Ice Circuit',
    trackColor: '#0a1a2a',
    trackPattern: 'crystals',
    patternColor: 'rgba(0, 191, 255, 0.15)',
    outerBorder: '#00bfff',
    innerBorder: '#e0ffff',
    outerGlow: 'rgba(0, 191, 255, 0.6)',
    innerGlow: 'rgba(224, 255, 255, 0.6)',
    checkpointColor: 'rgba(224, 255, 255, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#050f1a',
    minimapTrack: '#00bfff'
  },
  cyber_grid: {
    name: 'Cyber Grid',
    trackColor: '#0a0a0a',
    trackPattern: 'circuit',
    patternColor: 'rgba(0, 255, 0, 0.12)',
    outerBorder: '#00ff00',
    innerBorder: '#ff00ff',
    outerGlow: 'rgba(0, 255, 0, 0.6)',
    innerGlow: 'rgba(255, 0, 255, 0.6)',
    checkpointColor: 'rgba(0, 255, 0, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#000000',
    minimapTrack: '#00ff00'
  },
  toxic_waste: {
    name: 'Toxic Waste',
    trackColor: '#0a1a0a',
    trackPattern: 'bubbles',
    patternColor: 'rgba(50, 205, 50, 0.15)',
    outerBorder: '#32cd32',
    innerBorder: '#adff2f',
    outerGlow: 'rgba(50, 205, 50, 0.6)',
    innerGlow: 'rgba(173, 255, 47, 0.6)',
    checkpointColor: 'rgba(173, 255, 47, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#050a05',
    minimapTrack: '#32cd32'
  },
  volcanic: {
    name: 'Volcanic',
    trackColor: '#1a0a0a',
    trackPattern: 'cracks',
    patternColor: 'rgba(255, 69, 0, 0.2)',
    outerBorder: '#ff4500',
    innerBorder: '#ff6347',
    outerGlow: 'rgba(255, 69, 0, 0.6)',
    innerGlow: 'rgba(255, 99, 71, 0.6)',
    checkpointColor: 'rgba(255, 99, 71, 0.4)',
    finishColor: '#ffffff',
    backgroundColor: '#0a0505',
    minimapTrack: '#ff4500'
  }
};

// Track shape generators
const TRACK_SHAPES = {
  loop: (rng, radius, pointsCount) => {
    const points = [];
    const angleStep = (Math.PI * 2) / pointsCount;
    const phase2 = rng.range(0, Math.PI * 2);
    const phase3 = rng.range(0, Math.PI * 2);
    const phase5 = rng.range(0, Math.PI * 2);

    for (let i = 0; i < pointsCount; i++) {
      const angle = i * angleStep;
      let rVariation = radius;
      rVariation += Math.sin(angle * 2 + phase2) * radius * 0.4;
      rVariation += Math.cos(angle * 3 + phase3) * radius * 0.25;
      rVariation += Math.sin(angle * 5 + phase5) * radius * 0.15;
      rVariation += (rng.next() - 0.5) * radius * 0.1;
      
      points.push({
        x: Math.cos(angle) * rVariation,
        y: Math.sin(angle) * rVariation
      });
    }
    return points;
  },
  
  oval: (rng, radius, pointsCount) => {
    const points = [];
    const angleStep = (Math.PI * 2) / pointsCount;
    const stretchX = rng.range(1.3, 1.8);
    const stretchY = rng.range(0.6, 0.9);
    const wobble = rng.range(0.05, 0.15);

    for (let i = 0; i < pointsCount; i++) {
      const angle = i * angleStep;
      const rVariation = radius * (1 + Math.sin(angle * 4) * wobble);
      
      points.push({
        x: Math.cos(angle) * rVariation * stretchX,
        y: Math.sin(angle) * rVariation * stretchY
      });
    }
    return points;
  },
  
  figure8: (rng, radius, pointsCount) => {
    const points = [];
    const steps = pointsCount;
    const size = radius * 0.7;
    const twist = rng.range(0.8, 1.2);
    
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const scale = 1 + Math.sin(t * 3) * 0.1 * rng.next();
      
      // Lemniscate of Bernoulli with variations
      const denom = 1 + Math.sin(t) * Math.sin(t) * twist;
      const x = (Math.cos(t) * scale) / denom * size * 2;
      const y = (Math.sin(t) * Math.cos(t) * scale) / denom * size * 2;
      
      points.push({ x, y });
    }
    return points;
  },
  
  complex: (rng, radius, pointsCount) => {
    const points = [];
    const angleStep = (Math.PI * 2) / pointsCount;
    
    // Multiple overlapping shapes
    const lobes = Math.floor(rng.range(3, 7));
    const lobeStrength = rng.range(0.3, 0.6);
    const asymmetry = rng.range(0.1, 0.3);
    
    for (let i = 0; i < pointsCount; i++) {
      const angle = i * angleStep;
      let rVariation = radius;
      
      // Main lobes
      rVariation += Math.cos(angle * lobes) * radius * lobeStrength;
      // Secondary variation
      rVariation += Math.sin(angle * (lobes + 2)) * radius * 0.15;
      // Asymmetry
      rVariation += Math.cos(angle * 1 + Math.PI / 4) * radius * asymmetry;
      // Noise
      rVariation += (rng.next() - 0.5) * radius * 0.08;
      
      points.push({
        x: Math.cos(angle) * rVariation,
        y: Math.sin(angle) * rVariation
      });
    }
    return points;
  },
  
  star: (rng, radius, pointsCount) => {
    const points = [];
    const spikes = Math.floor(rng.range(4, 8));
    const spikeDepth = rng.range(0.3, 0.5);
    const angleStep = (Math.PI * 2) / pointsCount;
    
    for (let i = 0; i < pointsCount; i++) {
      const angle = i * angleStep;
      const spikeAngle = angle * spikes;
      const rVariation = radius * (1 - spikeDepth * Math.abs(Math.sin(spikeAngle)));
      
      points.push({
        x: Math.cos(angle) * rVariation,
        y: Math.sin(angle) * rVariation
      });
    }
    return points;
  },
  
  kidney: (rng, radius, pointsCount) => {
    const points = [];
    const angleStep = (Math.PI * 2) / pointsCount;
    const indent = rng.range(0.3, 0.5);
    const stretch = rng.range(1.2, 1.5);
    
    for (let i = 0; i < pointsCount; i++) {
      const angle = i * angleStep;
      let rVariation = radius;
      
      // Kidney indent on one side
      const indentFactor = 1 - indent * Math.pow(Math.max(0, Math.cos(angle)), 4);
      rVariation *= indentFactor;
      
      // Add some organic variation
      rVariation += Math.sin(angle * 5) * radius * 0.05;
      
      points.push({
        x: Math.cos(angle) * rVariation * stretch,
        y: Math.sin(angle) * rVariation
      });
    }
    return points;
  }
};

export class Track {
  constructor(radius = 3000, pointsCount = 35, themeId = 'neon_circuit', shapeType = 'loop', seed = 12345) {
    this.points = [];
    this.trackWidth = 250;
    this.themeId = themeId;
    this.shapeType = shapeType;
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    
    // Get theme
    this.theme = TRACK_THEMES[themeId] || TRACK_THEMES.neon_circuit;
    
    // Generate shape
    const shapeGenerator = TRACK_SHAPES[shapeType] || TRACK_SHAPES.loop;
    this.points = shapeGenerator(this.rng, radius, pointsCount);
    
    // Relax points for smoother curves
    this.relaxPoints(4);
    
    // Generate spline and boundaries
    this.generateSpline(15);
    this.generateBoundaries();
    
    // Checkpoints at roughly 25%, 50%, 75% progress
    const len = this.splinePoints.length;
    this.checkpoints = [
      Math.floor(len * 0.25),
      Math.floor(len * 0.50),
      Math.floor(len * 0.75)
    ];
  }
  
  relaxPoints(iterations) {
    const pointsCount = this.points.length;
    for (let iter = 0; iter < iterations; iter++) {
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
  
  // Draw track pattern/texture
  drawTrackPattern(ctx) {
    const pattern = this.theme.trackPattern;
    const bounds = this.getTrackBounds();
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    ctx.save();
    
    // Clip to track shape
    ctx.beginPath();
    ctx.moveTo(this.outerBounds[0].x, this.outerBounds[0].y);
    for (let i = 1; i < this.outerBounds.length; i++) {
      ctx.lineTo(this.outerBounds[i].x, this.outerBounds[i].y);
    }
    ctx.closePath();
    ctx.moveTo(this.innerBounds[0].x, this.innerBounds[0].y);
    for (let i = this.innerBounds.length - 1; i >= 0; i--) {
      ctx.lineTo(this.innerBounds[i].x, this.innerBounds[i].y);
    }
    ctx.closePath();
    ctx.clip('evenodd');
    
    ctx.strokeStyle = this.theme.patternColor;
    ctx.fillStyle = this.theme.patternColor;
    ctx.lineWidth = 2;
    
    switch (pattern) {
      case 'grid':
        this.drawGridPattern(ctx, bounds);
        break;
      case 'stripes':
        this.drawStripesPattern(ctx, bounds);
        break;
      case 'dots':
        this.drawDotsPattern(ctx, bounds);
        break;
      case 'circuit':
        this.drawCircuitPattern(ctx, bounds);
        break;
      case 'crystals':
        this.drawCrystalsPattern(ctx, bounds);
        break;
      case 'bubbles':
        this.drawBubblesPattern(ctx, bounds);
        break;
      case 'cracks':
        this.drawCracksPattern(ctx, bounds);
        break;
      case 'sand':
        this.drawSandPattern(ctx, bounds);
        break;
      default:
        this.drawGridPattern(ctx, bounds);
    }
    
    ctx.restore();
  }
  
  getTrackBounds() {
    if (this._bounds) return this._bounds;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of this.splinePoints) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    
    this._bounds = { minX, maxX, minY, maxY };
    return this._bounds;
  }
  
  drawGridPattern(ctx, bounds) {
    const spacing = 80;
    ctx.strokeStyle = this.theme.patternColor;
    ctx.lineWidth = 1;
    
    for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.minY);
      ctx.lineTo(x, bounds.maxY);
      ctx.stroke();
    }
    
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, y);
      ctx.lineTo(bounds.maxX, y);
      ctx.stroke();
    }
  }
  
  drawStripesPattern(ctx, bounds) {
    const spacing = 60;
    ctx.strokeStyle = this.theme.patternColor;
    ctx.lineWidth = 20;
    
    for (let i = bounds.minX - bounds.maxY; i < bounds.maxX - bounds.minY; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(bounds.minX, bounds.minY + (i - bounds.minX));
      ctx.lineTo(bounds.maxX, bounds.minY + (i - bounds.minX) + (bounds.maxY - bounds.minY));
      ctx.stroke();
    }
  }
  
  drawDotsPattern(ctx, bounds) {
    const spacing = 50;
    ctx.fillStyle = this.theme.patternColor;
    
    for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
      for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  drawCircuitPattern(ctx, bounds) {
    const rng = new SeededRandom(this.seed);
    ctx.strokeStyle = this.theme.patternColor;
    ctx.lineWidth = 2;
    
    // Draw random circuit-like lines
    for (let i = 0; i < 30; i++) {
      const x1 = rng.range(bounds.minX, bounds.maxX);
      const y1 = rng.range(bounds.minY, bounds.maxY);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      
      let x = x1, y = y1;
      for (let j = 0; j < 4; j++) {
        if (rng.next() > 0.5) {
          x += rng.range(-200, 200);
        } else {
          y += rng.range(-200, 200);
        }
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Add node at end
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawCrystalsPattern(ctx, bounds) {
    const rng = new SeededRandom(this.seed);
    ctx.strokeStyle = this.theme.patternColor;
    ctx.fillStyle = this.theme.patternColor;
    
    for (let i = 0; i < 40; i++) {
      const x = rng.range(bounds.minX, bounds.maxX);
      const y = rng.range(bounds.minY, bounds.maxY);
      const size = rng.range(10, 30);
      const sides = Math.floor(rng.range(4, 7));
      
      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = (j / sides) * Math.PI * 2 - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  
  drawBubblesPattern(ctx, bounds) {
    const rng = new SeededRandom(this.seed);
    ctx.strokeStyle = this.theme.patternColor;
    
    for (let i = 0; i < 50; i++) {
      const x = rng.range(bounds.minX, bounds.maxX);
      const y = rng.range(bounds.minY, bounds.maxY);
      const r = rng.range(5, 25);
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  drawCracksPattern(ctx, bounds) {
    const rng = new SeededRandom(this.seed);
    ctx.strokeStyle = this.theme.patternColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 25; i++) {
      let x = rng.range(bounds.minX, bounds.maxX);
      let y = rng.range(bounds.minY, bounds.maxY);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      for (let j = 0; j < 6; j++) {
        const angle = rng.range(0, Math.PI * 2);
        const dist = rng.range(30, 100);
        x += Math.cos(angle) * dist;
        y += Math.sin(angle) * dist;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  
  drawSandPattern(ctx, bounds) {
    const rng = new SeededRandom(this.seed);
    ctx.fillStyle = this.theme.patternColor;
    
    // Small dots for sand texture
    for (let i = 0; i < 500; i++) {
      const x = rng.range(bounds.minX, bounds.maxX);
      const y = rng.range(bounds.minY, bounds.maxY);
      const r = rng.range(1, 3);
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Wavy lines
    ctx.strokeStyle = this.theme.patternColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const y = rng.range(bounds.minY, bounds.maxY);
      ctx.beginPath();
      ctx.moveTo(bounds.minX, y);
      for (let x = bounds.minX; x <= bounds.maxX; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 15);
      }
      ctx.stroke();
    }
  }
  
  drawCheckpoints(ctx) {
    ctx.lineWidth = 15;
    ctx.strokeStyle = this.theme.checkpointColor;
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
    
    const padding = 20;
    const mapSize = 150;
    
    if (!this.minX) {
      const bounds = this.getTrackBounds();
      this.minX = bounds.minX; this.maxX = bounds.maxX;
      this.minY = bounds.minY; this.maxY = bounds.maxY;
      this.cx = (bounds.minX + bounds.maxX) / 2;
      this.cy = (bounds.minY + bounds.maxY) / 2;
      
      const trackWidth = bounds.maxX - bounds.minX;
      const trackHeight = bounds.maxY - bounds.minY;
      this.mapScale = (mapSize - 20) / Math.max(trackWidth, trackHeight);
    }
    
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
    ctx.strokeStyle = this.theme.minimapTrack;
    ctx.stroke();
    
    // Draw Car dot
    ctx.fillStyle = '#ff3366';
    ctx.beginPath();
    ctx.arc((carX - this.cx), (carY - this.cy), 100, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  
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
      
      ctx.moveTo(this.innerBounds[0].x, this.innerBounds[0].y);
      for(let i=this.innerBounds.length - 1; i >= 0; i--) {
          ctx.lineTo(this.innerBounds[i].x, this.innerBounds[i].y);
      }
      ctx.closePath();
      
      // Fill the track
      ctx.fillStyle = this.theme.trackColor;
      ctx.fill('evenodd');
      
      // Draw track pattern
      this.drawTrackPattern(ctx);

      // Checkpoints
      this.drawCheckpoints(ctx);

      // Draw outer boundary with glow effect
      ctx.save();
      ctx.shadowColor = this.theme.outerGlow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(this.outerBounds[0].x, this.outerBounds[0].y);
      for(let i=1; i < this.outerBounds.length; i++) {
          ctx.lineTo(this.outerBounds[i].x, this.outerBounds[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = this.theme.outerBorder;
      ctx.stroke();
      ctx.restore();

      // Draw inner boundary with glow effect
      ctx.save();
      ctx.shadowColor = this.theme.innerGlow;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(this.innerBounds[0].x, this.innerBounds[0].y);
      for(let i=1; i < this.innerBounds.length; i++) {
          ctx.lineTo(this.innerBounds[i].x, this.innerBounds[i].y);
      }
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = this.theme.innerBorder;
      ctx.stroke();
      ctx.restore();
      
      // Draw checkered finish line at the start point
      const p1 = this.innerBounds[0];
      const p2 = this.outerBounds[0];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = this.theme.finishColor;
      ctx.setLineDash([20, 20]);
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.setLineDash([]);
  }

  getPointInfo(x, y) {
    if (!this.splinePoints || this.splinePoints.length === 0) return { isOffTrack: true, progressIndex: 0 };
    
    let minSqDist = Infinity;
    let closestIndex = 0;
    
    for (let i = 0; i < this.splinePoints.length; i++) {
      const sp = this.splinePoints[i];
      const sqDist = (sp.x - x) ** 2 + (sp.y - y) ** 2;
      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        closestIndex = i;
      }
    }
    
    const maxSqDist = (this.trackWidth / 2) ** 2;
    return {
      isOffTrack: minSqDist > maxSqDist + 25,
      progressIndex: closestIndex
    };
  }
}

// Export themes and shapes for use in track selection
export { TRACK_THEMES, TRACK_SHAPES };
