"use strict";

(async function () {
  function observerSearchInput() {
    const input$ = document.querySelector('#search-input');
    input$.addEventListener('input', () => {
      browser.runtime.sendMessage({
        action: 'focusUrlbar',
        args: [
          input$.value,
        ],
      });
      input$.value = '';
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
