let ACCESS_TOKEN = null;

const cookieListener = (changeInfo) => {
  const { cookie, removed } = changeInfo;
  console.warn(cookie);
  if (cookie.domain !== ".ghostery.com") {
    return;
  }

  if (cookie.name !== "access_token") {
    return;
  }

  if (removed) {
    console.warn("ACCESS_TOKEN removed")
    ACCESS_TOKEN = null;
  }

  console.warn("ACCESS_TOKEN updated");
  ACCESS_TOKEN = cookie.value;
}

const lookForAccessToken = async () => {
  browser.cookies.onChanged.addListener(cookieListener);
  const cookie = await browser.cookies.get({
    url: "https://www.ghostery.com/",
    name: "access_token",
  });
  if (cookie) {
    console.warn("ACCESS_TOKEN found");
    ACCESS_TOKEN = cookie.value;
  };
}

async function start() {
  lookForAccessToken();
}

start();