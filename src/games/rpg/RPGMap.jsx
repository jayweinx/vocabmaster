import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import RPGSprite, { playerSprite } from './RPGSprite';

const npcSprites = ['villager', 'ranger', 'merchant', 'scholar', 'listener', 'mentor'];
const assetUrl = (path) => `${import.meta.env.BASE_URL}${String(path || '').replace(/^\//, '')}`;

const encounterSprite = (encounter, index) => {
  if (encounter.mode === 'MATCH') return encounter.cleared ? 'chestOpen' : 'chestClosed';
  if (encounter.mode === 'SENTENCE_BUILDER') return 'mentor';
  return npcSprites[index % npcSprites.length];
};

function Encounter({ encounter, index }) {
  const isChest = encounter.mode === 'MATCH';
  const size = isChest ? 76 : 64;
  return <div
    className="absolute"
    style={{ left: encounter.x - size / 2, top: encounter.y - size * 0.72, width: size, height: size }}
  >
    <RPGSprite
      name={encounterSprite(encounter, index)}
      size={size}
      label={isChest ? (encounter.cleared ? 'Opened treasure chest' : 'Treasure challenge') : encounter.cleared ? 'Completed character' : 'Challenge character'}
      className={encounter.cleared && !isChest ? 'opacity-90 saturate-75' : ''}
    />
    {encounter.cleared && <span aria-label="Challenge completed" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg">
      <CheckCircle2 size={18} aria-hidden="true" />
    </span>}
  </div>;
}

function RPGMap({ mapTheme, camera, player, facing, encounters, bossUnlocked }) {
  const gateSize = 132;
  const gateCenter = {
    x: mapTheme.bossArea.gate.x + mapTheme.bossArea.gate.w / 2,
    y: mapTheme.bossArea.gate.y + mapTheme.bossArea.gate.h / 2,
  };
  return <div
    aria-label={`${mapTheme.name} adventure map`}
    className="absolute inset-0 bg-center bg-no-repeat will-change-transform"
    style={{
      transform: `translate3d(${-camera.x}px, ${-camera.y}px, 0)`,
      width: mapTheme.world.width,
      height: mapTheme.world.height,
      backgroundImage: `url(${assetUrl(mapTheme.asset)})`,
      backgroundSize: '100% 100%',
    }}
  >
    <RPGSprite
      name="portal"
      size={148}
      label="Boss portal"
      className="absolute opacity-80 motion-safe:animate-pulse"
      style={{ left: mapTheme.bossArea.boss.x - 74, top: mapTheme.bossArea.boss.y - 112 }}
    />
    <RPGSprite
      name={bossUnlocked ? 'gateUnlocked' : 'gateLocked'}
      size={gateSize}
      label={bossUnlocked ? 'Unlocked Boss Gate' : 'Locked Boss Gate'}
      className="absolute drop-shadow-2xl"
      style={{ left: gateCenter.x - gateSize / 2, top: gateCenter.y - gateSize * 0.72 }}
    />
    {encounters.map((encounter, index) => <Encounter key={encounter.id} encounter={encounter} index={index} />)}
    <RPGSprite
      name="guardian"
      size={92}
      label="Word Guardian"
      className={`absolute drop-shadow-xl transition ${bossUnlocked ? 'opacity-100' : 'opacity-65 saturate-50'}`}
      style={{ left: mapTheme.bossArea.boss.x - 46, top: mapTheme.bossArea.boss.y - 48 }}
    />
    <RPGSprite
      name={playerSprite(facing)}
      size={70}
      label={`Player facing ${facing}`}
      className="absolute z-10 drop-shadow-xl"
      style={{ left: player.x - 35, top: player.y - 53 }}
    />
  </div>;
}

export default React.memo(RPGMap);
