"use strict";

(async function () {
  function observerSearchInput() {
    const form$ = document.querySelector('form');
    form$.addEventListener('submit', () => {
      const input$ = document.querySelector('#search-input');
      browser.runtime.sendMessage({
        action: 'search',
        args: [{
          query: input$.value,
        }],
      });
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    observerSearchInput();
  } else {
    document.addEventListener('DOMContentLoaded', function onLoad() {
      document.removeEventListener('DOMContentLoaded', onLoad);
      observerSearchInput();
    });
  }
})()
