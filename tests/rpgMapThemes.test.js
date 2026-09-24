import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import {
  RPG_MAP_THEMES,
  RPG_MAP_THEME_KEY,
  getRpgMapTheme,
  persistRpgMapTheme,
  readRpgMapTheme,
} from '../src/games/rpg/mapThemes.js';
import { collidesAt } from '../src/games/rpg/rpgHelpers.js';

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

test('three map themes expose complete, usable map configuration', () => {
  assert.deepEqual(RPG_MAP_THEMES.map((theme) => theme.id), ['village', 'forest', 'campus']);
  for (const theme of RPG_MAP_THEMES) {
    for (const key of ['id', 'name', 'description', 'world', 'spawn', 'paths', 'obstacles', 'npcZones', 'landmarks', 'bossArea', 'decorations', 'asset', 'preview']) {
      assert.ok(theme[key], `${theme.id} is missing ${key}`);
    }
    assert.ok(theme.world.width > 1000 && theme.world.height > 800);
    assert.ok(theme.npcZones.length >= 12);
    assert.ok(theme.obstacles.length >= 6);
    assert.ok(theme.paths.length >= 3);
    assert.equal(new Set(theme.paths.map((path) => path.id)).size, theme.paths.length, `${theme.id} path IDs are not unique`);
    assert.equal(theme.paths.every((path) => path.width >= 100 && path.points.length >= 2), true, `${theme.id} has an incomplete path`);
    assert.ok(theme.landmarks.length >= 3);
    assert.equal(collidesAt(theme.spawn, theme.obstacles), false, `${theme.id} spawn is blocked`);
    assert.equal(theme.npcZones.some((zone) => collidesAt(zone, theme.obstacles)), false, `${theme.id} has a blocked NPC zone`);
    assert.equal(Object.values(theme.specialZones).some((zone) => collidesAt(zone, theme.obstacles)), false, `${theme.id} has a blocked special zone`);
    assert.equal(collidesAt(theme.bossArea.boss, theme.obstacles), false, `${theme.id} boss is blocked after unlocking`);
    const placements = [theme.spawn, ...theme.npcZones, ...Object.values(theme.specialZones), theme.bossArea.boss, theme.bossArea.approach];
    assert.equal(placements.every(({ x, y }) => x >= 20 && y >= 20 && x <= theme.world.width - 20 && y <= theme.world.height - 20), true, `${theme.id} has an out-of-bounds placement`);
    assert.equal(collidesAt(theme.bossArea.approach, theme.obstacles), false, `${theme.id} boss approach is blocked by scenery`);
    assert.equal(collidesAt(theme.bossArea.approach, [theme.bossArea.gate]), false, `${theme.id} boss approach overlaps the locked gate`);
    assert.match(theme.asset, new RegExp(`/games/rpg/art/maps/${theme.id}-map\\.webp$`));
    assert.match(theme.preview, new RegExp(`/games/rpg/art/maps/${theme.id}-preview\\.webp$`));
    assert.equal(existsSync(new URL(`../public${theme.asset}`, import.meta.url)), true, `${theme.id} map art is missing`);
    assert.equal(existsSync(new URL(`../public${theme.preview}`, import.meta.url)), true, `${theme.id} preview art is missing`);
  }
  assert.equal(existsSync(new URL('../public/games/rpg/art/sprites/quest-sprites.webp', import.meta.url)), true, 'RPG sprite atlas is missing');
});

test('map layouts use distinct geometry rather than recolouring one layout', () => {
  const geometry = RPG_MAP_THEMES.map((theme) => JSON.stringify({
    world: theme.world,
    spawn: theme.spawn,
    obstacles: theme.obstacles,
    npcZones: theme.npcZones,
    bossArea: theme.bossArea,
  }));
  assert.equal(new Set(geometry).size, RPG_MAP_THEMES.length);
});

test('map theme selection reads, persists, and safely falls back', () => {
  const storage = createStorage();
  assert.equal(readRpgMapTheme(storage).id, 'village');
  assert.equal(persistRpgMapTheme('forest', storage).id, 'forest');
  assert.equal(storage.getItem(RPG_MAP_THEME_KEY), 'forest');
  assert.equal(readRpgMapTheme(storage).id, 'forest');
  assert.equal(getRpgMapTheme('missing').id, 'village');
  assert.equal(readRpgMapTheme({ getItem: () => { throw new Error('blocked'); } }).id, 'village');
});
