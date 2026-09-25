import React, { useEffect, useRef, useState } from "react";
import { MazeFolderWords, MazeOptions } from "./MazePreGame.jsx";
import MazeBoard from "./MazeBoard.jsx";
import MazeDPad from "./MazeDPad.jsx";
import MazeHud from "./MazeHud.jsx";
import MazeChallengeModal from "./MazeChallengeModal.jsx";
import {
  answerMazeSession, continueMazeQuestion, createMazeSession, mazeSessionStats,
  nextMazeLevel, retryMazeLevel, stepMazeSession,
} from "./mazeSession.js";
import { shuffled } from "./mazeGenerator.js";

const duration = (milliseconds) => {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
};

function MazeResults({ state, best, username, onNext, onRetry, onPlayAgain, onChangeWords, onGames, topRef }) {
  const phase = state.phase;
  const total = mazeSessionStats(state);
  const stats = phase === "mazecomplete" ? total : state.levelStats;
  const accuracy = stats.total ? Math.round(stats.correct / stats.total * 100) : 0;
  const elapsed = phase === "mazecomplete"
    ? Date.now() - state.sessionStartedAt
    : (state.levelEndedAt || Date.now()) - state.levelStartedAt;
  const needsReview = phase === "mazecomplete"
    ? state.levelResults.reduce((sum, level) => sum + level.needsReview, 0) + state.retryPool.size
    : state.retryPool.size;
  const rows = [
    ["Student", username || "Student"],
    ["Level", phase === "mazecomplete" ? `${state.chunks.length} completed` : `${state.levelIndex + 1} / ${state.chunks.length}`],
    ["Score", state.score.toLocaleString()], ["Accuracy", `${accuracy}%`],
    ["Primary Challenges", phase === "mazecomplete" ? `${total.primary} / ${state.sessionWords.length}` : `${state.attemptedPrimary.size} / ${state.words.length}`],
    ["Mastered", stats.mastered], ["Needs Review", needsReview], ["Recovered", stats.recovered],
    ["Coins", state.coins], ["Best Combo", `x${state.bestCombo}`], ["Time", duration(elapsed)],
  ];
  if (phase === "mazecomplete") rows.push(
    ["Words Practised", total.primary],
    ["Remaining Needs Review", needsReview],
    ["Best Score", Math.max(best, state.score).toLocaleString()],
  );
  return (
    <div ref={topRef} className="min-h-full bg-slate-950 p-4 text-white sm:p-8 pb-safe">
      <div className="mx-auto max-w-2xl rounded-3xl border border-indigo-300/40 bg-slate-900 p-5 shadow-xl sm:p-8">
        <p className="text-sm font-black uppercase tracking-widest text-indigo-300">Vocab Maze V2</p>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">{phase === "gameover" ? "Ghost Got You!" : phase === "mazecomplete" ? "MAZE COMPLETE" : "LEVEL COMPLETE"}</h2>
        {state.perfect && phase !== "gameover" && <p className="mt-3 rounded-xl bg-amber-400/20 p-3 font-black text-amber-200">Perfect Exploration ⭐ +300</p>}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3">
          {rows.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-800 p-3">
            <small className="block text-xs font-black uppercase text-indigo-300">{label}</small>
            <strong className="mt-1 block break-words text-lg sm:text-xl">{value}</strong>
          </div>)}
        </div>
        {phase === "levelcomplete" && <button onClick={onNext} className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-black">Next Level</button>}
        {phase === "gameover" && <button onClick={onRetry} className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-black">Retry Level</button>}
        {phase === "mazecomplete" && <button onClick={onPlayAgain} className="mt-6 w-full rounded-xl bg-indigo-600 py-4 font-black">Play Again</button>}
        <button onClick={onChangeWords} className="mt-3 w-full rounded-xl bg-slate-700 py-4 font-black">Change Words</button>
        <button onClick={onGames} className="mt-4 w-full font-black text-indigo-200">← Back to Games</button>
      </div>
    </div>
  );
}

export default function VocabMazeV2({ words, folders, username, setIsDirty, onBackToGames }) {
  const [phase, setPhase] = useState("setup");
  const [setupStep, setSetupStep] = useState("folders");
  const [setupFolderId, setSetupFolderId] = useState(null);
  const [setupSelected, setSetupSelected] = useState(() => new Set());
  const [activeWords, setActiveWords] = useState([]);
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem("evm_maze_difficulty") || "normal");
  const [game, setGame] = useState(null);
  const [best, setBest] = useState(() => Number(localStorage.getItem("evm_maze_best") || 0));
  const [quitTarget, setQuitTarget] = useState(null);
  const topRef = useRef(null);
  const lastKeyAt = useRef(0);
  const playPhase = game?.phase;

  useEffect(() => {
    setIsDirty?.(phase === "playing" && playPhase === "playing");
    return () => setIsDirty?.(false);
  }, [phase, playPhase, setIsDirty]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [phase, playPhase]);
  useEffect(() => {
    if (!game || !["gameover", "levelcomplete", "mazecomplete"].includes(game.phase) || game.score <= best) return;
    setBest(game.score);
    localStorage.setItem("evm_maze_best", String(game.score));
  }, [game?.phase, game?.score, best]);
  useEffect(() => {
    if (phase !== "playing" || playPhase !== "playing" || game?.question || quitTarget) return;
    const onKey = (event) => {
      const direction = {
        ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left",
        w: "up", d: "right", s: "down", a: "left",
      }[event.key.length === 1 ? event.key.toLowerCase() : event.key];
      if (!direction || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target?.closest?.("button, input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      event.preventDefault();
      if (Date.now() - lastKeyAt.current < 120) return;
      lastKeyAt.current = Date.now();
      setGame((current) => stepMazeSession(current, direction));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, playPhase, game?.question, quitTarget]);

  const start = () => {
    localStorage.setItem("evm_maze_difficulty", difficulty);
    setGame(createMazeSession(shuffled(activeWords), difficulty));
    setPhase("playing");
  };
  const requestQuit = (target) => setQuitTarget(target);
  const confirmQuit = () => {
    const target = quitTarget;
    setQuitTarget(null);
    setGame(null);
    setIsDirty?.(false);
    if (target === "games") onBackToGames();
    else if (target === "options") setPhase("options");
    else { setSetupStep("words"); setPhase("setup"); }
  };
  if (phase === "setup") return <MazeFolderWords words={words} folders={folders} topRef={topRef}
    onBack={onBackToGames} onSelectWords={(picked) => { setActiveWords(picked); setPhase("options"); }}
    folderId={setupFolderId} setFolderId={setSetupFolderId} step={setupStep} setStep={setSetupStep}
    selected={setupSelected} setSelected={setSetupSelected} />;
  if (phase === "options") return <MazeOptions words={activeWords} difficulty={difficulty}
    setDifficulty={setDifficulty} topRef={topRef} onStart={start}
    onBackWords={() => { setSetupStep("words"); setPhase("setup"); }} onBackGames={onBackToGames} />;
  if (!game) return null;
  if (game.phase !== "playing") return <MazeResults state={game} best={best} username={username} topRef={topRef}
    onNext={() => setGame((current) => nextMazeLevel(current))}
    onRetry={() => setGame((current) => retryMazeLevel(current))}
    onPlayAgain={() => setGame(createMazeSession(shuffled(activeWords), difficulty))}
    onChangeWords={() => { setSetupStep("words"); setGame(null); setPhase("setup"); }}
    onGames={onBackToGames} />;
  return (
    <div ref={topRef} className="flex min-h-full flex-col bg-slate-950 text-white pb-safe">
      <MazeHud state={game} onGames={() => requestQuit("games")} onSetup={() => requestQuit("options")} />
      <main className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-x-hidden p-2 sm:gap-4 sm:p-4">
        <p className="max-w-2xl text-center text-xs font-bold text-slate-300 sm:text-sm">Walk corridors, collect dots and coins, find the key, then challenge the boss. Use WASD or arrows.</p>
        <MazeBoard state={game} />
        <MazeDPad onMove={(direction) => setGame((current) => stepMazeSession(current, direction))} disabled={Boolean(game.question || quitTarget)} />
        {game.notice && <p className="max-w-xl rounded-xl bg-indigo-800 px-4 py-2 text-center text-sm font-bold" role="status">{game.notice}</p>}
      </main>
      {game.question && <MazeChallengeModal question={game.question} hearts={game.hearts} bossHp={game.bossHp}
        onAnswer={(correct) => setGame((current) => answerMazeSession(current, correct))}
        onContinue={() => setGame((current) => continueMazeQuestion(current))} />}
      {quitTarget && <div role="dialog" aria-modal="true" aria-label="Quit Maze confirmation"
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
          <h2 className="text-2xl font-black">Quit Maze?</h2>
          <p className="mt-3 text-gray-600">Your current level progress will be lost.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button onClick={() => setQuitTarget(null)} className="rounded-xl bg-indigo-600 px-4 py-3 font-black text-white">Keep Playing</button>
            <button onClick={confirmQuit} className="rounded-xl bg-gray-100 px-4 py-3 font-black">Quit</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
