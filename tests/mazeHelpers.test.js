import assert from "node:assert/strict";
import test from "node:test";
import {
  MAZE_TTS_LANG, mazeDescendantFolderIds, mazeFolderPath,
  mazeFolderUsableWords, meaningKey, meaningLines, usableMazeWord,
} from "../src/games/mazeHelpers.js";
import { buildV2MazeQuestion } from "../src/games/maze/mazeQuestionHelpers.js";

test("maze folder helpers support nested, empty, non-hardcoded trees", () => {
  const folders = [
    { id: "x", name: "Alpha", parentId: null },
    { id: "y", name: "Topic", parentId: "x" },
    { id: "z", name: "Empty", parentId: null },
  ];
  const words = [
    { id: "1", folderId: "y", word: "source of income", meaning: "income" },
    { id: "2", folderId: "z", word: "", meaning: "bad" },
  ];
  assert.deepEqual([...mazeDescendantFolderIds(folders, "x")].sort(), ["x", "y"]);
  assert.deepEqual(mazeFolderPath(folders, "y"), ["Alpha", "Topic"]);
  assert.equal(mazeFolderUsableWords(words, folders, "x").length, 1);
  assert.equal(mazeFolderUsableWords(words, folders, "z").length, 0);
  assert.equal(usableMazeWord({ word: "hello", mandarin: "你好" }), true);
  assert.equal(usableMazeWord({ word: "hello" }), false);
});

const words = [
  { id: "one", word: "ancient", meaning: "very old", mandarin: "古老的" },
  { id: "two", word: "brave", meaning: "showing courage", mandarin: "勇敢的" },
  { id: "three", word: "calm", meaning: "peaceful", mandarin: "平静的" },
  { id: "four", word: "distant", meaning: "far away", mandarin: "遥远的" },
];

test("English meaning precedes Mandarin and V2 answer options are identity-based", () => {
  assert.deepEqual(meaningLines(words[0]), ["very old", "古老的"]);
  assert.equal(meaningKey(words[0]), "very old\u0000古老的");
  const question = buildV2MazeQuestion(words[0], words, () => 0.25, "WORD_TO_MEANING");
  assert.equal(question.mode, "WORD_TO_MEANING");
  assert.ok(question.options.some((option) => option.id === question.correctId));
  assert.equal(new Set(question.options.map(meaningKey)).size, question.options.length);
});

test("V2 question options remain distinct when source meanings are ambiguous", () => {
  const ambiguous = [
    { id: "a", word: "same", meaning: "one meaning", mandarin: "同义" },
    { id: "b", word: "different", meaning: "one meaning", mandarin: "同义" },
    { id: "c", word: "third", meaning: "another meaning", mandarin: "另一个意思" },
  ];
  const question = buildV2MazeQuestion(ambiguous[0], ambiguous, () => 0.3, "WORD_TO_MEANING");
  assert.equal(question.correctId, "a");
  assert.equal(new Set(question.options.map(meaningKey)).size, question.options.length);
  assert.ok(!question.options.some((option) => option.id === "b"));
});

test("long English vocabulary and bilingual meanings stay intact in V2 prompts", () => {
  assert.equal(MAZE_TTS_LANG, "en-US");
  const required = [
    { id: "overspending", word: "overspending", meaning: "spending too much", mandarin: "过度消费" },
    { id: "eco-reserve", word: "eco reserve", meaning: "a protected natural area", mandarin: "生态保护区" },
    {
      id: "checkout-reflection",
      word: "Before clicking “Checkout”, ask yourself: Would I buy this at full price?",
      meaning: "a reminder to pause before buying something on sale",
      mandarin: "结账前先问自己：原价时我还会买吗？",
    },
  ];
  required.forEach((word) => {
    assert.deepEqual(meaningLines(word), [word.meaning, word.mandarin]);
    assert.ok(usableMazeWord(word));
  });
  const wordQuestion = buildV2MazeQuestion(required[2], required, () => 0.4, "WORD_TO_MEANING");
  assert.equal(wordQuestion.target.word, required[2].word);
  assert.ok(wordQuestion.target.word.includes("Would I buy this at full price?"));
  const reverse = buildV2MazeQuestion(required[1], required, () => 0.4, "MEANING_TO_WORD");
  assert.equal(reverse.target.word, "eco reserve");
  assert.deepEqual(meaningLines(reverse.target), ["a protected natural area", "生态保护区"]);
  const audio = buildV2MazeQuestion(required[0], required, () => 0.4, "AUDIO_TO_MEANING");
  assert.equal(audio.mode, "AUDIO_TO_MEANING");
  assert.equal(audio.target.word, "overspending");
});
