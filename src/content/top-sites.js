"use strict";

(async function () {
  function cleanup() {
    const $content = document.querySelector('.content');
    const $oldTopSites = $content.querySelector('.topsites');
    if ($oldTopSites) {
      $content.removeChild($oldTopSites);
    }
  }

  async function loadTopSites() {
    const $content = document.querySelector('.content');
    const topSites = await browser.runtime.sendMessage({
      action: 'getTopSites'
    });

    const $topSitesWrapper = document.createElement('div');
    $topSitesWrapper.classList.add('topsites');
    $topSitesWrapper.style.display = 'flex';
    $topSitesWrapper.style.flexDirection = 'row';
    $topSitesWrapper.style.margin = '40px 0 0 0';
    $topSitesWrapper.style.flexWrap = 'wrap';
    $topSitesWrapper.style.justifyContent = 'center';

    topSites.forEach(site => {
      const $site = document.createElement('a');
      $site.setAttribute('href', site.url);
      $site.style.display = 'flex';
      $site.style.flexDirection = 'column';
      $site.style.alignItems = 'center';
      $site.style.margin = '10px 7px';
      $site.style.textDecoration = 'none';
      $site.style.color = 'black';

      const $favicon = document.createElement('img');
      $favicon.setAttribute('src', site.favicon);
      $favicon.style.height = '48px';
      $favicon.style.width = '48px';
      $favicon.style.boxShadow = 'inset 0 0 0 1px rgba(249, 249, 250, 0.2), 0 1px 8px 0 rgba(12, 12, 13, 0.2)';
      $favicon.style.transition = 'box-shadow 150ms';
      $favicon.style.borderRadius = '5px';
      $favicon.style.backgroundColor = 'white';
      $site.appendChild($favicon);

      const $title = document.createElement('span');
      $title.innerText = site.title;
      $title.style.marginTop = '5px';
      $site.appendChild($title);

      $topSitesWrapper.appendChild($site);
    });

    $content.appendChild($topSitesWrapper);
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
