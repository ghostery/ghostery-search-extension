document.addEventListener('DOMContentLoaded', () => {
  const engines = [...document.querySelectorAll('.engine')];
  engines.forEach(engine => {
    engine.addEventListener('click', async () => {
      const name = engine.dataset.name;
      try {
        await browser.ghostery.setDefaultSearchEngine(name);
      } catch(e) {
        console.error(e);
      }
    });
  });
});