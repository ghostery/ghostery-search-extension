// limit engines we can send to the specific set we're interested in from search choice screen
const searchEngineMap = {
  "Ghostery Glow": "ghostery",
  Bing: "bing",
  DuckDuckGo: "ddg",
  Ecosia: "ecosia",
  Ekoru: "ekoru",
  Gibiru: "gibiru",
  Google: "google",
  OneSearch: "onesearch",
  Qwant: "qwant",
  Startpage: "sp",
  Yahoo: "yahoo",
};

async function getMetrics() {
  return {
    ds: await getDefaultSearchEngine(),
    db: await getIsDefaultBrowser(),
  };
}

/**
 * Get the name of the current default search engine (if it is in the searchEngineMap list).
 * Returns "other" if the engine is not in the shortlist, and empty string if the search API is not
 * available.
 */
async function getDefaultSearchEngine() {
  if (browser.search) {
    const engines = await browser.search.get();
    const defaultSearchEngine = engines.find((s) => s.isDefault).name;
    return searchEngineMap[defaultSearchEngine] || "other";
  }
  return "";
}

/**
 * Get default browser state:
 *  0 = unknown - API to check is missing
 *  1 = not default browser
 *  2 = is default browser
 */
async function getIsDefaultBrowser() {
  if (browser.ghostery) {
    if (await browser.ghostery.isDefaultBrowser()) {
      return 2;
    }
    return 1;
  }
  return 0;
}
