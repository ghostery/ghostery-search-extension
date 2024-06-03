if (!globalThis.browser) {
  globalThis.browser = globalThis.chrome;
}

(browser.browserAction || browser.action).onClicked.addListener(() => {
  browser.tabs.create({
    url: "https://ghosterysearch.com",
  });
});
