import {
  CAR_DEFS,
  CAR_ORDER,
  UPGRADE_LANES,
  buildCarSpecFromGarage,
  createEmptyUpgradeMap
} from './GarageData.js';
import {
  createEmptyMasteryRecord,
  evaluateLevelGoals,
  getLevelGoalSet,
  getMasteryCount,
  getNextTier,
  getTierPayout,
  getVisibleGoalText,
  normalizeMasteryRecord,
  TIER_DISPLAY_NAMES,
  TIER_ORDER
} from './CampaignGoals.js';

export const SAVE_KEY = 'microRacer2_save_v1';
export const SAVE_VERSION = 1;

const LEGACY_KEYS = {
  playerName: 'playerName',
  musicVolume: 'musicVolume',
  sfxVolume: 'sfxVolume',
  ghostsEnabled: 'ghostsEnabled',
  tutorials: 'microRacer2_tutorials',
  unlockedCampaignLevel: 'unlockedCampaignLevel'
};

const BOSS_REWARDS = {
  c6: { unlockCarId: 'drift', text: 'Drift chassis unlocked' },
  c12: { unlockCarId: 'grip', text: 'Grip chassis unlocked' },
  c18: { unlockLevel2: true, text: 'Level 2 upgrades unlocked' },
  c24: { unlockCarId: 'booster', text: 'Booster chassis unlocked' },
  c30: { credits: 800, completeCampaign: true, text: 'Campaign complete' }
};

export function createDefaultSave(trackIds = [], campaignLevels = []) {
  const save = {
    version: SAVE_VERSION,
    profile: {
      playerName: ''
    },
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.4,
      ghostsEnabled: true,
      seenTutorials: {}
    },
    campaign: {
      unlockedLevelIndex: 0,
      clearedLevelIds: [],
      clearedSections: [],
      campaignComplete: false,
      levelMastery: createEmptyLevelMasteryMap(campaignLevels)
    },
    garage: {
      credits: 0,
      selectedCarId: 'starter',
      unlockedCarIds: ['starter'],
      upgrades: createEmptyUpgradeMap(),
      level2Unlocked: false,
      condition: createEmptyConditionMap()
    },
    records: {
      leaderboards: {}
    },
    ghosts: {}
  };

  ensureTrackContainers(save, trackIds);
  return save;
}

export function loadSave(trackIds = [], campaignLevels = []) {
  let raw = null;

  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (error) {
    console.warn('Failed to read save data:', error);
  }

  let save = raw ? safelyParseSave(raw) : null;
  if (!save) {
    save = migrateLegacy(trackIds, campaignLevels);
    saveSave(save);
    return save;
  }

  const normalized = normalizeSave(save, trackIds, campaignLevels);
  if (JSON.stringify(normalized) !== JSON.stringify(save)) {
    saveSave(normalized);
  }
  return normalized;
}

export function saveSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (error) {
    console.warn('Failed to save progression data:', error);
  }
}

export function migrateLegacy(trackIds = [], campaignLevels = []) {
  const save = createDefaultSave(trackIds, campaignLevels);

  try {
    const savedName = localStorage.getItem(LEGACY_KEYS.playerName);
    if (savedName) save.profile.playerName = savedName;

    const musicVolume = parseFloat(localStorage.getItem(LEGACY_KEYS.musicVolume) ?? '');
    if (!Number.isNaN(musicVolume)) save.settings.musicVolume = musicVolume;

    const sfxVolume = parseFloat(localStorage.getItem(LEGACY_KEYS.sfxVolume) ?? '');
    if (!Number.isNaN(sfxVolume)) save.settings.sfxVolume = sfxVolume;

    const ghostsEnabled = localStorage.getItem(LEGACY_KEYS.ghostsEnabled);
    if (ghostsEnabled !== null) save.settings.ghostsEnabled = ghostsEnabled !== 'false';

    const tutorials = localStorage.getItem(LEGACY_KEYS.tutorials);
    if (tutorials) {
      try {
        save.settings.seenTutorials = JSON.parse(tutorials) || {};
      } catch (error) {
        console.warn('Failed to parse legacy tutorials:', error);
      }
    }

    const unlockedLevelIndex = parseInt(localStorage.getItem(LEGACY_KEYS.unlockedCampaignLevel) || '0', 10);
    if (!Number.isNaN(unlockedLevelIndex) && unlockedLevelIndex >= 0) {
      save.campaign.unlockedLevelIndex = unlockedLevelIndex;

      for (let i = 0; i < Math.min(unlockedLevelIndex, campaignLevels.length); i++) {
        const levelId = campaignLevels[i].id;
        save.campaign.clearedLevelIds.push(levelId);
        save.campaign.levelMastery[levelId].tier1 = true;
      }

      const sectionCount = Math.ceil(campaignLevels.length / 6);
      for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
        const sectionStart = sectionIndex * 6;
        const sectionLevels = campaignLevels.slice(sectionStart, sectionStart + 6);
        if (sectionLevels.length > 0 && sectionLevels.every((level) => save.campaign.clearedLevelIds.includes(level.id))) {
          save.campaign.clearedSections.push(sectionIndex);
        }
      }
    }

    trackIds.forEach((trackId) => {
      const key = `leaderboard_${trackId}`;
      const rawLeaderboard = localStorage.getItem(key);
      if (!rawLeaderboard) return;

      try {
        const parsed = JSON.parse(rawLeaderboard);
        save.records.leaderboards[trackId] = Array.isArray(parsed)
          ? parsed.map((record) => ({
              time: record.time,
              score: record.score || 0,
              playerName: record.playerName || save.profile.playerName || 'Player',
              carId: record.carId || 'starter',
              date: record.date || Date.now()
            }))
          : [];
      } catch (error) {
        console.warn(`Failed to parse legacy leaderboard for ${trackId}:`, error);
      }
    });
  } catch (error) {
    console.warn('Failed to migrate legacy save data:', error);
  }

  return normalizeSave(save, trackIds, campaignLevels);
}

export function normalizeSave(save, trackIds = [], campaignLevels = []) {
  const normalized = createDefaultSave(trackIds, campaignLevels);

  normalized.version = SAVE_VERSION;
  normalized.profile.playerName = typeof save?.profile?.playerName === 'string' ? save.profile.playerName : normalized.profile.playerName;
  normalized.settings.musicVolume = getNumber(save?.settings?.musicVolume, normalized.settings.musicVolume);
  normalized.settings.sfxVolume = getNumber(save?.settings?.sfxVolume, normalized.settings.sfxVolume);
  normalized.settings.ghostsEnabled = typeof save?.settings?.ghostsEnabled === 'boolean' ? save.settings.ghostsEnabled : normalized.settings.ghostsEnabled;
  normalized.settings.seenTutorials = isPlainObject(save?.settings?.seenTutorials) ? save.settings.seenTutorials : {};

  normalized.campaign.unlockedLevelIndex = Math.max(0, parseInt(save?.campaign?.unlockedLevelIndex ?? normalized.campaign.unlockedLevelIndex, 10) || 0);
  normalized.campaign.clearedLevelIds = Array.isArray(save?.campaign?.clearedLevelIds) ? [...new Set(save.campaign.clearedLevelIds)] : [];
  normalized.campaign.clearedSections = Array.isArray(save?.campaign?.clearedSections) ? [...new Set(save.campaign.clearedSections)] : [];
  normalized.campaign.campaignComplete = Boolean(save?.campaign?.campaignComplete);
  normalized.campaign.levelMastery = createEmptyLevelMasteryMap(campaignLevels);

  campaignLevels.forEach((level, index) => {
    const source = normalizeMasteryRecord(save?.campaign?.levelMastery?.[level.id]);
    if (index < normalized.campaign.unlockedLevelIndex || normalized.campaign.clearedLevelIds.includes(level.id)) {
      source.tier1 = true;
    }
    if (source.tier1 && !normalized.campaign.clearedLevelIds.includes(level.id)) {
      normalized.campaign.clearedLevelIds.push(level.id);
    }
    if (source.tier1 && source.tier2 && source.tier3) {
      source.hiddenRevealed = true;
    }
    normalized.campaign.levelMastery[level.id] = source;
  });

  normalized.garage.credits = Math.max(0, parseInt(save?.garage?.credits ?? normalized.garage.credits, 10) || 0);
  normalized.garage.selectedCarId = save?.garage?.selectedCarId && CAR_DEFS[save.garage.selectedCarId]
    ? save.garage.selectedCarId
    : 'starter';
  normalized.garage.unlockedCarIds = Array.isArray(save?.garage?.unlockedCarIds)
    ? [...new Set(save.garage.unlockedCarIds.filter((carId) => Boolean(CAR_DEFS[carId])))]
    : ['starter'];
  if (!normalized.garage.unlockedCarIds.includes('starter')) {
    normalized.garage.unlockedCarIds.unshift('starter');
  }

  normalized.garage.level2Unlocked = Boolean(save?.garage?.level2Unlocked);
  normalized.garage.upgrades = createEmptyUpgradeMap();
  normalized.garage.condition = createEmptyConditionMap();

  CAR_ORDER.forEach((carId) => {
    const source = save?.garage?.upgrades?.[carId] || {};
    normalized.garage.upgrades[carId] = {
      engine: clampUpgradeLevel(source.engine),
      grip: clampUpgradeLevel(source.grip),
      nitro: clampUpgradeLevel(source.nitro)
    };

    const damage = parseInt(save?.garage?.condition?.[carId]?.damage ?? 0, 10) || 0;
    normalized.garage.condition[carId] = {
      damage: Math.max(0, Math.min(100, damage))
    };
  });

  normalized.records.leaderboards = {};
  trackIds.forEach((trackId) => {
    const source = Array.isArray(save?.records?.leaderboards?.[trackId]) ? save.records.leaderboards[trackId] : [];
    normalized.records.leaderboards[trackId] = source
      .map((record) => normalizeLeaderboardRecord(record, normalized.profile.playerName))
      .filter(Boolean)
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
  });

  normalized.ghosts = {};
  trackIds.forEach((trackId) => {
    normalized.ghosts[trackId] = {};
    const source = isPlainObject(save?.ghosts?.[trackId]) ? save.ghosts[trackId] : {};
    Object.entries(source).forEach(([carId, ghost]) => {
      if (!CAR_DEFS[carId] || !isPlainObject(ghost) || !Array.isArray(ghost.frames)) return;
      normalized.ghosts[trackId][carId] = {
        bestLapTime: getNumber(ghost.bestLapTime, Infinity),
        frames: ghost.frames
          .map((frame) => normalizeGhostFrame(frame))
          .filter(Boolean)
      };
    });
  });

  const sectionCount = Math.ceil(campaignLevels.length / 6);
  for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex++) {
    const sectionLevels = campaignLevels.slice(sectionIndex * 6, sectionIndex * 6 + 6);
    if (sectionLevels.length > 0 && sectionLevels.every((level) => normalized.campaign.levelMastery[level.id]?.tier1)) {
      if (!normalized.campaign.clearedSections.includes(sectionIndex)) {
        normalized.campaign.clearedSections.push(sectionIndex);
      }
    }
  }

  if (!normalized.garage.unlockedCarIds.includes(normalized.garage.selectedCarId)) {
    normalized.garage.selectedCarId = 'starter';
  }

  ensureTrackContainers(normalized, trackIds);

  return normalized;
}

export function purchaseUpgrade(save, carId, laneId) {
  if (!CAR_DEFS[carId]) {
    return { ok: false, reason: 'Unknown car.' };
  }
  if (!save.garage.unlockedCarIds.includes(carId)) {
    return { ok: false, reason: 'Car locked.' };
  }

  const lane = UPGRADE_LANES[laneId];
  if (!lane) {
    return { ok: false, reason: 'Unknown upgrade.' };
  }

  const currentLevel = save.garage.upgrades[carId][laneId] || 0;
  if (currentLevel >= 2) {
    return { ok: false, reason: 'Upgrade maxed.' };
  }
  if (currentLevel === 1 && !save.garage.level2Unlocked) {
    return { ok: false, reason: 'Defeat Cyber Phantom to unlock level 2 upgrades.' };
  }

  const cost = lane.costs[currentLevel];
  if (save.garage.credits < cost) {
    return { ok: false, reason: 'Not enough credits.' };
  }

  save.garage.credits -= cost;
  save.garage.upgrades[carId][laneId] = currentLevel + 1;
  return { ok: true, cost, newLevel: currentLevel + 1 };
}

export function applyCampaignRaceResult(save, levelId, summary, campaignLevels) {
  const levelIndex = campaignLevels.findIndex((level) => level.id === levelId);
  if (levelIndex === -1) {
    return emptyRewardResult();
  }

  const level = campaignLevels[levelIndex];
  const mastery = getLevelMastery(save, levelId);
  const { goals, achievedTierIds } = evaluateLevelGoals(level, summary);

  mastery.bestTime = typeof summary.totalTime === 'number' && summary.finished
    ? (mastery.bestTime === null ? summary.totalTime : Math.min(mastery.bestTime, summary.totalTime))
    : mastery.bestTime;
  mastery.bestDrift = Math.max(mastery.bestDrift || 0, summary.driftScore || 0);
  mastery.bestDraft = Math.max(mastery.bestDraft || 0, summary.draftTime || 0);
  mastery.bestBank = Math.max(mastery.bestBank || 0, summary.bestBank || 0);
  mastery.maxCombo = Math.max(mastery.maxCombo || 1, summary.maxCombo || 1);

  const reward = emptyRewardResult();
  reward.tier1Satisfied = achievedTierIds.includes('tier1');
  reward.nextObjective = getVisibleGoalText(level, mastery);

  TIER_ORDER.forEach((tierId) => {
    if (achievedTierIds.includes(tierId) && !mastery[tierId]) {
      mastery[tierId] = true;
      reward.newlyCompletedTiers.push(tierId);
      reward.masteryEarned.push(TIER_DISPLAY_NAMES[tierId]);
      reward.grossCredits += getTierPayout(level, tierId);
    }
  });

  if (mastery.tier1 && mastery.tier2 && mastery.tier3) {
    mastery.hiddenRevealed = true;
  }
  if (mastery.hidden) {
    mastery.hiddenRevealed = true;
  }

  const tier1WasAlreadyCleared = save.campaign.clearedLevelIds.includes(levelId);
  const tier1JustEarned = mastery.tier1 && !tier1WasAlreadyCleared;

  if (tier1JustEarned) {
    save.campaign.clearedLevelIds.push(levelId);
    save.campaign.unlockedLevelIndex = Math.max(save.campaign.unlockedLevelIndex, levelIndex + 1);

    const bossReward = BOSS_REWARDS[levelId];
    if (bossReward) {
      if (bossReward.unlockCarId && !save.garage.unlockedCarIds.includes(bossReward.unlockCarId)) {
        save.garage.unlockedCarIds.push(bossReward.unlockCarId);
        reward.newUnlocks.push(bossReward.text);
      }
      if (bossReward.unlockLevel2 && !save.garage.level2Unlocked) {
        save.garage.level2Unlocked = true;
        reward.newUnlocks.push(bossReward.text);
      }
      if (bossReward.credits) {
        reward.grossCredits += bossReward.credits;
        reward.finalBonus += bossReward.credits;
      }
      if (bossReward.completeCampaign) {
        save.campaign.campaignComplete = true;
        reward.newUnlocks.push(bossReward.text);
      }
    }

    const sectionIndex = Math.floor(levelIndex / 6);
    const sectionLevels = campaignLevels.slice(sectionIndex * 6, sectionIndex * 6 + 6);
    const sectionCleared = sectionLevels.every((sectionLevel) => getLevelMastery(save, sectionLevel.id).tier1);
    if (sectionCleared && !save.campaign.clearedSections.includes(sectionIndex)) {
      save.campaign.clearedSections.push(sectionIndex);
      reward.sectionBonus = getSectionBonus(sectionIndex);
      reward.grossCredits += reward.sectionBonus;
      reward.newUnlocks.push(`Section ${sectionIndex + 1} bonus claimed`);
    }
  }

  reward.penaltyCredits = Math.min(reward.grossCredits, Math.max(0, Math.round(summary.contactPenalty || 0)));
  reward.creditsEarned = Math.max(0, reward.grossCredits - reward.penaltyCredits);
  save.garage.credits += reward.creditsEarned;

  reward.damageAdded = applyCarDamage(save, summary.carId, summary.damageTaken || 0);
  reward.repairEstimate = getRepairQuote(save, summary.carId).fullCost;
  reward.totalDamage = getRepairQuote(save, summary.carId).damage;

  const nextTier = getNextTier(level, mastery, true);
  reward.nextObjective = nextTier ? nextTier.label : 'All goals cleared';

  return reward;
}

export function buildCarSpec(save, carId) {
  const spec = buildCarSpecFromGarage(save.garage, carId);
  return applyDamageToSpec(spec, getCarDamage(save, carId));
}

export function getSelectedCarDef(save) {
  return CAR_DEFS[save?.garage?.selectedCarId] || CAR_DEFS.starter;
}

export function setSelectedCar(save, carId) {
  if (!save.garage.unlockedCarIds.includes(carId)) return false;
  save.garage.selectedCarId = carId;
  return true;
}

export function getLevelMastery(save, levelId) {
  if (!save.campaign.levelMastery[levelId]) {
    save.campaign.levelMastery[levelId] = createEmptyMasteryRecord();
  }
  return save.campaign.levelMastery[levelId];
}

export function getLevelCardData(save, level) {
  const mastery = getLevelMastery(save, level.id);
  const goals = getLevelGoalSet(level);
  const nextTier = getNextTier(level, mastery, true);
  return {
    mastery,
    goals,
    masteryCount: getMasteryCount(mastery),
    nextObjective: nextTier ? nextTier.label : 'All goals cleared',
    nextPayout: nextTier ? nextTier.payout : 0
  };
}

export function getActiveCampaignGoalText(save, level) {
  return getVisibleGoalText(level, getLevelMastery(save, level.id));
}

export function getLeaderboardRecords(save, trackId) {
  return [...(save.records.leaderboards[trackId] || [])].sort((a, b) => a.time - b.time).slice(0, 10);
}

export function saveLeaderboardRecord(save, trackId, time, score, playerName, carId) {
  ensureTrackContainers(save, [trackId]);
  const normalizedRecord = normalizeLeaderboardRecord({
    time,
    score,
    playerName,
    carId,
    date: Date.now()
  }, playerName);
  if (!normalizedRecord) return;

  const records = save.records.leaderboards[trackId].filter((record) => (
    !(record.playerName === normalizedRecord.playerName && record.carId === normalizedRecord.carId)
  ));

  records.push(normalizedRecord);
  save.records.leaderboards[trackId] = records
    .filter(Boolean)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);
}

export function clearLeaderboard(save, trackId) {
  ensureTrackContainers(save, [trackId]);
  save.records.leaderboards[trackId] = [];
}

export function getSavedGhost(save, trackId, carId) {
  const ghost = save?.ghosts?.[trackId]?.[carId];
  if (!ghost || !Array.isArray(ghost.frames) || ghost.frames.length === 0) {
    return null;
  }
  return ghost;
}

export function saveGhost(save, trackId, carId, bestLapTime, frames) {
  if (!Array.isArray(frames) || frames.length === 0) return false;
  ensureTrackContainers(save, [trackId]);

  const current = save.ghosts[trackId][carId];
  if (current && Number.isFinite(current.bestLapTime) && current.bestLapTime <= bestLapTime) {
    return false;
  }

  save.ghosts[trackId][carId] = {
    bestLapTime,
    frames: frames.map((frame) => ({
      x: frame.x,
      y: frame.y,
      heading: frame.heading,
      isDrifting: Boolean(frame.isDrifting),
      isBoosting: Boolean(frame.isBoosting),
      dt: frame.dt
    }))
  };
  return true;
}

export function getSectionProgress(save, campaignLevels, sectionIndex) {
  const start = sectionIndex * 6;
  const sectionLevels = campaignLevels.slice(start, start + 6);
  const clearedCount = sectionLevels.filter((level) => getLevelMastery(save, level.id).tier1).length;
  const bossLevel = sectionLevels[sectionLevels.length - 1];
  const bossRewardText = bossLevel ? getBossRewardPreview(bossLevel.id) : null;
  const masteryEarned = sectionLevels.reduce((total, level) => total + getMasteryCount(getLevelMastery(save, level.id)), 0);
  const masteryTotal = sectionLevels.length * TIER_ORDER.length;

  return {
    clearedCount,
    total: sectionLevels.length,
    masteryEarned,
    masteryTotal,
    sectionBonusClaimed: save.campaign.clearedSections.includes(sectionIndex),
    sectionBonusValue: getSectionBonus(sectionIndex),
    bossRewardText,
    bossCleared: bossLevel ? getLevelMastery(save, bossLevel.id).tier1 : false
  };
}

export function getLevelRewardPreview(save, level) {
  const card = getLevelCardData(save, level);
  if (card.nextPayout > 0) {
    return `Next payout: ${card.nextPayout} CR`;
  }
  return 'All mastery payouts claimed';
}

export function getBossRewardPreview(levelId) {
  return BOSS_REWARDS[levelId]?.text || null;
}

export function getRepairQuote(save, carId) {
  const damage = getCarDamage(save, carId);
  const fullCost = damage <= 0 ? 0 : Math.max(20, Math.round(damage * 4));
  const patchCost = damage <= 0 ? 0 : Math.max(10, Math.round(damage * 2.25));
  const patchDamage = damage <= 0 ? 0 : Math.max(0, Math.ceil(damage * 0.55));

  return {
    damage,
    condition: Math.max(0, 100 - damage),
    fullCost,
    patchCost,
    patchDamage,
    status: getConditionStatus(damage)
  };
}

export function repairCar(save, carId, mode = 'full') {
  const quote = getRepairQuote(save, carId);
  if (quote.damage <= 0) {
    return { ok: false, reason: 'Car is already race-ready.' };
  }

  const cost = mode === 'patch' ? quote.patchCost : quote.fullCost;
  if (save.garage.credits < cost) {
    return { ok: false, reason: 'Not enough credits.' };
  }

  save.garage.credits -= cost;
  save.garage.condition[carId].damage = mode === 'patch' ? quote.patchDamage : 0;

  return {
    ok: true,
    cost,
    remainingDamage: save.garage.condition[carId].damage,
    mode
  };
}

function createEmptyConditionMap() {
  const condition = {};
  CAR_ORDER.forEach((carId) => {
    condition[carId] = { damage: 0 };
  });
  return condition;
}

function createEmptyLevelMasteryMap(campaignLevels) {
  const levelMastery = {};
  campaignLevels.forEach((level) => {
    levelMastery[level.id] = createEmptyMasteryRecord();
  });
  return levelMastery;
}

function getSectionBonus(sectionIndex) {
  return sectionIndex === 4 ? 300 : 150;
}

function applyCarDamage(save, carId, damageAdded) {
  if (!CAR_DEFS[carId]) return 0;
  if (!save.garage.condition[carId]) {
    save.garage.condition[carId] = { damage: 0 };
  }
  const applied = Math.max(0, Math.round(damageAdded || 0));
  save.garage.condition[carId].damage = Math.max(0, Math.min(100, save.garage.condition[carId].damage + applied));
  return applied;
}

function getCarDamage(save, carId) {
  return Math.max(0, Math.min(100, save?.garage?.condition?.[carId]?.damage || 0));
}

function applyDamageToSpec(spec, damage) {
  const nextSpec = { ...spec };
  let accelPenalty = 1;
  let speedPenalty = 1;
  let gripPenalty = 1;

  if (damage >= 75) {
    accelPenalty = 0.92;
    speedPenalty = 0.92;
    gripPenalty = 0.96;
  } else if (damage >= 50) {
    accelPenalty = 0.95;
    speedPenalty = 0.95;
    gripPenalty = 0.98;
  } else if (damage >= 25) {
    accelPenalty = 0.98;
    speedPenalty = 0.98;
  }

  nextSpec.acceleration = Math.round(nextSpec.acceleration * accelPenalty);
  nextSpec.maxSpeed = Math.round(nextSpec.maxSpeed * speedPenalty);
  nextSpec.grip = Math.round(nextSpec.grip * gripPenalty);
  nextSpec.condition = Math.max(0, 100 - damage);
  return nextSpec;
}

function getConditionStatus(damage) {
  if (damage >= 75) return 'Critical';
  if (damage >= 50) return 'Shaken';
  if (damage >= 25) return 'Worn';
  return 'Race-ready';
}

function ensureTrackContainers(save, trackIds) {
  if (!save.records) save.records = { leaderboards: {} };
  if (!save.records.leaderboards) save.records.leaderboards = {};
  if (!save.ghosts) save.ghosts = {};

  trackIds.forEach((trackId) => {
    if (!Array.isArray(save.records.leaderboards[trackId])) {
      save.records.leaderboards[trackId] = [];
    }
    if (!isPlainObject(save.ghosts[trackId])) {
      save.ghosts[trackId] = {};
    }
  });
}

function normalizeLeaderboardRecord(record, fallbackName) {
  if (!record || typeof record.time !== 'number') return null;
  return {
    time: record.time,
    score: typeof record.score === 'number' ? record.score : 0,
    playerName: record.playerName || fallbackName || 'Player',
    carId: CAR_DEFS[record.carId] ? record.carId : 'starter',
    date: typeof record.date === 'number' ? record.date : Date.now()
  };
}

function normalizeGhostFrame(frame) {
  if (!frame || typeof frame.x !== 'number' || typeof frame.y !== 'number' || typeof frame.heading !== 'number' || typeof frame.dt !== 'number') {
    return null;
  }
  return {
    x: frame.x,
    y: frame.y,
    heading: frame.heading,
    isDrifting: Boolean(frame.isDrifting),
    isBoosting: Boolean(frame.isBoosting),
    dt: frame.dt
  };
}

function safelyParseSave(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse save data:', error);
    return null;
  }
}

function clampUpgradeLevel(value) {
  const parsed = parseInt(value ?? 0, 10) || 0;
  return Math.max(0, Math.min(2, parsed));
}

function getNumber(value, fallback) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyRewardResult() {
  return {
    tier1Satisfied: false,
    creditsEarned: 0,
    grossCredits: 0,
    penaltyCredits: 0,
    repairEstimate: 0,
    damageAdded: 0,
    totalDamage: 0,
    newlyCompletedTiers: [],
    masteryEarned: [],
    newUnlocks: [],
    sectionBonus: 0,
    finalBonus: 0,
    nextObjective: '--'
  };
}
