"use strict";

(async function () {

  function cleanup() {
    const $searchEngines = document.querySelector('.search-engines');
    $searchEngines.innerHTML = '';
  }

  async function addSearchEngines() {
    const query = new URLSearchParams(window.location.search).get('q');
    const $searchEngineTemplate = document.querySelector('#search-engine-template');
    const searchEngines = await browser.runtime.sendMessage({
      action: 'getSearchEngines',
    });
    const $searchEngines = document.querySelector('.search-engines');

    searchEngines.forEach(engine => {
      const $engine = $searchEngineTemplate.content.cloneNode(true);
      $engine.querySelector('.search-engine-name').innerText = engine.name;
      $engine.addEventListener('click', () => {
        browser.runtime.sendMessage({
          action: 'search',
          args: [{
            query,
            engine: engine.name,
          }],
        });
      });

      $searchEngines.appendChild($engine);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    cleanup();
    addSearchEngines();
  } else {
    document.addEventListener('DOMContentLoaded', function onLoad() {
      document.removeEventListener('DOMContentLoaded', onLoad);
      cleanup();
      addSearchEngines();
    });
  }
}());
