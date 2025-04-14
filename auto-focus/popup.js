document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('blocked-list');
  const input = document.getElementById('new-site');
  const button = document.getElementById('add-button');

  function refreshList() {
    chrome.storage.sync.get('blockedSites', ({ blockedSites }) => {
      list.innerHTML = '';
      blockedSites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;
        list.appendChild(li);
      });
    });
  }

  button.addEventListener('click', () => {
    const newSite = input.value.trim();
    if (newSite) {
      chrome.storage.sync.get('blockedSites', ({ blockedSites }) => {
        blockedSites.push(newSite);
        chrome.storage.sync.set({ blockedSites }, refreshList);
        input.value = '';
      });
    }
  });

  refreshList();
});