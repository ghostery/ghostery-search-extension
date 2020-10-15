const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ExtensionError } = ExtensionUtils;

global.ghostery = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      ghostery: {
        async setDefaultSearchEngine(searchEngineName) {
          if (!Services.search.isInitialized) {
            await Services.search.init();
          }

          const searchEngine = Services.search.getEngineByName(searchEngineName);

          if (!searchEngine) {
            throw new ExtensionError(`No search engine with name "${searchEngineName}"`)
          }

          Services.search.defaultEngine = searchEngine;
        },
      }
    }
  }
};