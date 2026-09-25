import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkMazeWords, generateMazeGrid, mazeCadence, mazeDistances, mazeKey,
  mazeNeighborsAt, mazeShortestTilePath, mazeThreshold, validateMaze,
} from "../src/games/maze/mazeGenerator.js";
import {
  answerMazeSession, continueMazeQuestion, createMazeSession, gateIsOpen,
  nextMazeLevel, retryMazeLevel, stepMazeSession,
} from "../src/games/maze/mazeSession.js";
import {
  buildV2MazeQuestion, chooseBossWord, eligibleMazeRetries, mazeQuestionModes,
} from "../src/games/maze/mazeQuestionHelpers.js";
import { isSentenceBuilderAnswerCorrect, tokenizeSentence } from "../src/quiz/sentenceBuilderHelpers.js";

const words = (count) => Array.from({ length: count }, (_, index) => ({
  id: `word-${index}`, word: index === 0 ? "look after yourself" : `word${index}`,
  meaning: `meaning ${index}`, mandarin: `意思${index}`,
}));
const seeded = (seed) => () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; };
const directionBetween = (a, b) =>
  b.x > a.x ? "right" : b.x < a.x ? "left" : b.y > a.y ? "down" : "up";

test("balanced word chunks preserve all words without a tiny tail", () => {
  for (const [count, expected] of [[10, [10]], [20, [20]], [21, [11, 10]], [30, [15, 15]], [43, [15, 14, 14]]]) {
    const chunks = chunkMazeWords(words(count));
    assert.deepEqual(chunks.map((chunk) => chunk.length), expected);
    assert.deepEqual(chunks.flat().map((word) => word.id), words(count).map((word) => word.id));
    assert.ok(chunks.every((chunk) => chunk.length <= 20));
  }
});

test("generated grids are solvable, sealed at the gate, and cover every primary word once", () => {
  for (const count of [3, 5, 10, 15, 20]) {
    for (let seed = 1; seed <= 60; seed += 1) {
      const vocabulary = words(count);
      const maze = generateMazeGrid(vocabulary, seeded(seed));
      assert.ok(validateMaze(maze), `${count} words, seed ${seed}`);
      const closed = mazeDistances(maze, maze.start);
      const open = mazeDistances(maze, maze.start, true);
      assert.ok(closed.has(mazeKey(maze.key)));
      assert.ok(!closed.has(mazeKey(maze.boss)));
      assert.ok(open.has(mazeKey(maze.boss)));
      assert.equal(maze.primary.size, count);
      assert.deepEqual(new Set(maze.primary.values()), new Set(vocabulary.map((word) => word.id)));
      assert.ok(closed.get(mazeKey(maze.ghostStart)) >= 5);
      assert.ok([...maze.primary.keys(), ...maze.review, ...maze.coins, mazeKey(maze.power)]
        .every((id) => closed.has(id)));
      assert.ok(mazeShortestTilePath(maze, maze.start, maze.boss).length === 0);
      assert.ok(mazeShortestTilePath(maze, maze.start, maze.boss, true).length > 0);
    }
  }
});

test("gate requires key and roughly 70 percent challenge progress", () => {
  assert.equal(mazeThreshold(10), 7);
  assert.equal(mazeThreshold(20), 14);
  assert.ok(mazeThreshold(3) < 3);
  const session = createMazeSession(words(10), "normal", seeded(3));
  assert.equal(gateIsOpen(session), false);
  assert.equal(gateIsOpen({ ...session, keyCollected: true }), false);
  assert.equal(gateIsOpen({ ...session, attemptedPrimary: new Set(Array.from({ length: 7 }, (_, i) => i)) }), false);
  assert.equal(gateIsOpen({ ...session, keyCollected: true, attemptedPrimary: new Set(Array.from({ length: 7 }, (_, i) => i)) }), true);
  const approach = { x: session.maze.gate.x - 1, y: session.maze.gate.y };
  const locked = stepMazeSession({ ...session, player: approach, ghost: session.maze.ghostStart }, "right");
  assert.deepEqual(locked.player, approach);
  const unlocked = stepMazeSession({ ...session, player: approach, ghost: session.maze.ghostStart,
    keyCollected: true, attemptedPrimary: new Set(Array.from({ length: 7 }, (_, i) => i)) }, "right");
  assert.deepEqual(unlocked.player, session.maze.gate);
});

test("normal corridor movement and wall bumps do not open questions or accelerate ghosts", () => {
  for (const [difficulty, cadence] of [["relaxed", 4], ["normal", 3], ["challenge", 2]]) {
    assert.equal(mazeCadence(difficulty), cadence);
    const session = createMazeSession(words(10), difficulty, seeded(2));
    const wall = stepMazeSession(session, "up");
    assert.equal(wall.player.x, session.player.x);
    assert.equal(wall.ghostCountdown, cadence);
    const next = mazeNeighborsAt(session.maze, session.player)[0];
    const moved = stepMazeSession(session, directionBetween(session.player, next));
    assert.deepEqual(moved.player, next);
    assert.equal(moved.question, null);
    assert.equal(moved.ghostCountdown, cadence === 1 ? cadence : cadence - 1);
    const paused = stepMazeSession({ ...moved, question: { kind: "primary" } }, directionBetween(next, session.player));
    assert.equal(paused.ghostCountdown, moved.ghostCountdown);
    assert.deepEqual(paused.player, moved.player);
  }
});

test("ghost follows a corridor shortest path only on its cadence", () => {
  const session = createMazeSession(words(10), "normal", seeded(11));
  const neighbor = mazeNeighborsAt(session.maze, session.player)[0];
  const toward = mazeShortestTilePath(session.maze, session.ghost, neighbor)[1];
  let state = stepMazeSession(session, directionBetween(session.player, neighbor));
  assert.deepEqual(state.ghost, session.ghost);
  state = stepMazeSession(state, directionBetween(neighbor, session.player));
  assert.deepEqual(state.ghost, session.ghost);
  state = stepMazeSession(state, directionBetween(session.player, neighbor));
  assert.deepEqual(state.ghost, toward);
  assert.equal(state.ghostCountdown, 3);
});

test("wrong primary answer is attempted once and spaced retries recover after two other encounters", () => {
  const vocabulary = words(10);
  const first = createMazeSession(vocabulary, "normal", seeded(5));
  const [tileId, wordId] = first.maze.primary.entries().next().value;
  const [x, y] = tileId.split(",").map(Number);
  const tile = { x, y };
  const beside = mazeNeighborsAt(first.maze, tile).find((candidate) => !first.maze.primary.has(mazeKey(candidate)));
  let state = stepMazeSession({ ...first, player: beside, ghost: first.maze.ghostStart }, directionBetween(beside, tile), seeded(2));
  assert.equal(state.question?.wordId, wordId);
  state = answerMazeSession(state, false);
  assert.equal(state.hearts, 2);
  assert.equal(state.attemptedPrimary.size, 1);
  assert.equal(state.retryPool.get(wordId).wrongCount, 1);
  state = continueMazeQuestion(state);
  assert.equal(state.question, null);
  const escaped = stepMazeSession(state, directionBetween(tile, beside));
  assert.equal(escaped.question, null);
  assert.deepEqual(escaped.player, beside);
  assert.equal(eligibleMazeRetries(state.retryPool, state.encounterIndex).length, 0);
  assert.equal(eligibleMazeRetries(state.retryPool, state.encounterIndex + 1).length, 0);
  assert.equal(eligibleMazeRetries(state.retryPool, state.encounterIndex + 2).length, 1);
  const review = { ...state, encounterIndex: state.encounterIndex + 3,
    question: { kind: "review", wordId, detail: buildV2MazeQuestion(vocabulary.find((word) => word.id === wordId), vocabulary, seeded(3)), feedback: null } };
  const recovered = answerMazeSession(review, true);
  assert.equal(recovered.retryPool.size, 0);
  assert.ok(recovered.recovered.has(wordId));
  assert.equal(recovered.score, state.score + 60);
});

test("frightened ghost chooses a retreat corridor instead of shortest pursuit", () => {
  const session = createMazeSession(words(10), "normal", seeded(19));
  const target = mazeNeighborsAt(session.maze, session.player)[0];
  const distances = mazeDistances(session.maze, target);
  const ghostTile = [...distances.keys()].map((id) => {
    const [x, y] = id.split(",").map(Number);
    return { x, y };
  }).find((tile) => {
    const neighbors = mazeNeighborsAt(session.maze, tile);
    return distances.get(mazeKey(tile)) >= 3 && neighbors.length >= 2 &&
      new Set(neighbors.map((neighbor) => distances.get(mazeKey(neighbor)))).size > 1;
  });
  assert.ok(ghostTile);
  const frightened = stepMazeSession({ ...session, ghost: ghostTile, ghostCountdown: 1, power: 8 },
    directionBetween(session.player, target));
  const retreatDistance = distances.get(mazeKey(frightened.ghost));
  const options = mazeNeighborsAt(session.maze, ghostTile).map((tile) => distances.get(mazeKey(tile)));
  assert.equal(retreatDistance, Math.max(...options));
  const chasing = stepMazeSession({ ...session, ghost: ghostTile, ghostCountdown: 1, power: 0 },
    directionBetween(session.player, target));
  assert.equal(distances.get(mazeKey(chasing.ghost)), Math.min(...options));
});

test("power protects through eight valid moves; frightened collision rewards and respawns ghost", () => {
  const state = createMazeSession(words(10), "normal", seeded(9));
  const power = state.maze.power;
  const beside = mazeNeighborsAt(state.maze, power)[0];
  const powered = stepMazeSession({ ...state, player: beside, ghost: state.maze.ghostStart }, directionBetween(beside, power));
  assert.equal(powered.power, 8);
  assert.equal(powered.powerCollected, true);
  const withGhost = { ...powered, ghost: mazeNeighborsAt(state.maze, power)[0] };
  const defeated = stepMazeSession(withGhost, directionBetween(power, withGhost.ghost));
  assert.equal(defeated.hearts, 3);
  assert.equal(defeated.score, powered.score + 200 + (state.maze.dots.has(mazeKey(withGhost.ghost)) ? 5 : 0));
  assert.equal(defeated.power, 7);
  assert.notDeepEqual(defeated.ghost, defeated.player);
  const eighth = stepMazeSession({ ...powered, power: 1, ghost: withGhost.ghost }, directionBetween(power, withGhost.ghost));
  assert.equal(eighth.hearts, 3);
  assert.equal(eighth.power, 0);
});

test("normal ghost collision loses one heart, respawns, and grants brief grace", () => {
  const state = createMazeSession(words(10), "normal", seeded(4));
  const beside = mazeNeighborsAt(state.maze, state.player)[0];
  const hit = stepMazeSession({ ...state, ghost: beside }, directionBetween(state.player, beside));
  assert.equal(hit.hearts, 2);
  assert.deepEqual(hit.player, state.start || state.maze.start);
  assert.ok(hit.grace > 0);
  assert.ok(mazeDistances(state.maze, hit.player).get(mazeKey(hit.ghost)) >= 5);
});

test("boss has three HP and prioritises missed words without immediate repeat", () => {
  const vocabulary = words(10);
  const state = createMazeSession(vocabulary, "normal", seeded(8));
  const missedId = vocabulary[2].id;
  const withMiss = { ...state, retryPool: new Map([[missedId, { wordId: missedId, wrongCount: 1, lastAttemptIndex: 1 }]]), wrongEver: new Set([missedId]) };
  assert.equal(chooseBossWord(withMiss, seeded(2)).id, missedId);
  assert.notEqual(chooseBossWord({ ...withMiss, bossLastWordId: missedId }, seeded(2)).id, missedId);
  const bossQuestion = { kind: "boss", wordId: missedId, detail: buildV2MazeQuestion(vocabulary[2], vocabulary, seeded(2)), feedback: null };
  const correct = answerMazeSession({ ...withMiss, question: bossQuestion }, true);
  assert.equal(correct.bossHp, 2);
  assert.equal(correct.score, state.score + 150);
  const wrong = answerMazeSession({ ...withMiss, question: bossQuestion }, false);
  assert.equal(wrong.bossHp, 3);
  assert.equal(wrong.hearts, 2);
});

test("three correct boss responses end the final level and award perfect exploration", () => {
  const vocabulary = words(3);
  let state = createMazeSession(vocabulary, "relaxed", seeded(12));
  state = { ...state, attemptedPrimary: new Set(state.maze.primary.keys()) };
  for (let hp = 3; hp > 0; hp -= 1) {
    const target = vocabulary[hp - 1];
    state = { ...state, question: { kind: "boss", wordId: target.id,
      detail: buildV2MazeQuestion(target, vocabulary, seeded(hp)), feedback: null } };
    state = answerMazeSession(state, true);
    assert.equal(state.bossHp, hp - 1);
    state = continueMazeQuestion(state, seeded(hp));
  }
  assert.equal(state.phase, "mazecomplete");
  assert.equal(state.perfect, true);
  assert.equal(state.score, 3 * 150 + 300);
  assert.equal(state.levelStats.correct, 3);
  assert.equal(state.levelStats.total, 3);
});

test("Sentence Builder eligibility uses shared punctuation and repeated-token logic", () => {
  assert.ok(mazeQuestionModes(words(1)[0]).includes("SENTENCE_BUILDER"));
  assert.ok(!mazeQuestionModes({ id: "short", word: "take off", meaning: "remove" }).includes("SENTENCE_BUILDER"));
  const phrase = "Go, go home!";
  const tokens = tokenizeSentence(phrase);
  assert.deepEqual(tokens.map((tile) => tile.text), ["Go,", "go", "home!"]);
  assert.ok(isSentenceBuilderAnswerCorrect(tokens, phrase));
});

test("level completion and retry keep chunk boundaries", () => {
  const session = createMazeSession(words(21), "normal", seeded(7));
  assert.deepEqual(session.chunks.map((chunk) => chunk.length), [11, 10]);
  const next = nextMazeLevel({ ...session, phase: "levelcomplete", levelEndedAt: Date.now(), perfect: false }, seeded(8));
  assert.equal(next.levelIndex, 1);
  assert.equal(next.words.length, 10);
  assert.equal(next.hearts, 3);
  const retry = retryMazeLevel({ ...next, phase: "gameover", hearts: 0 }, seeded(9));
  assert.equal(retry.levelIndex, 1);
  assert.equal(retry.words.length, 10);
  assert.equal(retry.hearts, 3);
});
