import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './ios.css';

document.documentElement.classList.add('ios-version');

const rootElement = document.getElementById('root');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Unable to start Vocab Master iOS.', error);
  if (rootElement) {
    rootElement.innerHTML = `
      <main class="ios-error-shell">
        <section class="ios-error-panel">
          <h1>Vocab Master iOS could not start</h1>
          <p>Please refresh the page. If it still fails, use Safari's Share button and choose Add to Home Screen after reopening.</p>
        </section>
      </main>
    `;
  }
}
