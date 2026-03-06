const LIGHT_DIR = normalize(vec(-0.62, 0.86, -0.54));

const BOX_FACES = [
  [1, 0, 3, 2],
  [4, 5, 6, 7],
  [0, 4, 7, 3],
  [5, 1, 2, 6],
  [3, 7, 6, 2],
  [0, 1, 5, 4]
];

const SHOWROOM_PROFILES = {
  starter: {
    label: 'Starter coupe',
    accent: '#95fff0',
    glow: '#5bffda',
    shadowScale: { x: 1.2, z: 1.08 },
    build(colors) {
      return [
        hull([0, 0.18, 0.08], {
          length: 3.5,
          bottomFrontWidth: 1.74,
          bottomBackWidth: 1.68,
          topFrontWidth: 1.16,
          topBackWidth: 1.04,
          heightFront: 0.42,
          heightBack: 0.48,
          frontTopInset: 0.42,
          backTopInset: 0.18
        }, colors.body),
        hull([0, 0.38, -1.26], {
          length: 1.06,
          bottomFrontWidth: 0.96,
          bottomBackWidth: 1.2,
          topFrontWidth: 0.68,
          topBackWidth: 0.88,
          heightFront: 0.14,
          heightBack: 0.18,
          frontBottomInset: 0.08,
          frontTopInset: 0.22,
          backTopInset: 0.08
        }, colors.highlight, { edgeAlpha: 0.08 }),
        hull([0, 0.62, -0.34], {
          length: 1.78,
          bottomFrontWidth: 0.96,
          bottomBackWidth: 1.06,
          topFrontWidth: 0.72,
          topBackWidth: 0.8,
          heightFront: 0.34,
          heightBack: 0.4,
          frontTopInset: 0.24,
          backTopInset: 0.12
        }, colors.glass, { opacity: 0.98, edgeAlpha: 0.1 }),
        hull([0, 0.44, 1.24], {
          length: 1.14,
          bottomFrontWidth: 1.28,
          bottomBackWidth: 1.12,
          topFrontWidth: 0.96,
          topBackWidth: 0.78,
          heightFront: 0.16,
          heightBack: 0.12,
          backTopInset: 0.2
        }, colors.dark),
        hull([-0.78, 0.16, 0.1], {
          length: 2.44,
          bottomFrontWidth: 0.18,
          bottomBackWidth: 0.16,
          topFrontWidth: 0.12,
          topBackWidth: 0.1,
          heightFront: 0.18,
          heightBack: 0.18
        }, colors.trim, { edgeAlpha: 0.1 }),
        hull([0.78, 0.16, 0.1], {
          length: 2.44,
          bottomFrontWidth: 0.18,
          bottomBackWidth: 0.16,
          topFrontWidth: 0.12,
          topBackWidth: 0.1,
          heightFront: 0.18,
          heightBack: 0.18
        }, colors.trim, { edgeAlpha: 0.1 }),
        hull([0, 0.72, 0.18], {
          length: 2.16,
          bottomFrontWidth: 0.16,
          bottomBackWidth: 0.16,
          topFrontWidth: 0.08,
          topBackWidth: 0.08,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.highlight, { edgeAlpha: 0.06 }),
        hull([0, 0.68, 1.78], {
          length: 0.42,
          bottomFrontWidth: 1.12,
          bottomBackWidth: 1.04,
          topFrontWidth: 1.04,
          topBackWidth: 0.96,
          heightFront: 0.06,
          heightBack: 0.06
        }, colors.accent, { glow: 0.12, edgeAlpha: 0.06 }),
        buildWheelSet(1.02, 1.22, colors)
      ].flat();
    }
  },
  drift: {
    label: 'Drift missile',
    accent: '#ff9fe3',
    glow: '#ff5ecb',
    shadowScale: { x: 1.28, z: 1.16 },
    build(colors) {
      return [
        hull([0, 0.14, 0.16], {
          length: 3.92,
          bottomFrontWidth: 1.88,
          bottomBackWidth: 1.94,
          topFrontWidth: 1.22,
          topBackWidth: 1.18,
          heightFront: 0.32,
          heightBack: 0.34,
          frontTopInset: 0.52,
          backTopInset: 0.14
        }, colors.body),
        hull([0, 0.18, -1.76], {
          length: 0.88,
          bottomFrontWidth: 0.94,
          bottomBackWidth: 1.44,
          topFrontWidth: 0.42,
          topBackWidth: 0.78,
          heightFront: 0.14,
          heightBack: 0.18,
          frontBottomInset: 0.1,
          frontTopInset: 0.26
        }, colors.highlight, { edgeAlpha: 0.08 }),
        hull([0, 0.52, 0.48], {
          length: 1.4,
          bottomFrontWidth: 0.84,
          bottomBackWidth: 0.98,
          topFrontWidth: 0.62,
          topBackWidth: 0.7,
          heightFront: 0.3,
          heightBack: 0.34,
          frontTopInset: 0.24,
          backTopInset: 0.08
        }, colors.glass, { opacity: 0.98, edgeAlpha: 0.1 }),
        hull([-0.98, 0.08, 0.18], {
          length: 2.88,
          bottomFrontWidth: 0.16,
          bottomBackWidth: 0.16,
          topFrontWidth: 0.08,
          topBackWidth: 0.08,
          heightFront: 0.22,
          heightBack: 0.22
        }, colors.trim, { edgeAlpha: 0.1 }),
        hull([0.98, 0.08, 0.18], {
          length: 2.88,
          bottomFrontWidth: 0.16,
          bottomBackWidth: 0.16,
          topFrontWidth: 0.08,
          topBackWidth: 0.08,
          heightFront: 0.22,
          heightBack: 0.22
        }, colors.trim, { edgeAlpha: 0.1 }),
        hull([-0.74, 0.34, 1.24], {
          length: 1.3,
          bottomFrontWidth: 0.44,
          bottomBackWidth: 0.34,
          topFrontWidth: 0.22,
          topBackWidth: 0.16,
          heightFront: 0.22,
          heightBack: 0.16
        }, colors.dark),
        hull([0.74, 0.34, 1.24], {
          length: 1.3,
          bottomFrontWidth: 0.44,
          bottomBackWidth: 0.34,
          topFrontWidth: 0.22,
          topBackWidth: 0.16,
          heightFront: 0.22,
          heightBack: 0.16
        }, colors.dark),
        hull([0, 0.56, -0.04], {
          length: 3.0,
          bottomFrontWidth: 0.18,
          bottomBackWidth: 0.18,
          topFrontWidth: 0.1,
          topBackWidth: 0.1,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.highlight, { edgeAlpha: 0.06 }),
        hull([0, 0.7, 1.58], {
          length: 0.3,
          bottomFrontWidth: 0.08,
          bottomBackWidth: 0.08,
          topFrontWidth: 0.04,
          topBackWidth: 0.04,
          heightFront: 0.28,
          heightBack: 0.28
        }, colors.trim, { edgeAlpha: 0.06 }),
        hull([-0.56, 0.68, 1.56], {
          length: 0.26,
          bottomFrontWidth: 0.08,
          bottomBackWidth: 0.08,
          topFrontWidth: 0.04,
          topBackWidth: 0.04,
          heightFront: 0.28,
          heightBack: 0.28
        }, colors.trim, { edgeAlpha: 0.06 }),
        hull([0.56, 0.68, 1.56], {
          length: 0.26,
          bottomFrontWidth: 0.08,
          bottomBackWidth: 0.08,
          topFrontWidth: 0.04,
          topBackWidth: 0.04,
          heightFront: 0.28,
          heightBack: 0.28
        }, colors.trim, { edgeAlpha: 0.06 }),
        hull([0, 0.94, 1.84], {
          length: 0.48,
          bottomFrontWidth: 1.76,
          bottomBackWidth: 1.64,
          topFrontWidth: 1.68,
          topBackWidth: 1.56,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.accent, { glow: 0.16, edgeAlpha: 0.06 }),
        hull([0, 0.1, 2.02], {
          length: 0.44,
          bottomFrontWidth: 1.24,
          bottomBackWidth: 1.46,
          topFrontWidth: 0.94,
          topBackWidth: 1.12,
          heightFront: 0.08,
          heightBack: 0.12
        }, colors.accent, { edgeAlpha: 0.06 }),
        buildWheelSet(1.14, 1.36, colors)
      ].flat();
    }
  },
  grip: {
    label: 'Grip prototype',
    accent: '#9edbff',
    glow: '#6ac6ff',
    shadowScale: { x: 1.3, z: 1.14 },
    build(colors) {
      return [
        hull([0, 0.14, 0.08], {
          length: 3.76,
          bottomFrontWidth: 1.8,
          bottomBackWidth: 1.72,
          topFrontWidth: 1.08,
          topBackWidth: 1.14,
          heightFront: 0.34,
          heightBack: 0.36,
          frontTopInset: 0.6,
          backTopInset: 0.12
        }, colors.body),
        hull([0, 0.16, -1.88], {
          length: 0.94,
          bottomFrontWidth: 0.64,
          bottomBackWidth: 1.18,
          topFrontWidth: 0.24,
          topBackWidth: 0.5,
          heightFront: 0.16,
          heightBack: 0.18,
          frontBottomInset: 0.1,
          frontTopInset: 0.18
        }, colors.highlight, { edgeAlpha: 0.08 }),
        hull([0, 0.54, 0.02], {
          length: 1.76,
          bottomFrontWidth: 0.9,
          bottomBackWidth: 1.0,
          topFrontWidth: 0.62,
          topBackWidth: 0.68,
          heightFront: 0.38,
          heightBack: 0.34,
          frontTopInset: 0.28,
          backTopInset: 0.16
        }, colors.glass, { opacity: 0.98, edgeAlpha: 0.1 }),
        hull([-0.78, 0.18, 0.2], {
          length: 2.42,
          bottomFrontWidth: 0.42,
          bottomBackWidth: 0.44,
          topFrontWidth: 0.22,
          topBackWidth: 0.18,
          heightFront: 0.24,
          heightBack: 0.2
        }, colors.trim),
        hull([0.78, 0.18, 0.2], {
          length: 2.42,
          bottomFrontWidth: 0.42,
          bottomBackWidth: 0.44,
          topFrontWidth: 0.22,
          topBackWidth: 0.18,
          heightFront: 0.24,
          heightBack: 0.2
        }, colors.trim),
        hull([0, 0.7, 0.44], {
          length: 1.1,
          bottomFrontWidth: 0.12,
          bottomBackWidth: 0.12,
          topFrontWidth: 0.03,
          topBackWidth: 0.03,
          heightFront: 0.38,
          heightBack: 0.32
        }, colors.highlight, { edgeAlpha: 0.06 }),
        hull([-0.56, 0.28, -1.56], {
          length: 0.46,
          bottomFrontWidth: 0.22,
          bottomBackWidth: 0.3,
          topFrontWidth: 0.16,
          topBackWidth: 0.2,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.accent, { edgeAlpha: 0.06 }),
        hull([0.56, 0.28, -1.56], {
          length: 0.46,
          bottomFrontWidth: 0.22,
          bottomBackWidth: 0.3,
          topFrontWidth: 0.16,
          topBackWidth: 0.2,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.accent, { edgeAlpha: 0.06 }),
        hull([0, 0.36, 1.34], {
          length: 1.08,
          bottomFrontWidth: 1.2,
          bottomBackWidth: 1.28,
          topFrontWidth: 0.88,
          topBackWidth: 0.92,
          heightFront: 0.14,
          heightBack: 0.16
        }, colors.dark),
        hull([0, 0.36, 1.9], {
          length: 0.76,
          bottomFrontWidth: 1.34,
          bottomBackWidth: 1.56,
          topFrontWidth: 1.22,
          topBackWidth: 1.42,
          heightFront: 0.1,
          heightBack: 0.12
        }, colors.accent, { glow: 0.12, edgeAlpha: 0.06 }),
        buildWheelSet(1.12, 1.28, colors)
      ].flat();
    }
  },
  booster: {
    label: 'Booster rocket',
    accent: '#ffd593',
    glow: '#ffb347',
    shadowScale: { x: 1.14, z: 1.24 },
    build(colors, upgrades = {}) {
      const nitroGlow = 0.2 + (upgrades.nitro || 0) * 0.16;
      return [
        hull([0, 0.16, 0.02], {
          length: 4.02,
          bottomFrontWidth: 0.94,
          bottomBackWidth: 0.98,
          topFrontWidth: 0.58,
          topBackWidth: 0.64,
          heightFront: 0.34,
          heightBack: 0.36,
          frontTopInset: 0.62,
          backTopInset: 0.1
        }, colors.body),
        hull([0, 0.28, -1.88], {
          length: 1.08,
          bottomFrontWidth: 0.48,
          bottomBackWidth: 0.84,
          topFrontWidth: 0.12,
          topBackWidth: 0.36,
          heightFront: 0.14,
          heightBack: 0.18,
          frontBottomInset: 0.08,
          frontTopInset: 0.18
        }, colors.highlight, { edgeAlpha: 0.08 }),
        hull([0, 0.52, -0.42], {
          length: 1.3,
          bottomFrontWidth: 0.72,
          bottomBackWidth: 0.84,
          topFrontWidth: 0.5,
          topBackWidth: 0.58,
          heightFront: 0.34,
          heightBack: 0.3,
          frontTopInset: 0.22,
          backTopInset: 0.12
        }, colors.glass, { opacity: 0.98, edgeAlpha: 0.1 }),
        hull([-0.88, 0.14, 0.72], {
          length: 2.8,
          bottomFrontWidth: 0.46,
          bottomBackWidth: 0.54,
          topFrontWidth: 0.24,
          topBackWidth: 0.28,
          heightFront: 0.52,
          heightBack: 0.56,
          frontTopInset: 0.34,
          backTopInset: 0.12
        }, colors.dark),
        hull([0.88, 0.14, 0.72], {
          length: 2.8,
          bottomFrontWidth: 0.46,
          bottomBackWidth: 0.54,
          topFrontWidth: 0.24,
          topBackWidth: 0.28,
          heightFront: 0.52,
          heightBack: 0.56,
          frontTopInset: 0.34,
          backTopInset: 0.12
        }, colors.dark),
        hull([-0.88, 0.34, 2.08], {
          length: 0.9,
          bottomFrontWidth: 0.3,
          bottomBackWidth: 0.36,
          topFrontWidth: 0.18,
          topBackWidth: 0.24,
          heightFront: 0.28,
          heightBack: 0.32
        }, colors.glow, { glow: nitroGlow, edgeAlpha: 0.06 }),
        hull([0.88, 0.34, 2.08], {
          length: 0.9,
          bottomFrontWidth: 0.3,
          bottomBackWidth: 0.36,
          topFrontWidth: 0.18,
          topBackWidth: 0.24,
          heightFront: 0.28,
          heightBack: 0.32
        }, colors.glow, { glow: nitroGlow, edgeAlpha: 0.06 }),
        hull([0, 0.58, 0.94], {
          length: 1.62,
          bottomFrontWidth: 0.1,
          bottomBackWidth: 0.1,
          topFrontWidth: 0.03,
          topBackWidth: 0.03,
          heightFront: 0.72,
          heightBack: 0.58
        }, colors.accent, { glow: 0.08, edgeAlpha: 0.06 }),
        hull([0, 0.48, 1.82], {
          length: 0.66,
          bottomFrontWidth: 1.08,
          bottomBackWidth: 1.28,
          topFrontWidth: 0.96,
          topBackWidth: 1.16,
          heightFront: 0.08,
          heightBack: 0.08
        }, colors.accent, { glow: 0.1, edgeAlpha: 0.06 }),
        buildWheelSet(1.0, 1.34, colors)
      ].flat();
    }
  }
};

export function getGarageShowroomLabel(carId) {
  return SHOWROOM_PROFILES[carId]?.label || 'Custom chassis';
}

export function renderGaragePreviewScene(ctx, options) {
  const {
    width,
    height,
    time = 0,
    carDef,
    repairQuote = { damage: 0 },
    upgrades = {}
  } = options;

  const profile = SHOWROOM_PROFILES[carDef?.id] || SHOWROOM_PROFILES.starter;
  const colors = buildPalette(carDef?.color || '#00ffcc', profile);
  const centerX = width * 0.5;
  const floorY = height * 0.73;
  const modelCenterY = floorY - 33;
  const modelParts = profile.build(colors, upgrades);
  const transform = {
    centerX,
    centerY: modelCenterY,
    translate: { x: 0, y: 0.08 + Math.sin(time * 1.8) * 0.05, z: 11.9 },
    rotation: {
      x: -0.42 + Math.sin(time * 0.42) * 0.03,
      y: 0.7 + time * 0.58,
      z: Math.sin(time * 1.1) * 0.03
    },
    focal: Math.min(width, height) * 2.7
  };

  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, time, colors);
  drawStageFloor(ctx, width, height, time, colors, centerX, floorY);
  drawShadow(ctx, centerX, floorY, profile.shadowScale, colors, transform.translate.y);
  drawModel(ctx, modelParts, transform);

  if ((repairQuote.damage || 0) > 25) {
    drawDamageOverlays(ctx, centerX, floorY, time, repairQuote.damage, colors);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(centerX - 122, height - 46, 244, 1);
}

function buildPalette(bodyColor, profile) {
  const accent = profile.accent || mixColor(bodyColor, '#ffffff', 0.35);
  return {
    body: bodyColor,
    accent,
    trim: mixColor(bodyColor, '#ffffff', 0.2),
    highlight: mixColor(accent, '#ffffff', 0.34),
    glass: mixColor(mixColor(bodyColor, '#08131a', 0.62), '#dcf6ff', 0.18),
    dark: mixColor(bodyColor, '#071219', 0.7),
    glow: profile.glow || mixColor(bodyColor, '#ffd08f', 0.38)
  };
}

function buildWheelSet(track, wheelbase, colors) {
  return [
    wheel([-track, 0.44, -wheelbase], colors),
    wheel([track, 0.44, -wheelbase], colors),
    wheel([-track, 0.44, wheelbase], colors),
    wheel([track, 0.44, wheelbase], colors)
  ].flat();
}

function wheel(center, colors) {
  const sideBias = Math.sign(center[0]) * 0.05;
  return [
    cylinderX(center, 0.42, 0.32, 10, '#10161d', { edgeAlpha: 0.1 }),
    cylinderX([center[0] + sideBias, center[1], center[2]], 0.22, 0.14, 10, colors.trim, {
      opacity: 0.94,
      edgeAlpha: 0.05
    }),
    cylinderX([center[0] + sideBias * 1.4, center[1], center[2]], 0.12, 0.08, 10, colors.highlight, {
      opacity: 0.92,
      edgeAlpha: 0.03
    })
  ];
}

function hull(origin, spec, color, options = {}) {
  return mesh(createHullVertices(origin, spec), BOX_FACES, color, options);
}

function cylinderX(center, radius, thickness, segments, color, options = {}) {
  const [cx, cy, cz] = center;
  const halfThickness = thickness * 0.5;
  const vertices = [];
  const faces = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const y = cy + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    vertices.push(vec(cx - halfThickness, y, z));
  }

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const y = cy + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    vertices.push(vec(cx + halfThickness, y, z));
  }

  faces.push(Array.from({ length: segments }, (_, index) => index));
  faces.push(Array.from({ length: segments }, (_, index) => segments + index));

  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([i, next, segments + next, segments + i]);
  }

  return mesh(vertices, orientFacesOutward(vertices, faces, vec(cx, cy, cz)), color, options);
}

function mesh(vertices, faces, color, options = {}) {
  return {
    vertices,
    faces,
    color,
    opacity: options.opacity ?? 1,
    glow: options.glow ?? 0,
    edgeAlpha: options.edgeAlpha ?? 0.12
  };
}

function createHullVertices(origin, spec) {
  const [cx, cy, cz] = origin;
  const {
    length,
    bottomFrontWidth,
    bottomBackWidth = bottomFrontWidth,
    topFrontWidth = bottomFrontWidth * 0.8,
    topBackWidth = bottomBackWidth * 0.8,
    heightFront,
    heightBack = heightFront,
    frontBottomInset = 0,
    backBottomInset = 0,
    frontTopInset = frontBottomInset,
    backTopInset = backBottomInset
  } = spec;

  const zFront = cz - length * 0.5;
  const zBack = cz + length * 0.5;

  return [
    vec(cx - bottomFrontWidth * 0.5, cy, zFront + frontBottomInset),
    vec(cx + bottomFrontWidth * 0.5, cy, zFront + frontBottomInset),
    vec(cx + topFrontWidth * 0.5, cy + heightFront, zFront + frontTopInset),
    vec(cx - topFrontWidth * 0.5, cy + heightFront, zFront + frontTopInset),
    vec(cx - bottomBackWidth * 0.5, cy, zBack - backBottomInset),
    vec(cx + bottomBackWidth * 0.5, cy, zBack - backBottomInset),
    vec(cx + topBackWidth * 0.5, cy + heightBack, zBack - backTopInset),
    vec(cx - topBackWidth * 0.5, cy + heightBack, zBack - backTopInset)
  ];
}

function orientFacesOutward(vertices, faces, center) {
  return faces.map((face) => {
    const polygon = face.map((index) => vertices[index]);
    const normal = polygonNormal(polygon);
    const faceCenter = averagePoints(polygon);
    const outward = normalize(add(faceCenter, scaleVector(center, -1)));
    return dot(normal, outward) < 0 ? [...face].reverse() : face;
  });
}

function drawBackdrop(ctx, width, height, time, colors) {
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.32, 12, width * 0.5, height * 0.36, height * 0.7);
  glow.addColorStop(0, withAlpha(colors.body, 0.26));
  glow.addColorStop(0.42, withAlpha(colors.accent, 0.12));
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.35);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 62, -108);
    ctx.lineTo(i * 18, 106);
    ctx.strokeStyle = `rgba(0, 255, 204, ${0.05 + (i + 1) * 0.018})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(width * 0.5, height * 0.28);
  ctx.rotate(time * 0.14);
  ctx.strokeStyle = withAlpha(colors.accent, 0.2);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.26, height * 0.09, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStageFloor(ctx, width, height, time, colors, centerX, floorY) {
  const floorGlow = ctx.createRadialGradient(centerX, floorY, 8, centerX, floorY, 156);
  floorGlow.addColorStop(0, withAlpha(colors.body, 0.24));
  floorGlow.addColorStop(0.45, withAlpha(colors.accent, 0.1));
  floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(centerX, floorY, 150, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  const centerGlow = ctx.createRadialGradient(centerX, floorY + 6, 6, centerX, floorY + 6, 82);
  centerGlow.addColorStop(0, withAlpha(colors.highlight, 0.08));
  centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.ellipse(centerX, floorY + 6, 88, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(centerX, floorY);
  ctx.rotate(time * 0.22);
  ctx.strokeStyle = withAlpha(colors.body, 0.32);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 138, 42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(-time * 0.46);
  ctx.strokeStyle = withAlpha(colors.accent, 0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, 168, 56, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = floorY - 14 + i * 11;
    ctx.beginPath();
    ctx.moveTo(centerX - 152, y);
    ctx.lineTo(centerX + 152, y);
    ctx.stroke();
  }
}

function drawShadow(ctx, centerX, floorY, shadowScale, colors, bobY) {
  const width = 84 * shadowScale.x;
  const height = 26 * shadowScale.z;
  const bobOffset = bobY * 14;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(centerX, floorY + 6 + bobOffset, width, height, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = withAlpha(colors.body, 0.16);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(centerX, floorY + 6 + bobOffset, width * 0.88, height * 0.82, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawModel(ctx, parts, transform) {
  const screenScaleX = Math.max(1, Math.abs(ctx.getTransform().a) || 1);
  const screenScaleY = Math.max(1, Math.abs(ctx.getTransform().d) || 1);
  const rasterWidth = Math.max(1, ctx.canvas.width);
  const rasterHeight = Math.max(1, ctx.canvas.height);
  const imageData = ctx.getImageData(0, 0, rasterWidth, rasterHeight);
  const colorBuffer = imageData.data;
  const depthBuffer = getDepthBuffer(rasterWidth, rasterHeight);
  const opaqueTriangles = [];
  const translucentTriangles = [];

  parts.forEach((part) => {
    const transformed = getPartVertices(part).map((vertex) => transformPoint(vertex, transform));
    const partFaces = part.faces || BOX_FACES;

    partFaces.forEach((indices) => {
      const polygon = indices.map((index) => transformed[index]);
      if (polygon.some((point) => point.z <= 0.1)) return;

      const normal = polygonNormal(polygon);
      const faceCenter = averagePoints(polygon);
      if (dot(normal, faceCenter) >= 0) return;

      const diffuse = Math.max(0, dot(normal, LIGHT_DIR));
      const viewDir = normalize(scaleVector(faceCenter, -1));
      const halfVector = normalize(add(LIGHT_DIR, viewDir));
      const specular = Math.pow(Math.max(0, dot(normal, halfVector)), 14) * 0.18;
      const lighting = 0.26 + diffuse * 0.68 + specular + part.glow * 0.16;
      const faceColor = parseColor(shadeColor(part.color, lighting));
      const alpha = clamp(part.opacity ?? 1, 0, 1);
      const projected = polygon.map((point) => {
        const screen = projectPoint(point, transform);
        return {
          x: screen.x * screenScaleX,
          y: screen.y * screenScaleY,
          invZ: 1 / point.z
        };
      });

      for (let i = 1; i < projected.length - 1; i++) {
        const triangle = {
          vertices: [projected[0], projected[i], projected[i + 1]],
          color: faceColor,
          alpha,
          depth: averageScalars([
            polygon[0].z,
            polygon[i].z,
            polygon[i + 1].z
          ])
        };

        if (alpha >= 0.999) {
          opaqueTriangles.push(triangle);
        } else {
          translucentTriangles.push(triangle);
        }
      }
    });
  });

  opaqueTriangles.forEach((triangle) => rasterizeTriangle(triangle, colorBuffer, depthBuffer, rasterWidth, rasterHeight, true));
  translucentTriangles.sort((left, right) => right.depth - left.depth);
  translucentTriangles.forEach((triangle) => rasterizeTriangle(triangle, colorBuffer, depthBuffer, rasterWidth, rasterHeight, false));

  ctx.putImageData(imageData, 0, 0);
}

function drawDamageOverlays(ctx, centerX, floorY, time, damage, colors) {
  const sparkCount = damage > 75 ? 5 : (damage > 45 ? 3 : 2);
  for (let i = 0; i < sparkCount; i++) {
    const sparkT = time * (2.1 + i * 0.28);
    const sx = centerX - 26 + Math.sin(sparkT + i * 0.4) * 22;
    const sy = floorY - 30 + Math.cos(sparkT * 1.3 + i) * 8;
    const len = 8 + ((i + 1) % 3) * 4;
    ctx.strokeStyle = damage > 75 ? 'rgba(255, 90, 40, 0.82)' : withAlpha(colors.glow, 0.78);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + len, sy - len * 0.38);
    ctx.stroke();
  }

  if (damage > 55) {
    const smoke = ctx.createRadialGradient(centerX + 38, floorY - 60, 4, centerX + 38, floorY - 60, 36);
    smoke.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    smoke.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = smoke;
    ctx.beginPath();
    ctx.ellipse(centerX + 38, floorY - 62 - Math.sin(time * 1.2) * 4, 30, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getPartVertices(part) {
  return part.vertices || [];
}

function rasterizeTriangle(triangle, colorBuffer, depthBuffer, width, height, writeDepth) {
  const [v0, v1, v2] = triangle.vertices;
  const minX = Math.max(0, Math.floor(Math.min(v0.x, v1.x, v2.x)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(v0.x, v1.x, v2.x)));
  const minY = Math.max(0, Math.floor(Math.min(v0.y, v1.y, v2.y)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(v0.y, v1.y, v2.y)));
  const area = edgeFunction(v0, v1, v2.x, v2.y);

  if (Math.abs(area) < 1e-5) return;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let w0 = edgeFunction(v1, v2, px, py);
      let w1 = edgeFunction(v2, v0, px, py);
      let w2 = edgeFunction(v0, v1, px, py);

      if ((area > 0 && (w0 < 0 || w1 < 0 || w2 < 0)) || (area < 0 && (w0 > 0 || w1 > 0 || w2 > 0))) {
        continue;
      }

      w0 /= area;
      w1 /= area;
      w2 /= area;

      const invZ = v0.invZ * w0 + v1.invZ * w1 + v2.invZ * w2;
      const index = y * width + x;

      if (invZ <= depthBuffer[index] + 1e-6) continue;

      const bufferIndex = index * 4;
      blendPixel(colorBuffer, bufferIndex, triangle.color, triangle.alpha);
      if (writeDepth) {
        depthBuffer[index] = invZ;
      }
    }
  }
}

function blendPixel(buffer, index, color, alpha) {
  const srcAlpha = clamp(alpha, 0, 1);
  const dstAlpha = (buffer[index + 3] ?? 255) / 255;
  const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

  if (outAlpha <= 0) return;

  buffer[index] = Math.round((color.r * srcAlpha) + (buffer[index] * (1 - srcAlpha)));
  buffer[index + 1] = Math.round((color.g * srcAlpha) + (buffer[index + 1] * (1 - srcAlpha)));
  buffer[index + 2] = Math.round((color.b * srcAlpha) + (buffer[index + 2] * (1 - srcAlpha)));
  buffer[index + 3] = Math.round(outAlpha * 255);
}

function edgeFunction(start, end, x, y) {
  return (x - start.x) * (end.y - start.y) - (y - start.y) * (end.x - start.x);
}

function getDepthBuffer(width, height) {
  if (!drawModel.depthBuffer || drawModel.depthBuffer.length !== width * height) {
    drawModel.depthBuffer = new Float32Array(width * height);
  }
  drawModel.depthBuffer.fill(-Infinity);
  return drawModel.depthBuffer;
}

function transformPoint(point, transform) {
  let rotated = rotateY(point, transform.rotation.y);
  rotated = rotateX(rotated, transform.rotation.x);
  rotated = rotateZ(rotated, transform.rotation.z);
  return vec(
    rotated.x + transform.translate.x,
    rotated.y + transform.translate.y,
    rotated.z + transform.translate.z
  );
}

function projectPoint(point, transform) {
  const scale = transform.focal / Math.max(0.1, point.z);
  return {
    x: transform.centerX + point.x * scale,
    y: transform.centerY - point.y * scale
  };
}

function rotateX(point, angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return vec(
    point.x,
    point.y * cos - point.z * sin,
    point.y * sin + point.z * cos
  );
}

function rotateY(point, angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return vec(
    point.x * cos + point.z * sin,
    point.y,
    -point.x * sin + point.z * cos
  );
}

function rotateZ(point, angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return vec(
    point.x * cos - point.y * sin,
    point.x * sin + point.y * cos,
    point.z
  );
}

function polygonNormal(points) {
  const normal = points.reduce((accumulator, current, index) => {
    const next = points[(index + 1) % points.length];
    return vec(
      accumulator.x + (current.y - next.y) * (current.z + next.z),
      accumulator.y + (current.z - next.z) * (current.x + next.x),
      accumulator.z + (current.x - next.x) * (current.y + next.y)
    );
  }, vec(0, 0, 0));

  return normalize(normal);
}

function averagePoints(points) {
  const total = points.reduce((accumulator, point) => add(accumulator, point), vec(0, 0, 0));
  return scaleVector(total, 1 / points.length);
}

function averageScalars(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shadeColor(color, amount) {
  const rgb = parseColor(color);
  const factor = clamp(amount, 0, 1.35);
  return `rgb(${Math.round(clamp(rgb.r * factor, 0, 255))}, ${Math.round(clamp(rgb.g * factor, 0, 255))}, ${Math.round(clamp(rgb.b * factor, 0, 255))})`;
}

function mixColor(colorA, colorB, ratio) {
  const left = parseColor(colorA);
  const right = parseColor(colorB);
  const amount = clamp(ratio, 0, 1);
  return `rgb(${Math.round(left.r + (right.r - left.r) * amount)}, ${Math.round(left.g + (right.g - left.g) * amount)}, ${Math.round(left.b + (right.b - left.b) * amount)})`;
}

function withAlpha(color, alpha) {
  const rgb = parseColor(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

function parseColor(color) {
  if (color.startsWith('rgb')) {
    const channels = color.match(/\d+(\.\d+)?/g)?.map(Number) || [255, 255, 255];
    return {
      r: channels[0] ?? 255,
      g: channels[1] ?? 255,
      b: channels[2] ?? 255
    };
  }

  const hex = color.replace('#', '');
  const normalized = hex.length === 3
    ? hex.split('').map((channel) => `${channel}${channel}`).join('')
    : hex;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function vec(x, y, z) {
  return { x, y, z };
}

function add(left, right) {
  return vec(left.x + right.x, left.y + right.y, left.z + right.z);
}

function scaleVector(vector, scalar) {
  return vec(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}

function dot(left, right) {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return vec(vector.x / length, vector.y / length, vector.z / length);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
