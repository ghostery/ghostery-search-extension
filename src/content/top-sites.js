"use strict";

(async function () {

  function cleanup() {
    const $topsites = document.querySelector('.top-sites');
    $topsites.innerHTML = '';
  }

  async function loadTopSites() {
    const $topsites = document.querySelector('.top-sites');
    const $tileTemplate = document.querySelector('#tile-template');
    const topSites = await browser.runtime.sendMessage({
      action: 'getTopSites'
    });

    topSites.slice(0, 5).forEach(site => {
      const $tile = $tileTemplate.content.cloneNode(true);
      $tile.querySelector('a').setAttribute('href', site.url);
      $tile.querySelector('img').setAttribute('src', site.favicon);
      $tile.querySelector('span').innerText = site.title;
      $topsites.appendChild($tile);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    cleanup();
    loadTopSites();
  } else {
    document.addEventListener('DOMContentLoaded', function onLoad() {
      document.removeEventListener('DOMContentLoaded', onLoad);
      cleanup();
      loadTopSites();
    });
  }
}());
