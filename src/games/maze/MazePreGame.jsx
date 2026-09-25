import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import {
  mazeDescendantFolderIds, mazeFolderPath, mazeFolderUsableWords,
  meaningLines, usableMazeWord,
} from "../mazeHelpers.js";
import { chunkMazeWords } from "./mazeGenerator.js";

function Meaning({ word }) {
  return <span>{meaningLines(word).map((line, index) =>
    <span key={index} className="block break-words">{line}</span>)}</span>;
}

export function MazeFolderWords({
  words, folders, onSelectWords, onBack, topRef, folderId, setFolderId,
  step, setStep, selected, setSelected,
}) {
  const ids = useMemo(() => mazeDescendantFolderIds(folders, folderId), [folders, folderId]);
  const candidates = useMemo(() => words.filter(usableMazeWord).filter((word) => ids.has(word.folderId)), [words, ids]);
  const picked = candidates.filter((word) => selected.has(word.id));
  const toggle = (id) => setSelected((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const current = folders.find((folder) => folder.id === folderId);
  const children = folders.filter((folder) => (folder.parentId || null) === (folderId || null));
  const path = folderId ? mazeFolderPath(folders, folderId).join(" › ") : "All Folders";
  const count = (id) => mazeFolderUsableWords(words, folders, id).length;
  const changeFolder = (id) => { setFolderId(id); setSelected(new Set()); };

  if (step === "folders") return (
    <div ref={topRef} className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe">
      <div className="mx-auto max-w-6xl">
        <button onClick={folderId ? () => changeFolder(current?.parentId || null) : onBack}
          className="mb-5 inline-flex items-center gap-2 font-black text-gray-500"><ChevronLeft size={20} />{folderId ? "Back" : "Back to Games"}</button>
        <p className="text-sm font-bold text-indigo-600">Mazes › {path}</p>
        <h2 className="text-3xl font-black text-gray-800">Vocab Maze</h2>
        <p className="mt-2 text-gray-500">Choose a vocabulary folder for your maze.</p>
        <span className="mt-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">MAZES</span>
        {current && <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{current.name}</h3>
          <p className="text-gray-500">{candidates.length} usable words</p>
          <button disabled={candidates.length < 3} onClick={() => setStep("words")}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-40">Select Words</button>
        </div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {children.map((folder) => <button key={folder.id} onClick={() => changeFolder(folder.id)}
            className={`rounded-3xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${count(folder.id) ? "border-indigo-100" : "border-gray-100 opacity-60"}`}>
            <Folder className="text-indigo-600" size={32} />
            <strong className="mt-4 block text-xl">{folder.name}</strong>
            <span className="mt-2 block text-gray-500">{count(folder.id)} words</span>
            <span className="mt-3 flex items-center gap-1 font-black text-indigo-600">Open Folder <ChevronRight size={16} /></span>
          </button>)}
        </div>
        {folderId && !children.length && !candidates.length &&
          <p className="mt-6 rounded-2xl bg-white p-6 text-center text-gray-500">No usable vocabulary in this folder yet.</p>}
      </div>
    </div>
  );

  return (
    <div ref={topRef} className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => setStep("folders")} className="mb-5 inline-flex items-center gap-2 font-black text-gray-500 hover:text-indigo-600">
          <ChevronLeft size={20} /> Back to {current?.name || "folder"}
        </button>
        <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
          <header className="p-6 sm:p-8">
            <h2 className="text-3xl font-black">Select Words for Maze</h2>
            <p className="mt-2 text-gray-500">Folder: {path} · {candidates.length} usable words</p>
          </header>
          <div className="p-5 sm:p-7">
            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div><h3 className="text-xl font-black text-gray-800">Select words</h3>
                <p className="text-sm text-gray-500">{picked.length} selected · at least 3 required</p></div>
              <div className="flex gap-2">
                <button onClick={() => setSelected(new Set(candidates.map((word) => word.id)))} className="rounded-xl bg-indigo-50 px-4 py-2 font-black text-indigo-600">Select All</button>
                <button onClick={() => setSelected(new Set())} className="rounded-xl bg-gray-100 px-4 py-2 font-black text-gray-600">Clear</button>
              </div>
            </div>
            {candidates.length >= 50 && <p className="mt-3 text-sm font-bold text-amber-700">For the best Maze experience, 10–30 words is recommended.</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {candidates.map((word) => <label key={word.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 p-3 hover:bg-indigo-50">
                <input type="checkbox" checked={selected.has(word.id)} onChange={() => toggle(word.id)} className="mt-1 h-5 w-5 accent-indigo-600" />
                <span className="min-w-0"><strong className="block break-words text-gray-800">{word.word}</strong>
                  <span className="mt-1 block text-sm text-gray-500"><Meaning word={word} /></span></span>
              </label>)}
              {!candidates.length && <p className="rounded-xl bg-gray-50 p-6 text-center font-bold text-gray-400">No usable vocabulary is available in this folder.</p>}
            </div>
            <button disabled={picked.length < 3} onClick={() => onSelectWords(picked)}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-45">Continue to Maze Setup</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function MazeOptions({ words, difficulty, setDifficulty, onStart, onBackWords, onBackGames, topRef }) {
  const chunks = chunkMazeWords(words);
  return (
    <div ref={topRef} className="min-h-full bg-gray-50 p-5 sm:p-7 pb-safe">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBackWords} className="mb-5 inline-flex items-center gap-2 font-black text-gray-500"><ChevronLeft size={20} /> Back to words</button>
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-black text-gray-800">Vocab Maze Setup</h2>
          <p className="mt-2 text-gray-500">Explore corridors, practise vocabulary, find the key, and reach the boss.</p>
          <div className="mt-6 rounded-2xl bg-indigo-50 p-4">
            <p className="font-black text-indigo-900">Session Summary</p>
            <p className="mt-2 text-sm text-indigo-800">Selected Vocabulary: <strong>{words.length} words</strong></p>
            <p className="text-sm text-indigo-800">Levels: <strong>{chunks.length}</strong></p>
            <p className="text-sm text-indigo-800">Level Vocabulary: <strong>{chunks.map((chunk) => chunk.length).join(" / ")}</strong></p>
          </div>
          <p className="mt-6 text-sm font-black uppercase text-gray-500">Ghost Difficulty</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[["relaxed", "Relaxed", "Moves every 4 steps"], ["normal", "Normal", "Moves every 3 steps"], ["challenge", "Challenge", "Moves every 2 steps"]]
              .map(([id, title, copy]) => <button key={id} onClick={() => setDifficulty(id)}
                className={`rounded-xl border-2 p-4 text-left ${difficulty === id ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                <strong>{title}</strong><span className="mt-1 block text-sm text-gray-500">{copy}</span>
              </button>)}
          </div>
          <button onClick={onStart} className="mt-7 w-full rounded-xl bg-indigo-600 py-4 text-lg font-black text-white">START MAZE</button>
          <button onClick={onBackGames} className="mt-4 w-full font-black text-gray-500">← Back to Games</button>
        </section>
      </div>
    </div>
  );
}
