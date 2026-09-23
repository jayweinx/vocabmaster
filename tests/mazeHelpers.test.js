import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMazeQuestion,
  generateMazeGraph,
  MAZE_TTS_LANG,
  mazeEdgeKey,
  mazeReachableWithout,
  mazeShortestPath,
  meaningKey,
  meaningLines,
} from "../src/games/mazeHelpers.js";

const words = [
  { id: "one", word: "ancient", meaning: "very old", mandarin: "古老的" },
  { id: "two", word: "brave", meaning: "showing courage", mandarin: "勇敢的" },
  { id: "three", word: "calm", meaning: "peaceful", mandarin: "平静的" },
  { id: "four", word: "distant", meaning: "far away", mandarin: "遥远的" },
];

const requiredVocabulary = [
  {
    id: "overspending",
    word: "overspending",
    meaning: "spending too much",
    mandarin: "过度消费",
  },
  {
    id: "eco-reserve",
    word: "eco reserve",
    meaning: "a protected natural area",
    mandarin: "生态保护区",
  },
  {
    id: "checkout-reflection",
    word: "Before clicking “Checkout”, ask yourself: Would I buy this at full price?",
    meaning: "a reminder to pause before buying something on sale",
    mandarin: "结账前先问自己：原价时我还会买吗？",
  },
];

test("maze graph is connected and has stable edge keys", () => {
  const graph = generateMazeGraph(12);
  assert.equal(graph.nodes.length, 13);
  assert.equal(mazeEdgeKey(9, 2), "2-9");
  graph.nodes.forEach((node) =>
    assert.ok(mazeShortestPath(graph, graph.startId, node.id).length),
  );
  assert.ok(graph.nodes.some((node) => node.type === "boss"));
});

test("English meaning is ordered before Mandarin and question options are identity-based", () => {
  assert.deepEqual(meaningLines(words[0]), ["very old", "古老的"]);
  const question = buildMazeQuestion({ type: "dot" }, words, null);
  assert.equal(question.mode, "WORD_TO_MEANING");
  assert.ok(
    question.options.some((option) => option.id === question.correctId),
  );
});

test("monster and boss create three-pair matching challenges", () => {
  const question = buildMazeQuestion({ type: "monster" }, words, null);
  assert.equal(question.mode, "MATCH");
  assert.equal(question.pairs.length, 3);
  assert.equal(question.meanings.length, 3);
  assert.equal(
    new Set(question.pairs.map((word) => word.word.toLowerCase())).size,
    3,
  );
  assert.equal(new Set(question.pairs.map(meaningKey)).size, 3);
});

test("ambiguous matching falls back to a normal identity question", () => {
  const ambiguous = [
    { id: "a", word: "same", meaning: "one meaning", mandarin: "同义" },
    {
      id: "b",
      word: "same",
      meaning: "another meaning",
      mandarin: "另一个意思",
    },
    { id: "c", word: "third", meaning: "one meaning", mandarin: "同义" },
  ];
  assert.notEqual(
    buildMazeQuestion({ type: "monster" }, ambiguous).mode,
    "MATCH",
  );
});

test("special node question modes keep visible distractors distinct", () => {
  assert.equal(
    buildMazeQuestion({ type: "key" }, words).mode,
    "MEANING_TO_WORD",
  );
  assert.equal(
    buildMazeQuestion({ type: "power" }, words).mode,
    "AUDIO_TO_MEANING",
  );
  const question = buildMazeQuestion({ type: "dot" }, words);
  assert.equal(
    new Set(question.options.map(meaningKey)).size,
    question.options.length,
  );
});

test("required long vocabulary records preserve word prompts and two-line meanings", () => {
  assert.equal(MAZE_TTS_LANG, "en-US");
  requiredVocabulary.forEach((word) => {
    assert.deepEqual(meaningLines(word), [word.meaning, word.mandarin]);
    assert.ok(
      !meaningLines(word)
        .join("\n")
        .match(/undefined|null|^\s*$/i),
    );
  });
  const wordToMeaning = buildMazeQuestion({ type: "dot" }, [
    requiredVocabulary[0],
  ]);
  assert.equal(wordToMeaning.mode, "WORD_TO_MEANING");
  assert.equal(wordToMeaning.target.word, "overspending");
  const meaningToWord = buildMazeQuestion({ type: "key" }, [
    requiredVocabulary[2],
  ]);
  assert.equal(meaningToWord.mode, "MEANING_TO_WORD");
  assert.ok(
    meaningToWord.options.some(
      (option) => option.word === requiredVocabulary[2].word,
    ),
  );
  assert.ok(
    requiredVocabulary[2].word.includes("Would I buy this at full price?"),
  );
  const ecoQuestion = buildMazeQuestion({ type: "dot" }, [
    requiredVocabulary[1],
  ]);
  assert.equal(ecoQuestion.target.word, "eco reserve");
  assert.deepEqual(meaningLines(ecoQuestion.target), [
    "a protected natural area",
    "生态保护区",
  ]);
  const audioQuestion = buildMazeQuestion({ type: "power" }, [
    requiredVocabulary[0],
  ]);
  assert.equal(audioQuestion.mode, "AUDIO_TO_MEANING");
  assert.equal(audioQuestion.target.word, "overspending");
});

test("randomized mazes never lock the key or isolate non-boss objectives", () => {
  const assertGraph = (graph) => {
    const boss = graph.bossId;
    const gate = graph.nodes.find((node) => node.type === "gate")?.id;
    const key = graph.nodes.find((node) => node.type === "key")?.id;
    const blockedBoss = new Set([boss]);
    graph.nodes
      .filter((node) => node.id !== boss)
      .forEach((node) =>
        assert.ok(
          mazeReachableWithout(graph, graph.startId, node.id, blockedBoss),
        ),
      );
    const blocked = new Set([boss, gate].filter((id) => id != null));
    graph.nodes
      .filter((node) => node.id !== boss && node.id !== gate)
      .forEach((node) =>
        assert.ok(mazeReachableWithout(graph, graph.startId, node.id, blocked)),
      );
    if (key != null)
      assert.ok(mazeReachableWithout(graph, graph.startId, key, blocked));
    if (graph.nodes.length - 1 >= 8) {
      assert.equal(
        graph.nodes.filter((node) => node.type === "gate").length,
        1,
      );
      assert.equal(graph.nodes.filter((node) => node.type === "key").length, 1);
    }
    if (graph.nodes.length - 1 >= 10) {
      const portals = graph.nodes.filter((node) => node.type === "portal");
      assert.equal(portals.length, 2);
      assert.equal(graph.portalPair[portals[0].id], portals[1].id);
      assert.equal(graph.portalPair[portals[1].id], portals[0].id);
    }
  };
  for (let run = 0; run < 2000; run += 1) assertGraph(generateMazeGraph(8));
  [5, 10, 15, 20, 30].forEach((size) => {
    for (let run = 0; run < 250; run += 1) assertGraph(generateMazeGraph(size));
  });
});
