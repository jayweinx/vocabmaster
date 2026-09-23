export const shuffle = (values) => {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const MAZE_TTS_LANG = "en-US";

export const mazeDescendantFolderIds = (folders, rootId) => {
  if (!rootId) return new Set();
  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    folders.forEach((folder) => {
      if (ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    });
  }
  return ids;
};

export const mazeFolderPath = (folders, folderId) => {
  const path = [];
  let folder = folders.find((item) => item.id === folderId);
  while (folder) {
    path.unshift(folder.name);
    folder = folders.find((item) => item.id === folder.parentId);
  }
  return path;
};

export const mazeFolderUsableWords = (words, folders, folderId) => {
  const ids = mazeDescendantFolderIds(folders, folderId);
  return words.filter((word) => usableMazeWord(word) && ids.has(word.folderId));
};

export const mazeEdgeKey = (a, b) => [a, b].sort((x, y) => x - y).join("-");
export const mazeNeighbors = (graph, id) =>
  graph
    ? graph.edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))
    : [];
export const mazeShortestPath = (graph, start, target) => {
  if (!graph || start == null || target == null) return [];
  const queue = [start],
    previous = new Map([[start, null]]);
  while (queue.length) {
    const current = queue.shift();
    if (current === target) {
      const path = [];
      for (let cursor = current; cursor != null; cursor = previous.get(cursor))
        path.unshift(cursor);
      return path;
    }
    mazeNeighbors(graph, current).forEach((next) => {
      if (!previous.has(next)) {
        previous.set(next, current);
        queue.push(next);
      }
    });
  }
  return [];
};

export const mazeReachableWithout = (
  graph,
  start,
  target,
  blocked = new Set(),
) => {
  if (blocked.has(start) || blocked.has(target)) return false;
  const queue = [start],
    seen = new Set([start]);
  while (queue.length) {
    const current = queue.shift();
    if (current === target) return true;
    mazeNeighbors(graph, current).forEach((next) => {
      if (!blocked.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    });
  }
  return false;
};

export const mazeNonArticulationIds = (graph, excluded = new Set()) =>
  graph.nodes
    .filter((node) => node.id !== graph.startId && !excluded.has(node.id))
    .filter((node) =>
      graph.nodes
        .filter((other) => other.id !== node.id && !excluded.has(other.id))
        .every((other) =>
          mazeReachableWithout(
            graph,
            graph.startId,
            other.id,
            new Set([...excluded, node.id]),
          ),
        ),
    )
    .map((node) => node.id);

export const usableMazeWord = (word) =>
  Boolean(word?.word && (word?.meaning || word?.mandarin));
export const meaningLines = (word) =>
  [word?.meaning, word?.mandarin].filter(Boolean);
export const meaningKey = (word) =>
  meaningLines(word).join("\u0000").trim().toLowerCase();

export const generateMazeGraph = (requested = 10) => {
  const count = Math.max(5, Math.min(30, Number(requested) || 10));
  const nodes = [{ id: 0, x: 500, y: 310, type: "start" }];
  const points = [{ x: 500, y: 310 }];
  const minDistance = count > 18 ? 72 : 92;
  for (let id = 1; id <= count; id += 1) {
    let point;
    for (let attempt = 0; attempt < 300 && !point; attempt += 1) {
      const candidate = {
        x: 80 + Math.random() * 840,
        y: 70 + Math.random() * 480,
      };
      if (
        points.every(
          (existing) =>
            Math.hypot(candidate.x - existing.x, candidate.y - existing.y) >
            minDistance,
        )
      )
        point = candidate;
    }
    point ||= {
      x: 500 + Math.cos(id * 2.4) * (130 + (id % 4) * 70),
      y: 310 + Math.sin(id * 2.4) * (95 + (id % 4) * 45),
    };
    points.push(point);
    nodes.push({ id, ...point, type: "dot" });
  }
  const edges = [];
  for (let id = 1; id <= count; id += 1) {
    const nearest = nodes
      .slice(0, id)
      .sort(
        (a, b) =>
          Math.hypot(nodes[id].x - a.x, nodes[id].y - a.y) -
          Math.hypot(nodes[id].x - b.x, nodes[id].y - b.y),
      )[0];
    edges.push([id, nearest.id]);
  }
  const keys = new Set(edges.map((edge) => mazeEdgeKey(...edge)));
  const candidates = [];
  nodes.forEach((a, i) =>
    nodes.slice(i + 1).forEach((b) => {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (!keys.has(mazeEdgeKey(a.id, b.id)) && distance < 300)
        candidates.push({ a: a.id, b: b.id, distance });
    }),
  );
  shuffle(candidates)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(2, Math.floor(count * 0.4)))
    .forEach(({ a, b }) => edges.push([a, b]));
  const distant = nodes
    .slice(1)
    .sort(
      (a, b) =>
        Math.hypot(b.x - 500, b.y - 310) - Math.hypot(a.x - 500, a.y - 310),
    );
  const bossId =
    distant.find((node) =>
      mazeNonArticulationIds({ nodes, edges, startId: 0 }).includes(node.id),
    )?.id || distant[0].id;
  const graph = { nodes, edges, startId: 0 };
  const gateCandidates = mazeNonArticulationIds(graph, new Set([bossId]));
  const pool = shuffle(
    nodes
      .slice(1)
      .map((node) => node.id)
      .filter((id) => id !== bossId),
  );
  const take = () => pool.shift() ?? null;
  const gate =
    count >= 8
      ? (shuffle(gateCandidates).find((id) => id !== bossId) ?? null)
      : null;
  if (gate != null) pool.splice(pool.indexOf(gate), 1);
  const key =
    count >= 8
      ? (pool.find((id) =>
          mazeReachableWithout(graph, 0, id, new Set([bossId, gate])),
        ) ?? null)
      : null;
  if (key != null) pool.splice(pool.indexOf(key), 1);
  const ids = {
    gate: key == null ? null : gate,
    key,
    power: count >= 6 ? take() : null,
    heart: count >= 7 ? take() : null,
    coin: take(),
    monster: count >= 6 ? take() : null,
    portalA: count >= 10 ? take() : null,
    portalB: count >= 10 ? take() : null,
  };
  const setType = (id, type) => {
    const node = nodes.find((item) => item.id === id);
    if (node) node.type = type;
  };
  Object.entries(ids).forEach(([type, id]) =>
    setType(id, type.startsWith("portal") ? "portal" : type),
  );
  setType(bossId, "boss");
  return {
    nodes,
    edges,
    startId: 0,
    bossId,
    portalPair:
      ids.portalA != null && ids.portalB != null
        ? { [ids.portalA]: ids.portalB, [ids.portalB]: ids.portalA }
        : {},
    ghostStart:
      distant.find((node) => node.id !== bossId && node.id !== ids.gate)?.id ||
      1,
  };
};

export const buildMazeQuestion = (node, words, previousId) => {
  const eligible = words.filter(usableMazeWord);
  const target =
    eligible.filter((word) => word.id !== previousId)[
      Math.floor(
        Math.random() *
          Math.max(1, eligible.filter((word) => word.id !== previousId).length),
      )
    ] || eligible[0];
  if (!target) return null;
  const unique = (items, value) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = value(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  if (eligible.length >= 3 && ["monster", "boss"].includes(node?.type)) {
    const seenWords = new Set();
    const seenMeanings = new Set();
    const pairs = shuffle(eligible)
      .filter((word) => {
        const wordKey = word.word.trim().toLowerCase();
        const nextMeaning = meaningKey(word);
        if (seenWords.has(wordKey) || seenMeanings.has(nextMeaning))
          return false;
        seenWords.add(wordKey);
        seenMeanings.add(nextMeaning);
        return true;
      })
      .slice(0, 3);
    if (pairs.length === 3)
      return { mode: "MATCH", target, pairs, meanings: shuffle(pairs) };
  }
  const mode = ["key", "gate", "coin"].includes(node?.type)
    ? "MEANING_TO_WORD"
    : ["power", "portal"].includes(node?.type)
      ? "AUDIO_TO_MEANING"
      : "WORD_TO_MEANING";
  const key =
    mode === "MEANING_TO_WORD"
      ? (word) => word.word.trim().toLowerCase()
      : meaningKey;
  const options = unique(
    [target, ...shuffle(eligible.filter((word) => word.id !== target.id))],
    key,
  ).slice(0, 4);
  return { mode, target, correctId: target.id, options };
};
