const tokenPool = new TokenPool();

class AccessToken {
  static set(value) {
    if (!AccessToken.TOKEN) {
      console.warn("ACCESS_TOKEN created");
    } else {
      console.warn("ACCESS_TOKEN updated");
    }
    AccessToken.TOKEN = value;
    tokenPool.generateTokens();
  }

  static get() {
    return AccessToken.TOKEN;
  }

  static destroy() {
    console.warn("ACCESS_TOKEN removed")
    AccessToken.TOKEN = null;
  }

  static async refresh() {
    await fetch(`${AUTH_BASE_URL}/refresh_token`, {
      method: 'POST',
      credentials: 'include',
    });
  }
}

function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

const cookieListener = (changeInfo) => {
  const { cookie, removed, cause } = changeInfo;
  if (cookie.domain !== AUTH_DOMAIN) {
    return;
  }

  if (cookie.name !== "access_token") {
    return;
  }

  if (removed) {
    AccessToken.destroy();

    if (cause !== "overwrite") {
      // try to refresh the token incase remove was caused by
      // token expiring
      AccessToken.refresh();
    }

    return;
  }

  AccessToken.set(cookie.value);
}

const lookForAccessToken = async () => {
  browser.cookies.onChanged.addListener(cookieListener);
  const cookie = await browser.cookies.get({
    url: `https://www${AUTH_DOMAIN}/`,
    name: "access_token",
  });
  if (cookie) {
    AccessToken.set(cookie.value);
  } else {
    // if token is not found on startup try to refresh
    // as it can just be expired
    AccessToken.refresh();
  };
}

async function start() {
  await setupEndpoints;
  lookForAccessToken();

  browser.webRequest.onBeforeSendHeaders.addListener(async (details) => {
    const { requestHeaders } = details;
    const token = await tokenPool.getToken();
    if (!token) {
      return;
    }
    requestHeaders.push({
      name: "SERP-token",
      value: token.token,
    });
    requestHeaders.push({
      name: "SERP-sig",
      value: token.sig,
    });
    return {
      requestHeaders,
    };
  }, { urls: [`${SERP_BASE_URL}/search*`]}, ["blocking", "requestHeaders"]);
}

browser.runtime.onMessage.addListener(async ({ action, args }, { tab }) => {
  if (action === 'getTokenCount') {
    return Promise.resolve(tokenPool.tokens.length);
  }

  if (action === 'getTopSites') {
    if (browser.ghostery.getPref('app.update.channel') === 'release') {
      return;
    }
    return (await browser.topSites.get({
      newtab: true,
      includeFavicon: true,
    })).filter(site => site.type === 'url');
  }

  if (action === 'getSearchEngines') {
    if (browser.ghostery.getPref('app.update.channel') === 'release') {
      return;
    }
    return (await browser.search.get()).filter(
      engine => engine.name !== browser.runtime.getManifest()["chrome_settings_overrides"]["search_provider"].name
    );
  }

  if (action === 'search') {
    const { query, engine } = args[0];
    return browser.search.search({
      query,
      engine,
      tabId: tab.id,
    });
  }

  return false;
});

start();
