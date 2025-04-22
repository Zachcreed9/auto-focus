// Background script for AutoFocus extension
// Handles extension initialization and setting focus on page load

// Initial installation setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ 
    enabled: true,
    blockedSites: ["youtube.com", "twitter.com", "reddit.com", "facebook.com", "instagram.com"],
    whitelist: ["google.com", "gmail.com", "docs.google.com", "drive.google.com"],
    scheduleSettings: {
      enabled: false,
      days: [1, 2, 3, 4, 5], // Monday to Friday
      timeRanges: [
        { name: 'Matin', start: '09:00', end: '12:00' },
        { name: 'Après-midi', start: '14:00', end: '18:00' }
      ]
    },
    categorySettings: {
      social: true,
      video: true,
      games: false,
      shopping: false
    },
    settings: {
      blockingMode: 'standard',
      notifyBlocked: true,
      notifySession: false,
      notifyStats: false,
      autoFocusEnabled: true,
      highlightFocus: true,
      autoSubmit: false
    },
    focusSettings: {
      preferInputs: true,
      focusDelay: 500,
      highlightFocused: true,
      autoSubmit: false
    },
    stats: {
      blockedCount: 0,
      totalFocusTime: 0,
      focusSessions: [],
      lastReset: new Date().toISOString()
    }
  });

  // Create context menu items
  chrome.contextMenus.create({
    id: "blockSite",
    title: "Bloquer ce site",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "whitelistSite",
    title: "Ajouter à la liste blanche",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "separator",
    type: "separator",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "startPomodoro",
    title: "Démarrer une session Pomodoro",
    contexts: ["page"]
  });
});

// Context menu handling
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "blockSite") {
    handleAddToBlockList(tab.url);
  } else if (info.menuItemId === "whitelistSite") {
    handleAddToWhitelist(tab.url);
  } else if (info.menuItemId === "startPomodoro") {
    startPomodoroSession(tab.id);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "toggle-focus") {
    toggleExtension();
  } else if (command === "start-pomodoro") {
    startPomodoroSession(tab.id);
  } else if (command === "block-current-site") {
    handleAddToBlockList(tab.url);
  } else if (command === "whitelist-current-site") {
    handleAddToWhitelist(tab.url);
  }
});

// Handle tab updates to execute content script for auto-focus and blocked sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkIfShouldBlock(tabId, tab.url);
  }
});

// Check if site should be blocked based on current settings
function checkIfShouldBlock(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return; // Skip Chrome internal pages
  }

  chrome.storage.sync.get([
    "enabled", 
    "blockedSites", 
    "whitelist", 
    "scheduleSettings", 
    "settings"
  ], (data) => {
    if (!data.enabled) {
      return; // Extension is disabled
    }

    // Extract domain from URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      return; // Invalid URL
    }
    const domain = urlObj.hostname;
    
    // Check whitelist first
    if (data.whitelist && isInList(domain, data.whitelist)) {
      // Site is whitelisted, apply auto-focus if enabled
      if (data.settings && data.settings.autoFocusEnabled) {
        applyAutoFocus(tabId);
      }
      return;
    }
    
    // Check if we should block based on schedule
    const shouldBlockNow = shouldBlockBasedOnSchedule(data.scheduleSettings, data.settings);
    
    // Check if site is in blocked list
    const isBlocked = data.blockedSites && isInList(domain, data.blockedSites);
    
    if (isBlocked && (data.settings.blockingMode !== 'scheduled' || shouldBlockNow)) {
      // Block the site
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"]
      });
      
      // Update stats
      updateBlockedStats(domain);
      
      // Show notification if enabled
      if (data.settings.notifyBlocked) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icon128.png',
          title: 'Auto-Focus',
          message: `Le site ${domain} a été bloqué pour vous aider à rester concentré.`
        });
      }
    } else if (data.settings.autoFocusEnabled) {
      // Not blocked, apply auto-focus if enabled
      applyAutoFocus(tabId);
    }
  });
}

// Apply auto-focus functionality to a tab
function applyAutoFocus(tabId) {
  chrome.storage.sync.get("focusSettings", (data) => {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: autoFocusContent,
      args: [data.focusSettings]
    });
  });
}

// This function will be injected into the page to find and focus on the appropriate element
function autoFocusContent(settings) {
  // Use default settings if none provided
  const focusSettings = settings || {
    preferInputs: true,
    focusDelay: 500,
    highlightFocused: true,
    autoSubmit: false
  };
  
  // Helper function to find the most relevant input to focus on
  function findBestElement() {
    // Priority ordered selectors for elements we might want to focus
    const selectors = [
      'input[type="text"]:not([readonly]):not([disabled])',
      'input[type="search"]:not([readonly]):not([disabled])',
      'input[type="email"]:not([readonly]):not([disabled])',
      'textarea:not([readonly]):not([disabled])',
      'input:not([readonly]):not([disabled])',
      '[contenteditable="true"]'
    ];
    
    // Try each selector in order
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      
      // Filter out hidden elements
      const visibleElements = elements.filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               el.offsetWidth > 0 &&
               el.offsetHeight > 0;
      });
      
      if (visibleElements.length > 0) {
        // Prefer elements in the viewport
        const inViewport = visibleElements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 &&
                 rect.left >= 0 &&
                 rect.bottom <= window.innerHeight &&
                 rect.right <= window.innerWidth;
        });
        
        if (inViewport.length > 0) {
          return inViewport[0]; // Return the first visible element in viewport
        }
        
        return visibleElements[0]; // Fall back to first visible element
      }
    }
    
    return null; // Nothing suitable found
  }
  
  // Wait a moment for page to stabilize, then focus
  setTimeout(() => {
    const elementToFocus = findBestElement();
    if (elementToFocus) {
      elementToFocus.focus();
      
      // Add a subtle highlight effect if enabled
      if (focusSettings.highlightFocused) {
        const originalBackground = elementToFocus.style.background;
        elementToFocus.style.background = "rgba(135, 206, 250, 0.2)";
        elementToFocus.style.transition = "background 0.5s";
        
        // Restore original background after a moment
        setTimeout(() => {
          elementToFocus.style.background = originalBackground;
        }, 1000);
      }
      
      // Set up auto-submit if enabled
      if (focusSettings.autoSubmit) {
        // Check if this is a form with a single text input
        const form = elementToFocus.form;
        if (form) {
          const inputs = form.querySelectorAll('input[type="text"], input[type="search"], input[type="email"]');
          if (inputs.length === 1) {
            elementToFocus.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                form.submit();
              }
            });
          }
        }
      }
    }
  }, focusSettings.focusDelay || 500);
}

// Check if a domain matches any item in a list
function isInList(domain, list) {
  return list.some(item => domain.includes(item));
}

// Check if we should block based on schedule settings and current time
function shouldBlockBasedOnSchedule(scheduleSettings, settings) {
  // If not scheduled mode or scheduleSettings doesn't exist, follow normal rules
  if (!settings || settings.blockingMode !== 'scheduled' || !scheduleSettings || !scheduleSettings.enabled) {
    return true;
  }
  
  // Get current day and time
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
  
  // Check if current day is in schedule
  if (!scheduleSettings.days.includes(currentDay)) {
    return false; // Not scheduled for today
  }
  
  // Check if current time is within a scheduled time range
  return scheduleSettings.timeRanges.some(range => {
    const [startHours, startMinutes] = range.start.split(':').map(Number);
    const [endHours, endMinutes] = range.end.split(':').map(Number);
    
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;
    
    return currentTime >= startTime && currentTime <= endTime;
  });
}

// Update stats when a site is blocked
function updateBlockedStats(domain) {
  chrome.storage.sync.get('stats', (data) => {
    const stats = data.stats || {
      blockedCount: 0,
      totalFocusTime: 0,
      focusSessions: [],
      lastReset: new Date().toISOString(),
      blockedSites: {}
    };
    
    // Increment blocked count
    stats.blockedCount++;
    
    // Track blocked site
    stats.blockedSites = stats.blockedSites || {};
    stats.blockedSites[domain] = (stats.blockedSites[domain] || 0) + 1;
    
    // Save updated stats
    chrome.storage.sync.set({ stats });
  });
}

// Start a Pomodoro session
function startPomodoroSession(tabId) {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon128.png',
    title: 'Session Pomodoro démarrée',
    message: 'Votre session de concentration de 25 minutes commence maintenant.'
  });
  
  // Record session start time
  const sessionStart = Date.now();
  
  // Set alarm for 25 minutes
  chrome.alarms.create('pomodoroEnd', { delayInMinutes: 25 });
  
  // Update badge
  chrome.action.setBadgeText({ text: '25:00' });
  chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
  
  // Start timer update (every minute)
  let remainingMinutes = 25;
  const timerId = setInterval(() => {
    remainingMinutes--;
    if (remainingMinutes <= 0) {
      clearInterval(timerId);
    } else {
      chrome.action.setBadgeText({ text: `${remainingMinutes}:00` });
    }
  }, 60000);
}

// Handle alarm for Pomodoro end
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroEnd') {
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon128.png',
      title: 'Session Pomodoro terminée',
      message: 'Votre session de 25 minutes est terminée. Prenez une pause de 5 minutes.'
    });
    
    // Update badge
    chrome.action.setBadgeText({ text: '' });
    
    // Update stats
    chrome.storage.sync.get('stats', (data) => {
      const stats = data.stats || {
        blockedCount: 0,
        totalFocusTime: 0,
        focusSessions: [],
        lastReset: new Date().toISOString()
      };
      
      // Add 25 minutes to total focus time
      stats.totalFocusTime += 25;
      
      // Record session
      stats.focusSessions.push({
        date: new Date().toISOString(),
        duration: 25,
        type: 'pomodoro'
      });
      
      // Limit sessions history to 100 entries
      if (stats.focusSessions.length > 100) {
        stats.focusSessions = stats.focusSessions.slice(-100);
      }
      
      // Save updated stats
      chrome.storage.sync.set({ stats });
    });
  }
});

// Add a site to the block list
function handleAddToBlockList(url) {
  if (!url) return;
  
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    return; // Invalid URL
  }
  
  chrome.storage.sync.get('blockedSites', ({ blockedSites = [] }) => {
    // Check if site already exists
    if (blockedSites.includes(domain)) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Auto-Focus',
        message: `${domain} est déjà dans la liste de blocage.`
      });
      return;
    }
    
    // Add to list and save
    const updatedSites = [...blockedSites, domain];
    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Auto-Focus',
        message: `${domain} a été ajouté à la liste de blocage.`
      });
      
      // Refresh the current tab if the site was just added
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes(domain)) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  });
}

// Add a site to the whitelist
function handleAddToWhitelist(url) {
  if (!url) return;
  
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    return; // Invalid URL
  }
  
  chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
    // Check if site already exists
    if (whitelist.includes(domain)) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Auto-Focus',
        message: `${domain} est déjà dans la liste blanche.`
      });
      return;
    }
    
    // Add to list and save
    const updatedSites = [...whitelist, domain];
    chrome.storage.sync.set({ whitelist: updatedSites }, () => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Auto-Focus',
        message: `${domain} a été ajouté à la liste blanche.`
      });
    });
  });
}

// Toggle extension enabled/disabled
function toggleExtension() {
  chrome.storage.sync.get('enabled', (data) => {
    const newState = !data.enabled;
    chrome.storage.sync.set({ enabled: newState }, () => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon128.png',
        title: 'Auto-Focus',
        message: newState ? 'Extension activée' : 'Extension désactivée'
      });
    });
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStatus') {
    chrome.storage.sync.get([
      'enabled', 
      'blockedSites', 
      'whitelist',
      'scheduleSettings',
      'categorySettings',
      'settings',
      'focusSettings',
      'stats'
    ], (data) => {
      sendResponse(data);
    });
    return true; // Required for async response
  }
  
  if (message.action === 'toggleEnabled') {
    chrome.storage.sync.get('enabled', (data) => {
      const newState = message.enabled !== undefined ? message.enabled : !data.enabled;
      chrome.storage.sync.set({ enabled: newState }, () => {
        sendResponse({ enabled: newState });
      });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'updateBlockedSites') {
    chrome.storage.sync.set({ blockedSites: message.blockedSites }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'updateWhitelist') {
    chrome.storage.sync.set({ whitelist: message.whitelist }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'updateSchedule') {
    chrome.storage.sync.set({ scheduleSettings: message.scheduleSettings }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'updateFocusSettings') {
    chrome.storage.sync.set({ focusSettings: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'startPomodoro') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        startPomodoroSession(tabs[0].id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    });
    return true; // Required for async response
  }
  
  if (message.action === 'resetStats') {
    chrome.storage.sync.set({
      stats: {
        blockedCount: 0,
        totalFocusTime: 0,
        focusSessions: [],
        lastReset: new Date().toISOString(),
        blockedSites: {}
      }
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Required for async response
  }
});