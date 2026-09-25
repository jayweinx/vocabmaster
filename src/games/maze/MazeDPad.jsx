import React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

const buttons = [
  ["up", ArrowUp, "col-start-2 row-start-1"],
  ["left", ArrowLeft, "col-start-1 row-start-2"],
  ["right", ArrowRight, "col-start-3 row-start-2"],
  ["down", ArrowDown, "col-start-2 row-start-3"],
];

export default function MazeDPad({ onMove, disabled }) {
  return (
    <div className="mx-auto grid w-[182px] grid-cols-3 grid-rows-3 gap-1.5 select-none touch-none lg:hidden" aria-label="Maze movement controls">
      {buttons.map(([direction, Icon, place]) => (
        <button key={direction} type="button" aria-label={`Move ${direction}`}
          disabled={disabled} onClick={() => onMove(direction)}
          onTouchMove={(event) => event.preventDefault()}
          className={`${place} flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-indigo-300 bg-indigo-700 text-white shadow-lg active:bg-indigo-500 disabled:opacity-40 touch-none`}>
          <Icon size={28} />
        </button>
      ))}
    </div>
  );
}
