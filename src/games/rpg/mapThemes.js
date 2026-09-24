export const RPG_MAP_THEME_KEY = 'evm_rpg_map_theme';

const village = {
  id: 'village',
  name: 'Vocabulary Village',
  description: 'Cozy paths, cheerful homes, and a fountain plaza.',
  world: { width: 2025, height: 1350 },
  spawn: { x: 920, y: 945 },
  paths: [
    { id: 'south-bridge', points: [[1010, 1330], [1010, 1050], [955, 865]], width: 150 },
    { id: 'plaza-loop', points: [[955, 865], [730, 760], [835, 610], [1090, 600], [1265, 745], [1160, 880], [955, 865]], width: 125 },
    { id: 'boss-road', points: [[1265, 745], [1480, 590], [1650, 430], [1830, 380]], width: 115 },
  ],
  obstacles: [
    { x: 0, y: 0, w: 535, h: 325, kind: 'house-and-grove' },
    { x: 520, y: 250, w: 475, h: 285, kind: 'village-hall' },
    { x: 0, y: 430, w: 405, h: 500, kind: 'river-and-mill' },
    { x: 1545, y: 455, w: 390, h: 265, kind: 'house' },
    { x: 1485, y: 820, w: 450, h: 260, kind: 'house' },
    { x: 855, y: 650, w: 320, h: 195, kind: 'fountain' },
    { x: 0, y: 990, w: 650, h: 320, kind: 'garden-and-grove' },
    { x: 1320, y: 1130, w: 705, h: 220, kind: 'south-grove' },
  ],
  npcZones: [
    { x: 1100, y: 595 }, { x: 1350, y: 585 }, { x: 1480, y: 750 },
    { x: 1395, y: 875 }, { x: 1225, y: 935 }, { x: 1015, y: 935 },
    { x: 790, y: 890 }, { x: 640, y: 730 }, { x: 505, y: 585 },
    { x: 450, y: 350 }, { x: 1170, y: 395 }, { x: 1515, y: 395 },
  ],
  specialZones: {
    phrase: { x: 1240, y: 765 },
    chest: { x: 1450, y: 685 },
  },
  landmarks: [
    { id: 'fountain-plaza', name: 'Fountain Plaza', x: 930, y: 585 },
    { id: 'welcome-sign', name: 'Village Welcome Sign', x: 260, y: 745 },
    { id: 'quest-hall', name: 'Quest Hall', x: 1460, y: 215 },
  ],
  bossArea: {
    name: 'Grand Word Hall',
    x: 1675, y: 40, w: 320, h: 350,
    boss: { x: 1840, y: 180 },
    gate: { x: 1690, y: 365, w: 280, h: 48 },
    approach: { x: 1650, y: 430 },
  },
  decorations: [
    { kind: 'flowers', x: 535, y: 255 },
    { kind: 'bench', x: 850, y: 715 },
    { kind: 'lamp-row', x: 1135, y: 720 },
    { kind: 'fence', x: 210, y: 930 },
    { kind: 'shrubs', x: 1260, y: 1010 },
  ],
  asset: '/games/rpg/art/maps/village-map.webp',
  preview: '/games/rpg/art/maps/village-preview.webp',
};

const forest = {
  id: 'forest',
  name: 'Forest Quest',
  description: 'Cross a woodland bridge and discover a glowing shrine.',
  world: { width: 2175, height: 1450 },
  spawn: { x: 1050, y: 1260 },
  paths: [
    { id: 'clearing-trail', points: [[1050, 1420], [1060, 1170], [920, 980], [1110, 825]], width: 150 },
    { id: 'bridge-trail', points: [[1110, 825], [1260, 680], [1390, 700], [1580, 610]], width: 115 },
    { id: 'shrine-climb', points: [[1580, 610], [1710, 485], [1840, 390], [1930, 325]], width: 105 },
  ],
  obstacles: [
    { x: 0, y: 0, w: 565, h: 350, kind: 'waterfall-and-cliffs' },
    { x: 590, y: 0, w: 520, h: 285, kind: 'ruins-and-grove' },
    { x: 0, y: 350, w: 390, h: 435, kind: 'west-grove' },
    { x: 760, y: 390, w: 355, h: 275, kind: 'river' },
    { x: 1320, y: 285, w: 465, h: 360, kind: 'river-and-cliffs' },
    { x: 1785, y: 650, w: 390, h: 280, kind: 'east-river' },
    { x: 0, y: 805, w: 430, h: 520, kind: 'cottage-grove' },
    { x: 1390, y: 930, w: 785, h: 450, kind: 'east-grove-and-pond' },
  ],
  npcZones: [
    { x: 545, y: 605 }, { x: 720, y: 520 }, { x: 1280, y: 530 },
    { x: 1510, y: 785 }, { x: 1085, y: 845 }, { x: 845, y: 845 },
    { x: 700, y: 1025 }, { x: 1085, y: 1025 }, { x: 1270, y: 1185 },
    { x: 845, y: 1185 }, { x: 1160, y: 1140 }, { x: 1320, y: 755 },
  ],
  specialZones: {
    phrase: { x: 1125, y: 750 },
    chest: { x: 1430, y: 730 },
  },
  landmarks: [
    { id: 'river-bridge', name: 'Whispering Bridge', x: 925, y: 520 },
    { id: 'forest-pond', name: 'Lily Pond', x: 620, y: 650 },
    { id: 'glowing-shrine', name: 'Glowing Word Shrine', x: 1880, y: 260 },
  ],
  bossArea: {
    name: 'Glowing Word Shrine',
    x: 1730, y: 25, w: 420, h: 365,
    boss: { x: 1930, y: 150 },
    gate: { x: 1770, y: 350, w: 320, h: 48 },
    approach: { x: 1930, y: 425 },
  },
  decorations: [
    { kind: 'mushrooms', x: 720, y: 465 },
    { kind: 'flowers', x: 1420, y: 405 },
    { kind: 'rocks', x: 350, y: 850 },
    { kind: 'fireflies', x: 1650, y: 540 },
    { kind: 'ferns', x: 1220, y: 1050 },
  ],
  asset: '/games/rpg/art/maps/forest-map.webp',
  preview: '/games/rpg/art/maps/forest-preview.webp',
};

const campus = {
  id: 'campus',
  name: 'School Campus',
  description: 'Explore the library, courtyard, and activity grounds.',
  world: { width: 2100, height: 1400 },
  spawn: { x: 1050, y: 1240 },
  paths: [
    { id: 'main-walk', points: [[1050, 1390], [1050, 1090], [1040, 850], [1035, 625], [1030, 430]], width: 155 },
    { id: 'courtyard-loop', points: [[1035, 625], [760, 600], [690, 760], [865, 900], [1130, 900], [1340, 740], [1320, 580], [1035, 625]], width: 120 },
    { id: 'knowledge-walk', points: [[1320, 580], [1500, 470], [1700, 390], [1875, 350]], width: 110 },
  ],
  obstacles: [
    { x: 0, y: 0, w: 595, h: 320, kind: 'science-wing' },
    { x: 650, y: 110, w: 600, h: 310, kind: 'main-school' },
    { x: 1330, y: 0, w: 400, h: 350, kind: 'hall-west-wing' },
    { x: 2045, y: 0, w: 55, h: 350, kind: 'hall-east-wall' },
    { x: 0, y: 315, w: 575, h: 350, kind: 'library' },
    { x: 1440, y: 470, w: 660, h: 340, kind: 'campus-cafe' },
    { x: 0, y: 720, w: 650, h: 430, kind: 'pond-and-gazebo' },
    { x: 850, y: 510, w: 400, h: 270, kind: 'courtyard-fountain' },
    { x: 1260, y: 815, w: 675, h: 325, kind: 'study-garden' },
  ],
  npcZones: [
    { x: 770, y: 585 }, { x: 1050, y: 470 }, { x: 1330, y: 585 },
    { x: 710, y: 760 }, { x: 1050, y: 815 }, { x: 1400, y: 770 },
    { x: 840, y: 935 }, { x: 1050, y: 1015 }, { x: 1240, y: 930 },
    { x: 875, y: 455 }, { x: 1130, y: 455 }, { x: 1455, y: 445 },
  ],
  specialZones: {
    phrase: { x: 920, y: 840 },
    chest: { x: 1305, y: 700 },
  },
  landmarks: [
    { id: 'main-entrance', name: 'Main School Entrance', x: 460, y: 320 },
    { id: 'learning-courtyard', name: 'Learning Courtyard', x: 1025, y: 760 },
    { id: 'grand-library', name: 'Grand Library', x: 1395, y: 195 },
  ],
  bossArea: {
    name: 'Hall of Knowledge',
    x: 1670, y: 0, w: 410, h: 390,
    boss: { x: 1890, y: 150 },
    gate: { x: 1700, y: 350, w: 350, h: 48 },
    approach: { x: 1880, y: 430 },
  },
  decorations: [
    { kind: 'notice-board', x: 610, y: 390 },
    { kind: 'bench', x: 1350, y: 520 },
    { kind: 'flowers', x: 410, y: 810 },
    { kind: 'lamp-row', x: 1510, y: 410 },
    { kind: 'bike-rack', x: 695, y: 1080 },
  ],
  asset: '/games/rpg/art/maps/campus-map.webp',
  preview: '/games/rpg/art/maps/campus-preview.webp',
};

export const RPG_MAP_THEMES = [village, forest, campus];

export const getRpgMapTheme = (id) =>
  RPG_MAP_THEMES.find((theme) => theme.id === id) || RPG_MAP_THEMES[0];

export const readRpgMapTheme = (storage) => {
  try {
    return getRpgMapTheme(storage?.getItem(RPG_MAP_THEME_KEY));
  } catch {
    return RPG_MAP_THEMES[0];
  }
};

export const persistRpgMapTheme = (id, storage) => {
  const theme = getRpgMapTheme(id);
  try {
    storage?.setItem(RPG_MAP_THEME_KEY, theme.id);
  } catch {
    // The selected map still works when storage is unavailable.
  }
  return theme;
};
