class AccessToken {
  static set(value) {
    if (!AccessToken.TOKEN) {
      console.warn("ACCESS_TOKEN created");
    } else {
      console.warn("ACCESS_TOKEN updated");
    }
    AccessToken.TOKEN = value;
    console.warn(parseJwt(value))
  }

  static get() {
    return ACCESS_TOKEN.TOKEN;
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