import React from 'react';

export const RPG_SPRITES = {
  playerDown: [0, 0],
  playerUp: [1, 0],
  playerRight: [2, 0],
  playerLeft: [3, 0],
  villager: [0, 1],
  ranger: [1, 1],
  merchant: [2, 1],
  scholar: [3, 1],
  listener: [0, 2],
  mentor: [1, 2],
  chestClosed: [2, 2],
  chestOpen: [3, 2],
  portal: [0, 3],
  gateLocked: [1, 3],
  gateUnlocked: [2, 3],
  guardian: [3, 3],
};

const SPRITE_SHEET = `${import.meta.env.BASE_URL}games/rpg/art/sprites/quest-sprites.webp`;

export const playerSprite = (facing = 'down') => ({
  down: 'playerDown',
  up: 'playerUp',
  right: 'playerRight',
  left: 'playerLeft',
}[facing] || 'playerDown');

export default function RPGSprite({
  name,
  size = 64,
  label,
  className = '',
  style,
}) {
  const [column, row] = RPG_SPRITES[name] || RPG_SPRITES.villager;
  return <span
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={`block shrink-0 bg-no-repeat ${className}`}
    style={{
      width: size,
      height: size,
      backgroundImage: `url(${SPRITE_SHEET})`,
      backgroundSize: `${size * 4}px ${size * 4}px`,
      backgroundPosition: `${-column * size}px ${-row * size}px`,
      ...style,
    }}
  />;
}
