import React, { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import SentenceBuilderQuestion from "../../components/SentenceBuilderQuestion.jsx";
import { MAZE_TTS_LANG, meaningLines } from "../mazeHelpers.js";

const speak = (word) => {
  if (!word || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = MAZE_TTS_LANG;
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
};

function Meaning({ word }) {
  return <span>{meaningLines(word).map((line, index) =>
    <span key={index} className="block break-words">{line}</span>)}</span>;
}

export default function MazeChallengeModal({ question, bossHp, hearts, onAnswer, onContinue }) {
  const [chosenId, setChosenId] = useState(null);
  const { detail, feedback, kind } = question;
  useEffect(() => { setChosenId(null); }, [question.wordId, kind, detail]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => {
    if (detail.mode !== "AUDIO_TO_MEANING") return;
    const timer = window.setTimeout(() => speak(detail.target.word), 180);
    return () => window.clearTimeout(timer);
  }, [detail]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-3 sm:p-6"
      role="dialog" aria-modal="true" aria-label={kind === "boss" ? "Maze boss battle" : "Maze vocabulary challenge"}>
      <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border-2 border-indigo-200 bg-white p-4 text-slate-800 shadow-2xl sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black uppercase tracking-wide text-indigo-600">
            {kind === "boss" ? `Boss Battle · ${bossHp} HP` : kind === "review" ? "Spaced Review" : "Vocabulary Challenge"}
          </p>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-black text-rose-700">❤️ {hearts}</span>
        </div>
        {detail.mode === "SENTENCE_BUILDER" ? (
          <SentenceBuilderQuestion word={detail.target} feedback={feedback ? feedback.correct : null}
            onCheck={onAnswer} onListen={() => speak(detail.target.word)} />
        ) : (
          <>
            <div className="mb-5 rounded-2xl bg-indigo-50 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
                {detail.mode === "MEANING_TO_WORD" ? "Which English word matches?" :
                  detail.mode === "AUDIO_TO_MEANING" ? "Listen and choose the meaning" : "Choose the correct meaning"}
              </p>
              {detail.mode === "MEANING_TO_WORD" ?
                <p className="mt-3 break-words text-xl font-black"><Meaning word={detail.target} /></p> :
                detail.mode === "AUDIO_TO_MEANING" ?
                  <button onClick={() => speak(detail.target.word)} aria-label="Hear vocabulary word"
                    className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white"><Volume2 /></button> :
                  <><h3 className="mt-2 break-words text-2xl font-black sm:text-4xl">{detail.target.word}</h3>
                    <button onClick={() => speak(detail.target.word)} className="mt-2 inline-flex items-center gap-2 font-black text-indigo-600"><Volume2 size={18} /> Listen</button></>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {detail.options.map((option, index) => (
                <button key={option.id} disabled={Boolean(feedback)}
                  onClick={() => { setChosenId(option.id); onAnswer(option.id === detail.correctId); }}
                  aria-label={`Answer ${index + 1}: ${detail.mode === "MEANING_TO_WORD" ? option.word : meaningLines(option).join("; ")}`}
                  className={`min-h-16 rounded-2xl border-2 p-3 text-left font-bold break-words ${feedback && option.id === detail.correctId ? "border-emerald-500 bg-emerald-50" : feedback && chosenId === option.id ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-indigo-400"}`}>
                  <span className="mr-2 text-indigo-500">{String.fromCharCode(65 + index)}.</span>
                  {detail.mode === "MEANING_TO_WORD" ? option.word : <Meaning word={option} />}
                </button>
              ))}
            </div>
          </>
        )}
        {feedback && (
          <div className={`mt-5 rounded-2xl border p-4 text-center ${feedback.correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`} role="status">
            <p className="font-black">{feedback.message}</p>
            {!feedback.correct && <p className="mt-2 break-words text-sm"><strong>Correct answer:</strong> {detail.target.word} — {meaningLines(detail.target).join(" / ")}</p>}
            <button onClick={onContinue} className="mt-4 w-full rounded-xl bg-indigo-600 px-5 py-3 font-black text-white" aria-label="Continue to Maze">Continue</button>
          </div>
        )}
      </section>
    </div>
  );
}
