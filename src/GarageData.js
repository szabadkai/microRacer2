const STARTER_SPEC = {
  acceleration: 600,
  maxSpeed: 800,
  friction: 0.98,
  turnSpeed: 3.5,
  grip: 800,
  driftGrip: 200,
  driftThreshold: 0.4,
  recoveryThreshold: 0.2,
  maxBoost: 100,
  boostChargeRate: 15
};

export const CAR_DEFS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    role: 'Balanced All-Rounder',
    color: '#00ffcc',
    description: 'The stock chassis. Stable, predictable, and still fast enough to win.',
    unlockText: 'Unlocked by default',
    spec: STARTER_SPEC
  },
  drift: {
    id: 'drift',
    name: 'Drift',
    role: 'Slide Specialist',
    color: '#ff66cc',
    description: 'Breaks traction early and hangs onto long drifts with forgiving recovery.',
    unlockText: 'Reward for defeating Neon Knight',
    spec: {
      acceleration: 580,
      maxSpeed: 760,
      friction: 0.98,
      turnSpeed: 3.5,
      grip: 730,
      driftGrip: 270,
      driftThreshold: 0.32,
      recoveryThreshold: 0.24,
      maxBoost: 110,
      boostChargeRate: 15
    }
  },
  grip: {
    id: 'grip',
    name: 'Grip',
    role: 'Precision Runner',
    color: '#66ccff',
    description: 'A planted setup for clean lines, tight recoveries, and boss hunting.',
    unlockText: 'Reward for defeating Ice King',
    spec: {
      acceleration: 600,
      maxSpeed: 780,
      friction: 0.98,
      turnSpeed: 3.5,
      grip: 950,
      driftGrip: 260,
      driftThreshold: 0.38,
      recoveryThreshold: 0.25,
      maxBoost: 95,
      boostChargeRate: 15
    }
  },
  booster: {
    id: 'booster',
    name: 'Booster',
    role: 'High-Risk Rocket',
    color: '#ffb347',
    description: 'The fastest shell in the garage, with aggressive boost pressure and looser grip.',
    unlockText: 'Reward for defeating Inferno',
    spec: {
      acceleration: 640,
      maxSpeed: 840,
      friction: 0.98,
      turnSpeed: 3.5,
      grip: 760,
      driftGrip: 190,
      driftThreshold: 0.44,
      recoveryThreshold: 0.18,
      maxBoost: 120,
      boostChargeRate: 15
    }
  }
};

export const CAR_ORDER = ['starter', 'drift', 'grip', 'booster'];

export const UPGRADE_LANES = {
  engine: {
    id: 'engine',
    label: 'Engine',
    costs: [200, 450],
    apply(spec, currentLevel) {
      if (currentLevel >= 1) {
        spec.acceleration *= 1.05;
        spec.maxSpeed *= 1.03;
      }
      if (currentLevel >= 2) {
        spec.acceleration *= 1.05;
        spec.maxSpeed *= 1.03;
      }
    }
  },
  grip: {
    id: 'grip',
    label: 'Grip',
    costs: [200, 450],
    apply(spec, currentLevel) {
      if (currentLevel >= 1) {
        spec.grip *= 1.08;
        spec.turnSpeed *= 1.04;
      }
      if (currentLevel >= 2) {
        spec.grip *= 1.08;
        spec.turnSpeed *= 1.04;
      }
    }
  },
  nitro: {
    id: 'nitro',
    label: 'Nitro',
    costs: [250, 500],
    apply(spec, currentLevel) {
      if (currentLevel >= 1) {
        spec.maxBoost += 10;
        spec.boostChargeRate *= 1.10;
      }
      if (currentLevel >= 2) {
        spec.maxBoost += 10;
        spec.boostChargeRate *= 1.10;
      }
    }
  }
};

export function createEmptyUpgradeMap() {
  const upgrades = {};
  CAR_ORDER.forEach((carId) => {
    upgrades[carId] = { engine: 0, grip: 0, nitro: 0 };
  });
  return upgrades;
}

export function getCarDef(carId) {
  return CAR_DEFS[carId] || CAR_DEFS.starter;
}

export function buildCarSpecFromGarage(garageState, carId) {
  const carDef = getCarDef(carId);
  const spec = { ...carDef.spec };
  const upgrades = garageState?.upgrades?.[carDef.id] || { engine: 0, grip: 0, nitro: 0 };

  Object.values(UPGRADE_LANES).forEach((lane) => {
    lane.apply(spec, upgrades[lane.id] || 0);
  });

  spec.acceleration = Math.round(spec.acceleration);
  spec.maxSpeed = Math.round(spec.maxSpeed);
  spec.grip = Math.round(spec.grip);
  spec.driftGrip = Math.round(spec.driftGrip);
  spec.maxBoost = Math.round(spec.maxBoost);
  spec.boostChargeRate = parseFloat(spec.boostChargeRate.toFixed(2));

  return spec;
}
