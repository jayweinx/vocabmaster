import {
  chunkMazeWords, generateMazeGrid, isMazeFloor, mazeCadence, mazeDistances,
  mazeKey, mazeNeighborsAt, mazeShortestTilePath, mazeThreshold, sameTile,
} from "./mazeGenerator.js";
import { buildV2MazeQuestion, chooseBossWord, eligibleMazeRetries } from "./mazeQuestionHelpers.js";

const freshStats = () => ({ correct: 0, total: 0, primary: 0, mastered: 0, recovered: 0, wrong: 0 });
const addStats = (a, b) => Object.fromEntries(Object.keys(a).map((key) => [key, a[key] + b[key]]));
const copy = (state) => ({ ...state, levelStats: { ...state.levelStats } });
const notice = (state, message) => ({ ...state, notice: message });
const farGhost = (state, player) => {
  const distances = mazeDistances(state.maze, player);
  const candidates = [...distances.entries()]
    .filter(([id, distance]) => distance >= 5 && id !== mazeKey(state.maze.key))
    .sort((a, b) => b[1] - a[1]);
  const [x, y] = (candidates[0]?.[0] || mazeKey(state.maze.ghostStart)).split(",").map(Number);
  return { x, y };
};

const levelBase = (session, levelIndex, random = Math.random, retry = false) => {
  const words = session.chunks[levelIndex];
  const maze = generateMazeGrid(words, random);
  return {
    ...session,
    levelIndex,
    words,
    maze,
    phase: "playing",
    player: maze.start,
    checkpoint: maze.start,
    ghost: maze.ghostStart,
    ghostCountdown: mazeCadence(session.difficulty),
    power: 0,
    powerCollected: false,
    grace: 0,
    hearts: 3,
    combo: 0,
    bestCombo: retry ? session.bestComboAtLevelStart : session.bestCombo,
    score: retry ? session.scoreAtLevelStart : session.score,
    coins: retry ? session.coinsAtLevelStart : session.coins,
    scoreAtLevelStart: retry ? session.scoreAtLevelStart : session.score,
    coinsAtLevelStart: retry ? session.coinsAtLevelStart : session.coins,
    bestComboAtLevelStart: retry ? session.bestComboAtLevelStart : session.bestCombo,
    collectedDots: new Set(),
    collectedCoins: new Set(),
    attemptedPrimary: new Set(),
    mastered: new Set(),
    visitedReview: new Set(),
    retryPool: new Map(),
    wrongEver: new Set(),
    recovered: new Set(),
    encounterIndex: 0,
    keyCollected: false,
    bossHp: 3,
    bossLastWordId: null,
    question: null,
    levelStats: freshStats(),
    levelStartedAt: Date.now(),
    levelEndedAt: null,
    perfect: false,
    notice: "Find the key and clear challenges to reach the boss.",
  };
};

export const createMazeSession = (selectedWords, difficulty = "normal", random = Math.random) => {
  if (selectedWords.length < 3) throw new Error("Select at least three words");
  const chunks = chunkMazeWords(selectedWords);
  return levelBase({
    chunks,
    sessionWords: selectedWords,
    difficulty,
    score: 0,
    coins: 0,
    bestCombo: 0,
    totalStats: freshStats(),
    levelResults: [],
    sessionStartedAt: Date.now(),
  }, 0, random);
};

export const gateIsOpen = (state) => state.keyCollected &&
  state.attemptedPrimary.size >= mazeThreshold(state.words.length);

export const mazeObjective = (state) => {
  if (!state.keyCollected) return "Find the Boss Key";
  const left = mazeThreshold(state.words.length) - state.attemptedPrimary.size;
  if (left > 0) return `Clear ${left} more Challenge${left === 1 ? "" : "s"}`;
  return "Boss Gate unlocked!";
};

const collision = (state) => {
  if (state.power > 0) {
    return notice({ ...state, ghost: farGhost(state, state.player), score: state.score + 200 },
      "Frightened ghost defeated! +200");
  }
  if (state.grace > 0) return state;
  const hearts = Math.max(0, state.hearts - 1);
  return notice({
    ...state,
    hearts,
    combo: 0,
    phase: hearts ? "playing" : "gameover",
    player: state.checkpoint,
    ghost: farGhost(state, state.checkpoint),
    ghostCountdown: mazeCadence(state.difficulty),
    grace: 2,
  }, hearts ? "Ghost caught you! Respawned at checkpoint." : "Ghost Got You!");
};

const moveGhost = (state) => {
  const remaining = state.ghostCountdown - 1;
  if (remaining > 0) return { ...state, ghostCountdown: remaining };
  const current = state.ghost;
  let next = current;
  if (state.power > 0) {
    const distance = mazeDistances(state.maze, state.player, gateIsOpen(state));
    const options = mazeNeighborsAt(state.maze, current, gateIsOpen(state))
      .sort((a, b) => (distance.get(mazeKey(b)) ?? -1) - (distance.get(mazeKey(a)) ?? -1));
    next = options[0] || current;
  } else {
    next = mazeShortestTilePath(state.maze, current, state.player, gateIsOpen(state))[1] || current;
  }
  const moved = { ...state, ghost: next, ghostCountdown: mazeCadence(state.difficulty) };
  return sameTile(next, moved.player) ? collision(moved) : moved;
};

const openQuestion = (state, kind, word, random) => ({
  ...state,
  encounterIndex: state.encounterIndex + 1,
  question: {
    kind,
    wordId: word.id,
    detail: buildV2MazeQuestion(word, state.words, random,
      kind === "boss" && word.word.trim().split(/\s+/).length > 2 && random() < 0.55
        ? "SENTENCE_BUILDER" : null),
    feedback: null,
  },
});

export const stepMazeSession = (current, direction, random = Math.random) => {
  if (!current || current.phase !== "playing" || current.question || current.quitConfirm) return current;
  const vector = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }[direction];
  if (!vector) return current;
  const target = { x: current.player.x + vector[0], y: current.player.y + vector[1] };
  if (!isMazeFloor(current.maze, target, gateIsOpen(current))) {
    if (sameTile(target, current.maze.gate)) return notice(current, mazeObjective(current));
    return current;
  }
  let state = copy(current);
  const id = mazeKey(target);
  state.player = target;
  state.grace = Math.max(0, state.grace - 1);
  const priorPower = state.power;
  if (state.maze.dots.has(id) && !state.collectedDots.has(id)) {
    state.collectedDots = new Set(state.collectedDots).add(id);
    state.score += 5;
  }
  if (state.maze.coins.has(id) && !state.collectedCoins.has(id)) {
    state.collectedCoins = new Set(state.collectedCoins).add(id);
    state.coins += 1;
    state.score += 25;
    state.notice = "Coin found! +25";
  }
  if (sameTile(target, state.maze.key) && !state.keyCollected) {
    state.keyCollected = true;
    state.notice = "Boss Key Found!";
  }
  if (sameTile(target, state.maze.power) && !state.powerCollected) {
    state.powerCollected = true;
    state.power = 8;
    state.notice = "Power! Ghost is frightened for 8 steps.";
  }
  if (sameTile(target, state.maze.checkpoint)) {
    state.checkpoint = target;
    state.notice = "Checkpoint activated!";
  }
  if (sameTile(state.ghost, target)) state = collision(state);
  else state = moveGhost(state);
  // Resolve collision and frightened routing on the eighth powered step,
  // then expire the power for the following movement.
  if (priorPower > 0) state.power = Math.max(0, priorPower - 1);
  if (state.phase !== "playing" || !sameTile(state.player, target)) return state;
  if (sameTile(target, state.maze.boss)) {
    return openQuestion(state, "boss", chooseBossWord(state, random), random);
  }
  if (state.maze.primary.has(id) && !state.attemptedPrimary.has(id)) {
    const word = state.words.find((item) => item.id === state.maze.primary.get(id));
    return openQuestion(state, "primary", word, random);
  }
  if (state.maze.review.has(id) && !state.visitedReview.has(id)) {
    state.visitedReview = new Set(state.visitedReview).add(id);
    const eligible = eligibleMazeRetries(state.retryPool, state.encounterIndex);
    if (eligible.length) {
      const entry = eligible[0];
      const word = state.words.find((item) => item.id === entry.wordId);
      return openQuestion(state, "review", word, random);
    }
    state.score += 25;
    state.coins += 1;
    state.notice = "No review needed! Bonus coin +25";
  }
  return state;
};

export const answerMazeSession = (current, correct) => {
  if (!current?.question || current.question.feedback !== null || current.phase !== "playing") return current;
  const state = copy(current);
  const { kind, wordId } = state.question;
  state.levelStats.total += 1;
  if (correct) {
    state.levelStats.correct += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
  } else {
    state.levelStats.wrong += 1;
    state.hearts = Math.max(0, state.hearts - 1);
    state.combo = 0;
    state.wrongEver = new Set(state.wrongEver).add(wordId);
  }
  let message;
  if (kind === "primary") {
    state.attemptedPrimary = new Set(state.attemptedPrimary).add(mazeKey(state.player));
    state.levelStats.primary += 1;
    if (correct) {
      state.mastered = new Set(state.mastered).add(wordId);
      state.levelStats.mastered += 1;
      state.score += 100;
      message = "Correct! +100";
    } else {
      const previous = state.retryPool.get(wordId);
      state.retryPool = new Map(state.retryPool).set(wordId, {
        wordId, wrongCount: (previous?.wrongCount || 0) + 1,
        encounterIndex: previous?.encounterIndex ?? state.encounterIndex,
        lastAttemptIndex: state.encounterIndex, recovered: false,
      });
      message = "Not quite. Review it later. −1 heart";
    }
  } else if (kind === "review") {
    if (correct) {
      state.retryPool = new Map(state.retryPool);
      state.retryPool.delete(wordId);
      state.recovered = new Set(state.recovered).add(wordId);
      state.levelStats.recovered += 1;
      state.score += 60;
      message = "Recovered! +60";
    } else {
      const entry = state.retryPool.get(wordId);
      state.retryPool = new Map(state.retryPool).set(wordId, {
        ...entry, wrongCount: entry.wrongCount + 1, lastAttemptIndex: state.encounterIndex,
      });
      message = "Keep practising. −1 heart";
    }
  } else {
    state.bossLastWordId = wordId;
    if (correct) {
      state.bossHp -= 1;
      state.score += 150;
      message = `Boss hit! +150 · ${state.bossHp} HP left`;
    } else message = "Boss holds on. −1 heart";
  }
  state.question = { ...state.question, feedback: { correct, message } };
  return state;
};

export const continueMazeQuestion = (current, random = Math.random) => {
  if (!current?.question?.feedback) return current;
  const state = { ...current, question: null };
  if (state.hearts === 0) return { ...state, phase: "gameover" };
  if (current.question.kind !== "boss") return state;
  if (state.bossHp > 0) return openQuestion(state, "boss", chooseBossWord(state, random), random);
  const perfect = state.attemptedPrimary.size === state.words.length;
  const reward = perfect ? 300 : 0;
  return {
    ...state,
    phase: state.levelIndex === state.chunks.length - 1 ? "mazecomplete" : "levelcomplete",
    score: state.score + reward,
    perfect,
    notice: perfect ? "Perfect Exploration! +300" : "Level complete!",
    levelEndedAt: Date.now(),
  };
};

export const nextMazeLevel = (current, random = Math.random) => {
  if (current.phase !== "levelcomplete") return current;
  const result = {
    ...current.levelStats,
    level: current.levelIndex + 1,
    duration: current.levelEndedAt - current.levelStartedAt,
    perfect: current.perfect,
    needsReview: current.retryPool.size,
  };
  return levelBase({
    ...current,
    totalStats: addStats(current.totalStats, current.levelStats),
    levelResults: [...current.levelResults, result],
  }, current.levelIndex + 1, random);
};

export const retryMazeLevel = (current, random = Math.random) => {
  if (current.phase !== "gameover") return current;
  return levelBase(current, current.levelIndex, random, true);
};

export const mazeSessionStats = (state) => addStats(state.totalStats, state.levelStats);
