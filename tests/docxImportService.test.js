import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import mammoth from 'mammoth';
import { analyseDocxArrayBuffer, analyseDocxFile, parseDocxVocabularyHtml } from '../src/services/docxImportService.js';

const fixtureHtml = `
  <p>Trial English 2026 – Vocabulary</p>
  <p>Vocabulary • Expressions</p>
  <p>A. Part 1</p>
  <table>
    <tr><td><p>Word / Phrase</p></td><td><p>中文意思</p></td><td><p>English meaning / usage</p></td></tr>
    <tr><td><p>1. be expected to</p><p>hatch</p></td><td><p>预计会孵化</p></td><td><p>likely to come out of eggs</p></td></tr>
    <tr><td><p>2. English only</p></td><td><p></p></td><td><p>definition</p></td></tr>
  </table>
  <p>G. Beautiful Sentences</p>
  <table>
    <tr><td>Word / Phrase</td><td>中文意思</td><td>English meaning / usage</td></tr>
    <tr><td>Before clicking “Checkout”, ask yourself: Would I buy this at full price?</td><td>在点击“结账”之前，先问自己：如果是原价，我还会买吗？</td><td>think before buying at normal price</td></tr>
  </table>`;

test('parses tables, joins wrapped cells, strips display numbering, and preserves sentences', () => {
  const result = parseDocxVocabularyHtml(fixtureHtml, {
    fileName: 'Pahang Trial English 2026 – Vocabulary.docx',
    destinationFolder: { id: 'form-5', name: 'Form 5' },
  });
  assert.equal(result.sections.length, 2);
  assert.equal(result.items.length, 3);
  assert.equal(result.items[0].word, 'be expected to hatch');
  assert.equal(result.items[0].pronunciation, '');
  assert.deepEqual(result.items[1].validationWarnings, ['Missing Mandarin']);
  assert.equal(result.items[2].word, 'Before clicking “Checkout”, ask yourself: Would I buy this at full price?');
  assert.match(result.items[2].category, /^Form 5 › Pahang Trial English 2026 – Vocabulary › G\. Beautiful Sentences$/);
});

test('matches existing destination paths case-insensitively', () => {
  const existingFolders = [
    { id: 'existing-form', name: 'form 5', parentId: null },
    { id: 'existing-document', name: 'Pahang Trial English 2026 – Vocabulary', parentId: 'existing-form' },
  ];
  const result = parseDocxVocabularyHtml(fixtureHtml, {
    fileName: 'Pahang Trial English 2026 – Vocabulary.docx',
    destinationFolder: existingFolders[0],
    existingFolders,
  });
  assert.equal(result.folders[0].existingFolderId, 'existing-form');
  assert.equal(result.folders[1].existingFolderId, 'existing-document');
});

test('rejects unsupported and empty files with clear messages', async () => {
  await assert.rejects(
    analyseDocxFile({ name: 'vocabulary.pdf', size: 10 }),
    /Please upload a \.docx file\./,
  );
  await assert.rejects(
    analyseDocxArrayBuffer(new ArrayBuffer(0)),
    /DOCX file is empty\./,
  );
});

test('parses the supplied acceptance DOCX when DOCX_ACCEPTANCE_FILE is set', {
  skip: !process.env.DOCX_ACCEPTANCE_FILE,
}, async () => {
  const buffer = await readFile(process.env.DOCX_ACCEPTANCE_FILE);
  const converted = await mammoth.convertToHtml({ buffer });
  const result = parseDocxVocabularyHtml(converted.value, {
    fileName: 'Trial English 2026 Vocabulary, Negeri Sembilan.docx',
    destinationFolder: { id: 'form-5', name: 'form 5' },
    parserMessages: converted.messages,
  });
  assert.deepEqual(result.sections, [
    'A. Part 1',
    'B. The Datai Langkawi Eco Reserve',
    'C. Fashion, Ambition & Success',
    'D. Responsible Use of Artificial Intelligence',
    'E. Financial Awareness',
    'F. Writing Topics',
    'G. Beautiful Sentences',
  ]);
  assert.equal(result.items.length, 169);
  assert.deepEqual(result.sectionCounts.map((section) => section.count), [38, 18, 39, 30, 22, 9, 13]);
  assert.deepEqual(
    [0, 38, 56, 95, 125, 147].map((index) => result.items[index].word),
    ['secure your spot', 'eco reserve', 'flip through fashion magazines', 'part of everyday lives', 'track every ringgit I spend', 'eco-friendlier'],
  );
  assert.equal(result.items[2].word, 'be expected to hatch');
  assert.equal(result.items[168].word, 'For me, being a smart consumer means doing your homework before tapping your card.');
  assert.equal(result.items[168].meaning, 'research before paying');
  assert.match(result.items[168].mandarin, /聪明的消费者/);
});
