export const SENTENCE_BUILDER = 'SENTENCE_BUILDER';

export const normalizeSentenceWhitespace = (value) => String(value ?? '')
  .replace(/\s+/g, ' ')
  .trim();

export const tokenizeSentence = (value) => normalizeSentenceWhitespace(value)
  .split(' ')
  .filter(Boolean)
  .map((text, index) => ({ id: `token-${index}`, index, text }));

export const isSentenceBuilderEligible = (word) => tokenizeSentence(
  typeof word === 'object' ? word?.word : word
).length > 2;

const shuffleWith = (items, random) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export const shuffleSentenceTiles = (tiles, random = Math.random) => {
  const original = tiles.map((tile) => tile.text).join('\u0000');
  let shuffled = [...tiles];

  // Repeated tokens can make several different ID arrangements read identically.
  // A bounded retry avoids a needless original-order bank without risking a loop.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    shuffled = shuffleWith(tiles, random);
    if (shuffled.map((tile) => tile.text).join('\u0000') !== original) break;
  }
  return shuffled;
};

export const isSentenceBuilderAnswerCorrect = (answerTiles, targetSentence) => (
  normalizeSentenceWhitespace(answerTiles.map((tile) => tile.text).join(' '))
    === normalizeSentenceWhitespace(targetSentence)
);

const availableMcqTypes = (word) => {
  const types = ['ENG_TO_MAN', 'MAN_TO_ENG', 'AUDIO_TO_ENG'];
  if (normalizeSentenceWhitespace(word?.meaning)) types.push('MEANING_TO_ENG');
  return types;
};

export const assignQuizQuestionTypes = (selectedWords, random = Math.random) => {
  const eligibleIndexes = [];
  const types = selectedWords.map((word, index) => {
    if (isSentenceBuilderEligible(word)) {
      eligibleIndexes.push(index);
      if (random() < 0.4) return SENTENCE_BUILDER;
    }
    const choices = availableMcqTypes(word);
    return choices[Math.floor(random() * choices.length)];
  });

  if (eligibleIndexes.length && !types.includes(SENTENCE_BUILDER)) {
    const forcedIndex = eligibleIndexes[Math.floor(random() * eligibleIndexes.length)];
    types[forcedIndex] = SENTENCE_BUILDER;
  }
  return types;
};

export const getSentenceBuilderMeaningLines = (word) => [
  { label: 'English meaning', value: normalizeSentenceWhitespace(word?.meaning) },
  { label: '中文意思', value: normalizeSentenceWhitespace(word?.mandarin) }
].filter((line) => line.value);
