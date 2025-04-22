// Popup script for Auto-Focus extension
// Handles user interface interactions and settings management

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements - Main Controls
  const statusToggle = document.getElementById('status-toggle');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Blocked Sites Tab
  const blockedList = document.getElementById('blocked-list');
  const newSiteInput = document.getElementById('new-site');
  const addButton = document.getElementById('add-button');
  
  // Category Checkboxes
  const categorySocial = document.getElementById('category-social');
  const categoryVideo = document.getElementById('category-video');
  const categoryGames = document.getElementById('category-games');
  const categoryShopping = document.getElementById('category-shopping');
  
  // Whitelist Tab
  const whitelist = document.getElementById('whitelist');
  const newWhitelistSiteInput = document.getElementById('new-whitelist-site');
  const addWhitelistButton = document.getElementById('add-whitelist-button');
  
  // Schedule Tab
  const dayCheckboxes = document.querySelectorAll('.day-checkbox');
  const morningStartInput = document.getElementById('morning-start');
  const morningEndInput = document.getElementById('morning-end');
  const afternoonStartInput = document.getElementById('afternoon-start');
  const afternoonEndInput = document.getElementById('afternoon-end');
  const addTimeRangeButton = document.getElementById('add-time-range');
  const saveScheduleButton = document.getElementById('save-schedule');
  
  // Settings Tab
  const blockingModeSelect = document.getElementById('blocking-mode');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const notifyBlockedCheckbox = document.getElementById('notify-blocked');
  const notifySessionCheckbox = document.getElementById('notify-session');
  const notifyStatsCheckbox = document.getElementById('notify-stats');
  const autoFocusEnabledCheckbox = document.getElementById('auto-focus-enabled');
  const highlightFocusCheckbox = document.getElementById('highlight-focus');
  const autoSubmitCheckbox = document.getElementById('auto-submit');
  const exportSettingsButton = document.getElementById('export-settings');
  const importSettingsButton = document.getElementById('import-settings');
  const importFileInput = document.getElementById('import-file');
  const saveSettingsButton = document.getElementById('save-settings');
  
  // Stats Tab
  const shareStatsButton = document.getElementById('share-stats');
  
  // Footer Controls
  const showHotkeysButton = document.getElementById('show-hotkeys');
  const showHelpButton = document.getElementById('show-help');
  
  // Modals
  const hotkeysModal = document.getElementById('hotkeys-modal');
  const closeModalButtons = document.querySelectorAll('.close-modal');
  
  // State Tracking
  let currentTheme = 'blue';
  let extensionEnabled = true;
  let focusSettings = {
    preferInputs: true,
    focusDelay: 500,
    highlightFocused: true,
    autoSubmit: false
  };
  let scheduleSettings = {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Monday to Friday
    timeRanges: [
      { name: 'Matin', start: '09:00', end: '12:00' },
      { name: 'Après-midi', start: '14:00', end: '18:00' }
    ]
  };
  let categorySettings = {
    social: true,
    video: true,
    games: false,
    shopping: false
  };
  
  // Default category sites
  const categorySites = {
    social: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'tiktok.com'],
    video: ['youtube.com', 'netflix.com', 'twitch.tv', 'vimeo.com', 'dailymotion.com'],
    games: ['chess.com', 'miniclip.com', 'poki.com', 'kongregate.com', 'addictinggames.com'],
    shopping: ['amazon.com', 'ebay.com', 'aliexpress.com', 'etsy.com', 'rakuten.com']
  };
  
  // Initialize UI
  initializeExtension();
  initializeCharts();
  
  // Tab Switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show selected tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
          
          // Apply special animation for stats tab
          if (tabName === 'stats') {
            animateStatNumbers();
          }
        }
      });
    });
  });
  
  // Enable/Disable Extension Toggle
  statusToggle.addEventListener('change', () => {
    extensionEnabled = statusToggle.checked;
    
    // Save to chrome storage
    chrome.storage.sync.set({ enabled: extensionEnabled }, () => {
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'toggleEnabled', 
        enabled: extensionEnabled 
      });
      
      // Visual feedback
      showNotification(
        extensionEnabled ? 
        'Auto-Focus activé ✅' : 
        'Auto-Focus désactivé ⏸️'
      );
    });
  });
  
  // Blocked Sites Tab
  
  // Add Site Button
  addButton.addEventListener('click', () => {
    addBlockedSite();
  });
  
  // Enter key in input
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBlockedSite();
    }
  });
  
  // Category Checkboxes
  categorySocial.addEventListener('change', () => {
    categorySettings.social = categorySocial.checked;
    updateCategorySites();
  });
  
  categoryVideo.addEventListener('change', () => {
    categorySettings.video = categoryVideo.checked;
    updateCategorySites();
  });
  
  categoryGames.addEventListener('change', () => {
    categorySettings.games = categoryGames.checked;
    updateCategorySites();
  });
  
  categoryShopping.addEventListener('change', () => {
    categorySettings.shopping = categoryShopping.checked;
    updateCategorySites();
  });
  
  // Whitelist Tab
  
  // Add Whitelist Site Button
  addWhitelistButton.addEventListener('click', () => {
    addWhitelistSite();
  });
  
  // Enter key in whitelist input
  newWhitelistSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addWhitelistSite();
    }
  });
  
  // Schedule Tab
  
  // Add Time Range Button
  addTimeRangeButton.addEventListener('click', () => {
    const timeRangesContainer = document.querySelector('.time-ranges');
    const newIndex = scheduleSettings.timeRanges.length;
    
    const timeRange = document.createElement('div');
    timeRange.className = 'time-range';
    timeRange.innerHTML = `
      <div class="time-label">Plage ${newIndex + 1} :</div>
      <div class="time-inputs">
        <input type="time" id="time-range-${newIndex}-start" value="09:00" />
        <span>à</span>
        <input type="time" id="time-range-${newIndex}-end" value="17:00" />
        <button class="delete-btn remove-time-range" data-index="${newIndex}">&times;</button>
      </div>
    `;
    
    timeRangesContainer.appendChild(timeRange);
    
    // Add event listener to the remove button
    const removeButton = timeRange.querySelector('.remove-time-range');
    removeButton.addEventListener('click', () => {
      timeRange.remove();
    });
  });
  
  // Save Schedule Button
  saveScheduleButton.addEventListener('click', () => {
    saveSchedule();
  });
  
  // Settings Tab
  
  // Theme Switcher
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentTheme = button.getAttribute('data-theme');
      
      // Update active theme button
      themeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Apply theme
      applyTheme(currentTheme);
      
      // Save theme preference
      localStorage.setItem('autoFocusTheme', currentTheme);
    });
  });
  
  // Export Settings Button
  exportSettingsButton.addEventListener('click', () => {
    exportSettings();
  });
  
  // Import Settings Button
  importSettingsButton.addEventListener('click', () => {
    importFileInput.click();
  });
  
  // Import File Change
  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    if (file) {
      importSettings(file);
    }
  });
  
  // Save Settings Button
  saveSettingsButton.addEventListener('click', () => {
    saveSettings();
  });
  
  // Stats Tab
  
  // Share Stats Button
  shareStatsButton.addEventListener('click', () => {
    shareStats();
  });
  
  // Footer Controls
  
  // Show Hotkeys Button
  showHotkeysButton.addEventListener('click', (e) => {
    e.preventDefault();
    hotkeysModal.classList.add('show');
  });
  
  // Show Help Button
  showHelpButton.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/user/auto-focus/wiki' });
  });
  
  // Close Modal Buttons
  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      modal.classList.remove('show');
    });
  });
  
  // Click outside modal to close
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('show');
    }
  });
  
  // Initialize Extension
  function initializeExtension() {
    // Load extension status and settings
    chrome.storage.sync.get([
      'enabled', 
      'blockedSites', 
      'whitelist', 
      'scheduleSettings', 
      'categorySettings',
      'settings', 
      'focusSettings'
    ], (data) => {
      // Set extension enabled status
      extensionEnabled = data.enabled !== undefined ? data.enabled : true;
      statusToggle.checked = extensionEnabled;
      
      // Load blocked sites
      if (data.blockedSites) {
        refreshBlockedSitesList(data.blockedSites);
      }
      
      // Load whitelist
      if (data.whitelist) {
        refreshWhitelistSitesList(data.whitelist);
      }
      
      // Load schedule settings
      if (data.scheduleSettings) {
        scheduleSettings = data.scheduleSettings;
        
        // Update UI with loaded schedule
        updateScheduleUI();
      }
      
      // Load category settings
      if (data.categorySettings) {
        categorySettings = data.categorySettings;
        
        // Update category checkboxes
        categorySocial.checked = categorySettings.social;
        categoryVideo.checked = categorySettings.video;
        categoryGames.checked = categorySettings.games;
        categoryShopping.checked = categorySettings.shopping;
      }
      
      // Load settings
      if (data.settings) {
        blockingModeSelect.value = data.settings.blockingMode || 'standard';
        notifyBlockedCheckbox.checked = data.settings.notifyBlocked !== undefined ? data.settings.notifyBlocked : true;
        notifySessionCheckbox.checked = data.settings.notifySession || false;
        notifyStatsCheckbox.checked = data.settings.notifyStats || false;
        autoFocusEnabledCheckbox.checked = data.settings.autoFocusEnabled !== undefined ? data.settings.autoFocusEnabled : true;
        highlightFocusCheckbox.checked = data.settings.highlightFocus !== undefined ? data.settings.highlightFocus : true;
        autoSubmitCheckbox.checked = data.settings.autoSubmit || false;
      }
      
      // Load focus settings
      if (data.focusSettings) {
        focusSettings = data.focusSettings;
      }
    });
    
    // Load theme
    currentTheme = localStorage.getItem('autoFocusTheme') || 'blue';
    applyTheme(currentTheme);
    
    // Set active theme button
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme') === currentTheme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Initialize Stats
    populateSiteStats();
  }
  
  // Blocked Sites Tab Functions
  
  // Refresh the blocked sites list
  function refreshBlockedSitesList(sites = []) {
    blockedList.innerHTML = '';
    
    if (sites.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'Aucun site bloqué. Ajoutez-en un ci-dessous.';
      emptyMessage.className = 'empty-message';
      blockedList.appendChild(emptyMessage);
      return;
    }
    
    sites.forEach(site => {
      const li = document.createElement('li');
      
      // Site name
      const siteText = document.createElement('span');
      siteText.textContent = site;
      li.appendChild(siteText);
      
      // Delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-btn';
      deleteButton.innerHTML = '&times;';
      deleteButton.title = 'Supprimer ce site';
      deleteButton.onclick = () => removeSite(site);
      li.appendChild(deleteButton);
      
      blockedList.appendChild(li);
    });
  }
  
  // Add a site to the blocked list
  function addBlockedSite() {
    const newSite = newSiteInput.value.trim();
    
    if (!newSite) return;
    
    // Basic validation
    if (!isValidDomain(newSite)) {
      showNotification('Veuillez entrer un nom de domaine valide', 'error');
      return;
    }
    
    chrome.storage.sync.get('blockedSites', ({ blockedSites = [] }) => {
      // Check if site already exists
      if (blockedSites.includes(newSite)) {
        showNotification('Ce site est déjà dans la liste', 'warning');
        return;
      }
      
      // Add to list and save
      const updatedSites = [...blockedSites, newSite];
      chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
        // Update UI
        refreshBlockedSitesList(updatedSites);
        
        // Clear input
        newSiteInput.value = '';
        
        // Show confirmation
        showNotification('Site ajouté à la liste de blocage');
        
        // Notify background
        chrome.runtime.sendMessage({ 
          action: 'updateBlockedSites',
          blockedSites: updatedSites
        });
      });
    });
  }
  
  // Remove a site from the blocked list
  function removeSite(site) {
    chrome.storage.sync.get('blockedSites', ({ blockedSites = [] }) => {
      const updatedSites = blockedSites.filter(s => s !== site);
      
      chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
        // Update UI
        refreshBlockedSitesList(updatedSites);
        
        // Show confirmation
        showNotification('Site retiré de la liste');
        
        // Notify background
        chrome.runtime.sendMessage({ 
          action: 'updateBlockedSites',
          blockedSites: updatedSites
        });
      });
    });
  }
  
  // Update category sites
  function updateCategorySites() {
    chrome.storage.sync.get('blockedSites', ({ blockedSites = [] }) => {
      let updatedSites = [...blockedSites];
      
      // Filter out category sites first
      Object.values(categorySites).flat().forEach(site => {
        updatedSites = updatedSites.filter(s => s !== site);
      });
      
      // Add selected category sites
      if (categorySettings.social) {
        updatedSites = [...updatedSites, ...categorySites.social];
      }
      
      if (categorySettings.video) {
        updatedSites = [...updatedSites, ...categorySites.video];
      }
      
      if (categorySettings.games) {
        updatedSites = [...updatedSites, ...categorySites.games];
      }
      
      if (categorySettings.shopping) {
        updatedSites = [...updatedSites, ...categorySites.shopping];
      }
      
      // Remove duplicates
      updatedSites = [...new Set(updatedSites)];
      
      chrome.storage.sync.set({ 
        blockedSites: updatedSites,
        categorySettings: categorySettings
      }, () => {
        // Update UI
        refreshBlockedSitesList(updatedSites);
        
        // Show confirmation
        showNotification('Catégories mises à jour');
        
        // Notify background
        chrome.runtime.sendMessage({ 
          action: 'updateBlockedSites',
          blockedSites: updatedSites
        });
      });
    });
  }
  
  // Whitelist Tab Functions
  
  // Refresh the whitelist sites
  function refreshWhitelistSitesList(sites = []) {
    whitelist.innerHTML = '';
    
    if (sites.length === 0) {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'Aucun site en liste blanche. Ajoutez-en un ci-dessous.';
      emptyMessage.className = 'empty-message';
      whitelist.appendChild(emptyMessage);
      return;
    }
    
    sites.forEach(site => {
      const li = document.createElement('li');
      
      // Site name
      const siteText = document.createElement('span');
      siteText.textContent = site;
      li.appendChild(siteText);
      
      // Delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-btn';
      deleteButton.innerHTML = '&times;';
      deleteButton.title = 'Supprimer ce site';
      deleteButton.onclick = () => removeWhitelistSite(site);
      li.appendChild(deleteButton);
      
      whitelist.appendChild(li);
    });
  }
  
  // Add a site to the whitelist
  function addWhitelistSite() {
    const newSite = newWhitelistSiteInput.value.trim();
    
    if (!newSite) return;
    
    // Basic validation
    if (!isValidDomain(newSite)) {
      showNotification('Veuillez entrer un nom de domaine valide', 'error');
      return;
    }
    
    chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
      // Check if site already exists
      if (whitelist.includes(newSite)) {
        showNotification('Ce site est déjà dans la liste blanche', 'warning');
        return;
      }
      
      // Add to list and save
      const updatedSites = [...whitelist, newSite];
      chrome.storage.sync.set({ whitelist: updatedSites }, () => {
        // Update UI
        refreshWhitelistSitesList(updatedSites);
        
        // Clear input
        newWhitelistSiteInput.value = '';
        
        // Show confirmation
        showNotification('Site ajouté à la liste blanche');
        
        // Notify background
        chrome.runtime.sendMessage({ 
          action: 'updateWhitelist',
          whitelist: updatedSites
        });
      });
    });
  }
  
  // Remove a site from the whitelist
  function removeWhitelistSite(site) {
    chrome.storage.sync.get('whitelist', ({ whitelist = [] }) => {
      const updatedSites = whitelist.filter(s => s !== site);
      
      chrome.storage.sync.set({ whitelist: updatedSites }, () => {
        // Update UI
        refreshWhitelistSitesList(updatedSites);
        
        // Show confirmation
        showNotification('Site retiré de la liste blanche');
        
        // Notify background
        chrome.runtime.sendMessage({ 
          action: 'updateWhitelist',
          whitelist: updatedSites
        });
      });
    });
  }
  
  // Schedule Tab Functions
  
  // Update Schedule UI
  function updateScheduleUI() {
    // Update day checkboxes
    dayCheckboxes.forEach(checkbox => {
      const day = parseInt(checkbox.getAttribute('data-day'));
      checkbox.checked = scheduleSettings.days.includes(day);
    });
    
    // Update time ranges
    if (scheduleSettings.timeRanges.length >= 1) {
      morningStartInput.value = scheduleSettings.timeRanges[0].start;
      morningEndInput.value = scheduleSettings.timeRanges[0].end;
    }
    
    if (scheduleSettings.timeRanges.length >= 2) {
      afternoonStartInput.value = scheduleSettings.timeRanges[1].start;
      afternoonEndInput.value = scheduleSettings.timeRanges[1].end;
    }
    
    // Add any additional time ranges
    const timeRangesContainer = document.querySelector('.time-ranges');
    for (let i = 2; i < scheduleSettings.timeRanges.length; i++) {
      const timeRange = document.createElement('div');
      timeRange.className = 'time-range';
      timeRange.innerHTML = `
        <div class="time-label">Plage ${i + 1} :</div>
        <div class="time-inputs">
          <input type="time" id="time-range-${i}-start" value="${scheduleSettings.timeRanges[i].start}" />
          <span>à</span>
          <input type="time" id="time-range-${i}-end" value="${scheduleSettings.timeRanges[i].end}" />
          <button class="delete-btn remove-time-range" data-index="${i}">&times;</button>
        </div>
      `;
      
      timeRangesContainer.appendChild(timeRange);
      
      // Add event listener to the remove button
      const removeButton = timeRange.querySelector('.remove-time-range');
      removeButton.addEventListener('click', () => {
        timeRange.remove();
      });
    }
  }
  
  // Save Schedule
  function saveSchedule() {
    // Get selected days
    const selectedDays = [];
    dayCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        selectedDays.push(parseInt(checkbox.getAttribute('data-day')));
      }
    });
    
    // Get time ranges
    const timeRanges = [];
    
    // Always add the first two default time ranges
    timeRanges.push({
      name: 'Matin',
      start: morningStartInput.value,
      end: morningEndInput.value
    });
    
    timeRanges.push({
      name: 'Après-midi',
      start: afternoonStartInput.value,
      end: afternoonEndInput.value
    });
    
    // Add any additional time ranges
    const additionalTimeRanges = document.querySelectorAll('.time-range');
    for (let i = 2; i < additionalTimeRanges.length; i++) {
      const startInput = additionalTimeRanges[i].querySelector(`input[id^="time-range-"]`);
      const endInput = additionalTimeRanges[i].querySelector(`input[id$="-end"]`);
      
      if (startInput && endInput) {
        timeRanges.push({
          name: `Plage ${i + 1}`,
          start: startInput.value,
          end: endInput.value
        });
      }
    }
    
    // Update schedule settings
    scheduleSettings = {
      enabled: true,
      days: selectedDays,
      timeRanges: timeRanges
    };
    
    // Save to storage
    chrome.storage.sync.set({ scheduleSettings }, () => {
      // Show confirmation
      showNotification('Horaires de blocage enregistrés');
      
      // Notify background
      chrome.runtime.sendMessage({ 
        action: 'updateSchedule',
        scheduleSettings: scheduleSettings
      });
      
      // Update blocking mode if needed
      if (blockingModeSelect.value !== 'scheduled') {
        blockingModeSelect.value = 'scheduled';
        saveSettings();
      }
    });
  }
  
  // Settings Tab Functions
  
  // Save Settings
  function saveSettings() {
    const settings = {
      blockingMode: blockingModeSelect.value,
      notifyBlocked: notifyBlockedCheckbox.checked,
      notifySession: notifySessionCheckbox.checked,
      notifyStats: notifyStatsCheckbox.checked,
      autoFocusEnabled: autoFocusEnabledCheckbox.checked,
      highlightFocus: highlightFocusCheckbox.checked,
      autoSubmit: autoSubmitCheckbox.checked
    };
    
    // Update focus settings
    focusSettings = {
      preferInputs: autoFocusEnabledCheckbox.checked,
      focusDelay: 500,
      highlightFocused: highlightFocusCheckbox.checked,
      autoSubmit: autoSubmitCheckbox.checked
    };
    
    // Save to chrome storage
    chrome.storage.sync.set({ 
      settings: settings,
      focusSettings: focusSettings
    }, () => {
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'updateFocusSettings', 
        settings: focusSettings 
      });
      
      // If blocking mode changed to scheduled, but schedule is not set up
      if (settings.blockingMode === 'scheduled' && (!scheduleSettings.enabled || scheduleSettings.days.length === 0)) {
        showNotification('N\'oubliez pas de configurer vos horaires de blocage', 'warning');
        
        // Switch to schedule tab
        tabButtons.forEach(btn => {
          if (btn.getAttribute('data-tab') === 'schedule') {
            btn.click();
          }
        });
      } else {
        // Visual feedback
        showNotification('Paramètres enregistrés ✅');
      }
    });
  }
  
  // Export Settings
  function exportSettings() {
    // Get all settings from storage
    chrome.storage.sync.get([
      'enabled',
      'blockedSites',
      'whitelist',
      'scheduleSettings',
      'categorySettings',
      'settings',
      'focusSettings'
    ], (data) => {
      // Create export object
      const exportData = {
        version: '1.2.0',
        exportDate: new Date().toISOString(),
        data: data
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "auto-focus-settings.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      // Show confirmation
      showNotification('Paramètres exportés');
    });
  }
  
  // Import Settings
  function importSettings(file) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);
        
        // Validate import data
        if (!importData.version || !importData.data) {
          throw new Error('Format de fichier invalide');
        }
        
        // Apply imported settings
        chrome.storage.sync.set(importData.data, () => {
          // Show confirmation
          showNotification('Paramètres importés ✅');
          
          // Reload popup to reflect new settings
          window.location.reload();
        });
      } catch (error) {
        showNotification('Erreur lors de l\'importation: ' + error.message, 'error');
      }
    };
    
    reader.readAsText(file);
  }
  
  // Apply theme to UI
  function applyTheme(theme) {
    // Remove previous theme
    document.body.classList.remove('dark-theme');
    
    // Apply theme
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    
    // Could expand this with additional themes logic
  }
  
  // Stats Tab Functions
  
  // Initialize Charts
  function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('weekly-chart');
      
      if (ctx) {
        // Get context
        const context = ctx.getContext('2d');
        
        // Sample data
        const data = {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{
            label: 'Heures de concentration',
            data: [3.5, 4.2, 2.8, 5.0, 3.0, 1.5, 0.5],
            backgroundColor: 'rgba(66, 133, 244, 0.2)',
            borderColor: '#4285F4',
            borderWidth: 2,
            pointBackgroundColor: '#4285F4',
            pointRadius: 4,
            tension: 0.3
          }]
        };
        
        // Create chart
        new Chart(context, {
          type: 'line',
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.raw + ' heures';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value + 'h';
                  }
                }
              }
            }
          }
        });
      }
    }
  }
  
  // Populate site stats (example data)
  function populateSiteStats() {
    // This would come from actual tracking data in a real extension
    // For demo purposes, we're using placeholder data
    const statsItems = [
      { site: 'youtube.com', count: 45 },
      { site: 'facebook.com', count: 28 },
      { site: 'twitter.com', count: 17 }
    ];
    
    const siteStatList = document.querySelector('.site-stat-list');
    if (!siteStatList) return;
    
    // Clear existing list
    siteStatList.innerHTML = '';
    
    // Add stats items
    statsItems.forEach(item => {
      const statItem = document.createElement('div');
      statItem.className = 'site-stat-item';
      
      const siteName = document.createElement('div');
      siteName.className = 'site-name';
      siteName.textContent = item.site;
      
      const siteCount = document.createElement('div');
      siteCount.className = 'site-count';
      siteCount.textContent = `${item.count} fois`;
      
      statItem.appendChild(siteName);
      statItem.appendChild(siteCount);
      siteStatList.appendChild(statItem);
    });
  }
  
  // Share Stats
  function shareStats() {
    // Create a snapshot of stats
    const statsData = {
      blockedToday: 32,
      focusTime: '3h 45m',
      productivity: 78,
      topBlocked: ['youtube.com', 'facebook.com', 'twitter.com']
    };
    
    // Create shareable text
    const shareText = `📊 Mes statistiques Auto-Focus:\n• ${statsData.blockedToday} sites distractifs bloqués aujourd'hui\n• ${statsData.focusTime} de concentration\n• ${statsData.productivity}% de productivité\n\n💪 #AutoFocus #Productivité`;
    
    // Create temporary input for copying
    const input = document.createElement('textarea');
    input.value = shareText;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    
    // Show confirmation
    showNotification('Statistiques copiées dans le presse-papier');
  }
  
  // Utility Functions
  
  // Animate stat numbers for a nice effect
  function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
      const targetValue = stat.textContent;
      let startValue = 0;
      
      // Check if it's a percentage
      const isPercentage = targetValue.includes('%');
      
      // Check if it's a time format
      const isTime = targetValue.includes('h') || targetValue.includes('m');
      
      // For percentages, count up to the number
      if (isPercentage) {
        const number = parseInt(targetValue);
        const duration = 1500;
        const increment = Math.ceil(number / (duration / 30));
        
        // Start at 0
        stat.textContent = '0%';
        
        const interval = setInterval(() => {
          startValue += increment;
          
          if (startValue >= number) {
            clearInterval(interval);
            startValue = number;
          }
          
          stat.textContent = `${startValue}%`;
        }, 30);
      }
      // For time formats, just fade in
      else if (isTime) {
        stat.style.opacity = '0';
        setTimeout(() => {
          stat.style.transition = 'opacity 1s ease';
          stat.style.opacity = '1';
        }, 300);
      }
      // For regular numbers, count up
      else {
        const number = parseInt(targetValue);
        const duration = 1500;
        const increment = Math.ceil(number / (duration / 30));
        
        // Start at 0
        stat.textContent = '0';
        
        const interval = setInterval(() => {
          startValue += increment;
          
          if (startValue >= number) {
            clearInterval(interval);
            startValue = number;
          }
          
          stat.textContent = startValue.toString();
        }, 30);
      }
    });
  }
  
  // Show notification toast
  function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    // Set notification type
    notification.className = 'notification'; // Reset
    notification.classList.add(`notification-${type}`);
    
    // Set message
    notification.textContent = message;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  // Basic domain validation
  function isValidDomain(domain) {
    // Simple validation - could be improved
    return domain.length > 1 && domain.includes('.');
  }
  
  // Add custom CSS for notification
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: var(--success);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .notification.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .notification-error {
      background-color: var(--error);
    }
    
    .notification-warning {
      background-color: var(--warning);
      color: #333;
    }
    
    .empty-message {
      color: var(--text-secondary);
      font-style: italic;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
});