import React from "react";
import { mazeObjective } from "./mazeSession.js";
import { mazeThreshold } from "./mazeGenerator.js";

export default function MazeHud({ state, onGames, onSetup }) {
  const chips = [
    ["Hearts", `❤️ ${state.hearts}`], ["Score", `⭐ ${state.score.toLocaleString()}`],
    ["Coins", `🪙 ${state.coins}`],
    ["Challenges", `❓ ${state.attemptedPrimary.size}/${state.words.length}`],
    ["Key", state.keyCollected ? "🔑 ✓" : "🔑 —"],
    ["Ghost countdown", `👻 Moves in ${state.ghostCountdown}`],
  ];
  if (state.combo >= 2) chips.push(["Combo", `🔥 x${state.combo}`]);
  if (state.power > 0) chips.push(["Power", `⚡ ${state.power}`]);
  return (
    <header className="shrink-0 bg-slate-900 px-3 py-2 text-white sm:px-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 sm:gap-2">
        <button onClick={onGames} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-black" aria-label="Leave Maze for Games">← Games</button>
        <button onClick={onSetup} className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-black" aria-label="Leave Maze for Setup">Setup</button>
        <span className="rounded-lg bg-indigo-700 px-2 py-1.5 text-xs font-black sm:text-sm">Level {state.levelIndex + 1}/{state.chunks.length}</span>
        {chips.map(([label, value]) => <span key={label} aria-label={`${label}: ${value}`}
          className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs font-black sm:text-sm">{value}</span>)}
      </div>
      <p className="mx-auto mt-1.5 max-w-6xl text-xs font-bold text-amber-200 sm:text-sm">
        Objective: {mazeObjective(state)} · Gate needs {mazeThreshold(state.words.length)} challenges
      </p>
    </header>
  );
}
