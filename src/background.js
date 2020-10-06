(async function start() {
  const cookies = await browser.cookies.get({
    url: "https://www.ghostery.com/",
    name: "access_token",
  });
}());