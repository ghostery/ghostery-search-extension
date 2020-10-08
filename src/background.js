// let API_BASE_URL = 'http://localhost:5000';
let API_BASE_URL = 'https://ghosterysearch.com';

class TokenPool {
  constructor() {
    this.pool = [];
  }

  async fetchTokens() {
    const response = await fetch(`${API_BASE_URL}/tokens/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AccessToken.get()}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      let json = await response.json();
      this.pool.push(...json.tokens);
    } else {
      console.error("Wrong access token");
    }
  }
}

const tokenPool = new TokenPool();

class AccessToken {
  static set(value) {
    if (!AccessToken.TOKEN) {
      console.warn("ACCESS_TOKEN created");
    } else {
      console.warn("ACCESS_TOKEN updated");
    }
    AccessToken.TOKEN = value;
    tokenPool.fetchTokens();
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
}

start();