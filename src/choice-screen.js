async function onboarding() {
  const { isOnboardingCompleted } = await browser.storage.local.get("isOnboardingCompleted");
  if (!isOnboardingCompleted) {
    await browser.tabs.create({
      url: browser.extension.getURL('pages/choice-screen.html'),
    });
  }
}

onboarding();