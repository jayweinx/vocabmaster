import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cameraFor,
  correctAnswerText,
  createRpgResult,
  hasThreeDistinctMeanings,
  isBossUnlocked,
  isUsableRpgWord,
  movePlayer,
  nextRpgStats,
  normalizeMovement,
  rpgQuestionMode,
  sampleRandomWords,
  scoreForAnswer,
  selectDistinctMeaningWords,
  shouldOfferRetry,
} from '../src/games/rpg/rpgHelpers.js';

test('movement normalizes diagonals and blocks obstacle movement', () => {
  const diagonal = normalizeMovement(1, 1, 10);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 10) < 0.001);
  assert.deepEqual(movePlayer({ x: 70, y: 75 }, { x: 1, y: 0 }, 10, [{ x: 90, y: 90, w: 80, h: 80 }]), { x: 70, y: 75 });
  assert.deepEqual(movePlayer({ x: 70, y: 75 }, { x: 1, y: -1 }, 10, [{ x: 90, y: 90, w: 80, h: 80 }]), { x: 70, y: 67.92893218813452 });
});
test('camera clamps and question modes reserve builder for phrases', () => {
  assert.deepEqual(cameraFor({ x: 0, y: 0 }, { width: 400, height: 300 }), { x: 0, y: 0 });
  assert.equal(rpgQuestionMode({ word: 'traditional art' }, 3), 'WORD_TO_MEANING');
  assert.equal(rpgQuestionMode({ word: 'keep savings goals on track' }, 3), 'SENTENCE_BUILDER');
});
test('retry spacing, boss unlock, scoring and result stats are deterministic', () => {
  assert.equal(shouldOfferRetry({ availableAfter: 5 }, 4), false); assert.equal(shouldOfferRetry({ availableAfter: 5 }, 5), true);
  assert.equal(isBossUnlocked({ normalCleared: 8, normalTotal: 10, specialsCleared: 1, specialsTotal: 1 }), true);
  assert.equal(scoreForAnswer({ correct: true, recovered: true, combo: 2 }).score, 80);
  const result = createRpgResult({ username: 'A', folderId: 'f', selectedWords: [{ id: 'w' }], stats: { score: 100, correct: 2, wrong: 1, recovered: 1, bestCombo: 2, coins: 3 }, startedAt: Date.now() - 2000 });
  assert.equal(result.accuracy, 67); assert.equal(result.selectedWordIds[0], 'w');
});
test('locked gate blocks movement, boss answers update final stats, and match meanings are distinct', () => {
  assert.deepEqual(movePlayer({ x: 1550, y: 870 }, { x: 1, y: 0 }, 30, [{ x: 1570, y: 850, w: 230, h: 45 }]), { x: 1550, y: 870 });
  const final = nextRpgStats({ score: 200, coins: 3, hearts: 1, correct: 2, wrong: 1, recovered: 0, combo: 2, bestCombo: 2, encounters: 4 }, { correct: true, boss: true });
  assert.deepEqual({ score: final.score, coins: final.coins, correct: final.correct, hearts: final.hearts }, { score: 400, coins: 11, correct: 3, hearts: 1 });
  assert.equal(hasThreeDistinctMeanings([{ meaning: 'a' }, { meaning: 'b' }, { meaning: 'c' }]), true);
  assert.equal(hasThreeDistinctMeanings([{ meaning: 'a' }, { meaning: 'a' }, { meaning: 'c' }]), false);
  assert.deepEqual(selectDistinctMeaningWords([{ id: 'a', meaning: 'same' }, { id: 'b', meaning: 'same' }, { id: 'c', meaning: 'different' }, { id: 'd', meaning: 'third' }]).map((word) => word.id), ['a', 'c', 'd']);
  const word = { word: 'source of income', meaning: 'where money comes from', mandarin: '收入来源' };
  assert.equal(correctAnswerText('WORD_TO_MEANING', word), 'where money comes from · 收入来源');
  assert.equal(correctAnswerText('MEANING_TO_WORD', word), 'source of income');
  assert.match(correctAnswerText('MATCH', word, [word]), /source of income → where money comes from/);
});

test('random word selection returns exact unique 10, 15, and 20 word samples', () => {
  const words = Array.from({ length: 25 }, (_, index) => ({
    id: `word-${index}`,
  }));
  for (const count of [10, 15, 20]) {
    const sample = sampleRandomWords(words, count, () => 0.25);
    assert.equal(sample.length, count);
    assert.equal(new Set(sample.map((word) => word.id)).size, count);
  }
});

test('random word selection clamps to a smaller pool and removes duplicate ids', () => {
  const words = Array.from({ length: 13 }, (_, index) => ({
    id: `word-${index}`,
  }));
  words.push({ id: 'word-3' });
  const sample = sampleRandomWords(words, 20, () => 0.75);
  assert.equal(sample.length, 13);
  assert.equal(new Set(sample.map((word) => word.id)).size, 13);
});

test('random word selection replaces the previous set and stays inside its current eligible pool', () => {
  const previousIds = new Set(['unrelated-1', 'unrelated-2']);
  const currentPool = Array.from({ length: 18 }, (_, index) => ({
    id: `current-${index}`,
  }));
  const nextIds = new Set(
    sampleRandomWords(currentPool, 15, () => 0.5, previousIds).map(
      (word) => word.id,
    ),
  );
  assert.equal(nextIds.size, 15);
  assert.equal([...nextIds].some((id) => previousIds.has(id)), false);
  assert.equal([...nextIds].every((id) => id.startsWith('current-')), true);
});

test('repeating a random count cannot return the identical id set when the pool is larger', () => {
  const words = Array.from({ length: 30 }, (_, index) => ({
    id: `word-${index}`,
  }));
  const firstIds = new Set(
    sampleRandomWords(words, 15, () => 0).map((word) => word.id),
  );
  const secondIds = new Set(
    sampleRandomWords(words, 15, () => 0, firstIds).map((word) => word.id),
  );

  assert.equal(secondIds.size, 15);
  assert.equal([...secondIds].every((id) => firstIds.has(id)), false);
});

test('Vocab Quest random eligibility requires a word and at least one meaning', () => {
  assert.equal(isUsableRpgWord({ word: 'apple', meaning: 'fruit' }), true);
  assert.equal(isUsableRpgWord({ word: 'apple', mandarin: '苹果' }), true);
  assert.equal(isUsableRpgWord({ word: 'apple' }), false);
  assert.equal(isUsableRpgWord({ meaning: 'fruit' }), false);
});
