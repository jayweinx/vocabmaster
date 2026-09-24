import React from 'react';
import { ArrowLeft, CheckCircle2, Compass, Play } from 'lucide-react';
import { RPG_MAP_THEMES } from './mapThemes';

const assetUrl = (path) => `${import.meta.env.BASE_URL}${String(path || '').replace(/^\//, '')}`;

export default function RPGMapSelector({ selectedId, onSelect, onStart, onBack }) {
  const selectedMap = RPG_MAP_THEMES.find((theme) => theme.id === selectedId) || RPG_MAP_THEMES[0];
  return <div className="min-h-full overflow-y-auto bg-sky-100 px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={onBack} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-black text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
        <ArrowLeft size={18} aria-hidden="true" /> Change words
      </button>
      <div className="mx-auto max-w-3xl rounded-[2rem] border-4 border-amber-200 bg-amber-50 px-5 py-6 text-center shadow-lg sm:px-8">
        <Compass size={38} className="mx-auto text-indigo-600" aria-hidden="true" />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.28em] text-indigo-600">Vocab Quest</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-5xl">Choose Your Adventure</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">Pick a world for this quest. Your last choice will be ready next time.</p>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {RPG_MAP_THEMES.map((theme) => {
          const selected = theme.id === selectedId;
          return <button key={theme.id} type="button" aria-pressed={selected} onClick={() => onSelect(theme.id)} className={`group min-h-11 overflow-hidden rounded-[1.75rem] bg-white text-left shadow-lg ring-4 transition duration-200 motion-safe:hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-indigo-500 ${selected ? 'ring-indigo-500' : 'ring-white/80'}`}>
            <span className="relative block aspect-[4/3] overflow-hidden bg-emerald-100">
              <img src={assetUrl(theme.preview)} alt={`${theme.name} map preview`} className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105" />
              <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black shadow ${selected ? 'bg-indigo-600 text-white' : 'bg-white/90 text-slate-700'}`}>
                {selected && <CheckCircle2 size={15} aria-hidden="true" />}{selected ? 'Selected' : 'Choose'}
              </span>
            </span>
            <span className="block p-5">
              <span className="block text-xl font-black text-slate-900">{theme.name}</span>
              <span className="mt-2 block min-h-12 text-sm font-semibold leading-relaxed text-slate-600">{theme.description}</span>
              <span className={`mt-4 block rounded-xl px-4 py-3 text-center text-sm font-black ${selected ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{selected ? 'Adventure selected' : 'Select adventure'}</span>
            </span>
          </button>;
        })}
      </div>

      <div className="mt-7 flex justify-center">
        <button type="button" onClick={onStart} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3 font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
          <Play size={20} fill="currentColor" aria-hidden="true" /> Begin {selectedMap.name}
        </button>
      </div>
    </div>
  </div>;
}
