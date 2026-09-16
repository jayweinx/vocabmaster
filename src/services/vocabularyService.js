import { isSupabaseConfigured, supabase } from '../lib/supabase';

const FOLDER_COLUMNS = new Set([
  'id', 'name', 'parentId', 'order', 'type', 'rawHeading', 'sourcePage',
  'importBatchId', 'createdAt', 'updatedAt',
]);
const WORD_COLUMNS = new Set([
  'id', 'word', 'pronunciation', 'meaning', 'mandarin', 'category', 'folderId',
  'section', 'part', 'question', 'sourcePage', 'rawHeading', 'rawSource',
  'importBatchId', 'createdAt', 'updatedAt',
]);

const assertConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add the two VITE_SUPABASE environment values and rebuild the app.');
  }
};

const metadataFrom = (item, knownKeys) => Object.fromEntries(
  Object.entries(item || {}).filter(([key, value]) => !knownKeys.has(key) && value !== undefined),
);

const folderToRow = (folder, index) => ({
  id: String(folder.id),
  name: String(folder.name || '').trim(),
  parent_id: folder.parentId === null || folder.parentId === undefined || folder.parentId === '' ? null : String(folder.parentId),
  sort_order: Number.isFinite(Number(folder.order)) ? Number(folder.order) : index,
  folder_type: folder.type || null,
  raw_heading: folder.rawHeading || null,
  source_page: folder.sourcePage !== null && folder.sourcePage !== undefined && folder.sourcePage !== '' && Number.isFinite(Number(folder.sourcePage)) ? Number(folder.sourcePage) : null,
  import_batch_id: folder.importBatchId ? String(folder.importBatchId) : null,
  metadata: metadataFrom(folder, FOLDER_COLUMNS),
  created_at: folder.createdAt || new Date().toISOString(),
  updated_at: folder.updatedAt || new Date().toISOString(),
});

const wordToRow = (item) => ({
  id: String(item.id),
  word: String(item.word || '').trim(),
  pronunciation: item.pronunciation || '',
  meaning: item.meaning || '',
  mandarin: item.mandarin || '',
  category: item.category || 'General',
  folder_id: item.folderId === null || item.folderId === undefined || item.folderId === '' ? null : String(item.folderId),
  section: item.section || '',
  part: item.part || '',
  question: item.question || '',
  source_page: item.sourcePage !== null && item.sourcePage !== undefined && item.sourcePage !== '' && Number.isFinite(Number(item.sourcePage)) ? Number(item.sourcePage) : null,
  raw_heading: item.rawHeading || '',
  raw_source: item.rawSource || '',
  import_batch_id: item.importBatchId ? String(item.importBatchId) : null,
  metadata: metadataFrom(item, WORD_COLUMNS),
  created_at: item.createdAt || new Date().toISOString(),
  updated_at: item.updatedAt || new Date().toISOString(),
});

const rowToFolder = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  name: row.name,
  parentId: row.parent_id,
  order: row.sort_order,
  type: row.folder_type || undefined,
  rawHeading: row.raw_heading || undefined,
  sourcePage: row.source_page,
  importBatchId: row.import_batch_id || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToWord = (row) => ({
  ...(row.metadata || {}),
  id: row.id,
  word: row.word,
  pronunciation: row.pronunciation || '',
  meaning: row.meaning || '',
  mandarin: row.mandarin || '',
  category: row.category || 'General',
  folderId: row.folder_id,
  section: row.section || '',
  part: row.part || '',
  question: row.question || '',
  sourcePage: row.source_page,
  rawHeading: row.raw_heading || '',
  rawSource: row.raw_source || '',
  importBatchId: row.import_batch_id || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const throwIfError = (result, context) => {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
};

export async function loadCloudLibrary() {
  assertConfigured();
  const [folderResult, wordResult] = await Promise.all([
    supabase.from('folders').select('*').order('sort_order').order('created_at'),
    supabase.from('words').select('*').order('created_at'),
  ]);
  const folders = throwIfError(folderResult, 'Could not load folders').map(rowToFolder);
  const words = throwIfError(wordResult, 'Could not load words').map(rowToWord);
  return { folders, words };
}

const chunk = (items, size = 250) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

const folderDepth = (folder, byId) => {
  let depth = 0;
  let cursor = folder;
  const seen = new Set();
  while (cursor?.parentId && !seen.has(String(cursor.id))) {
    seen.add(String(cursor.id));
    cursor = byId.get(String(cursor.parentId));
    depth += 1;
  }
  return depth;
};

export function validateLibrary(library) {
  const folders = Array.isArray(library?.folders) ? library.folders : [];
  const words = Array.isArray(library?.words) ? library.words : [];
  const errors = [];
  const folderIds = new Set();
  const wordIds = new Set();

  folders.forEach((folder, index) => {
    if (folder?.id === undefined || folder?.id === null || folder?.id === '') errors.push(`Folder ${index + 1} has no ID.`);
    if (!String(folder?.name || '').trim()) errors.push(`Folder ${index + 1} has no name.`);
    const id = String(folder?.id ?? '');
    if (folderIds.has(id)) errors.push(`Duplicate folder ID: ${id}`);
    folderIds.add(id);
  });
  folders.forEach((folder) => {
    if (folder.parentId && !folderIds.has(String(folder.parentId))) errors.push(`Folder "${folder.name}" has a missing parent (${folder.parentId}).`);
    const visited = new Set([String(folder.id)]);
    let parentId = folder.parentId ? String(folder.parentId) : null;
    while (parentId) {
      if (visited.has(parentId)) {
        errors.push(`Folder "${folder.name}" is part of a circular folder hierarchy.`);
        break;
      }
      visited.add(parentId);
      const parent = folders.find((candidate) => String(candidate.id) === parentId);
      parentId = parent?.parentId ? String(parent.parentId) : null;
    }
  });
  words.forEach((item, index) => {
    if (item?.id === undefined || item?.id === null || item?.id === '') errors.push(`Word ${index + 1} has no ID.`);
    if (!String(item?.word || '').trim()) errors.push(`Word ${index + 1} has no vocabulary text.`);
    const id = String(item?.id ?? '');
    if (wordIds.has(id)) errors.push(`Duplicate word ID: ${id}`);
    wordIds.add(id);
    if (item.folderId && !folderIds.has(String(item.folderId))) errors.push(`Word "${item.word}" uses missing folder ${item.folderId}.`);
  });
  return errors;
}

export async function syncCloudLibrary(library) {
  assertConfigured();
  const errors = validateLibrary(library);
  if (errors.length) throw new Error(errors.slice(0, 8).join(' '));

  const folders = library.folders || [];
  const words = library.words || [];
  const byId = new Map(folders.map((folder) => [String(folder.id), folder]));
  const sortedFolders = [...folders].sort((a, b) => folderDepth(a, byId) - folderDepth(b, byId));
  const folderRows = sortedFolders.map(folderToRow);
  const wordRows = words.map(wordToRow);

  for (const rows of chunk(folderRows)) {
    throwIfError(await supabase.from('folders').upsert(rows, { onConflict: 'id' }), 'Could not save folders');
  }
  for (const rows of chunk(wordRows)) {
    throwIfError(await supabase.from('words').upsert(rows, { onConflict: 'id' }), 'Could not save words');
  }

  const existingWords = throwIfError(await supabase.from('words').select('id'), 'Could not check saved words');
  const wantedWordIds = new Set(words.map((item) => String(item.id)));
  for (const ids of chunk(existingWords.map((row) => row.id).filter((id) => !wantedWordIds.has(id)))) {
    throwIfError(await supabase.from('words').delete().in('id', ids), 'Could not delete removed words');
  }

  const existingFolders = throwIfError(await supabase.from('folders').select('id'), 'Could not check saved folders');
  const wantedFolderIds = new Set(folders.map((folder) => String(folder.id)));
  for (const ids of chunk(existingFolders.map((row) => row.id).filter((id) => !wantedFolderIds.has(id)))) {
    throwIfError(await supabase.from('folders').delete().in('id', ids), 'Could not delete removed folders');
  }

  return { folderCount: folders.length, wordCount: words.length };
}

export async function signInTeacher(email, password) {
  assertConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
}

export async function signOutTeacher() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function isAllowlistedTeacher(userId) {
  if (!supabase || !userId) return false;
  const { data, error } = await supabase.from('teacher_users').select('user_id').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Could not verify teacher access: ${error.message}`);
  return Boolean(data);
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
