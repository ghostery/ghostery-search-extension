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
    injectLoggedInStatus(!!AccessToken.TOKEN);
  }

  static get() {
    return AccessToken.TOKEN;
  }

  static parse() {
    if (!AccessToken.TOKEN) {
      return {};
    }
    const base64Url = AccessToken.TOKEN.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  static destroy() {
    console.warn("ACCESS_TOKEN removed")
    AccessToken.TOKEN = null;
    injectLoggedInStatus(false);
  }

  static refresh() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(GBE_ADDON_ID, 'refreshToken', (response) => {
        if (!response && chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (!response.success){
          reject(response.error);
        } else {
          resolve();
        }
       });
    });
  }
}

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

function redirectToLastQuery() {
  let lastQuery;

  browser.webRequest.onBeforeRedirect.addListener((details) => {
    if (details.redirectUrl.startsWith(`https://signon${AUTH_DOMAIN}/`)) {
      const originalUrl = new URL(details.url);
      lastQuery = originalUrl.searchParams.get('q');
    }
  }, {
    urls: [
      `${SERP_BASE_URL}/search*`,
      `${SERP_BASE_URL}/images/search*`,
      `${SERP_BASE_URL}/videos/search*`,
      USE_STAGING ? 'https://staging.ghosterysearch.com/' : 'https://ghosterysearch.com/search*',
      USE_STAGING ? 'https://staging.ghosterysearch.com/images/search*' : 'https://ghosterysearch.com/images/search*',
      USE_STAGING ? 'https://staging.ghosterysearch.com/videos/search*' : 'https://ghosterysearch.com/videos/search*',
    ],
  }, []);

  browser.webRequest.onBeforeSendHeaders.addListener(async (details) => {
    const url = new URL(details.url);
    const searchParams = url.searchParams;
    if (lastQuery) {;
      searchParams.set('q', lastQuery);
      lastQuery = null;
      url.pathname = 'search/';
      url.searchParams = searchParams;
      return {
        redirectUrl: url.toString(),
      };
    }
  }, {
    urls: [
      `${SERP_BASE_URL}/`,
      USE_STAGING ? 'https://staging.ghosterysearch.com/' : 'https://ghosterysearch.com/',
    ],
  }, ['blocking']);
}

async function start() {
  await setupEndpoints;
  lookForAccessToken();
  redirectToLastQuery();

  browser.webRequest.onBeforeSendHeaders.addListener((details) => {
    const { requestHeaders } = details;
    const token = tokenPool.getToken();
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
  }, {
    urls: [
      `${SERP_BASE_URL}/search*`,
      `${SERP_BASE_URL}/images/search*`,
      `${SERP_BASE_URL}/videos/search*`,
      USE_STAGING ? 'https://staging.ghosterysearch.com/search*' : 'https://ghosterysearch.com/search*',
      USE_STAGING ? 'https://staging.ghosterysearch.com/images/search*' : 'https://ghosterysearch.com/images/search*',
      USE_STAGING ? 'https://staging.ghosterysearch.com/videos/search*' : 'https://ghosterysearch.com/videos/search*',
    ],
  }, ["requestHeaders", "blocking", ...(IS_CHROME ? ["extraHeaders"] : [])]);

  ON_START.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

browser.runtime.onMessage.addListener(async ({ action, args }, { tab }) => {
  if (action === 'getTopSites') {
    if (tab.incognito) {
      return;
    }
    return (await browser.topSites.get({
      newtab: true,
      includeFavicon: true,
    })).filter(site => site.type === 'url');
  }

  if (action === 'getSearchEngines') {
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
