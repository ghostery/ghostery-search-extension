let DEBUG = true;
const STAGING_BASE_URL = 'https://staging.ghosterysearch.com';
const PROD_BASE_URL = 'https://ghosterysearch.com';
const STAGING_AUTH_DOMAIN = '.ghosterystage.com';
const PROD_AUTH_DOMAIN = '.ghostery.com';
let API_BASE_URL = DEBUG ? 'http://localhost:5000' : PROD_BASE_URL;
let SERP_BASE_URL = DEBUG ? 'http://localhost' : PROD_BASE_URL;
let AUTH_DOMAIN = PROD_AUTH_DOMAIN;
let AUTH_BASE_URL = `https://consumerapi${PROD_AUTH_DOMAIN}/api/v2`;

const setupEndpoints = (async function() {
  const USE_STAGING = (await browser.storage.local.get('USE_STAGING'))['USE_STAGING'];
  if (USE_STAGING) {
    AUTH_DOMAIN = STAGING_AUTH_DOMAIN;
    AUTH_BASE_URL = AUTH_BASE_URL.replace(PROD_AUTH_DOMAIN, STAGING_AUTH_DOMAIN);
    console.log(`USING_STAGING: AUTH_BASE_URL=${AUTH_BASE_URL}`)
    // only switch to staging search if DEBUG is disabled
    if (!DEBUG) {
      API_BASE_URL = STAGING_BASE_URL;
      SERP_BASE_URL = STAGING_BASE_URL;
      console.log(`USING_STAGING: Redirecting ghosterysearch.com to staging.ghosterysearch.com`)
      browser.webRequest.onBeforeRequest.addListener(async (details) => {
        return {
          redirectUrl: details.url.replace(PROD_BASE_URL, STAGING_BASE_URL),
        }
      }, { urls: [`${PROD_BASE_URL}/*`]}, ["blocking"]);
    }
  }
})();

window.setStagingEnabled = async (shouldUseStaging) => {
  await browser.storage.local.set({ USE_STAGING: shouldUseStaging });
  document.location.reload();
}
