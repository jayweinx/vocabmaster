import React, { useRef, useState } from 'react';
import { Gamepad2 } from 'lucide-react';

export default function VirtualJoystick({ onInput }) {
  const ref = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (event) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const radius = box.width / 2;
    const length = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, radius / length);
    const vector = { x: (dx / radius) * scale, y: (dy / radius) * scale };
    setKnob(vector);
    onInput(vector);
  };

  const stop = () => {
    setKnob({ x: 0, y: 0 });
    onInput({ x: 0, y: 0 });
  };

  return <div
    ref={ref}
    role="application"
    aria-label="Movement joystick"
    onPointerDown={(event) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      update(event);
    }}
    onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && update(event)}
    onPointerUp={stop}
    onPointerCancel={stop}
    className="absolute bottom-4 left-4 z-30 h-24 w-24 touch-none rounded-full border-4 border-white/70 bg-slate-900/55 shadow-xl backdrop-blur-sm lg:hidden"
  >
    <div
      className="absolute left-1/2 top-1/2 grid h-10 w-10 place-items-center rounded-full bg-white text-indigo-700 shadow-md"
      style={{ transform: `translate(calc(-50% + ${knob.x * 27}px), calc(-50% + ${knob.y * 27}px))` }}
    >
      <Gamepad2 size={22} aria-hidden="true" />
    </div>
  </div>;
}
