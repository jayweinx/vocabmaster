import React from 'react';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Flame,
  HeartCrack,
  House,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import RPGSprite from './RPGSprite';

export default function RPGResultScreen({ phase, result, mapName, onPlayAgain, onChangeWords, onBack }) {
  const completed = phase === 'result';
  const items = [
    { label: 'Score', value: result.score, Icon: Star },
    { label: 'Accuracy', value: `${result.accuracy}%`, Icon: CheckCircle2 },
    { label: 'Correct', value: result.correct, Icon: Sparkles },
    { label: 'Recovered', value: result.recovered, Icon: RotateCcw },
    { label: 'Best combo', value: result.bestCombo, Icon: Flame },
    { label: 'Coins', value: result.coins, Icon: CircleDollarSign },
    { label: 'Time', value: `${Math.floor(result.timeSeconds / 60)}:${String(result.timeSeconds % 60).padStart(2, '0')}`, Icon: Clock3 },
  ];
  return <div className="min-h-full overflow-y-auto bg-sky-100 px-4 py-6 text-center sm:py-10">
    <div className="mx-auto max-w-2xl rounded-[2rem] border-4 border-amber-200 bg-amber-50 p-5 shadow-2xl sm:p-8">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl border-2 border-amber-200 bg-white shadow-lg">
        {completed ? <Trophy size={54} className="text-amber-500" aria-hidden="true" /> : <HeartCrack size={54} className="text-rose-500" aria-hidden="true" />}
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">{completed ? 'Adventure complete' : 'Quest paused'}</p>
      <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">{completed ? 'Brilliant work!' : 'Ready for another try?'}</h2>
      <p className="mt-3 font-bold text-slate-600">{result.student}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500"><MapPin size={16} aria-hidden="true" /> {mapName}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ label, value, Icon }) => <div key={label} className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
          <Icon size={20} className="mx-auto text-indigo-600" aria-hidden="true" />
          <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        </div>)}
        <div className="grid place-items-center rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
          <RPGSprite name={completed ? 'chestOpen' : 'mentor'} size={70} label={completed ? 'Opened reward chest' : 'Friendly mentor'} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={onPlayAgain} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-black text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
          <RotateCcw size={20} aria-hidden="true" /> {completed ? 'Play Again' : 'Retry Level'}
        </button>
        <button type="button" onClick={onChangeWords} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-100 px-4 py-3 font-black text-indigo-800 hover:bg-indigo-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
          <Sparkles size={20} aria-hidden="true" /> Change Words
        </button>
        <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-black text-slate-700 hover:border-slate-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300">
          <House size={20} aria-hidden="true" /> Back to Games
        </button>
      </div>
    </div>
  </div>;
}
