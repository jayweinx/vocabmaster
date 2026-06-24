import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Unable to start Vocab Master.', error);
  rootElement?.classList.remove('app-loading');
  if (rootElement) {
    rootElement.innerHTML = `
      <main class="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-slate-900">
        <section class="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 class="text-xl font-bold">Vocab Master could not start</h1>
          <p class="mt-3 text-sm text-slate-600">Please refresh the page. If it still fails, try clearing this site's browser cache and open it again.</p>
        </section>
      </main>
    `;
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch((error) => {
      console.warn('Service worker registration failed.', error);
    });
  });
}
