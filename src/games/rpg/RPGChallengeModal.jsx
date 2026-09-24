import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Volume2, XCircle } from 'lucide-react';
import SentenceBuilderQuestion from '../../components/SentenceBuilderQuestion';
import { getSentenceBuilderMeaningLines } from '../../quiz/sentenceBuilderHelpers';
import { correctAnswerText } from './rpgHelpers';
import RPGSprite from './RPGSprite';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const challengePresentation = (challenge) => {
  if (challenge.boss) return { title: 'Word Guardian', type: 'Boss Challenge', sprite: 'guardian' };
  if (challenge.mode === 'MATCH') return { title: 'Treasure Keeper', type: 'Treasure Match', sprite: 'chestClosed' };
  if (challenge.mode === 'SENTENCE_BUILDER') return { title: 'Sentence Mentor', type: 'Sentence Builder', sprite: 'mentor' };
  const characters = [
    ['Village Guide', 'villager'],
    ['Trail Ranger', 'ranger'],
    ['Word Merchant', 'merchant'],
    ['Campus Scholar', 'scholar'],
    ['Friendly Listener', 'listener'],
  ];
  const index = Number(String(challenge.id || '').split('-').pop()) || 0;
  const [title, sprite] = characters[index % characters.length];
  const labels = {
    WORD_TO_MEANING: 'Choose the Meaning',
    MEANING_TO_WORD: 'Choose the Word',
    AUDIO_TO_MEANING: 'Listening Challenge',
  };
  return { title, type: labels[challenge.mode] || 'Vocabulary Challenge', sprite };
};

export default function RPGChallengeModal({ challenge, words, onDone, onListen }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [matches, setMatches] = useState({});
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);
  const target = challenge.word;
  const lines = getSentenceBuilderMeaningLines(target);
  const presentation = challengePresentation(challenge);
  const options = useMemo(() => shuffle([target, ...shuffle(words.filter((word) => word.id !== target.id)).slice(0, 3)]), [target, words]);
  const matchMeanings = useMemo(() => shuffle(challenge.pairs || words.slice(0, 3)), [challenge.id, challenge.attempt, challenge.pairs, words]);
  const pairWords = challenge.pairs || words.slice(0, 3);

  useEffect(() => {
    const audioTimer = challenge.mode === 'AUDIO_TO_MEANING' ? setTimeout(() => onListen(target.word), 250) : null;
    return () => {
      if (audioTimer) clearTimeout(audioTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [challenge.mode, onListen, target.word]);

  const finish = (correct) => {
    if (finished) return;
    setFinished(true);
    setFeedback(correct);
    timerRef.current = setTimeout(() => onDone(correct), correct ? 1100 : 1900);
  };
  const optionText = (word) => challenge.mode === 'MEANING_TO_WORD' ? word.word : [word.meaning, word.mandarin].filter(Boolean).join(' · ');

  return <div role="dialog" aria-modal="true" aria-label={presentation.type} className="absolute inset-0 z-50 flex items-end justify-center overflow-hidden bg-slate-950/70 p-3 backdrop-blur-sm sm:items-center sm:p-5">
    <div className="max-h-[92%] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border-4 border-amber-200 bg-amber-50 p-4 shadow-2xl sm:p-7">
      <header className="flex items-center gap-3 border-b border-amber-200 pb-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-inner">
          <RPGSprite name={presentation.sprite} size={76} label={presentation.title} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">{presentation.type}</p>
          <h2 className="mt-1 truncate text-xl font-black text-slate-900 sm:text-2xl">{presentation.title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">Answer to continue your adventure.</p>
        </div>
      </header>

      <div className="mt-5">
        {challenge.mode === 'SENTENCE_BUILDER' ? <SentenceBuilderQuestion word={target} feedback={feedback} onListen={() => onListen(target.word)} onCheck={finish} /> : <>
          {challenge.mode === 'AUDIO_TO_MEANING' ? <div className="text-center">
            <p className="text-sm font-bold text-slate-600">Listen carefully, then choose the meaning.</p>
            <button type="button" onClick={() => onListen(target.word)} aria-label="Play vocabulary audio" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
              <Volume2 size={24} aria-hidden="true" /> Listen again
            </button>
          </div> : challenge.mode === 'MEANING_TO_WORD' ? <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
            {lines.map((line) => <p key={line.label} className="break-words text-lg font-bold leading-relaxed text-slate-700">{line.value}</p>)}
          </div> : <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center shadow-sm">
            <p className="break-words text-2xl font-black text-slate-900 sm:text-4xl">{target.word}</p>
          </div>}

          {challenge.mode === 'MATCH' ? <div className="mt-5 space-y-3">
            {pairWords.map((word) => <label key={word.id} className="flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-white p-3 font-bold text-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-words">{word.word}</span>
              <select disabled={finished} value={matches[word.id] || ''} onChange={(event) => setMatches((current) => ({ ...current, [word.id]: event.target.value }))} className="min-h-11 min-w-0 rounded-xl border-2 border-indigo-100 bg-white px-3 py-2 focus:border-indigo-500 focus:outline-none sm:max-w-sm">
                <option value="">Choose meaning</option>
                {matchMeanings.map((meaning) => <option key={meaning.id} value={meaning.id}>{meaning.meaning} {meaning.mandarin && `· ${meaning.mandarin}`}</option>)}
              </select>
            </label>)}
            <button type="button" disabled={finished || Object.keys(matches).length !== pairWords.length} onClick={() => finish(pairWords.every((word) => matches[word.id] === word.id))} className="min-h-12 w-full rounded-2xl bg-indigo-600 p-3 font-black text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-40">Check matches</button>
          </div> : <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((word) => {
              const chosen = selected === word.id;
              const answerClass = chosen ? (word.id === target.id ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-400 bg-rose-50 text-rose-900') : 'border-indigo-100 bg-white text-slate-800 hover:border-indigo-400';
              return <button key={word.id} type="button" disabled={Boolean(selected) || feedback !== null} onClick={() => { setSelected(word.id); finish(word.id === target.id); }} className={`min-h-14 break-words rounded-2xl border-2 p-3 font-bold leading-snug shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-default ${answerClass}`}>{optionText(word)}</button>;
            })}
          </div>}

          {feedback !== null && <div role="status" className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${feedback ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {feedback ? <CheckCircle2 size={24} className="shrink-0" aria-hidden="true" /> : <XCircle size={24} className="shrink-0" aria-hidden="true" />}
            <div>
              <p className="font-black">{feedback ? 'Correct! Reward earned.' : 'Not quite.'}</p>
              {!feedback && <p className="mt-1 whitespace-pre-line break-words text-sm"><span className="font-bold">Correct answer:</span> {correctAnswerText(challenge.mode, target, pairWords)}</p>}
            </div>
          </div>}
        </>}
      </div>
    </div>
  </div>;
}
