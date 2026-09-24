import React from 'react';
import {
  BookOpenCheck,
  CircleDollarSign,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Swords,
} from 'lucide-react';

const statItems = (stats, cleared, total) => [
  { label: 'Hearts', value: stats.hearts, Icon: Heart, color: 'text-rose-300' },
  { label: 'Score', value: stats.score, Icon: Star, color: 'text-amber-300' },
  { label: 'Coins', value: stats.coins, Icon: CircleDollarSign, color: 'text-yellow-300' },
  { label: 'Combo', value: stats.combo, Icon: Flame, color: 'text-orange-300' },
  { label: 'Cleared', value: `${cleared}/${total}`, Icon: BookOpenCheck, color: 'text-emerald-300' },
];

export function RPGHud({ mapName, stats, cleared, total, bossUnlocked }) {
  const remaining = Math.max(0, total - cleared);
  return <>
    <div className="absolute left-3 right-3 top-3 z-30 flex min-h-12 items-center gap-2 overflow-x-auto rounded-2xl border border-white/20 bg-slate-950/80 px-3 py-2 text-white shadow-xl backdrop-blur-md sm:left-4 sm:right-auto sm:max-w-[calc(100%-2rem)]">
      <span className="mr-1 hidden max-w-44 items-center gap-1.5 truncate border-r border-white/20 pr-3 text-xs font-black sm:flex">
        <MapPin size={16} className="text-sky-300" aria-hidden="true" />
        {mapName}
      </span>
      {statItems(stats, cleared, total).map(({ label, value, Icon, color }) => <span key={label} aria-label={`${label}: ${value}`} className="flex shrink-0 items-center gap-1 rounded-xl bg-white/10 px-2 py-1.5 text-xs font-black sm:px-2.5">
        <Icon size={16} className={color} aria-hidden="true" />
        <span>{value}</span>
      </span>)}
    </div>
    <div className="absolute left-3 top-[4.5rem] z-20 max-w-[min(19rem,calc(100%-1.5rem))] rounded-2xl border border-white/25 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-md sm:left-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Current quest</p>
      <p className="mt-0.5 flex items-center gap-2 text-xs font-bold sm:text-sm">
        {bossUnlocked ? <Sparkles size={16} className="text-amber-300" aria-hidden="true" /> : <BookOpenCheck size={16} className="text-emerald-300" aria-hidden="true" />}
        {bossUnlocked ? 'Enter the Boss Gate' : `Talk to ${remaining} more ${remaining === 1 ? 'NPC' : 'NPCs'}`}
      </p>
    </div>
  </>;
}

export function RPGInteractionButton({ kind = 'talk', onClick }) {
  const isBoss = kind === 'boss';
  const isChallenge = kind === 'challenge';
  const Icon = isBoss ? Swords : isChallenge ? Sparkles : MessageCircle;
  const label = isBoss ? 'BOSS CHALLENGE' : isChallenge ? 'CHALLENGE' : 'TALK';
  return <button
    type="button"
    onClick={onClick}
    className={`absolute bottom-5 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-black shadow-xl transition motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 ${isBoss ? 'border-amber-200 bg-amber-300 text-amber-950 focus-visible:ring-amber-200' : 'border-white bg-white text-indigo-800 focus-visible:ring-indigo-300'}`}
  >
    <Icon size={20} aria-hidden="true" />
    {label}
    <span className="hidden rounded-lg bg-black/10 px-2 py-1 text-[10px] sm:inline">E / SPACE</span>
  </button>;
}

export function RPGNotice({ notice }) {
  if (!notice) return null;
  const negative = notice.tone === 'wrong';
  return <div role="status" className={`absolute left-1/2 top-[7.5rem] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-center text-sm font-black shadow-xl motion-safe:animate-bounce ${negative ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-100 text-amber-950'}`}>
    {negative ? <MessageCircle size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
    {notice.message}
  </div>;
}
