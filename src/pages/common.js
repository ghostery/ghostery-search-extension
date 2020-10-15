document.addEventListener('DOMContentLoaded', () => {
  const engines = [...document.querySelectorAll('.engine')];
  engines.forEach(engine => {
    engine.addEventListener('click', async () => {
      const name = engine.dataset.name;
      await browser.ghostery.setDefaultSearchEngine(name);
      const currentTab = await browser.tabs.getCurrent();
      await browser.storage.local.set({
        isOnboardingCompleted: true,
      });
      await browser.tabs.create({});
      browser.tabs.remove(currentTab.id);
    });
  });
});