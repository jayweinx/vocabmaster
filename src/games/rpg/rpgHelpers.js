import { isSentenceBuilderEligible } from '../../quiz/sentenceBuilderHelpers.js';

export const RPG_WORLD = { width: 1800, height: 1200 };
export const RPG_OBSTACLES = [
  { x: 160, y: 120, w: 280, h: 210 }, { x: 690, y: 150, w: 250, h: 190 },
  { x: 1220, y: 160, w: 290, h: 220 }, { x: 300, y: 720, w: 210, h: 180 },
  { x: 1080, y: 720, w: 280, h: 200 }, { x: 1510, y: 750, w: 160, h: 260 }
];

export const normalizeMovement = (x, y, speed) => {
  const length = Math.hypot(x, y);
  return length ? { x: (x / length) * speed, y: (y / length) * speed } : { x: 0, y: 0 };
};

export const collidesAt = (position, obstacles = RPG_OBSTACLES, radius = 20) => obstacles.some((box) => (
  position.x + radius > box.x && position.x - radius < box.x + box.w
  && position.y + radius > box.y && position.y - radius < box.y + box.h
));

export const movePlayer = (position, input, speed, obstacles = RPG_OBSTACLES) => {
  const delta = normalizeMovement(input.x, input.y, speed);
  const xMove = { x: Math.max(20, Math.min(RPG_WORLD.width - 20, position.x + delta.x)), y: position.y };
  const afterX = collidesAt(xMove, obstacles) ? position : xMove;
  const yMove = { x: afterX.x, y: Math.max(20, Math.min(RPG_WORLD.height - 20, afterX.y + delta.y)) };
  return collidesAt(yMove, obstacles) ? afterX : yMove;
};

export const cameraFor = (player, viewport) => ({
  x: Math.max(0, Math.min(RPG_WORLD.width - viewport.width, player.x - viewport.width / 2)),
  y: Math.max(0, Math.min(RPG_WORLD.height - viewport.height, player.y - viewport.height / 2))
});

export const rpgQuestionMode = (word, index = 0) => {
  if (isSentenceBuilderEligible(word) && index % 4 === 3) return 'SENTENCE_BUILDER';
  return ['WORD_TO_MEANING', 'MEANING_TO_WORD', 'AUDIO_TO_MEANING'][index % 3];
};

export const shouldOfferRetry = (retry, encounterCount) => retry && encounterCount >= retry.availableAfter;
export const isBossUnlocked = ({ normalCleared, normalTotal, specialsCleared, specialsTotal }) => (
  normalTotal > 0 && normalCleared / normalTotal >= 0.8 && specialsCleared >= specialsTotal
);

export const scoreForAnswer = ({ correct, recovered, combo, special = false, boss = false }) => {
  if (!correct) return { score: 0, coins: 0, nextCombo: 0 };
  const base = boss ? 180 : recovered ? 60 : 100;
  const reward = special ? base + 40 : base;
  return { score: reward + Math.min(combo, 5) * 10, coins: boss ? 8 : special ? 4 : 2, nextCombo: combo + 1 };
};

export const nextRpgStats = (stats, { correct, recovered = false, special = false, boss = false }) => {
  const reward = scoreForAnswer({ correct, recovered, combo: stats.combo, special, boss });
  return {
    ...stats, score: stats.score + reward.score, coins: stats.coins + reward.coins,
    hearts: correct ? stats.hearts : Math.max(0, stats.hearts - 1),
    correct: stats.correct + (correct ? 1 : 0), wrong: stats.wrong + (correct ? 0 : 1),
    recovered: stats.recovered + (correct && recovered ? 1 : 0), combo: reward.nextCombo,
    bestCombo: Math.max(stats.bestCombo, reward.nextCombo), encounters: stats.encounters + (boss ? 0 : 1)
  };
};

export const hasThreeDistinctMeanings = (words) => new Set(words.map((word) => `${word.meaning || ''}\u0000${word.mandarin || ''}`)).size === words.length;

export const selectDistinctMeaningWords = (words, count = 3) => {
  const seen = new Set();
  const selected = [];
  for (const word of words) {
    const meaningKey = `${String(word.meaning || '').trim().toLowerCase()}\u0000${String(word.mandarin || '').trim()}`;
    if (seen.has(meaningKey)) continue;
    seen.add(meaningKey); selected.push(word);
    if (selected.length === count) return selected;
  }
  return [];
};

export const createRpgResult = ({ username, folderId, selectedWords, stats, startedAt }) => ({
  student: username || 'Student', folderId: folderId || null, selectedWordIds: selectedWords.map((word) => word.id),
  score: stats.score, accuracy: stats.correct + stats.wrong ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) : 0,
  correct: stats.correct, wrong: stats.wrong, recovered: stats.recovered, bestCombo: stats.bestCombo,
  coins: stats.coins, timeSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)), completedAt: new Date().toISOString()
});
