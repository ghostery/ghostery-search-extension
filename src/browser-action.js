browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: "https://glowstery.com",
  });
});
