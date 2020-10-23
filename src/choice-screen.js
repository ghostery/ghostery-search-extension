async function onboarding() {
  const { isOnboardingCompleted } = await browser.storage.local.get("isOnboardingCompleted");
  if (DEBUG || !isOnboardingCompleted) {
    await browser.tabs.create({
      url: browser.extension.getURL('pages/choice-screen.html'),
    });
  }
}

onboarding();