import { isSentenceBuilderEligible } from "../../quiz/sentenceBuilderHelpers.js";
import { meaningKey, usableMazeWord } from "../mazeHelpers.js";
import { shuffled } from "./mazeGenerator.js";

export const mazeQuestionModes = (word) => [
  "WORD_TO_MEANING",
  "MEANING_TO_WORD",
  "AUDIO_TO_MEANING",
  ...(isSentenceBuilderEligible(word) ? ["SENTENCE_BUILDER", "SENTENCE_BUILDER"] : []),
];

export const buildV2MazeQuestion = (word, words, random = Math.random, preferredMode = null) => {
  const mode = preferredMode && mazeQuestionModes(word).includes(preferredMode)
    ? preferredMode
    : shuffled(mazeQuestionModes(word), random)[0];
  if (mode === "SENTENCE_BUILDER") return { mode, target: word, correctId: word.id, options: [] };
  const identity = mode === "MEANING_TO_WORD"
    ? (item) => item.word.trim().toLowerCase()
    : meaningKey;
  const seen = new Set([identity(word)]);
  const distractors = shuffled(words.filter((item) => item.id !== word.id && usableMazeWord(item)), random)
    .filter((item) => {
      const value = identity(item);
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 3);
  return {
    mode,
    target: word,
    correctId: word.id,
    options: shuffled([word, ...distractors], random),
  };
};

export const eligibleMazeRetries = (retryPool, encounterIndex) =>
  [...retryPool.values()].filter((entry) =>
    !entry.recovered && encounterIndex - entry.lastAttemptIndex >= 2);

export const chooseBossWord = (state, random = Math.random) => {
  const excludesLast = (items) => items.filter((word) => word.id !== state.bossLastWordId);
  const byIds = (ids) => state.words.filter((word) => ids.has(word.id));
  const tiers = [
    byIds(new Set([...state.retryPool.keys()])),
    byIds(state.wrongEver),
    state.words.filter(isSentenceBuilderEligible),
    state.words,
  ];
  for (const tier of tiers) {
    const distinct = excludesLast(tier);
    if (distinct.length) return shuffled(distinct, random)[0];
  }
  return shuffled(state.words, random)[0];
};
