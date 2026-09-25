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

export const usableMazeWord = (word) =>
  Boolean(word?.word && (word?.meaning || word?.mandarin));
export const meaningLines = (word) =>
  [word?.meaning, word?.mandarin].filter(Boolean);
export const meaningKey = (word) =>
  meaningLines(word).join("\u0000").trim().toLowerCase();
