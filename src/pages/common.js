document.addEventListener('DOMContentLoaded', () => {
  const engines = [...document.querySelectorAll('.engine')];
  engines.forEach(engine => {
    engine.addEventListener('click', async () => {
      const name = engine.dataset.modal;
      const modal = document.querySelector(`#${name}-modal`);
      modal.classList.remove('hidden');
    });
  });

  const cancelButtons = [...document.querySelectorAll('.modal .cancel-button')];
  cancelButtons.forEach(button => {
    button.addEventListener('click', closeModals);
  });
  const confirmButtons = [...document.querySelectorAll('.modal .confirm-button')];
  confirmButtons.forEach(button => {
    const name = button.dataset.name;
    button.addEventListener('click', selectSearchEngine.bind(null, name));
  });
});

async function selectSearchEngine(name) {
  await browser.ghostery.setDefaultSearchEngine(name);
  const currentTab = await browser.tabs.getCurrent();
  await browser.storage.local.set({
    isOnboardingCompleted: true,
  });
  await browser.tabs.create({});
  browser.tabs.remove(currentTab.id);
}

function closeModals() {
  const modals = [...document.querySelectorAll('.modal')];
  modals.forEach(modal => {
    modal.classList.add('hidden');
  });
}