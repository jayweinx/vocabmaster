const MAX_DOCX_BYTES = 20 * 1024 * 1024;

const cleanText = (value) => String(value || '')
  .replace(/\u00a0/g, ' ')
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normalizeKey = (value) => cleanText(value)
  .toLowerCase()
  .replace(/[\s/\\|:;,.()\[\]{}_-]+/g, '');

const decodeHtml = (value) => String(value || '')
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&apos;|&#39;/gi, "'");

const htmlToText = (html) => cleanText(decodeHtml(
  String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li)>/gi, ' ')
    .replace(/<[^>]+>/g, ''),
));

const stripDisplayNumber = (value) => cleanText(value)
  .replace(/^\s*(?:\(?\d+\)?[.、):\-]\s*)+/, '')
  .trim();

const isIgnoredHeading = (value) => {
  const key = normalizeKey(value);
  return !key
    || key === 'vocabularyexpressions'
    || key === 'wordphrase'
    || key === '中文意思'
    || key === 'englishmeaningusage';
};

const isSectionHeading = (value) => /^[A-Z][.)]\s+\S/i.test(cleanText(value));
const cleanSectionHeading = (value) => cleanText(value).replace(/\s+[\u3400-\u9fff][\u3400-\u9fff\s·•，、；：。！？（）()]*$/u, '').trim();

const fileStem = (fileName) => cleanText(String(fileName || '').replace(/\.docx$/i, ''));

const chooseDocumentTitle = (paragraphTitle, fileName) => {
  const paragraph = cleanText(paragraphTitle);
  const stem = fileStem(fileName);
  const genericTitle = /^trial\s+english\s+\d{4}\s*[-–—]?\s*vocabulary$/i.test(paragraph);
  if (stem && (!paragraph || (genericTitle && normalizeKey(stem) !== normalizeKey(paragraph)))) return stem;
  return paragraph || stem || 'DOCX Vocabulary Import';
};

const parseRows = (tableHtml) => {
  const rows = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(tableHtml))) {
    const cells = [];
    const cellPattern = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowMatch[1]))) cells.push(htmlToText(cellMatch[1]));
    if (cells.some(Boolean)) rows.push(cells);
  }
  return rows;
};

const getColumnMap = (cells) => {
  const keys = cells.map(normalizeKey);
  const word = keys.findIndex((key) => key === 'wordphrase' || key === 'word' || key === 'vocabularywordphrase');
  const mandarin = keys.findIndex((key) => key.includes('中文意思') || key.includes('chinesemeaning') || key === 'mandarin');
  const meaning = keys.findIndex((key) => key.includes('englishmeaning') || key.includes('meaningusage') || key === 'meaning' || key.includes('englishexplanation'));
  return word >= 0 && mandarin >= 0 && meaning >= 0 ? { word, mandarin, meaning } : null;
};

const getPathNames = (folderId, folders) => {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names = [];
  const seen = new Set();
  let current = byId.get(folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return names;
};

const findExistingFolder = (pathNames, folders) => {
  const target = pathNames.map(normalizeKey).join('>');
  return folders.find((folder) => getPathNames(folder.id, folders).map(normalizeKey).join('>') === target) || null;
};

const createDraftFolder = ({ id, name, parentId, type, pathNames, existingFolders }) => {
  const existing = findExistingFolder(pathNames, existingFolders);
  return {
    id,
    name,
    parentId,
    type,
    rawHeading: name,
    sourcePage: null,
    lineNumber: null,
    needsReview: false,
    existingFolderId: existing?.id || null,
    ignored: false,
  };
};

const extractBlocks = (html) => {
  const blocks = [];
  const pattern = /<(p|h[1-6]|table)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = pattern.exec(String(html || '')))) {
    blocks.push(match[1].toLowerCase() === 'table'
      ? { type: 'table', html: match[2] }
      : { type: 'text', text: htmlToText(match[2]) });
  }
  return blocks;
};

export function parseDocxVocabularyHtml(html, {
  fileName = '',
  destinationFolder = null,
  existingFolders = [],
  parserMessages = [],
} = {}) {
  const blocks = extractBlocks(html);
  const textBlocks = blocks.filter((block) => block.type === 'text' && block.text);
  const firstTitle = textBlocks.find((block) => !isIgnoredHeading(block.text) && !isSectionHeading(block.text))?.text || '';
  const documentTitle = chooseDocumentTitle(firstTitle, fileName);
  const folders = [];
  const headings = [];
  const items = [];
  const warnings = parserMessages.map((message) => cleanText(message?.message || message)).filter(Boolean);
  const errors = [];
  const unrecognised = [];
  let sequence = 0;
  let currentSection = '';
  let currentSectionFolder = null;

  const destinationName = cleanText(destinationFolder?.name);
  let parentId = null;
  let parentPath = [];
  if (destinationName) {
    const destination = createDraftFolder({
      id: `docx-destination-${sequence += 1}`,
      name: destinationName,
      parentId: null,
      type: 'AUTO_PARENT',
      pathNames: [destinationName],
      existingFolders,
    });
    folders.push(destination);
    parentId = destination.id;
    parentPath = [destinationName];
  }

  const documentFolder = createDraftFolder({
    id: `docx-document-${sequence += 1}`,
    name: documentTitle,
    parentId,
    type: 'DOCUMENT_TITLE',
    pathNames: [...parentPath, documentTitle],
    existingFolders,
  });
  folders.push(documentFolder);

  const ensureSectionFolder = (sectionName) => {
    if (currentSectionFolder?.name === sectionName) return currentSectionFolder;
    currentSectionFolder = createDraftFolder({
      id: `docx-section-${sequence += 1}`,
      name: sectionName,
      parentId: documentFolder.id,
      type: 'SECTION',
      pathNames: [...parentPath, documentTitle, sectionName],
      existingFolders,
    });
    folders.push(currentSectionFolder);
    return currentSectionFolder;
  };

  blocks.forEach((block, blockIndex) => {
    if (block.type === 'text') {
      const text = cleanText(block.text);
      if (!text || isIgnoredHeading(text) || normalizeKey(text) === normalizeKey(firstTitle)) return;
      if (isSectionHeading(text)) {
        currentSection = cleanSectionHeading(text);
        headings.push({ lineNumber: blockIndex + 1, text: currentSection, type: 'section', value: currentSection });
        ensureSectionFolder(currentSection);
      }
      return;
    }

    const rows = parseRows(block.html);
    const headerIndex = rows.findIndex((row) => getColumnMap(row));
    if (headerIndex < 0) {
      unrecognised.push({ id: `docx-table-${blockIndex}`, lineNumber: blockIndex + 1, text: 'Table header was not recognised.' });
      return;
    }
    const columnMap = getColumnMap(rows[headerIndex]);
    const sectionName = currentSection || 'Vocabulary';
    const sectionFolder = ensureSectionFolder(sectionName);
    rows.slice(headerIndex + 1).forEach((cells, rowIndex) => {
      if (getColumnMap(cells)) return;
      const word = stripDisplayNumber(cells[columnMap.word]);
      const mandarin = cleanText(cells[columnMap.mandarin]);
      const meaning = cleanText(cells[columnMap.meaning]);
      if (!word && !mandarin && !meaning) return;
      const validationWarnings = [];
      if (!mandarin) validationWarnings.push('Missing Mandarin');
      if (!meaning) validationWarnings.push('Missing meaning');
      if (!word) errors.push(`Missing word in ${sectionName}, row ${rowIndex + 2}.`);
      const path = [...parentPath, documentTitle, sectionName];
      items.push({
        id: `docx-preview-${items.length + 1}`,
        lineNumber: items.length + 1,
        rawSource: cells.join(' | '),
        word,
        pronunciation: '',
        meaning,
        mandarin,
        category: path.join(' › '),
        folderId: sectionFolder.id,
        section: sectionName,
        part: '',
        question: '',
        sourcePage: null,
        rawHeading: sectionName,
        validationWarnings,
        ignored: false,
      });
    });
  });

  const sectionCounts = folders
    .filter((folder) => folder.type === 'SECTION')
    .map((folder) => ({
      name: folder.name,
      count: items.filter((item) => item.folderId === folder.id).length,
    }));

  if (!items.length) errors.push('No recognised vocabulary rows were found. Check that the DOCX contains a table with Word / Phrase, 中文意思, and English meaning / usage columns.');

  return {
    source: 'docx',
    fileName,
    documentTitle,
    sections: sectionCounts.map((section) => section.name),
    sectionCounts,
    items,
    folders,
    headings,
    unknownHeadings: [],
    unrecognised,
    warnings,
    errors,
    totalLines: items.length,
  };
}

export async function analyseDocxArrayBuffer(arrayBuffer, options = {}) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) throw new Error('The DOCX file is empty.');
  if (arrayBuffer.byteLength > MAX_DOCX_BYTES) throw new Error('This DOCX is larger than 20 MB. Please use a smaller document.');
  let result;
  try {
    const { default: mammoth } = await import('mammoth');
    result = await mammoth.convertToHtml({ arrayBuffer }, {
      includeDefaultStyleMap: true,
      includeEmbeddedStyleMap: true,
      ignoreEmptyParagraphs: true,
    });
  } catch (error) {
    throw new Error(`The DOCX could not be read. It may be damaged or invalid. ${error.message || ''}`.trim());
  }
  const analysis = parseDocxVocabularyHtml(result.value, { ...options, parserMessages: result.messages });
  if (!analysis.items.length) throw new Error(analysis.errors[0]);
  return analysis;
}

export async function analyseDocxFile(file, options = {}) {
  if (!file) throw new Error('Choose a DOCX file first.');
  if (!/\.docx$/i.test(file.name || '')) throw new Error('Please upload a .docx file.');
  if (file.size === 0) throw new Error('The DOCX file is empty.');
  if (file.size > MAX_DOCX_BYTES) throw new Error('This DOCX is larger than 20 MB. Please use a smaller document.');
  return analyseDocxArrayBuffer(await file.arrayBuffer(), { ...options, fileName: file.name });
}

export { cleanText as cleanDocxText };
