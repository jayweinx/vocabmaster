import { copyFileSync, existsSync } from 'node:fs';

const builtIndex = existsSync('dist/index.html') ? 'dist/index.html' : 'dist/_vite-pages/app/index.html';

if (existsSync(builtIndex)) {
  copyFileSync(builtIndex, 'dist/index.html');
  copyFileSync(builtIndex, 'dist/404.html');
}

if (existsSync('dist/_vite-pages/app-ios/index.html')) {
  copyFileSync('dist/_vite-pages/app-ios/index.html', 'dist/ios.html');
}
