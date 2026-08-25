import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Brain, List, Plus, ChevronRight, ChevronLeft, RotateCw, Check, X, Trash2, Edit2, Save, Languages, Award, Keyboard, Volume2, CheckCircle, History, AlertCircle, Clock, EyeOff, AlertTriangle, Square, CheckSquare, Zap, Delete, Folder, Download, Upload, Info, Search } from 'lucide-react';

const normalizeAnswer = (text) => String(text || '')
          .trim()
          .toLowerCase()
          .replace(/…/g, '...')
          .replace(/\s+/g, '');



        function CelebrationUI({ show }) {
          const version = useMemo(() => Math.floor(Math.random() * 5), []);
          if (!show) return null;

          const palette = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#ef4444'];
          const confetti = Array.from({ length: 42 }, (_, i) => ({
            left: `${(i * 17) % 100}%`,
            delay: `${(i % 12) * 0.12}s`,
            duration: `${2.4 + (i % 5) * 0.35}s`,
            color: palette[i % palette.length]
          }));
          const fireworks = [
            { left: '18%', top: '24%', color: '#f59e0b', delay: '0s' },
            { left: '78%', top: '22%', color: '#ec4899', delay: '0.35s' },
            { left: '50%', top: '13%', color: '#06b6d4', delay: '0.7s' },
            { left: '32%', top: '42%', color: '#10b981', delay: '1.05s' },
            { left: '68%', top: '43%', color: '#6366f1', delay: '1.4s' }
          ];
          const stars = ['⭐','✨','🌟','💫','⭐','✨','🌟','💫'];
          const balloons = ['🎈','🎈','🎉','🎈','🎊','🎈','🎉'];

          return (
            <div className="celebration-stage" aria-hidden="true">
              {version === 0 && fireworks.map((f, i) => (
                <span key={i} className="firework" style={{ left: f.left, top: f.top, color: f.color, animationDelay: f.delay }} />
              ))}
              {version === 1 && confetti.map((c, i) => (
                <span key={i} className="confetti-piece" style={{ left: c.left, background: c.color, animationDelay: c.delay, animationDuration: c.duration }} />
              ))}
              {version === 2 && (
                <>
                  <div className="sparkle-ring" />
                  {stars.map((s, i) => (
                    <span key={i} className="star-pop" style={{ left: `${12 + (i * 11)}%`, top: `${18 + (i % 3) * 16}%`, animationDelay: `${i * 0.16}s` }}>{s}</span>
                  ))}
                </>
              )}
              {version === 3 && balloons.map((b, i) => (
                <span key={i} className="balloon" style={{ left: `${8 + i * 14}%`, animationDelay: `${i * 0.28}s` }}>{b}</span>
              ))}
              {version === 4 && (
                <>
                  {confetti.slice(0, 22).map((c, i) => (
                    <span key={`c-${i}`} className="confetti-piece" style={{ left: c.left, background: c.color, animationDelay: c.delay, animationDuration: c.duration }} />
                  ))}
                  {fireworks.slice(0, 3).map((f, i) => (
                    <span key={`f-${i}`} className="firework" style={{ left: f.left, top: f.top, color: f.color, animationDelay: f.delay }} />
                  ))}
                </>
              )}
            </div>
          );
        }

        const shuffleArray = (array) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        const playAudio = async (text, lang, rate = 1.0) => {
          if (!window.speechSynthesis || !text) return;
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          utterance.rate = rate;
          window.speechSynthesis.speak(utterance);
        };

        const playSoundEffect = (type) => {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          const now = ctx.currentTime;

          if (type === 'correct') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3);
          } else if (type === 'wrong') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(100, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3);
          }
        };

        const formatTime = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const hasChineseText = (text) => /[\u3400-\u9fff]/.test(String(text || ''));
        const cleanCellText = (text) => String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        const normalizeWordKey = (text) => cleanCellText(text).toLowerCase();
        const normalizeCategoryKey = (text) => cleanCellText(text || 'General').toLowerCase();
        const makeImportKey = (word, category) => `${normalizeCategoryKey(category)}::${normalizeWordKey(word)}`;
        const makeId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const normalizeDash = (text) => cleanCellText(text).replace(/[‐‑‒–—―]/g, '-').replace(/\s*-\s*/g, ' - ');

        const stripLinePrefix = (line) => cleanCellText(line)
            .replace(/^[•●▪▫◦*]\s*/, '')
            .replace(/^\(?\d+[\s\.)、:-]+/, '')
            .replace(/^[a-zA-Z][\s\.)、:-]+(?=\S)/, '')
            .replace(/^[\-–—]\s+/, '')
            .trim();

        const inferHeadingType = (line, lineIndex = 0, hasDocumentTitle = false) => {
            const original = cleanCellText(line);
            const text = normalizeDash(original).replace(/[:：]+$/, '');
            const lower = text.toLowerCase();
            if (!text) return null;
            if (/^page\s+\d+/i.test(text)) {
                const pageMatch = text.match(/^page\s+(\d+)/i);
                const contexts = [];
                const paperMatch = text.match(/\bpaper\s+\d+\b/i);
                const partMatch = text.match(/\bpart\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
                const writingMatch = text.match(/\bwriting\b/i);
                const passageMatch = text.match(/\bpassage\s*[:：]\s*.+$/i);
                if (paperMatch) contexts.push({ kind: 'PAPER', label: normalizeDash(paperMatch[0]), rawHeading: original, level: 1 });
                if (partMatch) contexts.push({ kind: 'SECTION', label: normalizeDash(partMatch[0]), rawHeading: original, level: 2 });
                if (!partMatch && writingMatch) contexts.push({ kind: 'SECTION', label: 'Writing', rawHeading: original, level: 2 });
                if (passageMatch) contexts.push({ kind: 'PASSAGE', label: normalizeDash(passageMatch[0]).replace(/^passage\s*[:：]\s*/i, 'Passage - '), rawHeading: original, level: 3 });
                return { kind: 'PAGE_CONTEXT', label: text, rawHeading: original, sourcePage: pageMatch ? Number(pageMatch[1]) : null, contexts };
            }
            if (/^paper\s+\d+\b/i.test(text)) return { kind: 'PAPER', label: text, rawHeading: original, level: 1 };
            if (/^part\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(text)) {
                const instructionMatch = text.match(/^part\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+-\s+instructions?$/i);
                if (instructionMatch) return { kind: 'INSTRUCTIONS', label: 'Instructions', rawHeading: original, level: 3 };
                return { kind: 'SECTION', label: text, rawHeading: original, level: 2 };
            }
            if (/^(section|unit|chapter)\s+[A-Za-z0-9]+\b/i.test(text)) return { kind: 'SECTION', label: text, rawHeading: original, level: 2 };
            if (/^writing\b/i.test(text)) return { kind: 'SECTION', label: text, rawHeading: original, level: 2 };
            if (/^instructions?\b/i.test(text)) return { kind: 'INSTRUCTIONS', label: text.replace(/^part\s+\S+\s+-\s+/i, ''), rawHeading: original, level: 3 };
            if (/^question\s+\d+\b/i.test(text)) return { kind: 'QUESTION', label: text, rawHeading: original, level: 3 };
            if (/^questions\s+\d+\s*-\s*\d+\b/i.test(text)) return { kind: 'QUESTION_RANGE', label: text, rawHeading: original, level: 3 };
            if (/^passage\s+vocabulary\b/i.test(text)) {
                const paragraphMatch = text.match(/paragraphs?\s+.+$/i);
                return { kind: 'PASSAGE_SUBSECTION', label: paragraphMatch ? normalizeDash(paragraphMatch[0]) : text, rawHeading: original, level: 4 };
            }
            if (/^passage\b/i.test(text)) return { kind: 'PASSAGE', label: text, rawHeading: original, level: 3 };
            if (/^text\s+[A-Z]\b/i.test(text)) return { kind: 'TEXT', label: text, rawHeading: original, level: 3 };
            if (/^options?\s+[A-Z](?:\s*-\s*[A-Z])?\b/i.test(text)) return { kind: 'OPTIONS', label: text, rawHeading: original, level: 3 };
            if (/vocabulary$/i.test(text) && hasDocumentTitle && !/[()[\]\u3400-\u9fff]/.test(text)) return { kind: 'SUBTITLE', label: text, rawHeading: original, level: 0 };
            if (lineIndex <= 3 && !hasDocumentTitle && !/[()[\]\u3400-\u9fff]/.test(text) && text.split(/\s+/).length >= 3) {
                return { kind: 'DOCUMENT_TITLE', label: text, rawHeading: original, level: 0 };
            }
            if (!/[()[\]\u3400-\u9fff]/.test(text) && text.split(/\s+/).length >= 2 && text.split(/\s+/).length <= 5) {
                return { kind: 'UNKNOWN', label: text, rawHeading: original, level: 3, needsReview: true };
            }
            return null;
        };

        const detectHeading = (line) => {
            const heading = inferHeadingType(line);
            if (!heading || heading.kind === 'SUBTITLE') return null;
            if (heading.kind === 'DOCUMENT_TITLE') return { type: 'section', value: heading.label };
            if (heading.kind === 'PAPER') return { type: 'section', value: heading.label };
            if (heading.kind === 'SECTION') return { type: 'part', value: heading.label };
            if (['QUESTION', 'QUESTION_RANGE', 'PASSAGE', 'PASSAGE_SUBSECTION', 'TEXT', 'OPTIONS', 'INSTRUCTIONS', 'UNKNOWN'].includes(heading.kind)) return { type: 'question', value: heading.label };
            return null;
        };

        const splitChineseTail = (text) => {
            const match = String(text || '').match(/^(.*?)([\u3400-\u9fff][\u3400-\u9fff0-9A-Za-z\s；;，,、。.\-–—()（）\/]*)$/);
            if (!match) return { before: cleanCellText(text), mandarin: '' };
            return { before: cleanCellText(match[1]), mandarin: cleanCellText(match[2]) };
        };

        const buildPreviewItem = (draft, lineNumber, rawSource, context, fallbackCategory) => {
            const item = {
                id: `preview-${lineNumber}-${Math.random().toString(36).slice(2)}`,
                lineNumber,
                rawSource,
                word: cleanCellText(draft.word),
                pronunciation: cleanCellText(draft.pronunciation).replace(/^\/|\/$/g, ''),
                meaning: cleanCellText(draft.meaning),
                mandarin: cleanCellText(draft.mandarin),
                category: cleanCellText(draft.category || context.unit || fallbackCategory || 'General'),
                section: cleanCellText(context.section),
                part: cleanCellText(context.part),
                question: cleanCellText(context.question),
                ignored: false
            };
            return item;
        };

        const parseVocabularyLine = (line, lineNumber, context, fallbackCategory) => {
            const rawSource = line;
            let text = stripLinePrefix(line);
            if (!text) return null;
            if (detectHeading(text)) return null;

            let pronunciation = '';
            const pronMatch = text.match(/\/([^/]+)\//);
            if (pronMatch) {
                pronunciation = pronMatch[1];
                text = cleanCellText(text.replace(pronMatch[0], ' '));
            }

            let meaning = '';
            const meaningMatch = text.match(/\[([^\]]+)\]/);
            if (meaningMatch) {
                meaning = meaningMatch[1];
                text = cleanCellText(text.replace(meaningMatch[0], ' '));
            }

            if (text.includes('|')) {
                const parts = text.split('|').map(cleanCellText).filter(Boolean);
                if (parts.length >= 2) {
                    const chinesePart = parts.find(hasChineseText) || '';
                    const word = parts[0];
                    const nonChinese = parts.slice(1).filter(p => p !== chinesePart);
                    return buildPreviewItem({
                        word,
                        pronunciation,
                        meaning: meaning || nonChinese.join(' '),
                        mandarin: chinesePart || (hasChineseText(parts[parts.length - 1]) ? parts[parts.length - 1] : '')
                    }, lineNumber, rawSource, context, fallbackCategory);
                }
            }

            if (/\t/.test(rawSource) || /\s{2,}/.test(rawSource)) {
                const parts = rawSource.split(/\t+|\s{2,}/).map(part => stripLinePrefix(part)).filter(Boolean);
                if (parts.length >= 2) {
                    const word = parts[0];
                    const chinesePart = parts.find((part, index) => index > 0 && hasChineseText(part)) || '';
                    const meaningParts = parts.slice(1).filter(part => part !== chinesePart && !/^\/[^/]+\/$/.test(part));
                    return buildPreviewItem({
                        word,
                        pronunciation,
                        meaning: meaning || meaningParts.join(' '),
                        mandarin: chinesePart
                    }, lineNumber, rawSource, context, fallbackCategory);
                }
            }

            const dashMatch = text.match(/^(.+?)\s+[-–—]\s+(.+)$/);
            if (dashMatch && hasChineseText(dashMatch[2])) {
                return buildPreviewItem({
                    word: dashMatch[1],
                    pronunciation,
                    meaning,
                    mandarin: dashMatch[2]
                }, lineNumber, rawSource, context, fallbackCategory);
            }

            const { before, mandarin } = splitChineseTail(text);
            if (before && mandarin) {
                return buildPreviewItem({
                    word: before,
                    pronunciation,
                    meaning,
                    mandarin
                }, lineNumber, rawSource, context, fallbackCategory);
            }

            if (/^[A-Za-z][A-Za-z0-9\s'\-]+$/.test(text) && text.split(/\s+/).length <= 4) {
                return buildPreviewItem({
                    word: text,
                    pronunciation,
                    meaning,
                    mandarin: ''
                }, lineNumber, rawSource, context, fallbackCategory);
            }

            return null;
        };

        const evaluateImportStatus = (item, existingWords = [], duplicateAction = 'skip') => {
            if (item.ignored) return { status: 'Ignored', tone: 'gray', message: 'Ignored' };
            if (!cleanCellText(item.word)) return { status: 'Error', tone: 'red', message: 'Missing word' };
            if (!/^[A-Za-z][A-Za-z0-9\s'\-]+$/.test(cleanCellText(item.word))) return { status: 'Error', tone: 'red', message: 'Check word' };
            const duplicate = existingWords.find(word => makeImportKey(word.word, word.category) === makeImportKey(item.word, item.category));
            if (duplicate) return { status: 'Duplicate', tone: 'amber', message: duplicateAction === 'skip' ? 'Will skip existing' : duplicateAction === 'update' ? 'Will update existing' : 'Will keep both' };
            const warnings = [];
            if (existingWords.some(word => normalizeWordKey(word.word) === normalizeWordKey(item.word))) warnings.push('Existing elsewhere');
            if (!cleanCellText(item.meaning)) warnings.push('Missing meaning');
            if (!cleanCellText(item.mandarin)) warnings.push('Missing Mandarin');
            if (!cleanCellText(item.pronunciation)) warnings.push('No pronunciation');
            if (warnings.length) return { status: 'Warning', tone: 'yellow', message: warnings.join(', ') };
            return { status: 'Ready', tone: 'emerald', message: 'Ready' };
        };

        const parseVocabularyInput = (inputText, category = 'General') => {
            const rawLines = String(inputText || '').split(/\r?\n/);
            const context = { section: '', unit: '', part: '', question: '' };
            const items = [];
            const headings = [];
            const unrecognised = [];

            rawLines.forEach((rawLine, index) => {
                const lineNumber = index + 1;
                const cleaned = cleanCellText(rawLine);
                if (!cleaned) return;
                const heading = detectHeading(cleaned);
                if (heading) {
                    context[heading.type] = heading.value;
                    if (heading.type === 'unit') context.question = '';
                    if (heading.type === 'part') context.question = '';
                    headings.push({ lineNumber, text: cleaned, ...heading });
                    return;
                }
                const item = parseVocabularyLine(rawLine, lineNumber, context, category);
                if (item) {
                    items.push(item);
                } else {
                    unrecognised.push({ id: `unrecognised-${lineNumber}`, lineNumber, text: rawLine });
                }
            });

            return {
                items,
                headings,
                unrecognised,
                totalLines: rawLines.filter(line => cleanCellText(line)).length
            };
        };

        const getFolderPathNames = (folderId, folders = []) => {
            const byId = new Map(folders.map(folder => [folder.id, folder]));
            const path = [];
            let current = byId.get(folderId);
            const seen = new Set();
            while (current && !seen.has(current.id)) {
                seen.add(current.id);
                path.unshift(current.name);
                current = current.parentId ? byId.get(current.parentId) : null;
            }
            return path;
        };

        const getFolderPath = (folderId, folders = []) => getFolderPathNames(folderId, folders).join(' › ');
        const makeFolderPathKey = (names = []) => names.map(normalizeCategoryKey).join('>');

        const buildLegacyFolders = (words = [], existingFolders = []) => {
            const nextFolders = Array.isArray(existingFolders) ? [...existingFolders] : [];
            const folderByPath = new Map();
            const ensurePath = (pathNames, type = 'LEGACY') => {
                let parentId = null;
                let folder = null;
                const cleanNames = pathNames.map(cleanCellText).filter(Boolean);
                cleanNames.forEach((name, index) => {
                    const pathKey = makeFolderPathKey(cleanNames.slice(0, index + 1));
                    folder = folderByPath.get(pathKey) || nextFolders.find(item => item.parentId === parentId && normalizeCategoryKey(item.name) === normalizeCategoryKey(name));
                    if (!folder) {
                        folder = { id: makeId('folder'), name, parentId, type: index === cleanNames.length - 1 ? type : 'LEGACY_PARENT', createdAt: new Date().toISOString() };
                        nextFolders.push(folder);
                    }
                    folderByPath.set(pathKey, folder);
                    parentId = folder.id;
                });
                return folder;
            };

            nextFolders.forEach(folder => {
                const path = getFolderPathNames(folder.id, nextFolders);
                if (path.length) folderByPath.set(makeFolderPathKey(path), folder);
            });

            const nextWords = words.map(word => {
                if (word.folderId && nextFolders.some(folder => folder.id === word.folderId)) return word;
                const category = cleanCellText(word.category || 'General');
                const folder = ensurePath(category.split('›').map(cleanCellText).filter(Boolean), 'LEGACY');
                return { ...word, folderId: folder?.id, category };
            });

            return { folders: nextFolders, words: nextWords };
        };

        const createStructuredParser = (existingFolders = []) => {
            const proposedFolders = [];
            const proposedByPath = new Map();
            const existingByPath = new Map();
            existingFolders.forEach(folder => {
                const path = getFolderPathNames(folder.id, existingFolders);
                if (path.length) existingByPath.set(makeFolderPathKey(path), folder);
            });

            const ensureFolder = (pathNames, draft = {}) => {
                const cleanNames = pathNames.map(cleanCellText).filter(Boolean);
                if (!cleanNames.length) return null;
                const pathKey = makeFolderPathKey(cleanNames);
                let folder = proposedByPath.get(pathKey);
                if (folder) {
                    folder.sourcePage = folder.sourcePage || draft.sourcePage || null;
                    folder.rawHeading = folder.rawHeading || draft.rawHeading || '';
                    return folder;
                }
                const parent = cleanNames.length > 1 ? ensureFolder(cleanNames.slice(0, -1), { type: 'AUTO_PARENT' }) : null;
                const existing = existingByPath.get(pathKey);
                folder = {
                    id: makeId('proposed-folder'),
                    name: cleanNames[cleanNames.length - 1],
                    parentId: parent?.id || null,
                    type: draft.type || 'SECTION',
                    rawHeading: draft.rawHeading || '',
                    sourcePage: draft.sourcePage || null,
                    lineNumber: draft.lineNumber || null,
                    needsReview: Boolean(draft.needsReview),
                    existingFolderId: existing?.id || null,
                    ignored: false
                };
                proposedFolders.push(folder);
                proposedByPath.set(pathKey, folder);
                return folder;
            };

            return { proposedFolders, ensureFolder };
        };

        const parseStructuredVocabularyInput = (inputText, fallbackCategory = 'General', existingFolders = []) => {
            const rawLines = String(inputText || '').split(/\r?\n/);
            const parser = createStructuredParser(existingFolders);
            const context = { document: '', paper: '', section: '', content: '', passage: '', sourcePage: null };
            const headings = [];
            const unknownHeadings = [];
            const unrecognised = [];
            const items = [];
            let documentLocked = false;

            const currentPath = () => [
                context.document || fallbackCategory || 'General',
                context.paper,
                context.section,
                context.passage && context.content !== context.passage ? context.passage : '',
                context.content
            ].filter(Boolean);

            const applyHeading = (heading, lineNumber) => {
                headings.push({ lineNumber, text: heading.rawHeading || heading.label, ...heading });
                if (heading.kind === 'PAGE_CONTEXT') {
                    context.sourcePage = heading.sourcePage || context.sourcePage;
                    heading.contexts.forEach(part => applyHeading({ ...part, sourcePage: context.sourcePage, fromPageContext: true }, lineNumber));
                    return;
                }
                if (heading.kind === 'SUBTITLE') return;
                if (heading.kind === 'DOCUMENT_TITLE') {
                    context.document = heading.label;
                    documentLocked = true;
                    context.paper = '';
                    context.section = '';
                    context.content = '';
                    context.passage = '';
                    parser.ensureFolder([context.document], { type: 'DOCUMENT_TITLE', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (!context.document) {
                    context.document = cleanCellText(fallbackCategory || 'General');
                    parser.ensureFolder([context.document], { type: 'DOCUMENT_TITLE', rawHeading: context.document, lineNumber, sourcePage: context.sourcePage });
                }
                if (heading.kind === 'PAPER') {
                    context.paper = heading.label;
                    context.section = '';
                    context.content = '';
                    context.passage = '';
                    parser.ensureFolder([context.document, context.paper], { type: 'PAPER', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (heading.kind === 'SECTION') {
                    context.section = heading.label;
                    context.content = '';
                    context.passage = '';
                    parser.ensureFolder([context.document, context.paper, context.section].filter(Boolean), { type: 'SECTION', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (heading.kind === 'PASSAGE') {
                    context.content = heading.label;
                    context.passage = heading.label;
                    parser.ensureFolder(currentPath(), { type: 'PASSAGE', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (heading.kind === 'PASSAGE_SUBSECTION' && context.passage) {
                    const passagePath = [context.document, context.paper, context.section, context.passage].filter(Boolean);
                    context.content = heading.label;
                    parser.ensureFolder([...passagePath, heading.label], { type: 'PASSAGE_SUBSECTION', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (heading.kind === 'INSTRUCTIONS') {
                    context.content = heading.label || 'Instructions';
                    parser.ensureFolder(currentPath(), { type: 'INSTRUCTIONS', rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage });
                    return;
                }
                if (['QUESTION', 'QUESTION_RANGE', 'TEXT', 'OPTIONS', 'UNKNOWN'].includes(heading.kind)) {
                    context.passage = '';
                    context.content = heading.label;
                    const folder = parser.ensureFolder(currentPath(), { type: heading.kind, rawHeading: heading.rawHeading, lineNumber, sourcePage: context.sourcePage, needsReview: heading.needsReview });
                    if (heading.kind === 'UNKNOWN') unknownHeadings.push({ ...heading, folderId: folder?.id, lineNumber });
                }
            };

            rawLines.forEach((rawLine, index) => {
                const lineNumber = index + 1;
                const cleaned = cleanCellText(rawLine);
                if (!cleaned) return;
                const nextMeaningful = rawLines.slice(index + 1).map(cleanCellText).find(Boolean) || '';
                const nextLooksVocabulary = Boolean(parseVocabularyLine(nextMeaningful, lineNumber + 1, { section: '', unit: fallbackCategory, part: '', question: '' }, fallbackCategory));
                let heading = inferHeadingType(cleaned, index, documentLocked);
                if (heading?.kind === 'DOCUMENT_TITLE' && nextLooksVocabulary) {
                    heading = { kind: 'UNKNOWN', label: normalizeDash(cleaned), rawHeading: cleaned, level: 3, needsReview: true };
                }
                if (heading) {
                    applyHeading(heading, lineNumber);
                    return;
                }
                if (!context.document) {
                    const maybeTitle = inferHeadingType(cleaned, index, false);
                    if (maybeTitle?.kind === 'DOCUMENT_TITLE') {
                        applyHeading(maybeTitle, lineNumber);
                        return;
                    }
                    context.document = cleanCellText(fallbackCategory || 'General');
                    parser.ensureFolder([context.document], { type: 'DOCUMENT_TITLE', rawHeading: context.document, lineNumber, sourcePage: context.sourcePage });
                }
                const folder = parser.ensureFolder(currentPath(), { type: 'VOCABULARY_CONTAINER', sourcePage: context.sourcePage });
                const item = parseVocabularyLine(rawLine, lineNumber, {
                    section: context.paper,
                    unit: context.document,
                    part: context.section,
                    question: context.content
                }, getFolderPath(folder?.id, parser.proposedFolders) || fallbackCategory);
                if (item) {
                    item.folderId = folder?.id;
                    item.category = getFolderPath(folder?.id, parser.proposedFolders) || item.category;
                    item.sourcePage = context.sourcePage || null;
                    item.rawHeading = folder?.rawHeading || '';
                    items.push(item);
                } else {
                    unrecognised.push({ id: `unrecognised-${lineNumber}`, lineNumber, text: rawLine, location: getFolderPath(folder?.id, parser.proposedFolders) });
                }
            });

            return {
                items,
                folders: parser.proposedFolders,
                headings,
                unknownHeadings,
                unrecognised,
                documentTitle: context.document || fallbackCategory || 'General',
                totalLines: rawLines.filter(line => cleanCellText(line)).length
            };
        };

        const flattenFolderOptions = (folders = []) => folders.map(folder => ({
            id: folder.id,
            label: getFolderPath(folder.id, folders) || folder.name,
            depth: Math.max(0, getFolderPathNames(folder.id, folders).length - 1)
        })).sort((a, b) => a.label.localeCompare(b.label));

        const getDescendantFolderIds = (folderId, folders = []) => {
            const ids = [];
            const walk = (parentId) => {
                folders.filter(folder => folder.parentId === parentId).forEach(folder => {
                    ids.push(folder.id);
                    walk(folder.id);
                });
            };
            walk(folderId);
            return ids;
        };

        const getFolderAndDescendantIds = (folderId, folders = []) => [folderId, ...getDescendantFolderIds(folderId, folders)];

        const getSelectedWordsForFolders = (words = [], folders = [], selectedFolderIds = new Set()) => {
            const allowedFolderIds = new Set();
            selectedFolderIds.forEach(folderId => {
                getFolderAndDescendantIds(folderId, folders).forEach(id => allowedFolderIds.add(id));
            });
            return words.filter(word => word.folderId ? allowedFolderIds.has(word.folderId) : selectedFolderIds.has(word.category || 'General'));
        };

        function CategorySelectionScreen({ words, folders = [], onSelect, title }) {
            const [selectedFolderIds, setSelectedFolderIds] = useState(new Set());
            const [currentFolderId, setCurrentFolderId] = useState(null);

            const folderWords = useMemo(() => {
                const map = new Map();
                words.forEach(word => {
                    if (!word.folderId) return;
                    map.set(word.folderId, (map.get(word.folderId) || 0) + 1);
                });
                return map;
            }, [words]);

            const directChildren = useMemo(() => folders.filter(folder => (folder.parentId || null) === (currentFolderId || null)), [folders, currentFolderId]);
            const breadcrumb = useMemo(() => {
                const byId = new Map(folders.map(folder => [folder.id, folder]));
                const path = [];
                let current = currentFolderId ? byId.get(currentFolderId) : null;
                while (current) {
                    path.unshift(current);
                    current = current.parentId ? byId.get(current.parentId) : null;
                }
                return path;
            }, [folders, currentFolderId]);

            const subtreeWordCount = (folderId) => {
                const ids = getFolderAndDescendantIds(folderId, folders);
                return words.filter(word => word.folderId && ids.includes(word.folderId)).length;
            };

            const childFolderCount = (folderId) => folders.filter(folder => folder.parentId === folderId).length;

            const selectedWords = useMemo(() => getSelectedWordsForFolders(words, folders, selectedFolderIds), [words, folders, selectedFolderIds]);

            const getSelectionState = (folderId) => {
                const ids = getFolderAndDescendantIds(folderId, folders);
                const wordIds = words.filter(word => word.folderId && ids.includes(word.folderId)).map(word => word.id);
                if (!wordIds.length) return 'empty';
                const selectedWordIds = new Set(selectedWords.map(word => word.id));
                const selectedCount = wordIds.filter(id => selectedWordIds.has(id)).length;
                if (selectedCount === 0) return 'none';
                if (selectedCount === wordIds.length) return 'all';
                return 'partial';
            };

            const toggleFolder = (folderId) => {
                const state = getSelectionState(folderId);
                setSelectedFolderIds(prev => {
                    const next = new Set(prev);
                    const subtreeIds = getFolderAndDescendantIds(folderId, folders);
                    subtreeIds.forEach(id => next.delete(id));
                    if (state !== 'all') next.add(folderId);
                    return next;
                });
            };

            const currentScopeIds = currentFolderId ? getFolderAndDescendantIds(currentFolderId, folders) : folders.filter(folder => !folder.parentId).map(folder => folder.id);
            const currentScopeWordCount = currentFolderId
                ? subtreeWordCount(currentFolderId)
                : words.filter(word => word.folderId && folders.some(folder => !folder.parentId && getFolderAndDescendantIds(folder.id, folders).includes(word.folderId))).length;
            const selectedInScope = currentScopeIds.every(id => getSelectionState(id) === 'all') && currentScopeIds.length > 0;

            const handleSelectAll = () => {
                setSelectedFolderIds(prev => {
                    const next = new Set(prev);
                    const scopeTopIds = currentFolderId ? [currentFolderId] : folders.filter(folder => !folder.parentId).map(folder => folder.id);
                    scopeTopIds.forEach(id => getFolderAndDescendantIds(id, folders).forEach(desc => next.delete(desc)));
                    if (!selectedInScope) scopeTopIds.forEach(id => next.add(id));
                    return next;
                });
            };

            const fallbackCategories = useMemo(() => {
                const cats = new Set(words.filter(word => !word.folderId).map(w => w.category || 'General'));
                return Array.from(cats);
            }, [words]);

            return (
                <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
                    <div className="p-6 pb-2 shrink-0">
                        <h2 className="text-3xl font-black text-gray-800 mb-2">{title}</h2>
                        <p className="text-gray-500 font-medium">Select one or more folders to practice</p>
                        <div className="flex flex-wrap items-center gap-2 mt-4 text-sm font-bold">
                            <button onClick={() => setCurrentFolderId(null)} className={`px-3 py-2 rounded-xl ${!currentFolderId ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>{title.split(':')[0]}</button>
                            {breadcrumb.map(folder => (
                                <React.Fragment key={folder.id}>
                                    <span className="text-gray-300">›</span>
                                    <button onClick={() => setCurrentFolderId(folder.id)} className="px-3 py-2 rounded-xl bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50">{folder.name}</button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    
                    <div className="px-6 py-2 flex items-center justify-between shrink-0">
                         <div className="flex items-center gap-3">
                         {currentFolderId && (
                            <button onClick={() => setCurrentFolderId(folders.find(folder => folder.id === currentFolderId)?.parentId || null)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 text-gray-600 font-bold hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                <ChevronLeft size={18} /> Back
                            </button>
                         )}
                         <button onClick={handleSelectAll} className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
                            {selectedInScope ? <CheckSquare size={20} /> : <Square size={20} />}
                            {selectedInScope ? "Deselect All" : currentFolderId ? `Select All in ${breadcrumb[breadcrumb.length - 1]?.name || 'Folder'}` : "Select All Folders"}
                        </button>
                         </div>
                        <span className="text-sm font-bold text-gray-400">{selectedFolderIds.size} folders selected · {selectedWords.length} words</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-safe">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {directChildren.map(folder => {
                                const selectionState = getSelectionState(folder.id);
                                const isSelected = selectionState === 'all';
                                const isPartial = selectionState === 'partial';
                                return (
                                    <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className={`p-6 border-2 rounded-3xl shadow-sm transition-all text-left group relative cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50' : isPartial ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-white hover:border-indigo-300'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <Folder className={`${isSelected ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-500'} transition-colors`} size={32} />
                                            <button onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }} className="w-9 h-9 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm" aria-label={`Select ${folder.name}`}>
                                                {isSelected ? <CheckSquare size={22} /> : isPartial ? <span className="text-xl leading-none">◩</span> : <Square size={22} className="text-gray-300" />}
                                            </button>
                                        </div>
                                        <h3 className={`text-xl font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{folder.name}</h3>
                                        <p className={`text-sm ${isSelected ? 'text-indigo-600/70' : 'text-gray-400'}`}>
                                            {subtreeWordCount(folder.id)} words · {childFolderCount(folder.id)} subfolders
                                        </p>
                                    </div>
                                )
                            })}
                            {directChildren.length === 0 && currentFolderId && (
                                <div className="col-span-full bg-white border border-gray-100 rounded-3xl p-8 text-center text-gray-400 font-bold">
                                    No subfolders here. Select this folder from the checkbox above or go back.
                                </div>
                            )}
                            {!folders.length && fallbackCategories.map(cat => {
                                const isSelected = selectedFolderIds.has(cat);
                                return (
                                    <div key={cat} onClick={() => toggleFolder(cat)} className={`p-6 border-2 rounded-3xl shadow-sm transition-all text-left group relative cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 bg-white hover:border-indigo-300'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <Folder className="text-indigo-400" size={32} />
                                            {isSelected ? <CheckCircle className="text-indigo-600" size={24} /> : <Square className="text-gray-300" size={24} />}
                                        </div>
                                        <h3 className={`text-xl font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{cat}</h3>
                                        <p className="text-sm text-gray-400">{words.filter(w => (w.category || 'General') === cat).length} words</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
                        <button onClick={() => onSelect(Array.from(selectedFolderIds))} disabled={selectedWords.length === 0} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg flex items-center justify-center gap-2">
                            Continue <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            );
        }

        function WordSelectionScreen({ words, folders = [], selectedFolderIds, onStart, onBack, title }) {
            const selectedSet = useMemo(() => new Set(selectedFolderIds), [selectedFolderIds]);
            const filtered = useMemo(() => getSelectedWordsForFolders(words, folders, selectedSet), [words, folders, selectedSet]);
            const [selectedIds, setSelectedIds] = useState(() => new Set(filtered.map(w => w.id)));

            const toggle = (id) => {
                const next = new Set(selectedIds);
                if (next.has(id)) next.delete(id); else next.add(id);
                setSelectedIds(next);
            };

            const handleSelectAll = () => setSelectedIds(new Set(filtered.map(w => w.id)));
            const handleDeselectAll = () => setSelectedIds(new Set());

            return (
                <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded-full transition-colors"><ChevronLeft size={24} /></button>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
                                <p className="text-sm text-gray-500">{selectedFolderIds.length} folder(s) selected · {selectedIds.size} / {filtered.length} words</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={handleSelectAll} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">Select All</button>
                            <button onClick={handleDeselectAll} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Clear</button>
                            <button onClick={() => onStart(words.filter(w => selectedIds.has(w.id)))} disabled={selectedIds.size === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-md ml-2 flex items-center gap-2">
                                Start <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-safe">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto">
                            {filtered.map(w => (
                                <div key={w.id} onClick={() => toggle(w.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center bg-white hover:scale-[1.01] ${selectedIds.has(w.id) ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'border-gray-100 hover:border-indigo-200'}`}>
                                    <div className="flex-1 mr-4 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-800 text-lg truncate">{w.word}</p>
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full truncate shrink-0 max-w-[100px]">{w.category || 'General'}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{w.mandarin} {w.meaning ? `• ${w.meaning}` : ''}</p>
                                    </div>
                                    {selectedIds.has(w.id) ? <CheckSquare className="text-indigo-600 shrink-0" size={24} /> : <Square className="text-gray-300 shrink-0" size={24} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        function StudyMode({ words, folders }) {
          const [phase, setPhase] = useState('category');
          const [selectedCategories, setSelectedCategories] = useState([]);
          const [activeWords, setActiveWords] = useState([]);
          const [index, setIndex] = useState(0);
          const [isFlipped, setIsFlipped] = useState(false);
          const [wordStatus, setWordStatus] = useState(() => {
            try {
              return JSON.parse(localStorage.getItem('evm_flashcard_status') || '{}');
            } catch (error) {
              return {};
            }
          });

          useEffect(() => {
            localStorage.setItem('evm_flashcard_status', JSON.stringify(wordStatus));
          }, [wordStatus]);

          const markCurrentWord = (status) => {
            if (!activeWords.length) return;
            const currentWord = activeWords[index % activeWords.length];
            setWordStatus(prev => ({ ...prev, [currentWord.id]: status }));
            setIsFlipped(false);
            if (index < activeWords.length - 1) {
              window.setTimeout(() => {
                setIndex(prev => Math.min(prev + 1, activeWords.length - 1));
              }, 180);
            }
          };

          if (!words || words.length === 0) {
            return (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <BookOpen size={72} className="text-indigo-200 mb-4" />
                <h2 className="text-3xl font-black text-gray-800 mb-2">No words yet</h2>
                <p className="text-gray-500 font-medium max-w-sm">Go to Teacher Input to add vocabulary first.</p>
              </div>
            );
          }

          if (phase === 'category') {
            return <CategorySelectionScreen words={words} folders={folders} title="Flashcards: Category" onSelect={(folderIds) => { setSelectedCategories(folderIds); setPhase('setup'); }} />;
          }

          if (phase === 'setup') {
            return <WordSelectionScreen words={words} folders={folders} selectedFolderIds={selectedCategories} title="Select Flashcards" onBack={() => setPhase('category')} onStart={(selected) => {
              setActiveWords(selected);
              setIndex(0);
              setIsFlipped(false);
              setPhase('studying');
            }} />;
          }

          if (activeWords.length === 0) return <div className="p-10 text-center text-gray-400 font-bold">No words selected.</div>;

          const current = activeWords[index % activeWords.length];
          const currentStatus = wordStatus[current.id];
          const learnedCount = activeWords.filter(w => wordStatus[w.id] === 'learned').length;
          const notYetCount = activeWords.filter(w => wordStatus[w.id] === 'not_yet').length;

          return (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full p-4 md:p-8 animate-in fade-in">
              <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
                <button onClick={() => { setPhase('category'); setIndex(0); setIsFlipped(false); }} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-indigo-600 rounded-xl font-bold shadow-sm border border-gray-100 transition-colors">
                  <ChevronLeft size={20} /> Folders
                </button>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Flashcards</p>
                  <p className="text-sm font-bold text-gray-400">{selectedCategories.length} folder(s) • {activeWords.length} word(s)</p>
                  <p className="text-xs font-black text-gray-400 mt-1">
                    <span className="text-cyan-600">✓ {learnedCount}</span>
                    <span className="mx-1">/</span>
                    <span className="text-red-500">✕ {notYetCount}</span>
                  </p>
                </div>
              </div>

              <div className="flex-1 perspective-1000 relative min-h-[350px]">
                <div className={`relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                     onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`absolute inset-0 backface-hidden bg-white border-4 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-8 text-center ${currentStatus === 'learned' ? 'border-cyan-100' : currentStatus === 'not_yet' ? 'border-red-100' : 'border-indigo-50'}`}>
                    {currentStatus && (
                      <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${currentStatus === 'learned' ? 'bg-cyan-50 text-cyan-600' : 'bg-red-50 text-red-500'}`}>
                        {currentStatus === 'learned' ? <CheckCircle size={16} /> : <X size={16} />}
                        {currentStatus === 'learned' ? 'Learned' : 'Not Yet'}
                      </div>
                    )}
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">Vocabulary</span>
                    <h2 className="text-4xl md:text-6xl font-black text-gray-800 mb-6 break-words">{current.word}</h2>
                    {current.pronunciation && <p className="text-indigo-500 font-mono text-lg mb-8">/{current.pronunciation}/</p>}
                    <button onClick={(e) => { e.stopPropagation(); playAudio(current.word, 'en-US'); }} className="p-4 bg-indigo-50 text-indigo-600 rounded-full hover:scale-110 transition-transform">
                      <Volume2 size={32} />
                    </button>
                    <p className="text-xs text-gray-300 font-bold mt-6">Tap card to flip</p>
                  </div>
                  <div className="absolute inset-0 backface-hidden bg-indigo-600 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                    {currentStatus && (
                      <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 ${currentStatus === 'learned' ? 'bg-cyan-400/20 text-cyan-100' : 'bg-red-400/20 text-red-100'}`}>
                        {currentStatus === 'learned' ? <CheckCircle size={16} /> : <X size={16} />}
                        {currentStatus === 'learned' ? 'Learned' : 'Not Yet'}
                      </div>
                    )}
                    <span className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-4">Translation</span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 break-words">{current.mandarin}</h2>
                    {current.meaning && (
                        <div className="bg-white/10 p-4 rounded-2xl w-full max-w-sm mb-6">
                            <p className="text-sm text-indigo-200 uppercase font-bold mb-1">Meaning</p>
                            <p className="text-lg italic">"{current.meaning}"</p>
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); playAudio(current.mandarin, 'zh-CN'); }} className="p-4 bg-white/20 text-white rounded-full hover:scale-110 transition-transform">
                      <Volume2 size={32} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 shrink-0 grid grid-cols-2 gap-3">
                <button onClick={() => markCurrentWord('learned')} className={`py-4 rounded-2xl font-black shadow-md border-2 transition-all flex items-center justify-center gap-2 ${currentStatus === 'learned' ? 'bg-cyan-500 text-white border-cyan-500 scale-[1.02]' : 'bg-white text-cyan-600 border-cyan-100 hover:bg-cyan-50'}`}>
                  <CheckCircle size={24} /> 已学会
                </button>
                <button onClick={() => markCurrentWord('not_yet')} className={`py-4 rounded-2xl font-black shadow-md border-2 transition-all flex items-center justify-center gap-2 ${currentStatus === 'not_yet' ? 'bg-red-500 text-white border-red-500 scale-[1.02]' : 'bg-white text-red-500 border-red-100 hover:bg-red-50'}`}>
                  <X size={24} /> 还没学会
                </button>
              </div>

              <div className="flex justify-between items-center mt-5 shrink-0">
                <button onClick={() => { setIndex(i => (i - 1 + activeWords.length) % activeWords.length); setIsFlipped(false); }} className="p-5 rounded-2xl bg-white text-gray-400 hover:text-indigo-600 shadow-md transition-all"><ChevronLeft size={32}/></button>
                <div className="text-gray-400 font-bold bg-white px-6 py-2 rounded-full shadow-inner">{index + 1} / {activeWords.length}</div>
                <button onClick={() => { setIndex(i => (i + 1) % activeWords.length); setIsFlipped(false); }} className="p-5 rounded-2xl bg-white text-gray-400 hover:text-indigo-600 shadow-md transition-all"><ChevronRight size={32}/></button>
              </div>
            </div>
          );
        }

        function QuizMode({ words, folders, setIsDirty, username }) {
          const [phase, setPhase] = useState('category'); 
          const [selectedCategories, setSelectedCategories] = useState([]);
          const [currentQ, setCurrentQ] = useState(0);
          const [score, setScore] = useState(0);
          const [selectedOption, setSelectedOption] = useState(null);
          const [isCorrect, setIsCorrect] = useState(null);
          const [activeWords, setActiveWords] = useState([]); 
          const [showQuitConfirm, setShowQuitConfirm] = useState(false);
          const [questionTypes, setQuestionTypes] = useState([]);

          useEffect(() => {
            if (setIsDirty) setIsDirty(phase === 'playing');
          }, [phase, setIsDirty]);

          useEffect(() => {
            if (phase === 'playing' && questionTypes[currentQ] === 'AUDIO_TO_ENG') {
                const timeout = setTimeout(() => playAudio(activeWords[currentQ].word, 'en-US'), 400);
                return () => clearTimeout(timeout);
            }
          }, [currentQ, phase, questionTypes, activeWords]);

          const options = useMemo(() => {
            if (activeWords.length === 0 || !activeWords[currentQ]) return [];
            const target = activeWords[currentQ];
            const others = words.filter(w => w.id !== target.id);
            const incorrect = shuffleArray(others).slice(0, 3);
            return shuffleArray([...incorrect, target]);
          }, [currentQ, activeWords, words]);

          const handleAnswer = (opt) => {
            if (selectedOption) return;
            setSelectedOption(opt);
            const correct = opt.id === activeWords[currentQ].id;
            setIsCorrect(correct);
            if (correct) { setScore(s => s + 1); playSoundEffect('correct'); }
            else playSoundEffect('wrong');

            setTimeout(() => {
                if (currentQ < activeWords.length - 1) {
                    setCurrentQ(q => q + 1);
                    setSelectedOption(null);
                    setIsCorrect(null);
                } else {
                    setPhase('result');
                }
            }, 1500);
          };

          if (phase === 'category') return <CategorySelectionScreen words={words} folders={folders} title="Quiz: Category" onSelect={(folderIds) => { setSelectedCategories(folderIds); setPhase('setup'); }} />;
          if (phase === 'setup') return <WordSelectionScreen words={words} folders={folders} selectedFolderIds={selectedCategories} title="Select Words" onBack={() => setPhase('category')} onStart={(sw) => { 
              const shuffled = shuffleArray(sw);
              setActiveWords(shuffled); 
              
              const types = shuffled.map(w => {
                  const availableTypes = ['ENG_TO_MAN', 'MAN_TO_ENG', 'AUDIO_TO_ENG'];
                  if (w.meaning) availableTypes.push('MEANING_TO_ENG');
                  return availableTypes[Math.floor(Math.random() * availableTypes.length)];
              });
              setQuestionTypes(types);

              setCurrentQ(0); 
              setScore(0); 
              setPhase('playing'); 
          }} />;
          
          if (phase === 'result') {
            const isPerfect = score === activeWords.length;
            return (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in relative overflow-hidden">
                  <CelebrationUI show={isPerfect} />
                  <div className={`celebration-card flex flex-col items-center ${isPerfect ? 'bg-white/85 backdrop-blur-sm rounded-[2rem] px-8 py-8 shadow-xl border border-yellow-100' : ''}`}>
                      <div className="relative mb-6">
                          {isPerfect && <span className="medal-shine" />}
                          <Award size={88} className={`${isPerfect ? 'text-yellow-500' : 'text-indigo-500'} relative z-10`} />
                      </div>
                      <h2 className={`text-4xl md:text-5xl font-black mb-2 ${isPerfect ? 'celebration-title-glow text-yellow-600' : ''}`}>
                          {isPerfect ? 'Amazing! Perfect Score!' : 'Quiz Finished!'}
                      </h2>
                      {isPerfect && <p className="text-lg md:text-xl font-black text-emerald-600 mb-3">You got everything correct!</p>}
                      <div className="mb-3 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-black">Student: {username || 'Student'}</div>
                      <p className="text-2xl font-bold text-indigo-600 mb-8">Score: {score} / {activeWords.length}</p>
                      <button onClick={() => setPhase('category')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-colors">New Quiz</button>
                  </div>
              </div>
            );
          }

          const qWord = activeWords[currentQ];
          const qType = questionTypes[currentQ] || 'ENG_TO_MAN';

          return (
            <div className="h-full flex flex-col max-w-2xl mx-auto p-3 md:p-8 relative overflow-hidden pb-safe">
                {showQuitConfirm && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in rounded-2xl">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">Quit Quiz?</h3>
                        <p className="text-gray-500 mb-6 text-center">Your score will not be saved. Are you sure?</p>
                        <div className="flex gap-4 w-full max-w-sm">
                            <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
                            <button onClick={() => { setShowQuitConfirm(false); setPhase('category'); }} className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600">Quit</button>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center mb-3 md:mb-6 text-gray-400 font-bold bg-white px-4 md:px-6 py-2 md:py-3 rounded-full border shadow-sm shrink-0 text-sm md:text-base">
                    <span>Question {currentQ + 1} / {activeWords.length}</span>
                    <div className="flex items-center gap-4">
                        <span className="text-indigo-600">Score: {score}</span>
                        <button onClick={() => setShowQuitConfirm(true)} className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors border-l pl-4">
                            <X size={18} /> Quit
                        </button>
                    </div>
                </div>
                
                <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 md:p-10 shadow-xl border border-gray-100 text-center mb-3 md:mb-8 min-h-[140px] md:min-h-[220px] flex flex-col justify-center items-center shrink-0">
                    <span className="text-indigo-400 text-xs font-black uppercase tracking-widest block mb-4">
                        {qType === 'ENG_TO_MAN' && "Translate to Mandarin"}
                        {qType === 'MAN_TO_ENG' && "Translate to English"}
                        {qType === 'MEANING_TO_ENG' && "What is the word?"}
                        {qType === 'AUDIO_TO_ENG' && "Listen & Choose"}
                    </span>
                    
                    {qType === 'ENG_TO_MAN' && <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-6 break-words">{qWord.word}</h2>}
                    {qType === 'MAN_TO_ENG' && <h2 className="text-2xl md:text-5xl font-black text-gray-800 mb-3 md:mb-6 break-words leading-tight">{qWord.mandarin}</h2>}
                    {qType === 'MEANING_TO_ENG' && <h2 className="text-xl md:text-3xl font-bold text-gray-600 mb-3 md:mb-6 italic break-words leading-tight">"{qWord.meaning}"</h2>}
                    {qType === 'AUDIO_TO_ENG' && (
                        <button onClick={() => playAudio(qWord.word, 'en-US')} className="p-4 md:p-6 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-all shadow-sm animate-pulse mb-2 md:mb-4">
                            <Volume2 size={40} />
                        </button>
                    )}

                    {(qType === 'ENG_TO_MAN' || qType === 'MAN_TO_ENG') && (
                        <button onClick={() => playAudio(qType === 'ENG_TO_MAN' ? qWord.word : qWord.mandarin, qType === 'ENG_TO_MAN' ? 'en-US' : 'zh-CN')} className="text-indigo-200 hover:text-indigo-500 transition-colors">
                            <Volume2 size={32} />
                        </button>
                    )}
                    {qType === 'AUDIO_TO_ENG' && <span className="text-xs text-gray-400 font-bold">Click to replay</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4 pb-2 flex-1 min-h-0">
                    {options.map(opt => {
                        let style = "bg-white border-2 border-gray-100 text-gray-700 hover:border-indigo-300 hover:shadow-md";
                        if (selectedOption) {
                            if (opt.id === qWord.id) style = "bg-green-500 border-green-500 text-white shadow-lg scale-[1.02]";
                            else if (opt.id === selectedOption.id) style = "bg-red-500 border-red-500 text-white scale-[0.98]";
                            else style = "opacity-50 bg-gray-50 border-transparent scale-[0.98]";
                        }
                        return (
                            <button key={opt.id} disabled={!!selectedOption} onClick={() => handleAnswer(opt)} className={`p-3 md:p-6 rounded-2xl text-sm md:text-xl font-bold transition-all min-h-[82px] md:min-h-[120px] flex items-center justify-center leading-tight break-words ${style}`}>
                                {qType === 'ENG_TO_MAN' ? opt.mandarin : opt.word}
                            </button>
                        );
                    })}
                </div>
            </div>
          );
        }

        const VirtualKeyboard = ({ onKeyPress, onBackspace, onSubmit, disabled = false, submitText = "ENTER", autoHideUI = false }) => {
          const [showUI, setShowUI] = useState(true);
          const [mode, setMode] = useState('letters');

          const letterRows = [
              ['q','w','e','r','t','y','u','i','o','p'],
              ['a','s','d','f','g','h','j','k','l'],
              ['z','x','c','v','b','n','m']
          ];

          const symbolRows = [
              ['1','2','3','%'],
              ['4','5','6','-'],
              ['7','8','9','...'],
              [',','0','=','.' ]
          ];

          const allowedPhysicalKeys = /^[a-zA-Z0-9\s\-'.!,?#%+*\/=@£&_":;()]+$/;

          useEffect(() => {
              if (autoHideUI) {
                  const hasTouch = window.matchMedia("(any-pointer: coarse)").matches;
                  const isMobileUA = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
                  setShowUI(hasTouch || isMobileUA);
              }
          }, [autoHideUI]);

          useEffect(() => {
             const handlePhysicalKey = (e) => {
                 if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
                 if (e.key === 'Backspace') {
                     e.preventDefault();
                     onBackspace();
                 } else if (e.key === 'Enter') {
                     e.preventDefault();
                     onSubmit();
                 } else if (e.key === ' ') {
                     e.preventDefault();
                     onKeyPress(' ');
                 } else if (e.key.length === 1 && allowedPhysicalKeys.test(e.key)) {
                     e.preventDefault();
                     onKeyPress(/[a-zA-Z]/.test(e.key) ? e.key.toLowerCase() : e.key);
                 }
             };
             window.addEventListener('keydown', handlePhysicalKey);
             return () => window.removeEventListener('keydown', handlePhysicalKey);
          }, [onKeyPress, onBackspace, onSubmit, disabled]);

          if (!showUI) return null;

          const baseBtnClass = "bg-white text-gray-800 shadow-[0_4px_0_#d1d5db] active:translate-y-1 active:shadow-none hover:bg-gray-50 disabled:opacity-50";
          const modeBtnClass = "bg-gray-400 text-white shadow-[0_4px_0_#9ca3af] active:translate-y-1 active:shadow-none hover:bg-gray-500";

          const renderKey = (key, extraClass = '') => (
              <button key={key} disabled={disabled} onClick={() => !disabled && onKeyPress(key)} className={`${extraClass || 'flex-1'} h-10 md:h-14 rounded-lg md:rounded-xl text-lg md:text-2xl font-bold transition-all ${baseBtnClass}`}>
                  {key === '...' ? '…' : key}
              </button>
          );

          return (
              <div className="w-full p-2 md:p-4 rounded-t-2xl md:rounded-2xl shrink-0 mt-auto bg-gray-200 pb-safe">
                  <div className="flex flex-col gap-2 md:gap-3 max-w-3xl mx-auto">
                      {mode === 'letters' ? (
                          <>
                              {letterRows.map((row, i) => (
                                  <div key={i} className={`flex justify-center gap-1 md:gap-2 ${i === 1 ? 'px-4 md:px-8' : i === 2 ? 'px-8 md:px-16' : ''}`}>
                                      {row.map(key => (
                                          <button key={key} disabled={disabled} onClick={() => !disabled && onKeyPress(key)} className={`flex-1 h-10 md:h-14 rounded-lg md:rounded-xl text-lg md:text-2xl font-bold uppercase transition-all ${baseBtnClass}`}>
                                              {key}
                                          </button>
                                      ))}
                                  </div>
                              ))}
                              <div className="flex justify-center gap-1 md:gap-2 mt-1">
                                  <button onClick={() => setMode('symbols')} disabled={disabled} className={`flex-[2] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-black transition-all ${modeBtnClass}`}>
                                      ?123
                                  </button>
                                  <button onClick={() => !disabled && onKeyPress(' ')} disabled={disabled} className={`flex-[5] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-bold uppercase transition-all ${baseBtnClass}`}>
                                      SPACE
                                  </button>
                                  <button onClick={() => !disabled && onBackspace()} disabled={disabled} className="flex-[2] h-10 md:h-14 rounded-lg md:rounded-xl flex justify-center items-center transition-all bg-gray-400 text-white shadow-[0_4px_0_#9ca3af] active:translate-y-1 active:shadow-none hover:bg-gray-500 disabled:opacity-50">
                                      <Delete size={24} />
                                  </button>
                                  <button onClick={() => !disabled && onSubmit()} disabled={disabled} className={`flex-[2.5] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-black uppercase transition-all ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} bg-indigo-600 text-white shadow-[0_4px_0_#4338ca] active:translate-y-1 active:shadow-none hover:bg-indigo-700`}>
                                      {submitText}
                                  </button>
                              </div>
                          </>
                      ) : (
                          <>
                              <div className="grid grid-cols-4 gap-1 md:gap-2">
                                  {symbolRows.flat().map(key => renderKey(key, 'w-full'))}
                              </div>
                              <div className="grid grid-cols-6 gap-1 md:gap-2">
                                  {["'", '"', '!', '?', ':', ';'].map(key => renderKey(key, 'w-full'))}
                              </div>
                              <div className="flex justify-center gap-1 md:gap-2 mt-1">
                                  <button onClick={() => setMode('letters')} disabled={disabled} className={`flex-[2] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-black transition-all ${modeBtnClass}`}>
                                      ABC
                                  </button>
                                  <button onClick={() => !disabled && onKeyPress(' ')} disabled={disabled} className={`flex-[4] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-bold uppercase transition-all ${baseBtnClass}`}>
                                      SPACE
                                  </button>
                                  <button onClick={() => !disabled && onBackspace()} disabled={disabled} className="flex-[2] h-10 md:h-14 rounded-lg md:rounded-xl flex justify-center items-center transition-all bg-gray-400 text-white shadow-[0_4px_0_#9ca3af] active:translate-y-1 active:shadow-none hover:bg-gray-500 disabled:opacity-50">
                                      <Delete size={24} />
                                  </button>
                                  <button onClick={() => !disabled && onSubmit()} disabled={disabled} className={`flex-[2.5] h-10 md:h-14 rounded-lg md:rounded-xl text-sm md:text-xl font-black uppercase transition-all ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} bg-indigo-600 text-white shadow-[0_4px_0_#4338ca] active:translate-y-1 active:shadow-none hover:bg-indigo-700`}>
                                      {submitText}
                                  </button>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          );
        };

        function SpellingMode({ words, folders, setIsDirty, username }) {
          const [phase, setPhase] = useState('category');
          const [selectedCategories, setSelectedCategories] = useState([]);
          const [activeWords, setActiveWords] = useState([]);
          const [currentIndex, setCurrentIndex] = useState(0);
          const [userInput, setUserInput] = useState('');
          const [userAnswers, setUserAnswers] = useState({});
          const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
          const [timer, setTimer] = useState(0);
          const [isTimerRunning, setIsTimerRunning] = useState(false);
          const [finalTime, setFinalTime] = useState("0:00");
          const [showQuitConfirm, setShowQuitConfirm] = useState(false);
          const inputDisplayRef = useRef(null);

          useEffect(() => {
            if (setIsDirty) setIsDirty(phase === 'playing');
          }, [phase, setIsDirty]);

          useEffect(() => {
            const box = inputDisplayRef.current;
            if (box) box.scrollLeft = box.scrollWidth;
          }, [userInput]);

          useEffect(() => {
            let interval;
            if (phase === 'playing' && isTimerRunning) {
              interval = setInterval(() => setTimer(prev => prev + 1), 1000);
            }
            return () => clearInterval(interval);
          }, [isTimerRunning, phase]);

          const handleStart = (selected) => {
              setActiveWords(shuffleArray(selected));
              setCurrentIndex(0);
              setUserAnswers({});
              setUserInput('');
              setTimer(0);
              setIsTimerRunning(true);
              setPhase('playing');
          };

          const handleVirtualKeyPress = (char) => setUserInput(prev => prev + char);
          const handleVirtualBackspace = () => setUserInput(prev => prev.slice(0, -1));

          const goToNext = () => {
            setUserAnswers({ ...userAnswers, [currentIndex]: userInput });
            if (currentIndex < activeWords.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setUserInput(userAnswers[currentIndex + 1] || '');
            } else {
                setShowConfirmSubmit(true);
            }
          };

          const goToPrev = () => {
              if (currentIndex > 0) {
                  setUserAnswers({ ...userAnswers, [currentIndex]: userInput });
                  setCurrentIndex(prev => prev - 1);
                  setUserInput(userAnswers[currentIndex - 1] || '');
              }
          };

          const confirmSubmit = () => {
            setIsTimerRunning(false);
            const formattedTime = formatTime(timer);
            setFinalTime(formattedTime);
            setShowConfirmSubmit(false);
            setPhase('result');
          };

          const getScore = () => {
              let correctCount = 0;
              activeWords.forEach((word, idx) => {
                  const ans = (idx === currentIndex && !showConfirmSubmit) ? userInput : (userAnswers[idx] || '');
                  if (normalizeAnswer(ans) === normalizeAnswer(word.word)) correctCount++;
              });
              return correctCount;
          };

          if (phase === 'category') return <CategorySelectionScreen words={words} folders={folders} title="Spelling: Category" onSelect={(folderIds) => { setSelectedCategories(folderIds); setPhase('setup'); }} />;
          if (phase === 'setup') return <WordSelectionScreen words={words} folders={folders} selectedFolderIds={selectedCategories} title="Start Spelling" onBack={() => setPhase('category')} onStart={handleStart} />;

          if (phase === 'result') {
              const finalScore = getScore();
              const isPerfect = finalScore === activeWords.length;
              const mistakes = activeWords.map((word, idx) => ({
                  word,
                  ans: userAnswers[idx] || '',
                  isCorrect: normalizeAnswer(userAnswers[idx] || '') === normalizeAnswer(word.word)
              })).filter(item => !item.isCorrect);

              return (
                  <div className="h-full flex flex-col items-center p-4 md:p-8 text-center animate-in zoom-in overflow-y-auto custom-scrollbar relative">
                      <CelebrationUI show={isPerfect} />
                      <div className={`max-w-2xl w-full flex flex-col items-center celebration-card ${isPerfect ? 'bg-white/85 backdrop-blur-sm rounded-[2rem] px-5 md:px-8 py-8 shadow-xl border border-yellow-100' : ''}`}>
                          <div className="relative mb-4">
                              {isPerfect && <span className="medal-shine" />}
                              <Award size={88} className={`${isPerfect ? 'text-yellow-500' : 'text-indigo-500'} relative z-10`} />
                          </div>
                          <h2 className={`text-3xl md:text-5xl font-black mb-2 ${isPerfect ? 'celebration-title-glow text-yellow-600' : ''}`}>{isPerfect ? 'Amazing! Perfect Score!' : 'Practice Complete'}</h2>
                          {isPerfect && <p className="text-lg md:text-xl font-black text-emerald-600 mb-3">You got everything correct!</p>}
                          <p className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                              You answered <span className={isPerfect ? "text-green-600" : "text-indigo-600"}>{finalScore}</span> out of {activeWords.length} correctly.
                          </p>
                          <div className="mb-3 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-sm font-black">Student: {username || 'Student'}</div>
                          <p className="text-gray-500 mb-8 font-bold"><Clock size={16} className="inline mr-1" />{finalTime}</p>

                          {!isPerfect && (
                              <div className="w-full bg-red-50 border-2 border-red-100 rounded-3xl p-6 mb-8 text-left">
                                  <div className="flex items-center gap-2 mb-4 text-red-600">
                                      <AlertCircle size={24} />
                                      <h3 className="text-xl font-bold uppercase tracking-wide">Questions Answered Wrongly</h3>
                                  </div>
                                  <div className="space-y-4">
                                      {mistakes.map((item) => (
                                          <div key={item.word.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                                              <p className="text-sm font-bold text-gray-500 mb-2">{item.word.mandarin} {item.word.meaning ? `(${item.word.meaning})` : ''}</p>
                                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-xs font-bold text-gray-400 w-12">YOU:</span>
                                                      <span className="font-bold text-lg text-red-500 line-through">{item.ans || "(empty)"}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-xs font-bold text-gray-400 w-12">ANS:</span>
                                                      <span className="font-bold text-lg text-green-600">{item.word.word}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {isPerfect && (
                              <div className="w-full space-y-4 text-left mb-8">
                                  {activeWords.map((word, idx) => {
                                      const ans = userAnswers[idx] || '';
                                      return (
                                          <div key={word.id} className="p-4 rounded-xl border-2 border-green-200 bg-green-50 flex justify-between items-center">
                                              <div className="flex-1 mr-4">
                                                  <p className="text-sm font-bold text-gray-500 mb-1">{word.mandarin}</p>
                                                  <span className="font-bold text-lg text-green-700">{ans}</span>
                                              </div>
                                              <CheckCircle className="text-green-500 shrink-0" size={28} />
                                          </div>
                                      );
                                  })}
                              </div>
                          )}

                          <div className="flex flex-col gap-4 w-full">
                              {!isPerfect && (
                                  <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-3xl mb-2">
                                      <p className="text-indigo-800 font-bold text-lg mb-4">You didn't get all correct. Try again to achieve 100%!</p>
                                      <button onClick={() => {
                                          setActiveWords(shuffleArray(activeWords));
                                          setCurrentIndex(0);
                                          setUserAnswers({});
                                          setUserInput('');
                                          setTimer(0);
                                          setIsTimerRunning(true);
                                          setPhase('playing');
                                      }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                          <RotateCw size={20} /> Try Again
                                      </button>
                                  </div>
                              )}
                              <button onClick={() => {
                                  setPhase('category');
                              }} className={`w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-colors ${isPerfect ? 'shadow-md' : ''}`}>
                                  Start New Session
                              </button>
                          </div>
                      </div>
                  </div>
              );
          }

          const qWord = activeWords[currentIndex];

          return (
              <div className="flex flex-col h-full max-w-2xl mx-auto w-full relative bg-gray-50">
                  {showQuitConfirm && (
                      <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                              <AlertCircle size={32} className="text-red-500" />
                          </div>
                          <h3 className="text-3xl font-black text-gray-800 mb-2">Quit Practice?</h3>
                          <p className="text-gray-500 mb-6 text-center text-lg">Your progress will be lost. Are you sure?</p>
                          <div className="flex gap-4 w-full max-w-sm">
                              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
                              <button onClick={() => { setShowQuitConfirm(false); setPhase('category'); }} className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600">Quit</button>
                          </div>
                      </div>
                  )}
                  {showConfirmSubmit && (
                      <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in">
                          <h3 className="text-3xl font-black text-gray-800 mb-4">Submit Answers?</h3>
                          <div className="flex gap-4 w-full max-w-sm">
                              <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
                              <button onClick={confirmSubmit} className="flex-1 py-4 rounded-xl bg-green-500 text-white font-bold shadow-lg hover:bg-green-600">Submit</button>
                          </div>
                      </div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col min-h-0 custom-scrollbar">
                      <div className="flex justify-between items-center mb-6 text-gray-400 font-bold shrink-0 bg-white px-4 py-2 rounded-full border shadow-sm">
                          <span className="flex items-center gap-2 text-indigo-600"><Clock size={18} /> {formatTime(timer)}</span>
                          <div className="flex items-center gap-4">
                              <span>Word {currentIndex + 1} / {activeWords.length}</span>
                              <button onClick={() => setShowQuitConfirm(true)} className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors border-l pl-3">
                                  <X size={18} /> Quit
                              </button>
                          </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 text-center mb-6 shrink-0">
                          <span className="text-indigo-400 text-xs font-black uppercase tracking-widest block mb-4">Translate this</span>
                          <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-2">{qWord.mandarin}</h2>
                          {qWord.meaning && <p className="text-lg text-gray-500 mb-4 font-medium italic">"{qWord.meaning}"</p>}
                          <button onClick={() => playAudio(qWord.mandarin, 'zh-CN')} className="text-indigo-300 hover:text-indigo-500 transition-colors mx-auto p-2 bg-indigo-50 rounded-full"><Volume2 size={24} /></button>
                      </div>

                      <div className="w-full relative shrink-0">
                          <div ref={inputDisplayRef} className="w-full min-h-[78px] p-4 text-left text-2xl md:text-3xl font-bold rounded-2xl border-4 border-indigo-500 bg-white shadow-inner flex items-center justify-start mb-2 cursor-text overflow-x-auto custom-scrollbar" onClick={() => document.getElementById('hidden-input')?.focus()}>
                              <div className="answer-display-line whitespace-nowrap">
                                  {userInput.split('').map((char, idx) => (
                                      char === ' '
                                          ? <span key={idx} className="answer-space">␣</span>
                                          : <span key={idx} className="answer-char text-gray-800">{char}</span>
                                  ))}
                                  <span className="typing-cursor"></span>
                                  {!userInput && <span className="text-gray-300 font-normal text-xl ml-2 align-middle">Type here...</span>}
                              </div>
                          </div>
                          <p className="text-center text-xs text-gray-400 font-bold mb-5">Spaces show as <span className="inline-flex items-center justify-center px-1 rounded bg-indigo-50 text-indigo-500">␣</span>. Spacing will not affect marking.</p>

                          <div className="flex gap-4 mb-4">
                              <button onClick={goToPrev} disabled={currentIndex === 0} className="flex-1 py-4 rounded-2xl font-bold text-indigo-600 bg-indigo-50 disabled:opacity-50 transition-colors hover:bg-indigo-100">Previous</button>
                              <button onClick={goToNext} className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 shadow-md hover:bg-indigo-700 transition-all">{currentIndex === activeWords.length - 1 ? 'Finish' : 'Next Word'}</button>
                          </div>
                      </div>
                  </div>

                  <VirtualKeyboard
                      disabled={showConfirmSubmit || showQuitConfirm}
                      onKeyPress={handleVirtualKeyPress}
                      onBackspace={handleVirtualBackspace}
                      onSubmit={goToNext}
                      submitText={currentIndex === activeWords.length - 1 ? 'FINISH' : 'NEXT'}
                      autoHideUI={true}
                  />
                  <input
                      id="hidden-input"
                      type="text"
                      inputMode="none"
                      readOnly
                      className="opacity-0 absolute -z-10 h-0 w-0"
                      value={userInput}
                      onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z0-9\s\-'.!,?#%+*\/=@£&_\":;()]*$/.test(val)) setUserInput(val);
                      }}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                  />
              </div>
          );
        }

        function AddMode({ words, setWords, folders, setFolders, setActiveTab }) {
            const [inputText, setInputText] = useState('');
            const [category, setCategory] = useState('English Trial 2026 Pahang');
            const [analysis, setAnalysis] = useState(null);
            const [preview, setPreview] = useState([]);
            const [proposedFolders, setProposedFolders] = useState([]);
            const [selectedPreviewIds, setSelectedPreviewIds] = useState(new Set());
            const [bulkFolderId, setBulkFolderId] = useState('');
            const [duplicateAction, setDuplicateAction] = useState('skip');
            const [importResult, setImportResult] = useState(null);
            const [previewTab, setPreviewTab] = useState('structure');
            const [collapsedFolderIds, setCollapsedFolderIds] = useState(new Set());
            const fileInputRef = useRef(null);

            const previewStatuses = useMemo(() => preview.map(item => ({
                id: item.id,
                ...evaluateImportStatus(item, words, duplicateAction)
            })), [preview, words, duplicateAction]);

            const statusById = useMemo(() => {
                const map = new Map();
                previewStatuses.forEach(status => map.set(status.id, status));
                return map;
            }, [previewStatuses]);

            const summary = useMemo(() => {
                const base = { Ready: 0, Warning: 0, Duplicate: 0, Error: 0, Ignored: 0 };
                previewStatuses.forEach(status => { base[status.status] = (base[status.status] || 0) + 1; });
                return base;
            }, [previewStatuses]);

            const importableCount = preview.filter(item => {
                const status = statusById.get(item.id);
                return status && !['Error', 'Ignored'].includes(status.status) && !(status.status === 'Duplicate' && duplicateAction === 'skip');
            }).length;

            const existingCategories = useMemo(() => {
                const cats = new Set(words.map(w => w.category || 'General'));
                preview.forEach(item => { if (item.category) cats.add(item.category); });
                return Array.from(cats).sort();
            }, [words, preview]);

            const folderOptions = useMemo(() => flattenFolderOptions(proposedFolders), [proposedFolders]);
            const proposedById = useMemo(() => new Map(proposedFolders.map(folder => [folder.id, folder])), [proposedFolders]);
            const folderWordCounts = useMemo(() => {
                const direct = new Map();
                preview.forEach(item => {
                    if (!item.ignored && item.folderId) direct.set(item.folderId, (direct.get(item.folderId) || 0) + 1);
                });
                const total = new Map(direct);
                proposedFolders.forEach(folder => {
                    const count = direct.get(folder.id) || 0;
                    let parentId = folder.parentId;
                    while (parentId) {
                        total.set(parentId, (total.get(parentId) || 0) + count);
                        parentId = proposedById.get(parentId)?.parentId;
                    }
                });
                return { direct, total };
            }, [preview, proposedFolders, proposedById]);

            const structureSummary = useMemo(() => {
                const paperCount = proposedFolders.filter(folder => folder.type === 'PAPER').length;
                const sectionCount = proposedFolders.filter(folder => ['SECTION', 'INSTRUCTIONS', 'QUESTION', 'QUESTION_RANGE', 'PASSAGE', 'PASSAGE_SUBSECTION', 'TEXT', 'OPTIONS', 'UNKNOWN'].includes(folder.type)).length;
                const contentCount = proposedFolders.filter(folder => !['DOCUMENT_TITLE', 'AUTO_PARENT'].includes(folder.type)).length;
                return {
                    paperCount,
                    sectionCount,
                    contentCount,
                    existingFolders: proposedFolders.filter(folder => folder.existingFolderId).length,
                    needsReview: proposedFolders.filter(folder => folder.needsReview && !folder.ignored).length
                };
            }, [proposedFolders]);

            const handleParse = () => {
                const parsed = parseStructuredVocabularyInput(inputText, category, folders);
                setAnalysis(parsed);
                setPreview(parsed.items);
                setProposedFolders(parsed.folders);
                setSelectedPreviewIds(new Set());
                setImportResult(null);
                setPreviewTab('structure');
            };

            const handleJsonFileChange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (!Array.isArray(parsed)) throw new Error('Backup file must be an array.');
                        const draftFolders = [];
                        const folderByPath = new Map();
                        const ensureDraftFolder = (pathText) => {
                            const names = cleanCellText(pathText || category || 'General').split('›').map(cleanCellText).filter(Boolean);
                            let parentId = null;
                            let folder = null;
                            names.forEach((name, depth) => {
                                const pathKey = makeFolderPathKey(names.slice(0, depth + 1));
                                folder = folderByPath.get(pathKey);
                                if (!folder) {
                                    folder = { id: makeId('json-folder'), name, parentId, type: depth === 0 ? 'DOCUMENT_TITLE' : 'SECTION', rawHeading: name, sourcePage: null, lineNumber: index + 1, needsReview: false, existingFolderId: null, ignored: false };
                                    draftFolders.push(folder);
                                    folderByPath.set(pathKey, folder);
                                }
                                parentId = folder.id;
                            });
                            return folder;
                        };
                        const items = parsed.map((item, index) => {
                            const folder = ensureDraftFolder(item.category || category || 'General');
                            return ({
                            id: `json-preview-${index}-${Math.random().toString(36).slice(2)}`,
                            lineNumber: index + 1,
                            rawSource: JSON.stringify(item),
                            word: cleanCellText(item.word),
                            pronunciation: cleanCellText(item.pronunciation),
                            meaning: cleanCellText(item.meaning),
                            mandarin: cleanCellText(item.mandarin),
                            category: getFolderPath(folder.id, draftFolders) || cleanCellText(item.category || category || 'General'),
                            folderId: folder.id,
                            section: cleanCellText(item.section),
                            part: cleanCellText(item.part),
                            question: cleanCellText(item.question),
                            sourcePage: item.sourcePage || null,
                            rawHeading: cleanCellText(item.rawHeading),
                            ignored: false
                        });}).filter(item => item.word || item.mandarin || item.meaning);
                        setAnalysis({ items, folders: draftFolders, headings: [], unknownHeadings: [], unrecognised: [], totalLines: parsed.length, source: 'json', documentTitle: category || 'JSON Backup' });
                        setPreview(items);
                        setProposedFolders(draftFolders);
                        setSelectedPreviewIds(new Set());
                        setImportResult(null);
                        setPreviewTab('vocabulary');
                    } catch (error) {
                        setAnalysis({ items: [], folders: [], headings: [], unknownHeadings: [], unrecognised: [{ id: 'json-error', lineNumber: 1, text: 'Invalid JSON backup file.' }], totalLines: 1, source: 'json' });
                        setPreview([]);
                        setProposedFolders([]);
                    }
                    e.target.value = '';
                };
                reader.readAsText(file);
            };

            const updatePreviewItem = (id, field, value) => {
                setPreview(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
            };

            const togglePreviewSelection = (id) => {
                setSelectedPreviewIds(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                });
            };

            const selectAllPreview = () => {
                const visibleIds = preview.map(item => item.id);
                setSelectedPreviewIds(prev => prev.size === visibleIds.length ? new Set() : new Set(visibleIds));
            };

            const updateFolderName = (folderId, name) => {
                setProposedFolders(current => current.map(folder => folder.id === folderId ? { ...folder, name } : folder));
                setPreview(current => current.map(item => item.folderId ? { ...item, category: getFolderPath(item.folderId, proposedFolders.map(folder => folder.id === folderId ? { ...folder, name } : folder)) } : item));
            };

            const moveFolder = (folderId, parentId) => {
                if (folderId === parentId) return;
                const descendantIds = new Set();
                const collect = (id) => {
                    proposedFolders.filter(folder => folder.parentId === id).forEach(child => {
                        descendantIds.add(child.id);
                        collect(child.id);
                    });
                };
                collect(folderId);
                if (descendantIds.has(parentId)) return;
                const nextFolders = proposedFolders.map(folder => folder.id === folderId ? { ...folder, parentId: parentId || null } : folder);
                setProposedFolders(nextFolders);
                setPreview(current => current.map(item => item.folderId ? { ...item, category: getFolderPath(item.folderId, nextFolders) } : item));
            };

            const markFolder = (folderId, changes) => {
                setProposedFolders(current => current.map(folder => folder.id === folderId ? { ...folder, ...changes } : folder));
            };

            const treatUnknownAsVocabulary = (folderId) => {
                const folder = proposedById.get(folderId);
                if (!folder) return;
                const parentPath = getFolderPathNames(folder.parentId, proposedFolders);
                const parentFolderId = folder.parentId || proposedFolders.find(item => !item.parentId)?.id || folderId;
                setPreview(current => [{
                    id: makeId('preview-vocab'),
                    lineNumber: folder.lineNumber || 0,
                    rawSource: folder.rawHeading || folder.name,
                    word: folder.name,
                    pronunciation: '',
                    meaning: '',
                    mandarin: '',
                    category: parentPath.join(' › ') || folder.name,
                    folderId: parentFolderId,
                    section: '',
                    part: '',
                    question: '',
                    sourcePage: folder.sourcePage || null,
                    rawHeading: folder.rawHeading || '',
                    ignored: false
                }, ...current]);
                markFolder(folderId, { ignored: true, needsReview: false });
            };

            const applyBulkFolder = () => {
                if (!bulkFolderId || selectedPreviewIds.size === 0) return;
                const nextCategory = getFolderPath(bulkFolderId, proposedFolders);
                setPreview(current => current.map(item => selectedPreviewIds.has(item.id) ? { ...item, folderId: bulkFolderId, category: nextCategory } : item));
            };

            const ignoreSelected = () => {
                setPreview(current => current.map(item => selectedPreviewIds.has(item.id) ? { ...item, ignored: true } : item));
                setSelectedPreviewIds(new Set());
            };

            const deleteSelected = () => {
                setPreview(current => current.filter(item => !selectedPreviewIds.has(item.id)));
                setSelectedPreviewIds(new Set());
            };

            const clearPronunciationSelected = () => {
                setPreview(current => current.map(item => selectedPreviewIds.has(item.id) ? { ...item, pronunciation: '' } : item));
            };

            const restoreIgnored = (id) => {
                setPreview(current => current.map(item => item.id === id ? { ...item, ignored: false } : item));
            };

            const createWordFromPreview = (item, batchId) => ({
                id: Date.now() + Math.random(),
                word: cleanCellText(item.word),
                meaning: cleanCellText(item.meaning),
                pronunciation: cleanCellText(item.pronunciation),
                mandarin: cleanCellText(item.mandarin),
                category: cleanCellText(item.category || 'General'),
                folderId: item.finalFolderId || item.folderId || null,
                section: cleanCellText(item.section),
                part: cleanCellText(item.part),
                question: cleanCellText(item.question),
                sourcePage: item.sourcePage || null,
                rawHeading: item.rawHeading || '',
                rawSource: item.rawSource || '',
                importBatchId: batchId,
                createdAt: new Date().toISOString()
            });

            const importPreviewItems = () => {
                const batchId = `batch-${Date.now()}`;
                const previousWords = words;
                const previousFolders = folders;
                let importedCount = 0;
                let updatedCount = 0;
                let skippedCount = 0;
                let createdFoldersCount = 0;

                const nextFolders = [...folders];
                const folderIdMap = new Map();
                const realPathMap = new Map();
                nextFolders.forEach(folder => {
                    const path = getFolderPathNames(folder.id, nextFolders);
                    if (path.length) realPathMap.set(makeFolderPathKey(path), folder);
                });

                const sortedFolders = [...proposedFolders].filter(folder => !folder.ignored).sort((a, b) => getFolderPathNames(a.id, proposedFolders).length - getFolderPathNames(b.id, proposedFolders).length);
                sortedFolders.forEach(folder => {
                    const proposedPath = getFolderPathNames(folder.id, proposedFolders);
                    const pathKey = makeFolderPathKey(proposedPath);
                    let realFolder = realPathMap.get(pathKey);
                    if (!realFolder) {
                        const parentRealId = folder.parentId ? folderIdMap.get(folder.parentId) : null;
                        realFolder = {
                            id: makeId('folder'),
                            name: cleanCellText(folder.name),
                            parentId: parentRealId || null,
                            type: folder.type,
                            rawHeading: folder.rawHeading || '',
                            sourcePage: folder.sourcePage || null,
                            importBatchId: batchId,
                            createdAt: new Date().toISOString()
                        };
                        nextFolders.push(realFolder);
                        realPathMap.set(pathKey, realFolder);
                        createdFoldersCount += 1;
                    }
                    folderIdMap.set(folder.id, realFolder.id);
                });

                const nextWords = [...words];
                const resolveProposedFolderId = (folderId) => {
                    let current = proposedFolders.find(folder => folder.id === folderId);
                    while (current?.ignored) current = current.parentId ? proposedFolders.find(folder => folder.id === current.parentId) : null;
                    return current?.id || folderId;
                };
                preview.forEach(item => {
                    const resolvedFolderId = resolveProposedFolderId(item.folderId);
                    const realFolderId = folderIdMap.get(resolvedFolderId) || resolvedFolderId || null;
                    const categoryPath = realFolderId ? getFolderPath(realFolderId, nextFolders) : cleanCellText(item.category || 'General');
                    const draftItem = { ...item, finalFolderId: realFolderId, category: categoryPath };
                    const status = evaluateImportStatus(draftItem, nextWords, duplicateAction).status;
                    if (['Error', 'Ignored'].includes(status)) return;
                    const existingIndex = nextWords.findIndex(word => makeImportKey(word.word, word.category) === makeImportKey(draftItem.word, draftItem.category));
                    if (existingIndex !== -1 && duplicateAction === 'skip') {
                        skippedCount += 1;
                        return;
                    }
                    if (existingIndex !== -1 && duplicateAction === 'update') {
                        nextWords[existingIndex] = {
                            ...nextWords[existingIndex],
                            word: cleanCellText(item.word),
                            meaning: cleanCellText(item.meaning),
                            pronunciation: cleanCellText(item.pronunciation),
                            mandarin: cleanCellText(item.mandarin),
                            category: categoryPath,
                            folderId: realFolderId,
                            section: cleanCellText(item.section),
                            part: cleanCellText(item.part),
                            question: cleanCellText(item.question),
                            sourcePage: item.sourcePage || null,
                            rawHeading: item.rawHeading || nextWords[existingIndex].rawHeading || '',
                            rawSource: item.rawSource || nextWords[existingIndex].rawSource || '',
                            updatedAt: new Date().toISOString()
                        };
                        updatedCount += 1;
                        return;
                    }
                    nextWords.push(createWordFromPreview(draftItem, batchId));
                    importedCount += 1;
                });

                setWords(nextWords);
                setFolders(nextFolders);
                setImportResult({ importedCount, updatedCount, skippedCount, createdFoldersCount, batchId, previousWords, previousFolders });
                setPreview([]);
                setAnalysis(null);
                setProposedFolders([]);
                setSelectedPreviewIds(new Set());
            };

            const undoLastImport = () => {
                if (!importResult?.previousWords) return;
                setWords(importResult.previousWords);
                setFolders(importResult.previousFolders || folders);
                setImportResult(null);
            };

            const statusClasses = {
                Ready: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                Warning: 'bg-yellow-50 text-yellow-700 border-yellow-100',
                Duplicate: 'bg-amber-50 text-amber-700 border-amber-100',
                Error: 'bg-red-50 text-red-700 border-red-100',
                Ignored: 'bg-gray-100 text-gray-500 border-gray-200'
            };

            const renderFolderTree = (parentId = null, depth = 0) => {
                const children = proposedFolders.filter(folder => folder.parentId === parentId && !folder.ignored);
                return children.map(folder => {
                    const hasChildren = proposedFolders.some(item => item.parentId === folder.id && !item.ignored);
                    const collapsed = collapsedFolderIds.has(folder.id);
                    return (
                        <div key={folder.id} className="border-l border-indigo-100" style={{ marginLeft: depth ? 16 : 0 }}>
                            <div className={`p-3 my-2 rounded-2xl border ${folder.needsReview ? 'bg-yellow-50 border-yellow-200' : folder.existingFolderId ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
                                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button type="button" onClick={() => setCollapsedFolderIds(prev => { const next = new Set(prev); next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id); return next; })} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            {hasChildren ? (collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} className="-rotate-90" />) : <Folder size={18} />}
                                        </button>
                                        <input value={folder.name} onChange={e => updateFolderName(folder.id, e.target.value)} className="flex-1 min-w-[180px] p-2 rounded-lg bg-white border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-gray-800" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                                        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">{folder.type}</span>
                                        <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">{folderWordCounts.total.get(folder.id) || 0} words</span>
                                        {folder.sourcePage && <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500">Page {folder.sourcePage}</span>}
                                        {folder.existingFolderId && <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Existing Folder</span>}
                                        {folder.needsReview && <span className="px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700">Needs Review</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-row gap-2 mt-3">
                                    <select value={folder.parentId || ''} onChange={e => moveFolder(folder.id, e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-bold">
                                        <option value="">Top level</option>
                                        {folderOptions.filter(option => option.id !== folder.id).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                                    </select>
                                    {folder.needsReview && (
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => markFolder(folder.id, { needsReview: false, type: 'SECTION' })} className="px-3 py-2 rounded-lg bg-yellow-500 text-white font-bold text-sm">Treat as Folder</button>
                                            <button onClick={() => treatUnknownAsVocabulary(folder.id)} className="px-3 py-2 rounded-lg bg-white border border-yellow-200 text-yellow-700 font-bold text-sm">Treat as Vocabulary</button>
                                            <button onClick={() => markFolder(folder.id, { ignored: true, needsReview: false })} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 font-bold text-sm">Ignore</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {hasChildren && !collapsed && renderFolderTree(folder.id, depth + 1)}
                        </div>
                    );
                });
            };

            return (
                <div className="h-full flex flex-col p-4 md:p-6 max-w-6xl mx-auto w-full overflow-y-auto custom-scrollbar">
                    <h2 className="text-3xl font-black text-gray-800 mb-2">Import Vocabulary</h2>
                    <p className="text-sm text-gray-400 font-medium mb-6">Paste a structured vocabulary document, review the folder tree, then import.</p>

                    {importResult && (
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-5 mb-6">
                            <h3 className="text-xl font-black text-emerald-800 mb-1">Import Complete</h3>
                            <p className="text-sm text-emerald-700 mb-4">{importResult.createdFoldersCount || 0} folders created, {importResult.importedCount} vocabulary items imported, {importResult.updatedCount} updated, {importResult.skippedCount} skipped.</p>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={undoLastImport} className="px-4 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors">Undo Last Import</button>
                                <button onClick={() => setActiveTab('study')} className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 transition-colors">Done</button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 mb-6">
                        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Plus size={22} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">Smart Entry</h3>
                                    <p className="text-xs text-gray-400 font-bold">Structured document, paper, part, question, passage, text</p>
                                </div>
                            </div>
                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Default Main Folder</label>
                            <input value={category} onChange={e => setCategory(e.target.value)} list="import-category-options" className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none mb-4 font-bold" placeholder="e.g. Form 2 Unit 6" />
                            <datalist id="import-category-options">
                                {existingCategories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>

                            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Paste Structured Vocabulary</label>
                            <p className="text-xs text-gray-400 mb-2">Paper, Part, Question, Passage, Text, Options, headings, and vocabulary rows are analysed together.</p>
                            <textarea value={inputText} onChange={e => setInputText(e.target.value)} className="w-full h-72 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none font-mono mb-4 text-sm" placeholder={"English Trial 2026 Pahang\n\nPage 1 - Paper 1 - Part 1 - Questions 1-4\n\nPart 1 - Instructions\n1. stimuli [information used for questions] 题目材料\n\nQuestion 1 - School Recycling Sale\n1. organise [to plan and arrange] 组织；安排"} />
                            <button onClick={handleParse} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-colors">Analyse Structure</button>
                        </div>

                        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><Upload size={22} /></div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">JSON Backup</h3>
                                    <p className="text-xs text-gray-400 font-bold">Restore or merge an exported backup safely</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-5">JSON backup import also checks duplicates before anything is written into your collection.</p>
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleJsonFileChange} className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} className="w-full py-4 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-colors">
                                Choose JSON File
                            </button>
                        </div>
                    </div>

                    {analysis && (
                        <div className="bg-indigo-50 rounded-3xl p-4 md:p-6 border-2 border-indigo-100 mb-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5">
                                <div>
                                    <h3 className="text-2xl font-black text-indigo-950">{analysis.documentTitle || category}</h3>
                                    <p className="text-sm text-indigo-700 font-medium">{analysis.totalLines} relevant lines processed, {preview.length} vocabulary items, {analysis.headings.length} headings recognised, {analysis.unrecognised.length} unknown lines.</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 text-sm">
                                    <div className="px-3 py-2 rounded-xl border font-black text-center bg-white text-indigo-700 border-indigo-100">{structureSummary.paperCount} Papers</div>
                                    <div className="px-3 py-2 rounded-xl border font-black text-center bg-white text-indigo-700 border-indigo-100">{structureSummary.sectionCount} Sections</div>
                                    <div className="px-3 py-2 rounded-xl border font-black text-center bg-white text-indigo-700 border-indigo-100">{structureSummary.contentCount} Folders</div>
                                    {['Ready', 'Warning', 'Duplicate', 'Error', 'Ignored'].map(label => (
                                        <div key={label} className={`px-3 py-2 rounded-xl border font-black text-center ${statusClasses[label]}`}>
                                            {summary[label] || 0} {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {summary.Duplicate > 0 && (
                                <div className="bg-white border border-amber-100 rounded-2xl p-4 mb-4">
                                    <h4 className="font-black text-amber-800 mb-2">Existing word detected</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            ['skip', 'Skip existing'],
                                            ['update', 'Update existing'],
                                            ['keep', 'Keep both']
                                        ].map(([value, label]) => (
                                            <button key={value} onClick={() => setDuplicateAction(value)} className={`py-3 rounded-xl font-bold border-2 transition-colors ${duplicateAction === value ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-amber-100 text-amber-700 hover:bg-amber-50'}`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2 font-bold">This choice applies to all duplicate rows. Default is Skip existing.</p>
                                </div>
                            )}

                            {preview.length > 0 && (
                                <div className="bg-white rounded-2xl border border-indigo-100 p-3 mb-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button onClick={selectAllPreview} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
                                                {selectedPreviewIds.size === preview.length ? 'Clear Selection' : 'Select All'}
                                            </button>
                                            <span className="text-sm text-gray-400 font-bold">{selectedPreviewIds.size} selected</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <select value={bulkFolderId} onChange={e => setBulkFolderId(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none text-sm font-bold min-w-[240px]">
                                                <option value="">Move selected to...</option>
                                                {folderOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                                            </select>
                                            <button onClick={applyBulkFolder} className="px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">Move to Folder</button>
                                            <button onClick={clearPronunciationSelected} className="px-3 py-2 rounded-lg bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-colors">Clear Pronunciation</button>
                                            <button onClick={ignoreSelected} className="px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 font-bold hover:bg-yellow-100 transition-colors">Ignore Selected</button>
                                            <button onClick={deleteSelected} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">Delete Selected</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mb-4">
                                <button onClick={() => setPreviewTab('structure')} className={`px-4 py-3 rounded-xl font-black ${previewTab === 'structure' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>Structure Preview</button>
                                <button onClick={() => setPreviewTab('vocabulary')} className={`px-4 py-3 rounded-xl font-black ${previewTab === 'vocabulary' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>Vocabulary Preview</button>
                            </div>

                            {previewTab === 'structure' && (
                                <div className="bg-white rounded-2xl border border-indigo-100 p-4 mb-4">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <h4 className="font-black text-gray-800">Structure Detected</h4>
                                        <p className="text-xs font-bold text-gray-400">{structureSummary.existingFolders} existing folders reused, {structureSummary.needsReview} need review</p>
                                    </div>
                                    <div className="max-h-[620px] overflow-y-auto custom-scrollbar pr-2">
                                        {renderFolderTree()}
                                    </div>
                                </div>
                            )}

                            {previewTab === 'vocabulary' && (
                            <div className="overflow-x-auto custom-scrollbar bg-white rounded-2xl border border-indigo-100">
                                <table className="w-full min-w-[980px] text-sm">
                                    <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider text-xs">
                                        <tr>
                                            <th className="p-3 text-left">Select</th>
                                            <th className="p-3 text-left">Status</th>
                                            <th className="p-3 text-left">Location</th>
                                            <th className="p-3 text-left">Word</th>
                                            <th className="p-3 text-left">Pronunciation</th>
                                            <th className="p-3 text-left">Meaning</th>
                                            <th className="p-3 text-left">Mandarin</th>
                                            <th className="p-3 text-left">Part / Question</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map(item => {
                                            const status = statusById.get(item.id) || evaluateImportStatus(item, words, duplicateAction);
                                            return (
                                                <tr key={item.id} className={`${item.ignored ? 'opacity-60' : ''} border-t border-gray-100`}>
                                                    <td className="p-3 align-top">
                                                        <button onClick={() => togglePreviewSelection(item.id)} className="text-indigo-500">
                                                            {selectedPreviewIds.has(item.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <div className={`inline-flex px-2 py-1 rounded-lg border text-xs font-black ${statusClasses[status.status] || statusClasses.Warning}`}>{status.status}</div>
                                                        <p className="text-[11px] text-gray-400 mt-1 max-w-[140px]">{status.message}</p>
                                                        {item.ignored && <button onClick={() => restoreIgnored(item.id)} className="text-xs text-indigo-600 font-bold mt-1">Restore</button>}
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <select value={item.folderId || ''} onChange={e => { const id = e.target.value; updatePreviewItem(item.id, 'folderId', id); updatePreviewItem(item.id, 'category', getFolderPath(id, proposedFolders)); }} className="w-full min-w-[240px] p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none">
                                                            {folderOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                                                        </select>
                                                    </td>
                                                    {['word', 'pronunciation', 'meaning', 'mandarin'].map(field => (
                                                        <td key={field} className="p-3 align-top">
                                                            <input value={item[field] || ''} onChange={e => updatePreviewItem(item.id, field, e.target.value)} className="w-full min-w-[140px] p-2 bg-gray-50 rounded-lg border-2 border-transparent focus:border-indigo-500 outline-none" />
                                                        </td>
                                                    ))}
                                                    <td className="p-3 align-top text-xs text-gray-500 min-w-[160px]">
                                                        {item.sourcePage ? `Page ${item.sourcePage}` : '-'}
                                                        <p className="text-[11px] text-gray-300 mt-1 line-clamp-2">Line {item.lineNumber}: {item.rawSource}</p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            )}

                            {analysis.unrecognised.length > 0 && (
                                <div className="bg-white border border-red-100 rounded-2xl p-4 mt-4">
                                    <h4 className="font-black text-red-700 mb-3">{analysis.unrecognised.length} lines could not be recognised</h4>
                                    <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                                        {analysis.unrecognised.map(line => (
                                            <div key={line.id} className="p-3 bg-red-50 rounded-xl text-sm">
                                                <p className="font-bold text-red-700">Line {line.lineNumber}</p>
                                                <p className="font-mono text-red-600 break-words">{line.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
                                <p className="text-sm text-indigo-700 font-bold">Folders are proposed only until you import. Page headings are saved as metadata, not folders.</p>
                                <button
                                    onClick={importPreviewItems}
                                    disabled={importableCount === 0}
                                    className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create Folders & Import {importableCount} Words
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        function ListMode({ words, setWords, folders, setFolders }) {
            const [search, setSearch] = useState('');
            const [pendingImport, setPendingImport] = useState(null);
            const [pendingImportFolders, setPendingImportFolders] = useState([]);
            const [selectedIds, setSelectedIds] = useState(new Set());
            const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
            const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
            const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
            const [editingId, setEditingId] = useState(null);
            const [editDraft, setEditDraft] = useState({
                word: '',
                pronunciation: '',
                mandarin: '',
                meaning: '',
                category: 'General'
            });
            const fileInputRef = useRef(null);

            const categories = useMemo(() => {
                const cats = new Set(words.map(w => w.category || 'General'));
                return ['All', ...Array.from(cats)];
            }, [words]);

            const pendingImportSummary = useMemo(() => {
                if (!pendingImport) return null;
                const existingKeys = new Set(words.map(word => makeImportKey(word.word, word.category)));
                const existing = pendingImport.filter(item => existingKeys.has(makeImportKey(item.word, item.category))).length;
                return {
                    total: pendingImport.length,
                    existing,
                    fresh: pendingImport.length - existing
                };
            }, [pendingImport, words]);

            const deleteWord = (id) => {
                setWords(words.filter(w => w.id !== id));
                if (editingId === id) setEditingId(null);
            };

            const startEdit = (word) => {
                setEditingId(word.id);
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(word.id);
                    return next;
                });
                setEditDraft({
                    word: word.word || '',
                    pronunciation: word.pronunciation || '',
                    mandarin: word.mandarin || '',
                    meaning: word.meaning || '',
                    category: word.category || 'General'
                });
            };

            const cancelEdit = () => {
                setEditingId(null);
                setEditDraft({
                    word: '',
                    pronunciation: '',
                    mandarin: '',
                    meaning: '',
                    category: 'General'
                });
            };

            const updateEditDraft = (field, value) => {
                setEditDraft(current => ({ ...current, [field]: value }));
            };

            const saveEdit = (id) => {
                const cleaned = {
                    word: editDraft.word.trim().replace(/\s+/g, ' '),
                    pronunciation: editDraft.pronunciation.trim(),
                    mandarin: editDraft.mandarin.trim(),
                    meaning: editDraft.meaning.trim(),
                    category: editDraft.category.trim().replace(/\s+/g, ' ') || 'General'
                };

                if (!cleaned.word || !cleaned.mandarin) return;

                setWords(words.map(w => w.id === id ? { ...w, ...cleaned } : w));
                cancelEdit();
            };

            const handleDownload = () => {
                const dataStr = JSON.stringify({
                    version: 2,
                    exportedAt: new Date().toISOString(),
                    folders,
                    words
                }, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vocab_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            const handleFileChange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        const incomingWords = Array.isArray(parsed) ? parsed : Array.isArray(parsed.words) ? parsed.words : [];
                        const incomingFolders = Array.isArray(parsed?.folders) ? parsed.folders : [];
                        if (Array.isArray(incomingWords)) {
                            const validData = incomingWords.filter(item => item.word).map(item => ({
                                ...item,
                                id: item.id || Date.now() + Math.random(),
                                word: cleanCellText(item.word),
                                pronunciation: cleanCellText(item.pronunciation),
                                meaning: cleanCellText(item.meaning),
                                mandarin: cleanCellText(item.mandarin),
                                category: cleanCellText(item.category || 'General')
                            }));
                            if (validData.length > 0) {
                                setPendingImport(validData);
                                setPendingImportFolders(incomingFolders);
                            }
                        }
                    } catch (error) {
                        console.error("Invalid JSON file");
                    }
                    e.target.value = '';
                };
                reader.readAsText(file);
            };

            const handleImportAction = (action) => {
                if (action === 'replace') {
                    setWords(pendingImport);
                    setFolders(pendingImportFolders);
                } else {
                    const nextWords = [...words];
                    const nextFolders = [...folders];
                    const folderIdMap = new Map();
                    const realPathMap = new Map();
                    nextFolders.forEach(folder => {
                        const path = getFolderPathNames(folder.id, nextFolders);
                        if (path.length) realPathMap.set(makeFolderPathKey(path), folder);
                    });
                    pendingImportFolders
                        .slice()
                        .sort((a, b) => getFolderPathNames(a.id, pendingImportFolders).length - getFolderPathNames(b.id, pendingImportFolders).length)
                        .forEach(folder => {
                            const path = getFolderPathNames(folder.id, pendingImportFolders);
                            const pathKey = makeFolderPathKey(path);
                            let realFolder = realPathMap.get(pathKey);
                            if (!realFolder) {
                                realFolder = {
                                    ...folder,
                                    id: makeId('folder'),
                                    parentId: folder.parentId ? folderIdMap.get(folder.parentId) : null,
                                    importedAt: new Date().toISOString()
                                };
                                nextFolders.push(realFolder);
                                realPathMap.set(pathKey, realFolder);
                            }
                            folderIdMap.set(folder.id, realFolder.id);
                        });
                    pendingImport.forEach(item => {
                        const mappedFolderId = item.folderId ? folderIdMap.get(item.folderId) || item.folderId : null;
                        const mappedCategory = mappedFolderId ? getFolderPath(mappedFolderId, nextFolders) : item.category;
                        const mappedItem = { ...item, folderId: mappedFolderId, category: mappedCategory };
                        const existingIndex = nextWords.findIndex(word => makeImportKey(word.word, word.category) === makeImportKey(mappedItem.word, mappedItem.category));
                        if (existingIndex !== -1 && action === 'skip') return;
                        if (existingIndex !== -1 && action === 'update') {
                            nextWords[existingIndex] = {
                                ...nextWords[existingIndex],
                                ...mappedItem,
                                id: nextWords[existingIndex].id,
                                updatedAt: new Date().toISOString()
                            };
                            return;
                        }
                        nextWords.push({
                            ...mappedItem,
                            id: action === 'keep' || existingIndex === -1 ? Date.now() + Math.random() : item.id,
                            createdAt: item.createdAt || new Date().toISOString()
                        });
                    });
                    setWords(nextWords);
                    setFolders(nextFolders);
                }
                setPendingImport(null);
                setPendingImportFolders([]);
            };

            const filtered = words.filter(w => {
                const normalizedSearch = search.toLowerCase();
                const matchSearch = (w.word || '').toLowerCase().includes(normalizedSearch)
                    || (w.mandarin || '').includes(search)
                    || (w.meaning || '').toLowerCase().includes(normalizedSearch)
                    || (w.pronunciation || '').toLowerCase().includes(normalizedSearch);
                const matchCategory = selectedCategoryFilter === 'All' || (w.category || 'General') === selectedCategoryFilter;
                return matchSearch && matchCategory;
            });

            const deleteCategory = () => {
                setWords(words.filter(w => (w.category || 'General') !== selectedCategoryFilter));
                setSelectedCategoryFilter('All');
                setSelectedIds(new Set());
                setShowCategoryDeleteConfirm(false);
            };

            const toggleSelection = (id) => {
                if (editingId === id) return;
                const next = new Set(selectedIds);
                if (next.has(id)) next.delete(id); else next.add(id);
                setSelectedIds(next);
            };

            const handleSelectAll = () => {
                if (selectedIds.size === filtered.length && filtered.length > 0) {
                    setSelectedIds(new Set());
                } else {
                    setSelectedIds(new Set(filtered.map(w => w.id)));
                }
            };

            const executeBatchDelete = () => {
                setWords(words.filter(w => !selectedIds.has(w.id)));
                setSelectedIds(new Set());
                setShowBatchDeleteConfirm(false);
            };

            return (
                <div className="h-full flex flex-col p-6 max-w-4xl mx-auto w-full overflow-hidden relative">
                    {showBatchDeleteConfirm && (
                        <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in rounded-2xl">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Delete {selectedIds.size} Words?</h3>
                            <p className="text-gray-500 mb-6 text-center">This action cannot be undone. Are you sure you want to delete the selected words?</p>
                            <div className="flex gap-4 w-full max-w-sm">
                                <button onClick={() => setShowBatchDeleteConfirm(false)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={executeBatchDelete} className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-colors">Delete</button>
                            </div>
                        </div>
                    )}
                    {pendingImport && (
                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in rounded-2xl">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <Upload size={32} className="text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Import Backup</h3>
                            <p className="text-gray-500 mb-3 text-center">Found {pendingImportSummary?.total || pendingImport.length} words in the backup file.</p>
                            <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-5 text-sm">
                                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3 py-2 font-black text-center">{pendingImportSummary?.fresh || 0} new</div>
                                <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-3 py-2 font-black text-center">{pendingImportSummary?.existing || 0} existing</div>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-sm">
                                <button onClick={() => handleImportAction('skip')} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-colors">
                                    Skip Existing
                                </button>
                                <button onClick={() => handleImportAction('update')} className="w-full py-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition-colors">
                                    Update Existing
                                </button>
                                <button onClick={() => handleImportAction('keep')} className="w-full py-4 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors">
                                    Keep Both
                                </button>
                                <button onClick={() => handleImportAction('replace')} className="w-full py-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">
                                    Replace Existing List
                                </button>
                                <button onClick={() => setPendingImport(null)} className="w-full py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 mt-2 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {showCategoryDeleteConfirm && (
                        <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-in fade-in rounded-2xl">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Delete Folder?</h3>
                            <p className="text-gray-500 mb-6 text-center">Are you sure you want to delete the folder <span className="font-bold text-gray-700">"{selectedCategoryFilter}"</span> and all its {filtered.length} words?</p>
                            <div className="flex gap-4 w-full max-w-sm">
                                <button onClick={() => setShowCategoryDeleteConfirm(false)} className="flex-1 py-4 rounded-xl border-2 border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={deleteCategory} className="flex-1 py-4 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-colors">Delete Folder</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
                        <h2 className="text-3xl font-black text-gray-800">Vocabulary List</h2>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                                <Upload size={20} /> Import
                            </button>
                            <button onClick={handleDownload} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-emerald-100 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
                                <Download size={20} /> Export
                            </button>
                        </div>
                    </div>

                    <div className="relative mb-6 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none shadow-sm transition-colors" placeholder="Search words or characters..." />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4 shrink-0 overflow-x-auto pb-2 custom-scrollbar">
                        {categories.map(c => (
                            <button key={c} onClick={() => { setSelectedCategoryFilter(c); setSelectedIds(new Set()); }}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${selectedCategoryFilter === c ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                                {c === 'All' ? 'All Folders' : c}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                            <button onClick={handleSelectAll} className="flex items-center gap-2 text-gray-600 font-bold hover:text-indigo-600 transition-colors ml-2">
                                {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="text-indigo-600" size={20} /> : <Square className="text-gray-400" size={20} />}
                                Select All
                            </button>
                            {selectedCategoryFilter !== 'All' && (
                                <button onClick={() => setShowCategoryDeleteConfirm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors text-sm border border-red-100">
                                    <Folder size={16} /> Delete Folder ({filtered.length})
                                </button>
                            )}
                        </div>
                        {selectedIds.size > 0 && (
                            <button onClick={() => setShowBatchDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors text-sm border border-red-100">
                                <Trash2 size={16} /> Delete Selected ({selectedIds.size})
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-safe min-h-0">
                        {filtered.length === 0 ? (
                            <div className="text-center text-gray-400 py-10 font-bold">No words found.</div>
                        ) : (
                            filtered.map(w => (
                                <div key={w.id} onClick={() => toggleSelection(w.id)} className={`p-4 bg-white rounded-2xl border group transition-colors ${editingId === w.id ? 'border-indigo-300 ring-1 ring-indigo-300' : `cursor-pointer ${selectedIds.has(w.id) ? 'border-indigo-300 ring-1 ring-indigo-300 bg-indigo-50/50' : 'hover:border-indigo-200'}`}`}>
                                    {editingId === w.id ? (
                                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">English</label>
                                                    <input
                                                        value={editDraft.word}
                                                        onChange={(e) => updateEditDraft('word', e.target.value)}
                                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-gray-800"
                                                        placeholder="Word"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pronunciation / Reading</label>
                                                    <input
                                                        value={editDraft.pronunciation}
                                                        onChange={(e) => updateEditDraft('pronunciation', e.target.value)}
                                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-gray-700"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mandarin / Answer</label>
                                                    <input
                                                        value={editDraft.mandarin}
                                                        onChange={(e) => updateEditDraft('mandarin', e.target.value)}
                                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-gray-700"
                                                        placeholder="苹果"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Folder</label>
                                                    <input
                                                        value={editDraft.category}
                                                        onChange={(e) => updateEditDraft('category', e.target.value)}
                                                        list="vocab-categories"
                                                        className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-gray-700"
                                                        placeholder="General"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Meaning / Description</label>
                                                <input
                                                    value={editDraft.meaning}
                                                    onChange={(e) => updateEditDraft('meaning', e.target.value)}
                                                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none text-gray-700"
                                                    placeholder="Optional description, e.g. red fruit"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={cancelEdit} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                                                    <X size={16} /> Cancel
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(w.id)}
                                                    disabled={!editDraft.word.trim() || !editDraft.mandarin.trim()}
                                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Save size={16} /> Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex items-center gap-4 min-w-0">
                                                {selectedIds.has(w.id) ? <CheckSquare className="text-indigo-600 shrink-0" size={24} /> : <Square className="text-gray-300 shrink-0" size={24} />}
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center font-bold shrink-0">{(w.word || '?')[0].toUpperCase()}</div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-lg truncate">{w.word}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">{w.category || 'General'}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate">{w.mandarin} • {w.meaning || 'No description'}</p>
                                                    {w.pronunciation && <p className="text-xs text-gray-300 truncate">/{w.pronunciation}/</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 shrink-0 border-t border-gray-100 pt-3 sm:border-t-0 sm:pt-0">
                                                <button onClick={(e) => { e.stopPropagation(); startEdit(w); }} className="flex items-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all shrink-0 font-bold text-sm" title="Edit word">
                                                    <Edit2 size={18}/> Edit
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteWord(w.id); }} className="flex items-center gap-2 px-3 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all shrink-0 font-bold text-sm" title="Delete word">
                                                    <Trash2 size={18}/> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <datalist id="vocab-categories">
                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>
            );
        }

        function App() {
          const [username, setUsername] = useState(() => { try { return localStorage.getItem('evm_user') || 'Student'; } catch (error) { return 'Student'; } });
          const [showNameEditor, setShowNameEditor] = useState(false);
          const [draftUsername, setDraftUsername] = useState(username);
          const [activeTab, setActiveTab] = useState('study');
          const [pendingTab, setPendingTab] = useState(null);
          const [isCurrentTabDirty, setIsCurrentTabDirty] = useState(false);
          const [words, setWords] = useState(() => {
            try {
              const saved = localStorage.getItem('en_vocab_master_data');
              const parsed = saved ? JSON.parse(saved) : [];
              return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
              console.warn('Vocabulary data was corrupted, resetting to empty list.', error);
              return [];
            }
          });
          const [folders, setFolders] = useState(() => {
            try {
              const saved = localStorage.getItem('en_vocab_master_folders');
              const parsed = saved ? JSON.parse(saved) : [];
              return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
              console.warn('Folder data was corrupted, resetting to empty list.', error);
              return [];
            }
          });

          useEffect(() => {
            try { localStorage.setItem('en_vocab_master_data', JSON.stringify(words)); } catch (error) { console.warn('Unable to save vocabulary data.', error); }
          }, [words]);

          useEffect(() => {
            try { localStorage.setItem('en_vocab_master_folders', JSON.stringify(folders)); } catch (error) { console.warn('Unable to save folder data.', error); }
          }, [folders]);

          useEffect(() => {
            if (!words.length) return;
            const needsMigration = words.some(word => !word.folderId) || !folders.length;
            if (!needsMigration) return;
            const migrated = buildLegacyFolders(words, folders);
            const changedFolders = migrated.folders.length !== folders.length;
            const changedWords = migrated.words.some((word, index) => word.folderId !== words[index]?.folderId);
            if (changedFolders) setFolders(migrated.folders);
            if (changedWords) setWords(migrated.words);
          }, [words, folders]);

          useEffect(() => {
            try { localStorage.setItem('evm_user', username); } catch (error) { console.warn('Unable to save student name.', error); }
            setDraftUsername(username);
          }, [username]);

          const openNameEditor = () => {
            setDraftUsername(username);
            setShowNameEditor(true);
          };

          const saveStudentName = () => {
            const cleaned = draftUsername.trim().replace(/\s+/g, ' ');
            setUsername(cleaned || 'Student');
            setShowNameEditor(false);
          };

          const StudentNameButton = ({ mobile = false }) => (
            <button
              type="button"
              onClick={openNameEditor}
              className={`${mobile ? 'text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-full' : 'mt-5 w-full bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl'} font-black flex items-center justify-center gap-2 transition-colors`}
              title="Edit student name"
            >
              <span className={mobile ? "text-xs" : "text-base"}>✎</span>
              <span className="truncate max-w-[130px]">{username || 'Student'}</span>
            </button>
          );

          const NavButton = ({ id, icon: Icon, label }) => (
            <button
              onClick={() => {
                  if (activeTab !== id) {
                      if (isCurrentTabDirty) {
                          setPendingTab(id);
                      } else {
                          setActiveTab(id);
                      }
                  }
              }}
              className={`flex flex-col md:flex-row items-center justify-center md:justify-start p-3 md:py-4 md:px-6 flex-1 md:flex-none transition-all ${
                activeTab === id ? 'text-indigo-600 bg-indigo-50 md:border-l-4 border-indigo-600 font-black' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Icon size={24} className="mb-1 md:mb-0 md:mr-4" />
              <span className="text-[10px] md:text-base uppercase tracking-wider">{label}</span>
            </button>
          );

          return (
            <div className="app-shell h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden bg-gray-50">
              <aside className="hidden md:flex flex-col w-72 bg-white border-r shadow-xl z-20 shrink-0">
                <div className="p-8 bg-indigo-600 text-white text-center">
                  <Languages size={40} className="mx-auto mb-4" />
                  <h1 className="text-xl font-black leading-tight uppercase tracking-tighter">Vocab Master</h1>
                  <StudentNameButton />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <NavButton id="study" icon={BookOpen} label="Flashcards" />
                  <NavButton id="quiz" icon={Brain} label="Quiz" />
                  <NavButton id="spelling" icon={Keyboard} label="Spelling Practice" />
                  <div className="h-px bg-gray-100 my-4"></div>
                  <NavButton id="add" icon={Plus} label="Teacher Input" />
                  <NavButton id="list" icon={List} label="Manage Words" />
                </div>
              </aside>

              <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                <header className="md:hidden bg-indigo-600 text-white p-4 text-center font-black flex justify-between items-center">
                    <span className="text-lg uppercase tracking-tighter">Vocab Master</span>
                    <StudentNameButton mobile />
                </header>
                
                <div className="flex-1 overflow-auto relative">
                    {activeTab === 'study' && <StudyMode words={words} folders={folders} />}
                    {activeTab === 'quiz' && <QuizMode words={words} folders={folders} setIsDirty={setIsCurrentTabDirty} username={username} />}
                    {activeTab === 'spelling' && <SpellingMode words={words} folders={folders} setIsDirty={setIsCurrentTabDirty} username={username} />}
                    {activeTab === 'add' && <AddMode words={words} setWords={setWords} folders={folders} setFolders={setFolders} setActiveTab={setActiveTab} />}
                    {activeTab === 'list' && <ListMode words={words} setWords={setWords} folders={folders} setFolders={setFolders} />}
                </div>
                <nav className="md:hidden bg-white border-t flex justify-between shadow-lg z-20 shrink-0 pb-safe overflow-x-auto custom-scrollbar">
                    <NavButton id="study" icon={BookOpen} label="Cards" />
                    <NavButton id="quiz" icon={Brain} label="Quiz" />
                    <NavButton id="spelling" icon={Keyboard} label="Spell" />
                    <NavButton id="add" icon={Plus} label="Add" />
                    <NavButton id="list" icon={List} label="Manage" />
                </nav>

                {showNameEditor && (
                  <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
                      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-2 border-gray-100">
                          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
                              <span className="text-3xl text-indigo-600">✎</span>
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 mb-2">Edit Student Name</h3>
                          <p className="text-gray-500 mb-5 text-sm font-medium">This name will appear on screenshots and result pages.</p>
                          <input
                              value={draftUsername}
                              onChange={(e) => setDraftUsername(e.target.value.slice(0, 30))}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveStudentName(); }}
                              autoFocus
                              className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 outline-none rounded-2xl text-center text-xl font-black text-gray-800 mb-5"
                              placeholder="Student name"
                          />
                          <div className="flex gap-4 w-full">
                              <button onClick={() => setShowNameEditor(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                              <button onClick={saveStudentName} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Save</button>
                          </div>
                      </div>
                  </div>
                )}

                {pendingTab && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
                      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl transform text-center max-w-sm w-full border-2 border-gray-100">
                          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                              <AlertTriangle size={32} className="text-yellow-600" />
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 mb-2">Switch Section?</h3>
                          <p className="text-gray-500 mb-8 text-sm md:text-base font-medium">Are you sure you want to leave? Your active session progress will be lost.</p>
                          <div className="flex gap-4 w-full">
                              <button onClick={() => setPendingTab(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all border-2 border-transparent">Cancel</button>
                              <button onClick={() => { setActiveTab(pendingTab); setPendingTab(null); setIsCurrentTabDirty(false); }} className="flex-1 bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-red-600 transition-all">Leave</button>
                          </div>
                      </div>
                  </div>
                )}
              </main>
            </div>
          );
        }
export default App;

