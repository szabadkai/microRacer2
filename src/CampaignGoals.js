export const TIER_ORDER = ['tier1', 'tier2', 'tier3', 'hidden'];
export const VISIBLE_TIER_ORDER = ['tier1', 'tier2', 'tier3'];

export const TIER_SHORT_LABELS = {
  tier1: 'I',
  tier2: 'II',
  tier3: 'III',
  hidden: '?'
};

export const TIER_DISPLAY_NAMES = {
  tier1: 'Tier I',
  tier2: 'Tier II',
  tier3: 'Tier III',
  hidden: 'Hidden'
};

const NORMAL_PAYOUTS = {
  tier1: 60,
  tier2: 90,
  tier3: 140,
  hidden: 220
};

const BOSS_PAYOUTS = {
  tier1: 120,
  tier2: 180,
  tier3: 260,
  hidden: 400
};

export function createEmptyMasteryRecord() {
  return {
    tier1: false,
    tier2: false,
    tier3: false,
    hidden: false,
    hiddenRevealed: false,
    bestTime: null,
    bestDrift: 0,
    bestDraft: 0,
    bestBank: 0,
    maxCombo: 1
  };
}

export function normalizeMasteryRecord(source = {}) {
  const record = createEmptyMasteryRecord();
  TIER_ORDER.forEach((tierId) => {
    record[tierId] = Boolean(source[tierId]);
  });
  record.hiddenRevealed = Boolean(source.hiddenRevealed || record.hidden);
  record.bestTime = typeof source.bestTime === 'number' && !Number.isNaN(source.bestTime) ? source.bestTime : null;
  record.bestDrift = typeof source.bestDrift === 'number' ? Math.max(0, source.bestDrift) : 0;
  record.bestDraft = typeof source.bestDraft === 'number' ? Math.max(0, source.bestDraft) : 0;
  record.bestBank = typeof source.bestBank === 'number' ? Math.max(0, source.bestBank) : 0;
  record.maxCombo = typeof source.maxCombo === 'number' ? Math.max(1, source.maxCombo) : 1;

  if (record.tier1 && record.tier2 && record.tier3) {
    record.hiddenRevealed = true;
  }

  return record;
}

export function getMasteryCount(record) {
  return TIER_ORDER.filter((tierId) => record?.[tierId]).length;
}

export function getTierPayout(level, tierId) {
  const payouts = isBossLevel(level.id) ? BOSS_PAYOUTS : NORMAL_PAYOUTS;
  return payouts[tierId] || 0;
}

export function getLevelGoalSet(level) {
  if (level.targetDriftScore) {
    return buildDriftGoals(level);
  }
  if (level.targetDraftTime) {
    return buildDraftGoals(level);
  }
  if (level.isElimination) {
    return buildEliminationGoals(level);
  }
  if (level.isCleanRacing && level.targetTime) {
    return buildCleanTimeGoals(level);
  }
  if (level.targetTime) {
    return buildTimeGoals(level);
  }
  if (level.isCleanRacing) {
    return buildCleanGoals(level);
  }
  return buildRaceGoals(level);
}

export function evaluateLevelGoals(level, summary) {
  const goals = getLevelGoalSet(level);
  const achievedTierIds = TIER_ORDER.filter((tierId) => goals[tierId].check(summary));
  return { goals, achievedTierIds };
}

export function getNextTier(level, mastery, includeHidden = true) {
  const goals = getLevelGoalSet(level);
  const tierOrder = includeHidden ? TIER_ORDER : VISIBLE_TIER_ORDER;
  const nextTierId = tierOrder.find((tierId) => !mastery?.[tierId]) || null;
  return nextTierId ? { id: nextTierId, ...goals[nextTierId] } : null;
}

export function getVisibleGoalText(level, mastery) {
  const nextTier = getNextTier(level, mastery, false);
  if (nextTier) return nextTier.label;
  const hiddenGoal = getLevelGoalSet(level).hidden;
  if (mastery?.hiddenRevealed) return hiddenGoal.label;
  return 'All visible goals complete';
}

function buildRaceGoals(level) {
  const boss = isBossLevel(level.id);
  return {
    tier1: goal('Finish 1st', getTierPayout(level, 'tier1'), (summary) => summary.finished && summary.position === 1),
    tier2: goal('Finish 1st + stay clean', getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.position === 1 && summary.cleanRun
    )),
    tier3: goal('Finish 1st + clean + no contact', getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.position === 1 && summary.cleanRun && summary.collisionFree
    )),
    hidden: boss
      ? goal('Win in a stock Starter chassis', getTierPayout(level, 'hidden'), (summary) => (
          summary.finished && summary.position === 1 && summary.starterStockBuild
        ), true)
      : goal('Finish 1st + clean + no boost', getTierPayout(level, 'hidden'), (summary) => (
          summary.finished && summary.position === 1 && summary.cleanRun && summary.noBoostUsed
        ), true)
  };
}

function buildTimeGoals(level) {
  const tier2Time = roundTime(level.targetTime * 0.95);
  const tier3Time = roundTime(level.targetTime * 0.9);
  const hiddenTime = roundTime(level.targetTime * 0.86);

  return {
    tier1: goal(`Finish under ${formatSeconds(level.targetTime)}`, getTierPayout(level, 'tier1'), (summary) => (
      summary.finished && summary.totalTime <= level.targetTime
    )),
    tier2: goal(`Finish under ${formatSeconds(tier2Time)}`, getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.totalTime <= tier2Time
    )),
    tier3: goal(`Under ${formatSeconds(tier3Time)} + stay clean`, getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.totalTime <= tier3Time && summary.cleanRun
    )),
    hidden: goal(`Under ${formatSeconds(hiddenTime)} + no boost`, getTierPayout(level, 'hidden'), (summary) => (
      summary.finished && summary.totalTime <= hiddenTime && summary.noBoostUsed
    ), true)
  };
}

function buildCleanTimeGoals(level) {
  const tier2Time = roundTime(level.targetTime * 0.95);
  const tier3Time = roundTime(level.targetTime * 0.9);
  const hiddenTime = roundTime(level.targetTime * 0.86);

  return {
    tier1: goal(`Clean finish under ${formatSeconds(level.targetTime)}`, getTierPayout(level, 'tier1'), (summary) => (
      summary.finished && summary.cleanRun && summary.totalTime <= level.targetTime
    )),
    tier2: goal(`Clean finish under ${formatSeconds(tier2Time)}`, getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.cleanRun && summary.totalTime <= tier2Time
    )),
    tier3: goal(`Clean under ${formatSeconds(tier3Time)} + no contact`, getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.cleanRun && summary.totalTime <= tier3Time && summary.collisionFree
    )),
    hidden: goal(`Clean under ${formatSeconds(hiddenTime)} + no boost`, getTierPayout(level, 'hidden'), (summary) => (
      summary.finished && summary.cleanRun && summary.totalTime <= hiddenTime && summary.noBoostUsed
    ), true)
  };
}

function buildCleanGoals(level) {
  return {
    tier1: goal('Finish clean', getTierPayout(level, 'tier1'), (summary) => (
      summary.finished && summary.cleanRun
    )),
    tier2: goal('Finish clean + no contact', getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.cleanRun && summary.collisionFree
    )),
    tier3: goal('Perfect clean run', getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.cleanRun && summary.collisionFree && summary.damageTaken <= 4
    )),
    hidden: goal('Perfect clean + no boost', getTierPayout(level, 'hidden'), (summary) => (
      summary.finished && summary.cleanRun && summary.collisionFree && summary.noBoostUsed
    ), true)
  };
}

function buildDriftGoals(level) {
  const tier2Score = roundTo(level.targetDriftScore * 1.35, 500);
  const tier3Score = roundTo(level.targetDriftScore * 1.65, 500);
  const hiddenScore = roundTo(level.targetDriftScore * 1.9, 500);
  const hiddenBank = roundTo(level.targetDriftScore * 0.9, 100);

  return {
    tier1: goal(`Score ${formatPoints(level.targetDriftScore)}`, getTierPayout(level, 'tier1'), (summary) => (
      summary.finished && summary.driftScore >= level.targetDriftScore
    )),
    tier2: goal(`Score ${formatPoints(tier2Score)}`, getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.driftScore >= tier2Score
    )),
    tier3: goal(`Score ${formatPoints(tier3Score)} + stay clean`, getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.driftScore >= tier3Score && summary.cleanRun
    )),
    hidden: goal(`Score ${formatPoints(hiddenScore)} + x4 combo or big bank`, getTierPayout(level, 'hidden'), (summary) => (
      summary.finished
      && summary.driftScore >= hiddenScore
      && (summary.maxCombo >= 4 || summary.bestBank >= hiddenBank)
    ), true)
  };
}

function buildDraftGoals(level) {
  const tier2Draft = roundDraft(level.targetDraftTime * 1.4);
  const tier3Draft = roundDraft(level.targetDraftTime * 1.8);
  const hiddenDraft = roundDraft(level.targetDraftTime * 2.1);

  return {
    tier1: goal(`Draft for ${tierLabelDraft(level.targetDraftTime)}`, getTierPayout(level, 'tier1'), (summary) => (
      summary.finished && summary.draftTime >= level.targetDraftTime
    )),
    tier2: goal(`Draft ${tierLabelDraft(tier2Draft)} + finish 1st`, getTierPayout(level, 'tier2'), (summary) => (
      summary.finished && summary.draftTime >= tier2Draft && summary.position === 1
    )),
    tier3: goal(`Draft ${tierLabelDraft(tier3Draft)} + win clean`, getTierPayout(level, 'tier3'), (summary) => (
      summary.finished && summary.draftTime >= tier3Draft && summary.position === 1 && summary.cleanRun
    )),
    hidden: goal(`Draft ${tierLabelDraft(hiddenDraft)} + win with no boost`, getTierPayout(level, 'hidden'), (summary) => (
      summary.finished && summary.draftTime >= hiddenDraft && summary.position === 1 && summary.noBoostUsed
    ), true)
  };
}

function buildEliminationGoals(level) {
  return {
    tier1: goal('Survive the elimination', getTierPayout(level, 'tier1'), (summary) => (
      summary.survivedElimination
    )),
    tier2: goal('Survive + stay clean', getTierPayout(level, 'tier2'), (summary) => (
      summary.survivedElimination && summary.cleanRun
    )),
    tier3: goal('Survive + clean + no contact', getTierPayout(level, 'tier3'), (summary) => (
      summary.survivedElimination && summary.cleanRun && summary.collisionFree
    )),
    hidden: goal('Survive with no boost', getTierPayout(level, 'hidden'), (summary) => (
      summary.survivedElimination && summary.noBoostUsed
    ), true)
  };
}

function goal(label, payout, check, hidden = false) {
  return { label, payout, check, hidden };
}

function roundTo(value, step) {
  return Math.ceil(value / step) * step;
}

function roundDraft(value) {
  return Math.round(value * 2) / 2;
}

function roundTime(value) {
  return Math.round(value * 10) / 10;
}

function formatPoints(value) {
  return `${Math.round(value).toLocaleString()} PTS`;
}

function tierLabelDraft(value) {
  return `${value.toFixed(1)}s`;
}

function formatSeconds(value) {
  const minutes = Math.floor(value / 60);
  const seconds = value - minutes * 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
  }
  return `${value.toFixed(1)}s`;
}

function isBossLevel(levelId) {
  return levelId === 'c6' || levelId === 'c12' || levelId === 'c18' || levelId === 'c24' || levelId === 'c30';
}
