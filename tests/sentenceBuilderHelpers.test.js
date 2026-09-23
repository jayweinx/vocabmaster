import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SENTENCE_BUILDER,
  assignQuizQuestionTypes,
  getSentenceBuilderMeaningLines,
  isSentenceBuilderAnswerCorrect,
  isSentenceBuilderEligible,
  normalizeSentenceWhitespace,
  shuffleSentenceTiles,
  tokenizeSentence
} from '../src/quiz/sentenceBuilderHelpers.js';

test('only English entries with more than two whitespace tokens are builder eligible', () => {
  assert.equal(isSentenceBuilderEligible({ word: 'overspending' }), false);
  assert.equal(isSentenceBuilderEligible({ word: 'traditional art' }), false);
  assert.equal(isSentenceBuilderEligible({ word: 'source of income' }), true);
  assert.equal(isSentenceBuilderEligible({ word: 'keep savings goals on track' }), true);
});

test('tokenization normalizes whitespace while preserving attached punctuation and long sentences', () => {
  const sentence = ' Before\n clicking  “Checkout”, ask yourself: Would I buy this at full price? ';
  assert.deepEqual(tokenizeSentence(sentence).map((tile) => tile.text), [
    'Before', 'clicking', '“Checkout”,', 'ask', 'yourself:', 'Would', 'I', 'buy', 'this', 'at', 'full', 'price?'
  ]);
  assert.equal(normalizeSentenceWhitespace(sentence), 'Before clicking “Checkout”, ask yourself: Would I buy this at full price?');
  assert.deepEqual(tokenizeSentence('AI is a tool, not a replacement for human thinking.').map((tile) => tile.text), [
    'AI', 'is', 'a', 'tool,', 'not', 'a', 'replacement', 'for', 'human', 'thinking.'
  ]);
  assert.deepEqual(tokenizeSentence('keep savings goals on track').map((tile) => tile.text), ['keep', 'savings', 'goals', 'on', 'track']);
  assert.deepEqual(tokenizeSentence('source of income').map((tile) => tile.text), ['source', 'of', 'income']);
});

test('tile shuffle retries after an identity order and returns a later non-identity order', () => {
  const tiles = tokenizeSentence('source of income');
  const randomValues = [0.99, 0.99, 0.99, 0, 0, 0];
  let randomCalls = 0;
  const shuffled = shuffleSentenceTiles(tiles, () => {
    randomCalls += 1;
    return randomValues.shift();
  });
  assert.notDeepEqual(shuffled.map((tile) => tile.text), tiles.map((tile) => tile.text));
  assert.deepEqual(shuffled.map((tile) => tile.text), ['of', 'source', 'income']);
  assert.equal(randomCalls, 4);
});

test('repeated tokens have independent IDs and exact normalized sequence controls correctness', () => {
  const repeated = tokenizeSentence('the cat and the dog');
  assert.notEqual(repeated[0].id, repeated[3].id);
  assert.equal(isSentenceBuilderAnswerCorrect(repeated, 'the cat and the dog'), true);
  assert.equal(isSentenceBuilderAnswerCorrect([repeated[0], repeated[1], repeated[2], repeated[4], repeated[3]], 'the cat and the dog'), false);
});

test('builder assignment preserves MCQ types and always includes a builder when eligible words exist', () => {
  const words = [
    { word: 'overspending', meaning: 'spending too much', mandarin: '过度消费' },
    { word: 'source of income', meaning: 'where money comes from', mandarin: '收入来源' },
    { word: 'AI is a tool, not a replacement for human thinking.', meaning: 'technology should support judgment', mandarin: '人工智能是工具' }
  ];
  const types = assignQuizQuestionTypes(words, () => 0.99);
  assert.equal(types.length, words.length);
  assert.ok(types.includes(SENTENCE_BUILDER));
  assert.notEqual(types[0], SENTENCE_BUILDER);
  assert.ok(types.every((type) => ['ENG_TO_MAN', 'MAN_TO_ENG', 'AUDIO_TO_ENG', 'MEANING_TO_ENG', SENTENCE_BUILDER].includes(type)));
});

test('builder meaning lines are English first, Chinese second, and omit absent values', () => {
  assert.deepEqual(getSentenceBuilderMeaningLines({ meaning: 'a plan', mandarin: '计划' }), [
    { label: 'English meaning', value: 'a plan' },
    { label: '中文意思', value: '计划' }
  ]);
  assert.deepEqual(getSentenceBuilderMeaningLines({ meaning: null, mandarin: '计划' }), [
    { label: '中文意思', value: '计划' }
  ]);
});
