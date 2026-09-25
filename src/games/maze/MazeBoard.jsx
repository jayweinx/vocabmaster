import React, { useEffect, useMemo, useState } from "react";
import {
  CircleHelp, Coins, Crown, Flag, Ghost, KeyRound, LockKeyhole,
  RotateCcw, Shield, Sparkles, UserRound, Zap,
} from "lucide-react";
import { gateIsOpen } from "./mazeSession.js";
import { mazeKey, sameTile } from "./mazeGenerator.js";

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const useViewport = () => {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
};

const tileInfo = (state, position) => {
  const id = mazeKey(position);
  if (!state.maze.grid[position.y]?.[position.x]) return ["wall", null];
  if (sameTile(position, state.maze.boss)) return ["boss", <Crown />];
  if (sameTile(position, state.maze.gate)) return ["gate", gateIsOpen(state) ? <Sparkles /> : <LockKeyhole />];
  if (sameTile(position, state.maze.key) && !state.keyCollected) return ["key", <KeyRound />];
  if (sameTile(position, state.maze.power) && !state.powerCollected) return ["power", <Zap />];
  if (sameTile(position, state.maze.checkpoint)) return ["checkpoint", <Flag />];
  if (state.maze.primary.has(id)) return state.attemptedPrimary.has(id)
    ? ["cleared", <Shield />] : ["primary", <CircleHelp />];
  if (state.maze.review.has(id)) return state.visitedReview.has(id)
    ? ["cleared", <Shield />] : ["review", <RotateCcw />];
  if (state.maze.coins.has(id) && !state.collectedCoins.has(id)) return ["coin", <Coins />];
  if (state.maze.dots.has(id) && !state.collectedDots.has(id)) return ["dot", <span className="block h-1.5 w-1.5 rounded-full bg-amber-200" />];
  return [state.maze.bossArea.has(id) ? "arena" : "floor", null];
};

export default function MazeBoard({ state }) {
  const viewportWidth = useViewport();
  const columns = viewportWidth < 600 ? 9 : viewportWidth < 1000 ? 13 : 17;
  const rows = viewportWidth < 600 ? 9 : 11;
  const left = clamp(state.player.x - Math.floor(columns / 2), 0, Math.max(0, state.maze.width - columns));
  const top = clamp(state.player.y - Math.floor(rows / 2), 0, Math.max(0, state.maze.height - rows));
  const tiles = useMemo(() => Array.from({ length: rows * columns }, (_, index) => ({
    x: left + index % columns,
    y: top + Math.floor(index / columns),
  })), [columns, rows, left, top]);
  return (
    <div className="mx-auto w-fit max-w-full rounded-2xl border-4 border-indigo-400/70 bg-slate-950 p-1 shadow-2xl shadow-indigo-950"
      role="img" aria-label="Vocab Maze corridor map"
      data-camera-x={left} data-camera-y={top}
      data-maze-grid={state.maze.grid.map((row) => row.map((floor) => floor ? "1" : "0").join("")).join("/")}
      data-gate={`${state.maze.gate.x},${state.maze.gate.y}`}
      data-boss={`${state.maze.boss.x},${state.maze.boss.y}`}
      data-key={`${state.maze.key.x},${state.maze.key.y}`}
      data-power={`${state.maze.power.x},${state.maze.power.y}`}>
      <div className="grid overflow-hidden rounded-lg"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, width: `min(calc(100vw - 32px), ${columns * 39}px)` }}>
        {tiles.map((position) => {
          const [baseType, icon] = tileInfo(state, position);
          const isPlayer = sameTile(position, state.player);
          const isGhost = sameTile(position, state.ghost);
          const visibleType = isPlayer ? "player" : isGhost ? (state.power ? "frightened-ghost" : "ghost") : baseType;
          return (
            <div key={`${position.x}-${position.y}`}
              data-x={position.x} data-y={position.y} data-tile-type={visibleType} data-base-type={baseType}
              title={`${visibleType} (${position.x}, ${position.y})`}
              className={`relative flex aspect-square items-center justify-center border border-slate-950/25 text-white [&_svg]:h-[55%] [&_svg]:w-[55%] ${
                baseType === "wall" ? "bg-indigo-900 shadow-[inset_0_2px_0_#818cf8,inset_2px_0_0_#4f46e5]" :
                baseType === "arena" || baseType === "boss" ? "bg-violet-700/80" :
                baseType === "gate" ? "bg-amber-900" : "bg-slate-800"
              } ${baseType === "primary" ? "text-cyan-300" : ""} ${baseType === "review" ? "text-purple-300" : ""} ${baseType === "coin" ? "text-yellow-300" : ""} ${baseType === "key" ? "text-amber-300" : ""} ${baseType === "power" ? "text-lime-300" : ""} ${baseType === "checkpoint" ? "text-sky-300" : ""} ${baseType === "cleared" ? "text-emerald-500" : ""}`}>
              {isPlayer ? <span className="z-20 flex h-[75%] w-[75%] items-center justify-center rounded-full border-2 border-white bg-amber-500 text-slate-900 shadow-lg shadow-amber-300/40"><UserRound size={22} /></span>
                : isGhost ? <span className={`z-10 flex h-[75%] w-[75%] items-center justify-center rounded-full border-2 border-white shadow-lg ${state.power ? "bg-sky-500 shadow-sky-300/50" : "bg-rose-600 shadow-rose-300/50"}`}><Ghost size={22} /></span>
                  : icon}
            </div>
          );
        })}
      </div>
    </div>
  );
}
