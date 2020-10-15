async function onboarding() {
  const onboardingTabs = await browser.tabs.query({
    url: browser.extension.getURL('pages/choice-screen.html'),
  });
  const onboardingTabIds = onboardingTabs.map(t => t.id);
  await browser.tabs.remove(onboardingTabIds);
  await browser.tabs.create({
    url: browser.extension.getURL('pages/choice-screen.html'),
  });
}

onboarding();