const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
const { ExtensionUtils } = ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");
const { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
const { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

const { ExtensionError } = ExtensionUtils;

const getWindow = (windowId) => {
  const windowTracker = ExtensionParent.apiManager.global.windowTracker;
  if (typeof windowId === 'number') {
    return windowTracker.getWindow(windowId, null);
  }
  return windowTracker.getCurrentWindow();
};

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
        isDefaultBrowser() {
          const shell = Components.classes["@mozilla.org/browser/shell-service;1"]
            .getService(Components.interfaces.nsIShellService)
          return shell.isDefaultBrowser();
        }
      }
    }
  }
};
