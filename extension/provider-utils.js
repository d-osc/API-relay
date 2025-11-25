// provider-utils.js - shared helper utilities for providers
(function(){
  window.__API_RELAY_UTILS = window.__API_RELAY_UTILS || {};

  function waitForSelector(selector, opts) {
    opts = opts || {};
    const timeout = opts.timeout || 10000;
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const e = document.querySelector(selector);
        if (e) {
          obs.disconnect();
          clearTimeout(t);
          resolve(e);
        }
      });
      obs.observe(document, { childList: true, subtree: true });
      const t = setTimeout(() => { obs.disconnect(); reject(new Error('timeout')); }, timeout);
    });
  }

  function retry(fn, attempts = 5, delay = 300) {
    return new Promise((resolve, reject) => {
      let i = 0;
      function run() {
        Promise.resolve().then(fn).then(resolve).catch((err) => {
          i++;
          if (i >= attempts) return reject(err);
          setTimeout(run, delay * Math.pow(1.5, i));
        });
      }
      run();
    });
  }

  window.__API_RELAY_UTILS.waitForSelector = waitForSelector;
  window.__API_RELAY_UTILS.retry = retry;
})();
