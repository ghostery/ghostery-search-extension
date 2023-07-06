browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: "https://ghosterysearch.com",
  });
});
