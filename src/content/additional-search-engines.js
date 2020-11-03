"use strict";

(async function () {

  function cleanup() {
    const $content = document.querySelector('.main-content');
    const $searchEngines = document.querySelector('.searchengines');
    if ($searchEngines) {
      $content.removeChild($searchEngines);
    }
  }

  async function addSearchEngines() {
    const query = new URLSearchParams(window.location.search).get('q');
    const $content = document.querySelector('.main-content');
    const searchEngines = await browser.runtime.sendMessage({
      action: 'getSearchEngines',
    });
    const $searchEnginesWrapper = document.createElement('div');
    $searchEnginesWrapper.classList.add('searchengines');
    $searchEnginesWrapper.style.display = 'flex';
    $searchEnginesWrapper.style.flexDirection = 'row';
    $searchEnginesWrapper.style.margin = '40px 0 40px 0';
    $searchEnginesWrapper.style.flexWrap = 'wrap';

    searchEngines.forEach(engine => {
      const $engine = document.createElement('a');
      $engine.style.display = 'flex';
      $engine.style.flexDirection = 'column';
      $engine.style.alignItems = 'center';
      $engine.style.margin = '10px 7px';
      $engine.style.textDecoration = 'none';
      $engine.style.color = 'black';
      $engine.style.cursor = 'pointer';
      $engine.addEventListener('click', () => {
        browser.runtime.sendMessage({
          action: 'search',
          args: [{
            query,
            engine: engine.name,
          }],
        });
      });

      const $favicon = document.createElement('img');
      $favicon.setAttribute('src', engine.favIconUrl);
      $favicon.style.height = '24px';
      $favicon.style.width = '24px';
      $favicon.style.boxShadow = 'inset 0 0 0 1px rgba(249, 249, 250, 0.2), 0 1px 8px 0 rgba(12, 12, 13, 0.2)';
      $favicon.style.transition = 'box-shadow 150ms';
      $favicon.style.borderRadius = '5px';
      $favicon.style.backgroundColor = 'white';
      $engine.appendChild($favicon);

      const $title = document.createElement('span');
      $title.innerText = engine.name;
      $title.style.marginTop = '5px';
      $engine.appendChild($title);

      $searchEnginesWrapper.appendChild($engine);
    });

    $content.appendChild($searchEnginesWrapper);
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
