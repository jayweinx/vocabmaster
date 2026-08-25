import{a as e,i as t,n,r,t as i}from"./src-BBu2f9hX.js";var a=e(t(),1),o=r(),s=n(),c=document.getElementById(`root`);try{(0,o.createRoot)(c).render((0,s.jsx)(a.StrictMode,{children:(0,s.jsx)(i,{})}))}catch(e){console.error(`Unable to start Vocab Master.`,e),c?.classList.remove(`app-loading`),c&&(c.innerHTML=`
      <main class="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-slate-900">
        <section class="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 class="text-xl font-bold">Vocab Master could not start</h1>
          <p class="mt-3 text-sm text-slate-600">Please refresh the page. If it still fails, try clearing this site's browser cache and open it again.</p>
        </section>
      </main>
    `)}`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/vocabmaster/service-worker.js`).catch(e=>{console.warn(`Service worker registration failed.`,e)})});