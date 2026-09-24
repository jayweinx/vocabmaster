import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isSentenceBuilderEligible } from '../quiz/sentenceBuilderHelpers';
import RPGChallengeModal from './rpg/RPGChallengeModal';
import { RPGHud, RPGInteractionButton, RPGNotice } from './rpg/RPGHud';
import RPGMap from './rpg/RPGMap';
import RPGMapSelector from './rpg/RPGMapSelector';
import RPGResultScreen from './rpg/RPGResultScreen';
import VirtualJoystick from './rpg/VirtualJoystick';
import {
  cameraFor,
  createRpgResult,
  isBossUnlocked,
  isUsableRpgWord,
  movePlayer,
  nextRpgStats,
  rpgQuestionMode,
  selectDistinctMeaningWords,
  shouldOfferRetry,
} from './rpg/rpgHelpers';
import {
  getRpgMapTheme,
  persistRpgMapTheme,
  readRpgMapTheme,
} from './rpg/mapThemes';

const VOCAB_QUEST_RANDOM_SELECTION = {
  counts: [10, 15, 20],
  isEligible: isUsableRpgWord,
};

const INITIAL_STATS = {
  score: 0,
  coins: 0,
  hearts: 3,
  correct: 0,
  wrong: 0,
  recovered: 0,
  combo: 0,
  bestCombo: 0,
  encounters: 0,
};

const play = (text) => {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
};

export default function VocabQuestRPG({
  words,
  folders,
  username,
  setIsDirty,
  onBackToGames,
  CategorySelectionScreen,
  WordSelectionScreen,
}) {
  const [phase, setPhase] = useState('category');
  const [folderIds, setFolderIds] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [error, setError] = useState('');
  const [mapThemeId, setMapThemeId] = useState(() => readRpgMapTheme(typeof window === 'undefined' ? null : window.localStorage).id);
  const [player, setPlayer] = useState({ x: 500, y: 560 });
  const [facing, setFacing] = useState('down');
  const [input, setInput] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 800, height: 560 });
  const [encounters, setEncounters] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [finalStats, setFinalStats] = useState(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [notice, setNotice] = useState(null);
  const areaRef = useRef(null);
  const keys = useRef(new Set());
  const interactRef = useRef(() => {});

  const mapTheme = getRpgMapTheme(mapThemeId);
  const normal = encounters.filter((item) => !item.special);
  const specials = encounters.filter((item) => item.special);
  const clearedCount = normal.filter((item) => item.cleared).length;
  const bossUnlocked = isBossUnlocked({
    normalCleared: clearedCount,
    normalTotal: normal.length,
    specialsCleared: specials.filter((item) => item.cleared).length,
    specialsTotal: specials.length,
  });
  const usable = (items) => items.filter(isUsableRpgWord);

  useEffect(() => {
    if (setIsDirty) setIsDirty(phase === 'playing');
  }, [phase, setIsDirty]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const resize = () => {
      const bounds = areaRef.current?.getBoundingClientRect();
      if (bounds) setViewport({ width: bounds.width, height: bounds.height });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'result' || !finalStats) return;
    try {
      localStorage.setItem('evm_rpg_best_score', String(Math.max(Number(localStorage.getItem('evm_rpg_best_score') || 0), finalStats.score)));
    } catch {
      // Results still display if browser storage is unavailable.
    }
  }, [phase, finalStats]);

  useEffect(() => {
    if (!input.x && !input.y) return;
    if (Math.abs(input.x) > Math.abs(input.y)) setFacing(input.x > 0 ? 'right' : 'left');
    else setFacing(input.y > 0 ? 'down' : 'up');
  }, [input]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const update = () => {
      const held = keys.current;
      setInput({
        x: (held.has('ArrowRight') || held.has('d') ? 1 : 0) - (held.has('ArrowLeft') || held.has('a') ? 1 : 0),
        y: (held.has('ArrowDown') || held.has('s') ? 1 : 0) - (held.has('ArrowUp') || held.has('w') ? 1 : 0),
      });
    };
    const stop = () => {
      keys.current.clear();
      setInput({ x: 0, y: 0 });
    };
    const down = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
        update();
      }
      if (key === ' ' || key === 'e') {
        event.preventDefault();
        interactRef.current();
      }
    };
    const up = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      keys.current.delete(key);
      update();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', stop);
    return () => {
      stop();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', stop);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || challenge || (!input.x && !input.y)) return undefined;
    let frame;
    let last = performance.now();
    const loop = (now) => {
      const step = Math.min(2.5, (now - last) / 16) * 4;
      last = now;
      const obstacles = bossUnlocked ? mapTheme.obstacles : [...mapTheme.obstacles, mapTheme.bossArea.gate];
      setPlayer((position) => movePlayer(position, input, step, obstacles, mapTheme.world));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase, challenge, input, bossUnlocked, mapTheme]);

  const begin = (items) => {
    const selected = usable(items);
    if (selected.length < 3) {
      setError('Select at least 3 vocabulary items to start Vocab Quest.');
      return;
    }
    if (selected.length > 20) {
      setError('Choose up to 20 vocabulary items for Vocab Quest.');
      return;
    }
    setSelectedWords(selected);
    setError('');
    setPhase('map');
  };

  const chooseMap = (id) => {
    const theme = persistRpgMapTheme(id, typeof window === 'undefined' ? null : window.localStorage);
    setMapThemeId(theme.id);
  };

  const startAdventure = (id = mapThemeId, items = selectedWords) => {
    const theme = persistRpgMapTheme(id, typeof window === 'undefined' ? null : window.localStorage);
    const selected = usable(items);
    const levelNormals = selected.slice(0, Math.min(12, selected.length)).map((word, index) => ({
      id: `npc-${index}`,
      word,
      ...theme.npcZones[index],
      special: false,
      cleared: false,
      retry: null,
      mode: rpgQuestionMode(word, index),
    }));
    const phrase = selected.find(isSentenceBuilderEligible);
    const chestPairs = selectDistinctMeaningWords(selected);
    const chest = chestPairs.length === 3 ? [{
      id: 'chest',
      word: chestPairs[0],
      pairs: chestPairs,
      ...theme.specialZones.chest,
      special: true,
      cleared: false,
      mode: 'MATCH',
    }] : [];
    const phraseChallenge = phrase ? [{
      id: 'phrase',
      word: phrase,
      ...theme.specialZones.phrase,
      special: true,
      cleared: false,
      mode: 'SENTENCE_BUILDER',
    }] : [];

    setMapThemeId(theme.id);
    setSelectedWords(selected);
    setEncounters([...levelNormals, ...phraseChallenge, ...chest]);
    setPlayer({ ...theme.spawn });
    setFacing('up');
    setInput({ x: 0, y: 0 });
    setStats(INITIAL_STATS);
    setFinalStats(null);
    setNotice(null);
    setStartedAt(Date.now());
    setError('');
    setPhase('playing');
  };

  const nearest = useMemo(() => encounters.find((item) => (
    !item.cleared
    && (item.retry ? shouldOfferRetry(item.retry, stats.encounters) : true)
    && Math.hypot(item.x - player.x, item.y - player.y) < 78
  )), [encounters, player, stats.encounters]);
  const bossNear = bossUnlocked && Math.hypot(player.x - mapTheme.bossArea.boss.x, player.y - mapTheme.bossArea.boss.y) < 110;

  const interact = useCallback(() => {
    if (challenge) return;
    if (nearest) setChallenge(nearest);
    else if (bossNear) setChallenge({
      id: 'boss',
      word: encounters.find((item) => item.retry)?.word || selectedWords[0],
      boss: true,
      bossIndex: 0,
      mode: 'WORD_TO_MEANING',
    });
  }, [challenge, nearest, bossNear, encounters, selectedWords]);
  interactRef.current = interact;

  const onChallengeDone = (correct) => {
    const current = challenge;
    const nextStats = nextRpgStats(stats, {
      correct,
      recovered: Boolean(current.retry),
      special: current.special,
      boss: current.boss,
    });
    setStats(nextStats);

    if (current.boss) {
      if (!correct) {
        if (nextStats.hearts === 0) {
          setFinalStats(nextStats);
          setChallenge(null);
          setPhase('gameover');
        } else {
          setChallenge({ ...current, attempt: (current.attempt || 0) + 1 });
        }
        return;
      }
      if (current.bossIndex < 2) {
        const nextWord = selectedWords[(current.bossIndex + 1) % selectedWords.length];
        setChallenge({
          ...current,
          word: nextWord,
          bossIndex: current.bossIndex + 1,
          mode: rpgQuestionMode(nextWord, current.bossIndex + 1),
          attempt: 0,
        });
        return;
      }
      setFinalStats(nextStats);
      setChallenge(null);
      setPhase('result');
      return;
    }

    const recovered = Boolean(current.retry);
    const becomesUnlocked = !bossUnlocked && isBossUnlocked({
      normalCleared: normal.filter((item) => item.cleared || item.id === current.id).length,
      normalTotal: normal.length,
      specialsCleared: specials.filter((item) => item.cleared || item.id === current.id).length,
      specialsTotal: specials.length,
    });
    setEncounters((items) => items.map((item) => item.id !== current.id
      ? item
      : correct
        ? { ...item, cleared: true, retry: null }
        : { ...item, retry: { availableAfter: stats.encounters + 3 } }));
    setChallenge(null);

    if (!correct && nextStats.hearts === 0) {
      setFinalStats(nextStats);
      setPhase('gameover');
      return;
    }
    if (!correct) setNotice({ tone: 'wrong', message: 'Not quite — try another challenge.' });
    else if (recovered) setNotice({ tone: 'success', message: 'Recovered! +60 score' });
    else if (becomesUnlocked) setNotice({ tone: 'success', message: 'BOSS UNLOCKED!' });
    else setNotice({ tone: 'success', message: `Correct! +${nextStats.score - stats.score} score · +${nextStats.coins - stats.coins} coins` });
  };

  if (phase === 'category') return <div className="min-h-full">
    <div className="p-4">
      <button type="button" onClick={onBackToGames} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
        <ArrowLeft size={18} aria-hidden="true" /> Back to Games
      </button>
    </div>
    <CategorySelectionScreen words={words} folders={folders} title="Vocab Quest: Category" onSelect={(ids) => { setFolderIds(ids); setPhase('setup'); }} />
  </div>;

  if (phase === 'setup') return <div className="min-h-full">
    <div className="p-4">
      <button type="button" onClick={onBackToGames} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300">
        <ArrowLeft size={18} aria-hidden="true" /> Back to Games
      </button>
      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 font-bold text-red-600">{error}</p>}
    </div>
    <WordSelectionScreen
      words={words}
      folders={folders}
      selectedFolderIds={folderIds}
      title="Choose 10–20 words for Vocab Quest"
      randomSelection={VOCAB_QUEST_RANDOM_SELECTION}
      onBack={() => setPhase('category')}
      onStart={begin}
    />
  </div>;

  if (phase === 'map') return <RPGMapSelector
    selectedId={mapThemeId}
    onSelect={chooseMap}
    onStart={() => startAdventure()}
    onBack={() => setPhase('setup')}
  />;

  if (phase === 'result' || phase === 'gameover') {
    const result = createRpgResult({
      username,
      folderId: folderIds[0],
      selectedWords,
      stats: finalStats || stats,
      startedAt,
    });
    return <RPGResultScreen
      phase={phase}
      result={result}
      mapName={mapTheme.name}
      onPlayAgain={() => startAdventure(mapTheme.id, selectedWords)}
      onChangeWords={() => setPhase('setup')}
      onBack={onBackToGames}
    />;
  }

  const camera = cameraFor(player, viewport, mapTheme.world);
  return <div ref={areaRef} className="relative h-full min-h-[520px] w-full max-w-full touch-none overflow-hidden bg-emerald-900">
    <RPGMap
      mapTheme={mapTheme}
      camera={camera}
      player={player}
      facing={facing}
      encounters={encounters}
      bossUnlocked={bossUnlocked}
    />
    <RPGHud
      mapName={mapTheme.name}
      stats={stats}
      cleared={clearedCount}
      total={normal.length}
      bossUnlocked={bossUnlocked}
    />
    {nearest && <RPGInteractionButton kind={nearest.special ? 'challenge' : 'talk'} onClick={interact} />}
    {bossNear && !nearest && <RPGInteractionButton kind="boss" onClick={interact} />}
    <VirtualJoystick onInput={setInput} />
    <RPGNotice notice={notice} />
    {challenge && <RPGChallengeModal
      key={`${challenge.id}-${challenge.bossIndex || 0}-${challenge.attempt || 0}`}
      challenge={challenge}
      words={selectedWords}
      onDone={onChallengeDone}
      onListen={play}
    />}
  </div>;
}
