const key = (x, y) => `${x},${y}`;
export const mazeKey = (point) => key(point.x, point.y);
export const sameTile = (a, b) => Boolean(a && b && a.x === b.x && a.y === b.y);
export const mazeDirections = [
  { x: 0, y: -1, name: "up" },
  { x: 1, y: 0, name: "right" },
  { x: 0, y: 1, name: "down" },
  { x: -1, y: 0, name: "left" },
];

export const shuffled = (items, random = Math.random) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const chunkMazeWords = (words, maximum = 20) => {
  const count = Math.ceil(words.length / maximum);
  if (!count) return [];
  const base = Math.floor(words.length / count);
  const extra = words.length % count;
  let offset = 0;
  return Array.from({ length: count }, (_, index) => {
    const size = base + (index < extra ? 1 : 0);
    const chunk = words.slice(offset, offset + size);
    offset += size;
    return chunk;
  });
};

export const mazeThreshold = (count) => Math.min(Math.max(1, count - 1), Math.ceil(count * 0.7));
export const mazeCadence = (difficulty) =>
  difficulty === "relaxed" ? 4 : difficulty === "challenge" ? 2 : 3;

export const isMazeFloor = (maze, position, gateOpen = false) => {
  if (!maze || !position || !maze.grid[position.y]?.[position.x]) return false;
  if (sameTile(position, maze.gate) && !gateOpen) return false;
  return true;
};

export const mazeNeighborsAt = (maze, position, gateOpen = false) =>
  mazeDirections
    .map((direction) => ({ x: position.x + direction.x, y: position.y + direction.y }))
    .filter((tile) => isMazeFloor(maze, tile, gateOpen));

export const mazeDistances = (maze, start, gateOpen = false) => {
  if (!isMazeFloor(maze, start, gateOpen)) return new Map();
  const distances = new Map([[mazeKey(start), 0]]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const tile = queue[cursor];
    for (const next of mazeNeighborsAt(maze, tile, gateOpen)) {
      const id = mazeKey(next);
      if (distances.has(id)) continue;
      distances.set(id, distances.get(mazeKey(tile)) + 1);
      queue.push(next);
    }
  }
  return distances;
};

export const mazeShortestTilePath = (maze, start, target, gateOpen = false) => {
  if (!isMazeFloor(maze, start, gateOpen) || !isMazeFloor(maze, target, gateOpen)) return [];
  const queue = [start];
  const previous = new Map([[mazeKey(start), null]]);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const tile = queue[cursor];
    if (sameTile(tile, target)) {
      const path = [];
      for (let at = mazeKey(tile); at; at = previous.get(at)) {
        const [x, y] = at.split(",").map(Number);
        path.unshift({ x, y });
      }
      return path;
    }
    for (const next of mazeNeighborsAt(maze, tile, gateOpen)) {
      const id = mazeKey(next);
      if (previous.has(id)) continue;
      previous.set(id, mazeKey(tile));
      queue.push(next);
    }
  }
  return [];
};

export const validateMaze = (maze) => {
  if (!maze || !isMazeFloor(maze, maze.start) || !isMazeFloor(maze, maze.ghostStart)) return false;
  const closed = mazeDistances(maze, maze.start);
  const open = mazeDistances(maze, maze.start, true);
  const main = maze.grid.flatMap((row, y) => row.map((floor, x) => ({ floor, x, y })))
    .filter((tile) => tile.floor && !maze.bossArea.has(mazeKey(tile)) && !sameTile(tile, maze.gate));
  if (!main.every((tile) => closed.has(mazeKey(tile)))) return false;
  if (closed.has(mazeKey(maze.boss)) || closed.has(mazeKey(maze.gate))) return false;
  if (!open.has(mazeKey(maze.boss)) || open.size !== main.length + maze.bossArea.size + 1) return false;
  if (!closed.has(mazeKey(maze.key)) || !closed.has(mazeKey(maze.ghostStart))) return false;
  if ((closed.get(mazeKey(maze.ghostStart)) || 0) < 5) return false;
  if (maze.primary.size !== maze.words.length) return false;
  if (new Set([...maze.primary.values()]).size !== maze.words.length) return false;
  if (![...maze.primary.keys(), ...maze.review, ...maze.coins, mazeKey(maze.power), mazeKey(maze.key)]
    .every((id) => closed.has(id))) return false;
  return true;
};

const makeMaze = (words, random) => {
  const side = words.length <= 5 ? 11 : words.length <= 8 ? 13 :
    words.length <= 12 ? 15 : words.length <= 16 ? 17 : 19;
  const width = side + 4;
  const height = side;
  const grid = Array.from({ length: height }, () => Array(width).fill(false));
  const carve = (x, y) => {
    grid[y][x] = true;
    for (const vector of shuffled(mazeDirections, random)) {
      const nx = x + vector.x * 2;
      const ny = y + vector.y * 2;
      if (nx <= 0 || nx >= side - 1 || ny <= 0 || ny >= height - 1 || grid[ny][nx]) continue;
      grid[y + vector.y][x + vector.x] = true;
      carve(nx, ny);
    }
  };
  carve(1, 1);
  // A few internal wall openings give the chase alternate routes.
  const loopWalls = [];
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < side - 2; x += 1) {
      if (grid[y][x]) continue;
      if ((grid[y][x - 1] && grid[y][x + 1]) || (grid[y - 1][x] && grid[y + 1][x]))
        loopWalls.push({ x, y });
    }
  }
  shuffled(loopWalls, random).slice(0, Math.max(2, Math.round(words.length / 3)))
    .forEach(({ x, y }) => { grid[y][x] = true; });

  const gateYs = shuffled(Array.from({ length: Math.floor((height - 1) / 2) }, (_, i) => 1 + i * 2)
    .filter((y) => grid[y][side - 2]), random);
  const gate = { x: side - 1, y: gateYs[0] };
  grid[gate.y][gate.x] = true;
  const bossArea = new Set();
  for (let y = gate.y - 1; y <= gate.y + 1; y += 1) {
    for (let x = side; x <= side + 2; x += 1) {
      if (y > 0 && y < height - 1) {
        grid[y][x] = true;
        bossArea.add(key(x, y));
      }
    }
  }
  const boss = { x: side + 1, y: gate.y };
  const start = { x: 1, y: 1 };
  const maze = { width, height, grid, start, gate, boss, bossArea, words };
  const distances = mazeDistances(maze, start);
  const main = [...distances.keys()].map((id) => {
    const [x, y] = id.split(",").map(Number);
    return { x, y, distance: distances.get(id) };
  });
  const available = shuffled(main.filter((tile) => tile.distance >= 3 &&
    !(tile.x === side - 2 && tile.y === gate.y)), random);
  const gateDistances = mazeDistances(maze, { x: side - 2, y: gate.y });
  const isBranch = (tile) => mazeNeighborsAt(maze, tile).length <= 2;
  const take = (predicate = () => true) => {
    const index = available.findIndex(predicate);
    return index < 0 ? null : available.splice(index, 1)[0];
  };
  maze.ghostStart = take((tile) => tile.distance >= 8) || take((tile) => tile.distance >= 5);
  maze.key = take((tile) => tile.distance >= 8 && isBranch(tile) &&
    (gateDistances.get(mazeKey(tile)) || 0) >= 5) || take((tile) => tile.distance >= 5 && isBranch(tile)) || take();
  maze.power = take((tile) => tile.distance >= 5 && isBranch(tile)) || take((tile) => tile.distance >= 5) || take();
  maze.checkpoint = words.length >= 10 ? take((tile) => tile.distance >= 5) : null;
  const orderedWords = shuffled(words, random);
  const primaryPositions = shuffled(available, random).slice(0, words.length);
  maze.primary = new Map(primaryPositions.map((tile, index) => [mazeKey(tile), orderedWords[index].id]));
  primaryPositions.forEach((tile) => available.splice(available.findIndex((candidate) => sameTile(candidate, tile)), 1));
  maze.review = new Set(shuffled(available, random).slice(0, Math.max(2, Math.round(words.length * 0.25))).map(mazeKey));
  [...maze.review].forEach((id) => available.splice(available.findIndex((tile) => mazeKey(tile) === id), 1));
  maze.coins = new Set(shuffled(available.filter((tile) => mazeNeighborsAt(maze, tile).length <= 2), random)
    .slice(0, Math.max(2, Math.min(5, Math.round(words.length / 4)))).map(mazeKey));
  maze.dots = new Set(main.map(mazeKey).filter((id) => id !== mazeKey(start) &&
    id !== mazeKey(maze.ghostStart) && !maze.primary.has(id) && !maze.review.has(id) &&
    !maze.coins.has(id) && id !== mazeKey(maze.key) && id !== mazeKey(maze.power) &&
    id !== (maze.checkpoint && mazeKey(maze.checkpoint))));
  return maze;
};

export const generateMazeGrid = (words, random = Math.random) => {
  if (!words?.length || words.some((word) => word?.id == null)) throw new Error("Maze needs identified vocabulary words");
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const maze = makeMaze(words, random);
    if (validateMaze(maze)) return maze;
  }
  throw new Error("Could not generate a solvable maze");
};
