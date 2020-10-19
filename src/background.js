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
  const { cookie, removed } = changeInfo;

  if (cookie.domain !== ".ghostery.com") {
    return;
  }

  if (cookie.name !== "access_token") {
    return;
  }

  if (removed) {
    AccessToken.destroy();
    return;
  }

  AccessToken.set(cookie.value);
}

const lookForAccessToken = async () => {
  browser.cookies.onChanged.addListener(cookieListener);
  const cookie = await browser.cookies.get({
    url: "https://www.ghostery.com/",
    name: "access_token",
  });
  if (cookie) {
    AccessToken.set(cookie.value);
  };
}

async function start() {
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

  browser.webRequest.onBeforeSendHeaders.addListener(async (details) => {
    const { requestHeaders } = details;
    const accessToken = AccessToken.get();
    if (!accessToken) {
      return;
    }
    requestHeaders.push({
      name: "Authorization",
      value: `Bearer ${accessToken}`,
    });
    return {
      requestHeaders,
    };
  }, { urls: [`${SERP_BASE_URL}/login*`]}, ["blocking", "requestHeaders"]);
}

start();