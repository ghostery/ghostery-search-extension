let loggedIn = false;
let statusContentScript = Promise.resolve();

const loggedInScript = `
document.querySelector('html').classList.remove('logged-out');
document.querySelector('html').classList.add('logged-in');
`;
const loggedOutScript = `
document.querySelector('html').classList.remove('logged-in');
document.querySelector('html').classList.add('logged-out');
`;

function injectLoggedInStatus(status) {
  statusContentScript = statusContentScript.then(async () => {
    console.log("set logged in", status);
    if (status === loggedIn) {
      return;
    }
    loggedIn = status;
    // register a content script to inject status classes in the future
    await browser.contentScripts.register({
      allFrames: false,
      js: [
        {
          code: status ? loggedInScript : loggedOutScript,
        },
      ],
      matches: [`${SERP_BASE_URL}/*`],
      runAt: "document_start",
    });
    // trigger the log in state change in existing browser tabs
    const activeTabs = await browser.tabs.query({ url: `${SERP_BASE_URL}/*` });
    activeTabs.forEach(({ id }) => {
      browser.tabs.executeScript(id, {
        code: status ? loggedInScript : loggedOutScript,
      });
    });
  });
}

injectLoggedInStatus(false);
