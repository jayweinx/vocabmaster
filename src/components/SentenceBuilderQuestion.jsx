import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import {
  getSentenceBuilderMeaningLines,
  isSentenceBuilderAnswerCorrect,
  normalizeSentenceWhitespace,
  shuffleSentenceTiles,
  tokenizeSentence
} from '../quiz/sentenceBuilderHelpers';

const createTiles = (word) => shuffleSentenceTiles(tokenizeSentence(word));

function SentenceBuilderQuestion({ word, feedback, onCheck, onListen }) {
  const [bank, setBank] = useState(() => createTiles(word?.word));
  const [answer, setAnswer] = useState([]);
  const isLocked = feedback !== null;
  const meaningLines = getSentenceBuilderMeaningLines(word);

  useEffect(() => {
    setBank(createTiles(word?.word));
    setAnswer([]);
  }, [word?.id, word?.word]);

  const moveToAnswer = (tile) => {
    if (isLocked) return;
    setBank((tiles) => tiles.filter((item) => item.id !== tile.id));
    setAnswer((tiles) => [...tiles, tile]);
  };

  const moveToBank = (tile) => {
    if (isLocked) return;
    setAnswer((tiles) => tiles.filter((item) => item.id !== tile.id));
    setBank((tiles) => [...tiles, tile]);
  };

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 md:p-10 shadow-xl border border-gray-100 text-center">
        <span className="text-indigo-400 text-xs font-black uppercase tracking-widest block mb-4">Arrange the words</span>
        <div className="space-y-2 text-left max-w-xl mx-auto">
          {meaningLines.map((line) => (
            <p key={line.label} className="text-gray-700 break-words leading-relaxed">
              <span className="text-xs font-black uppercase tracking-wide text-indigo-400 mr-2">{line.label}</span>
              <span className="font-semibold">{line.value}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 min-h-[86px]">
        <p className="text-xs font-black uppercase tracking-wide text-indigo-400 mb-3">Your sentence</p>
        <div className="flex flex-wrap gap-2">
          {answer.map((tile) => (
            <button key={tile.id} disabled={isLocked} onClick={() => moveToBank(tile)} className="rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm md:text-base font-bold shadow-sm hover:bg-indigo-700 disabled:cursor-default">
              {tile.text}
            </button>
          ))}
          {!answer.length && <span className="text-sm text-indigo-300 italic">Tap words below to build the sentence.</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Word bank</p>
        <div className="flex flex-wrap gap-2">
          {bank.map((tile) => (
            <button key={tile.id} disabled={isLocked} onClick={() => moveToAnswer(tile)} className="rounded-xl border-2 border-indigo-100 bg-white text-gray-700 px-3 py-2 text-sm md:text-base font-bold hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-default">
              {tile.text}
            </button>
          ))}
        </div>
      </div>

      {!isLocked && (
        <button disabled={bank.length > 0} onClick={() => onCheck(isSentenceBuilderAnswerCorrect(answer, word?.word))} className="w-full rounded-2xl bg-indigo-600 py-4 text-white font-black shadow-lg hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
          Check sentence
        </button>
      )}

      {isLocked && (
        <div className={`rounded-2xl p-4 text-center ${feedback ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <p className="font-black text-lg">{feedback ? 'Correct!' : 'Not quite.'}</p>
          <p className="mt-1 break-words"><span className="font-bold">Correct answer:</span> {normalizeSentenceWhitespace(word?.word)}</p>
          {feedback && <button onClick={onListen} className="mt-3 inline-flex items-center gap-2 font-bold text-indigo-600 hover:text-indigo-800"><Volume2 size={18} /> Listen</button>}
        </div>
      )}
    </div>
  );
}

export default SentenceBuilderQuestion;
