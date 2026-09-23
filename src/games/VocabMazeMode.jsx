import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Folder,
  Volume2,
} from "lucide-react";
import {
  buildMazeQuestion,
  generateMazeGraph,
  MAZE_TTS_LANG,
  mazeDescendantFolderIds,
  mazeEdgeKey,
  mazeFolderPath,
  mazeFolderUsableWords,
  mazeNeighbors,
  mazeShortestPath,
  meaningLines,
  shuffle,
  usableMazeWord,
} from "./mazeHelpers";

const speak = (text) => {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = MAZE_TTS_LANG;
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
};
const meta = (type) =>
  ({
    start: ["🏁", "#4f46e5"],
    dot: ["", "#fff"],
    coin: ["🪙", "#fef3c7"],
    heart: ["❤️", "#ffe4e6"],
    key: ["🔑", "#fef9c3"],
    gate: ["🔒", "#e5e7eb"],
    power: ["⚡", "#dbeafe"],
    portal: ["🌀", "#ede9fe"],
    monster: ["👾", "#fee2e2"],
    boss: ["👑", "#fae8ff"],
  })[type] || ["", "#fff"];
const Meaning = ({ word }) => (
  <span>
    {meaningLines(word).map((line, index) => (
      <span key={`${line}-${index}`} className="block break-words">
        {line}
      </span>
    ))}
  </span>
);

function Setup({
  words,
  folders,
  onStart,
  onBack,
  topRef,
  folderId,
  setFolderId,
  step,
  setStep,
  selected,
  setSelected,
}) {
  const ids = useMemo(
    () => mazeDescendantFolderIds(folders, folderId),
    [folders, folderId],
  );
  const candidates = useMemo(
    () =>
      words
        .filter(usableMazeWord)
        .filter((word) => ids && ids.has(word.folderId)),
    [words, ids],
  );
  const picked = candidates.filter((word) => selected.has(word.id));
  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const current = folders.find((folder) => folder.id === folderId);
  const children = folders.filter(
    (folder) => (folder.parentId || null) === (folderId || null),
  );
  const path = folderId
    ? mazeFolderPath(folders, folderId).join(" › ")
    : "All Folders";
  const count = (id) => mazeFolderUsableWords(words, folders, id).length;
  const changeFolder = (id) => {
    setFolderId(id);
    setSelected(new Set());
  };

  if (step === "folders") {
    return (
      <div
        ref={topRef}
        className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe"
      >
        <div className="mx-auto max-w-6xl">
          <button
            onClick={
              folderId
                ? () => changeFolder(current?.parentId || null)
                : onBack
            }
            className="mb-5 inline-flex items-center gap-2 font-black text-gray-500"
          >
            <ChevronLeft size={20} />
            {folderId ? "Back" : "Back to Games"}
          </button>
          <p className="text-sm font-bold text-indigo-600">Mazes › {path}</p>
          <h2 className="text-3xl font-black text-gray-800">Vocab Maze</h2>
          <p className="mt-2 text-gray-500">
            Choose a vocabulary folder for your maze.
          </p>
          <span className="mt-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">
            MAZES
          </span>
          {current && (
            <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black">{current.name}</h3>
              <p className="text-gray-500">
                {candidates.length} usable words
              </p>
              <button
                disabled={candidates.length < 3}
                onClick={() => setStep("words")}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-40"
              >
                Select Words
              </button>
            </div>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {children.map((folder) => (
              <button
                key={folder.id}
                onClick={() => changeFolder(folder.id)}
                className={`rounded-3xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                  count(folder.id)
                    ? "border-indigo-100"
                    : "border-gray-100 opacity-60"
                }`}
              >
                <Folder className="text-indigo-600" size={32} />
                <strong className="mt-4 block text-xl">{folder.name}</strong>
                <span className="mt-2 block text-gray-500">
                  {count(folder.id)} words
                </span>
                <span className="mt-3 flex items-center gap-1 font-black text-indigo-600">
                  Open Folder <ChevronRight size={16} />
                </span>
              </button>
            ))}
          </div>
          {folderId && !children.length && !candidates.length && (
            <p className="mt-6 rounded-2xl bg-white p-6 text-center text-gray-500">
              No usable vocabulary in this folder yet.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === "words") {
    return (
      <div
        ref={topRef}
        className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe"
      >
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => setStep("folders")}
            className="mb-5 inline-flex items-center gap-2 font-black text-gray-500 hover:text-indigo-600"
          >
            <ChevronLeft size={20} /> Back to {current?.name || "folder"}
          </button>
          <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
            <header className="p-6 sm:p-8">
              <h2 className="text-3xl font-black">
                Select Words for Maze
              </h2>
              <p className="mt-2 text-gray-500">
                Folder: {path} · {candidates.length} usable words
              </p>
            </header>
            <div className="p-5 sm:p-7">
              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-gray-800">
                    Select words
                  </h3>
                  <p className="text-sm text-gray-500">
                    {picked.length} selected · at least 3 required
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSelected(
                      candidates.length > 0 &&
                        selected.size === candidates.length
                        ? new Set()
                        : new Set(candidates.map((word) => word.id)),
                    )
                  }
                  className="rounded-xl bg-indigo-50 px-4 py-2 font-black text-indigo-600"
                >
                  {candidates.length > 0 &&
                  selected.size === candidates.length
                    ? "Clear all"
                    : "Select all"}
                </button>
              </div>
              {candidates.length >= 50 && (
                <p className="mt-3 text-sm font-bold text-amber-700">
                  For the best Maze experience, 10–30 words is recommended.
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {candidates.map((word) => (
                  <label
                    key={word.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-3 hover:bg-indigo-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(word.id)}
                      onChange={() => toggle(word.id)}
                      className="mt-1 h-5 w-5 accent-indigo-600"
                    />
                    <span className="min-w-0">
                      <strong className="block break-words text-gray-800">
                        {word.word}
                      </strong>
                      <span className="mt-1 block text-sm text-gray-500">
                        <Meaning word={word} />
                      </span>
                    </span>
                  </label>
                ))}
                {!candidates.length && (
                  <p className="rounded-xl bg-gray-50 p-6 text-center font-bold text-gray-400">
                    No usable vocabulary is available in this folder.
                  </p>
                )}
              </div>
              <button
                disabled={picked.length < 3}
                onClick={() => onStart(picked)}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continue to Maze Setup
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }
}

function Question({ question, hearts, onChoice, onMatches, answerState }) {
  const [chosenWord, setChosenWord] = useState(null);
  const [matches, setMatches] = useState({});
  const [chosenOption, setChosenOption] = useState(null);
  useEffect(() => {
    if (question?.mode === "AUDIO_TO_MEANING")
      window.setTimeout(() => speak(question.target.word), 180);
  }, [question]);
  useEffect(() => {
    setChosenWord(null);
    setMatches({});
    setChosenOption(null);
  }, [question]);
  if (question.mode === "MATCH")
    return (
      <div>
        <p className="text-center text-xl font-black">
          Match each English word to its meaning
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {question.pairs.map((word) => (
              <button
                key={word.id}
                disabled={Boolean(answerState)}
                onClick={() => setChosenWord(word.id)}
                className={`w-full rounded-xl border-2 p-3 text-left font-black ${chosenWord === word.id ? "border-indigo-500 bg-indigo-50" : matches[word.id] ? "border-emerald-300 bg-emerald-50" : "border-gray-200"}`}
              >
                {word.word}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {question.meanings.map((word) => (
              <button
                key={word.id}
                disabled={!chosenWord || Boolean(answerState)}
                onClick={() => {
                  setMatches((current) => {
                    const next = { ...current };
                    Object.keys(next).forEach((id) => {
                      if (next[id] === word.id) delete next[id];
                    });
                    next[chosenWord] = word.id;
                    return next;
                  });
                  setChosenWord(null);
                }}
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-left font-bold disabled:opacity-45"
              >
                <Meaning word={word} />
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={Boolean(answerState)}
          onClick={() =>
            onMatches(
              question.pairs.every((word) => matches[word.id] === word.id),
              question.pairs.every((word) => matches[word.id]),
            )
          }
          className="mt-5 w-full rounded-xl bg-indigo-600 py-4 font-black text-white"
        >
          Check Matches
        </button>
        {answerState === "wrong" && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">
            Correct mapping:{" "}
            {question.pairs
              .map((word) => `${word.word} → ${meaningLines(word).join(" / ")}`)
              .join(" · ")}
          </p>
        )}
      </div>
    );
  const meaningMode = question.mode !== "MEANING_TO_WORD";
  return (
    <div>
      <div className="mb-5 text-center">
        {question.mode === "WORD_TO_MEANING" && (
          <>
            <p className="text-xs font-black uppercase text-gray-400">
              Choose the correct meaning
            </p>
            <h4 className="mt-2 break-words text-4xl font-black">
              {question.target.word}
            </h4>
            <button
              onClick={() => speak(question.target.word)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 font-black text-indigo-600"
            >
              <Volume2 size={20} /> Listen
            </button>
          </>
        )}
        {question.mode === "MEANING_TO_WORD" && (
          <>
            <p className="text-xs font-black uppercase text-gray-400">
              Which English word matches?
            </p>
            <div className="mx-auto mt-3 max-w-xl rounded-xl bg-indigo-50 p-4 text-xl font-black text-indigo-900">
              <Meaning word={question.target} />
            </div>
          </>
        )}
        {question.mode === "AUDIO_TO_MEANING" && (
          <>
            <p className="text-xs font-black uppercase text-gray-400">
              Listen and choose the meaning
            </p>
            <button
              onClick={() => speak(question.target.word)}
              className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600 text-white"
            >
              <Volume2 size={38} />
            </button>
          </>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <button
            key={option.id}
            disabled={Boolean(answerState)}
            onClick={() => {
              setChosenOption(option.id);
              onChoice(option.id === question.correctId);
            }}
            className={`flex min-h-24 items-start gap-3 rounded-2xl border-2 p-4 text-left font-black disabled:opacity-70 ${answerState && option.id === question.correctId ? "border-emerald-500 bg-emerald-50" : answerState === "wrong" && chosenOption === option.id ? "border-red-500 bg-red-50" : "border-gray-100 hover:border-indigo-300"}`}
          >
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{meaningMode ? <Meaning word={option} /> : option.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VocabMazeMode({
  words,
  folders,
  username,
  setIsDirty,
  onBackToGames,
}) {
  const [phase, setPhase] = useState("setup");
  const [setupFolderId, setSetupFolderId] = useState(null);
  const [setupStep, setSetupStep] = useState("folders");
  const [setupSelected, setSetupSelected] = useState(() => new Set());
  const [activeWords, setActiveWords] = useState([]),
    [baseDots, setBaseDots] = useState(() =>
      Number(localStorage.getItem("evm_maze_dots") || 10),
    ),
    [difficulty, setDifficulty] = useState(
      () => localStorage.getItem("evm_maze_difficulty") || "normal",
    ),
    [level, setLevel] = useState(1),
    [graph, setGraph] = useState(null),
    [player, setPlayer] = useState(0),
    [ghost, setGhost] = useState(null),
    [ghostMoves, setGhostMoves] = useState(0),
    [collected, setCollected] = useState(() => new Set()),
    [edges, setEdges] = useState(() => new Set()),
    [hearts, setHearts] = useState(3),
    [coins, setCoins] = useState(0),
    [score, setScore] = useState(0),
    [combo, setCombo] = useState(0),
    [key, setKey] = useState(false),
    [power, setPower] = useState(0),
    [challenge, setChallenge] = useState(null),
    [answers, setAnswers] = useState({ correct: 0, total: 0 }),
    [notice, setNotice] = useState(""),
    [best, setBest] = useState(() =>
      Number(localStorage.getItem("evm_maze_best") || 0),
    );
  const lastWord = useRef(null);
  const topRef = useRef(null);
  const dots = Math.max(5, Math.min(30, Number(baseDots) || 10));
  const every =
    difficulty === "relaxed" ? 3 : difficulty === "challenge" ? 1 : 2;
  const node = (id) => graph?.nodes.find((item) => item.id === id);
  const neighbors = useMemo(
    () => mazeNeighbors(graph, player),
    [graph, player],
  );
  const bossOpen =
    graph &&
    graph.nodes
      .filter((item) => item.id && item.id !== graph.bossId)
      .every((item) => collected.has(item.id));
  useEffect(() => {
    setIsDirty?.(phase === "playing");
    return () => setIsDirty?.(false);
  }, [phase, setIsDirty]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const start = (nextLevel, fresh = false) => {
    const next = generateMazeGraph(Math.min(30, dots + (nextLevel - 1) * 2));
    setLevel(nextLevel);
    setGraph(next);
    setPlayer(0);
    setGhost(next.ghostStart);
    setGhostMoves(0);
    setCollected(new Set());
    setEdges(new Set());
    setHearts(3);
    setCombo(0);
    setKey(false);
    setPower(0);
    setChallenge(null);
    lastWord.current = null;
    if (fresh) {
      setScore(0);
      setCoins(0);
      setAnswers({ correct: 0, total: 0 });
    }
    setPhase("playing");
  };
  const saveBest = (value) => {
    if (value > best) {
      setBest(value);
      localStorage.setItem("evm_maze_best", String(value));
    }
  };
  const loseHeart = (message, delay = 350) => {
    const nextHearts = Math.max(0, hearts - 1);
    setHearts(nextHearts);
    setCombo(0);
    setNotice(message);
    if (nextHearts === 0) {
      saveBest(score);
      window.setTimeout(() => setPhase("gameover"), delay);
    }
  };
  const respawn = (at) =>
    graph.nodes
      .filter((item) => item.id !== at && item.id !== graph.bossId)
      .sort(
        (a, b) =>
          mazeShortestPath(graph, b.id, at).length -
          mazeShortestPath(graph, a.id, at).length,
      )[0]?.id;
  // The move that collected Power passes 4 here before React has committed state.
  const ghostStep = (at, powerOverride = power) => {
    let nextPower = powerOverride;
    let nextGhost = ghost;
    if (nextGhost === at) {
      if (nextPower) {
        setScore((value) => value + 60);
        setCoins((value) => value + 15);
        nextGhost = respawn(at);
        nextPower -= 1;
        setNotice("⚡ Ghost eaten! +60");
      } else {
        loseHeart("👻 Ghost caught you! -1 heart");
        nextGhost = respawn(at);
      }
      setGhost(nextGhost);
      setPower(nextPower);
      setGhostMoves(0);
      return;
    }
    const count = ghostMoves + 1;
    if (count >= every) {
      const path = mazeShortestPath(graph, nextGhost, at);
      nextGhost = path[1] ?? nextGhost;
      setGhostMoves(0);
    } else setGhostMoves(count);
    if (nextGhost === at && nextPower > 0) {
      setScore((value) => value + 60);
      setCoins((value) => value + 15);
      setGhost(respawn(at));
      setPower(Math.max(0, nextPower - 1));
      setNotice("⚡ Ghost eaten! +60");
      return;
    }
    if (nextGhost === at) {
      loseHeart("👻 Ghost caught you! -1 heart");
      setGhost(respawn(at));
      setPower(nextPower);
      return;
    }
    if (nextPower) nextPower -= 1;
    setGhost(nextGhost);
    setPower(nextPower);
  };
  const move = (destination, cleared) => {
    const original = player;
    let final = destination.id;
    let nextPower = power;
    setEdges((current) =>
      new Set(current).add(mazeEdgeKey(original, destination.id)),
    );
    if (
      destination.type === "portal" &&
      graph.portalPair[destination.id] != null
    ) {
      final = graph.portalPair[destination.id];
      setEdges((current) =>
        new Set(current).add(mazeEdgeKey(destination.id, final)),
      );
      setNotice("🌀 Portal jump!");
    }
    if (cleared) {
      const nextCollected = new Set(collected).add(destination.id);
      if (
        destination.type === "portal" &&
        graph.portalPair[destination.id] != null
      ) {
        nextCollected.add(final);
      }
      setCollected(nextCollected);
      let reward = 10 + Math.min(combo * 2, 16);
      if (destination.type === "coin") {
        reward += 20;
        setCoins((value) => value + 25);
      }
      if (destination.type === "heart")
        setHearts((value) => Math.min(5, value + 1));
      if (destination.type === "key") setKey(true);
      if (destination.type === "power") {
        nextPower = 4;
        setPower(nextPower);
      }
      if (destination.type === "monster") reward += 20;
      if (destination.type === "boss") reward += 55;
      setCoins((value) => value + (destination.type === "coin" ? 0 : 5));
      const finalScore = score + reward;
      setScore((value) => value + reward);
      if (
        graph.nodes
          .filter((item) => item.id)
          .every((item) => nextCollected.has(item.id))
      ) {
        saveBest(finalScore);
        window.setTimeout(() => setPhase("complete"), 520);
      }
    }
    setPlayer(final);
    window.setTimeout(() => ghostStep(final, nextPower), 100);
  };
  const open = (destination) => {
    if (!neighbors.includes(destination.id) || challenge) return;
    if (destination.type === "gate" && !key && !collected.has(destination.id))
      return setNotice("🔒 Find the key first.");
    if (
      destination.type === "boss" &&
      !bossOpen &&
      !collected.has(destination.id)
    ) {
      const remaining = graph.nodes.filter(
        (item) =>
          item.id && item.id !== graph.bossId && !collected.has(item.id),
      ).length;
      return setNotice(
        `👑 Boss locked: clear ${remaining} more challenge${remaining === 1 ? "" : "s"}.`,
      );
    }
    if (collected.has(destination.id)) return move(destination, false);
    const next = buildMazeQuestion(destination, activeWords, lastWord.current);
    lastWord.current = next?.target?.id;
    setChallenge({ node: destination, question: next, state: null });
  };
  useEffect(() => {
    if (phase !== "playing" || challenge) return;
    const listener = (event) => {
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;
      event.preventDefault();
      const current = node(player);
      const vector = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      }[event.key];
      const target = neighbors
        .map(node)
        .filter(Boolean)
        .map((item) => ({
          item,
          dx: item.x - current.x,
          dy: item.y - current.y,
        }))
        .filter((item) => item.dx * vector[0] + item.dy * vector[1] > 5)
        .sort(
          (a, b) =>
            b.dx * vector[0] +
            b.dy * vector[1] -
            (a.dx * vector[0] + a.dy * vector[1]),
        )[0]?.item;
      target ? open(target) : setNotice("No connected dot in that direction.");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [phase, challenge, player, neighbors, graph, key, bossOpen, collected]);
  const answer = (correct, complete = true) => {
    if (!complete) return setNotice("Match all three pairs first.");
    setAnswers((value) => ({
      correct: value.correct + (correct ? 1 : 0),
      total: value.total + 1,
    }));
    if (correct) {
      setCombo((value) => value + 1);
      setChallenge((current) => ({ ...current, state: "correct" }));
      window.setTimeout(() => {
        const destination = challenge.node;
        setChallenge(null);
        move(destination, true);
      }, 520);
    } else {
      loseHeart("❌ Wrong answer. -1 heart", 450);
      setChallenge((current) => ({ ...current, state: "wrong" }));
      window.setTimeout(
        () =>
          setChallenge((current) =>
            current
              ? (() => {
                  const nextQuestion = buildMazeQuestion(
                    current.node,
                    activeWords,
                    lastWord.current,
                  );
                  lastWord.current =
                    nextQuestion?.target?.id || lastWord.current;
                  return { ...current, state: null, question: nextQuestion };
                })()
              : null,
          ),
        800,
      );
    }
  };
  if (phase === "setup")
    return (
      <Setup
        words={words}
        folders={folders}
        onStart={(selected) => {
          setActiveWords(shuffle(selected));
          setPhase("options");
        }}
        onBack={onBackToGames}
        topRef={topRef}
        folderId={setupFolderId}
        setFolderId={setSetupFolderId}
        step={setupStep}
        setStep={setSetupStep}
        selected={setupSelected}
        setSelected={setSetupSelected}
      />
    );
  if (phase === "options")
    return (
      <div ref={topRef} className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => {
              setSetupStep("words");
              setPhase("setup");
            }}
            className="mb-5 inline-flex items-center gap-2 font-black text-gray-500"
          >
            <ChevronLeft size={20} /> Back to words
          </button>
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-black text-gray-800">
              Vocab Maze setup
            </h2>
            <p className="mt-2 text-gray-500">
              Level 1 dots, ghost cadence, and special routes.
            </p>
            <p className="mt-6 text-sm font-black uppercase text-gray-500">
              Dots in Level 1
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[5, 8, 10, 15, 20, 30].map((value) => (
                <button
                  key={value}
                  onClick={() => setBaseDots(value)}
                  className={`rounded-xl border-2 py-3 font-black ${dots === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200 text-gray-600"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <label className="mt-4 block font-bold text-gray-600">
              Custom (5–30)
              <input
                type="number"
                min="5"
                max="30"
                value={baseDots}
                onChange={(event) => setBaseDots(event.target.value)}
                className="ml-3 w-24 rounded-xl border-2 border-gray-200 px-3 py-2 font-black"
              />
            </label>
            <p className="mt-6 text-sm font-black uppercase text-gray-500">
              Ghost difficulty
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["relaxed", "Relaxed", "Every 3 moves"],
                ["normal", "Normal", "Every 2 moves"],
                ["challenge", "Challenge", "Every move"],
              ].map(([id, title, copy]) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={`rounded-xl border-2 p-4 text-left ${difficulty === id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}
                >
                  <strong>{title}</strong>
                  <span className="mt-1 block text-sm text-gray-500">
                    {copy}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                localStorage.setItem("evm_maze_dots", String(dots));
                localStorage.setItem("evm_maze_difficulty", difficulty);
                start(1, true);
              }}
              className="mt-7 w-full rounded-xl bg-indigo-600 py-4 text-lg font-black text-white"
            >
              Start Level 1
            </button>
            <button
              onClick={onBackToGames}
              className="mt-4 w-full font-black text-gray-500"
            >
              ← Back to Games
            </button>
          </section>
        </div>
      </div>
    );
  if (phase !== "playing") {
    const accuracy = answers.total
      ? Math.round((answers.correct / answers.total) * 100)
      : 0;
    return (
      <div ref={topRef} className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-6xl">{phase === "complete" ? "🏆" : "👻"}</div>
          <h2 className="mt-4 text-4xl font-black text-gray-800">
            {phase === "complete" ? `Level ${level} Complete` : "Ghost Got You"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Score", score],
              ["Coins", coins],
              ["Accuracy", `${accuracy}%`],
              ["Best", Math.max(best, score)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-indigo-50 p-3">
                <small className="font-black uppercase text-indigo-400">
                  {label}
                </small>
                <strong className="block text-2xl text-indigo-900">
                  {value}
                </strong>
              </div>
            ))}
          </div>
          <button
            onClick={() => start(phase === "complete" ? level + 1 : level)}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-black text-white"
          >
            {phase === "complete" ? "Next Level" : "Retry Level"}
          </button>
          <button
            onClick={() => setPhase("options")}
            className="mt-3 w-full rounded-xl bg-gray-100 py-4 font-black text-gray-600"
          >
            New Maze Setup
          </button>
          <button
            onClick={onBackToGames}
            className="mt-4 font-black text-gray-500"
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }
  return (
    <div ref={topRef} className="h-full min-h-0 bg-slate-950 text-white">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 overflow-hidden bg-slate-900 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 font-black">
            <button
              onClick={onBackToGames}
              className="rounded-xl bg-slate-800 px-3 py-2"
            >
              ← Games
            </button>
            <button
              onClick={() => setPhase("options")}
              className="rounded-xl bg-slate-800 px-3 py-2"
            >
              Setup
            </button>
            <span>🕸️ L{level}</span>
            <span>❤️ {hearts}</span>
            <span>🪙 {coins}</span>
            <span>⭐ {score}</span>
            <span>
              ● {collected.size}/{graph.nodes.length - 1}
            </span>
            {combo > 1 && <span>🔥 x{combo}</span>}
            {key && <span>🔑</span>}
            {power > 0 && <span>⚡ {power}</span>}
          </div>
        </header>
        <main className="relative min-h-0 flex-1 p-2 sm:p-4">
          <div
            className="relative h-full overflow-hidden rounded-3xl border border-slate-700"
            style={{
              background:
                "radial-gradient(circle at 20% 20%,#312e81,#020617 60%)",
            }}
          >
            {notice && (
              <p className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-xl bg-white px-4 py-2 text-center text-sm font-black text-slate-800">
                {notice}
              </p>
            )}
            <svg viewBox="0 0 1000 620" className="h-full w-full">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {graph.edges.map(([a, b]) => (
                <line
                  key={mazeEdgeKey(a, b)}
                  x1={node(a).x}
                  y1={node(a).y}
                  x2={node(b).x}
                  y2={node(b).y}
                  stroke={edges.has(mazeEdgeKey(a, b)) ? "#818cf8" : "#475569"}
                  strokeWidth="5"
                />
              ))}
              {graph.nodes.map((item) => {
                const [icon, fill] = meta(item.type);
                const locked =
                  (item.type === "gate" && !key) ||
                  (item.type === "boss" && !bossOpen);
                const adjacent = neighbors.includes(item.id);
                const cleared = collected.has(item.id);
                return (
                  <g
                    key={item.id}
                    onClick={() => open(item)}
                    className={adjacent ? "cursor-pointer" : ""}
                  >
                    {adjacent && item.id !== player && (
                      <circle
                        cx={item.x}
                        cy={item.y}
                        r="36"
                        fill="none"
                        stroke="#a5b4fc"
                        strokeWidth="5"
                        filter="url(#glow)"
                      />
                    )}
                    <circle
                      cx={item.x}
                      cy={item.y}
                      r={item.type === "boss" ? 30 : 23}
                      fill={cleared ? "#14532d" : fill}
                      stroke={item.id === player ? "#facc15" : "#cbd5e1"}
                      strokeWidth="5"
                    />
                    <text
                      x={item.x}
                      y={item.y + 8}
                      textAnchor="middle"
                      fontSize="22"
                    >
                      {cleared ? "✓" : locked ? "🔒" : icon || "●"}
                    </text>
                  </g>
                );
              })}
              <text
                x={node(player).x}
                y={node(player).y - 34}
                textAnchor="middle"
                fontSize="34"
              >
                🧑‍🚀
              </text>
              {ghost != null && (
                <text
                  x={node(ghost).x}
                  y={node(ghost).y + 51}
                  textAnchor="middle"
                  fontSize="30"
                >
                  {power ? "😨" : "👻"}
                </text>
              )}
            </svg>
          </div>
          {challenge && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur">
              <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 text-gray-800 sm:p-7">
                <p className="text-sm font-black uppercase text-indigo-500">
                  Vocabulary challenge · ❤️ {hearts}
                </p>
                <Question
                  question={challenge.question}
                  hearts={hearts}
                  answerState={challenge.state}
                  onChoice={answer}
                  onMatches={answer}
                />
                {challenge.state && (
                  <p
                    className={`mt-4 rounded-xl p-3 text-center font-black ${challenge.state === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {challenge.state === "correct"
                      ? "Correct! Moving…"
                      : "Try a fresh challenge."}
                  </p>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
