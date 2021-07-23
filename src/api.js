/**
 * API for external communication from Ghostery browser extension
 */

const ALLOWED_ADDON_IDS = new Set([GBE_ADDON_ID]);

browser.runtime.onMessageExternal.addListener(async (message, sender) => {
  if (!ALLOWED_ADDON_IDS.has(sender.id)) {
    return false;
  }
  if (message === "getMetrics") {
    return getMetrics();
  }
  if (message.type === "setDefaultSearch") {
    return browser.ghostery.setDefaultSearchEngine(message.search);
  }
});
