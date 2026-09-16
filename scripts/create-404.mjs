import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const copyNormalizedHtml = (source, target) => {
  const html = readFileSync(source, 'utf8').replace(/\r\n?/g, '\n');
  writeFileSync(target, html);
};

const builtIndex = existsSync('dist/index.html') ? 'dist/index.html' : 'dist/_vite-pages/app/index.html';

if (existsSync(builtIndex)) {
  copyNormalizedHtml(builtIndex, 'dist/index.html');
  copyNormalizedHtml(builtIndex, 'dist/404.html');
}

if (existsSync('dist/_vite-pages/app-ios/index.html')) {
  copyNormalizedHtml('dist/_vite-pages/app-ios/index.html', 'dist/ios.html');
}
