chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ blockedSites: ["youtube.com", "twitter.com", "reddit.com"] });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.storage.sync.get("blockedSites", ({ blockedSites }) => {
      const isBlocked = blockedSites.some(site => changeInfo.url.includes(site));
      if (isBlocked) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["content.js"]
        });
      }
    });
  }
});