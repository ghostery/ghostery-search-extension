ON_START.push(() => {
  browser.webRequest.onBeforeSendHeaders.addListener(async (details) => {
    const { requestHeaders } = details;
    requestHeaders.push({
      name: "SERP-browser",
      value: "Ghostery Dawn",
    });
    return {
      requestHeaders,
    };
  }, { urls: [`${SERP_BASE_URL}/*`, USE_STAGING ? 'https://staging.ghosterysearch.com/search*' : 'https://ghosterysearch.com/search*']}, ["blocking", "requestHeaders"]);
});
