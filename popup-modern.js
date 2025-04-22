document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup chargé');
  
  // Définir le thème par défaut
  document.body.setAttribute('data-theme', 'blue');
  
  // Initialisation des onglets
  initTabs();
  
  // Chargement des données depuis le stockage
  loadData();
  
  // Initialisation des graphiques
  initCharts();
  
  // Gestion des événements
  setupEventListeners();
  
  // Citation aléatoire
  loadRandomQuote();
  
  // Afficher une notification de bienvenue
  setTimeout(function() {
    showNotification('Auto-Focus est prêt à vous aider à rester concentré!', 'info');
  }, 500);
});

// Système d'onglets
function initTabs() {
  const tabNavs = document.querySelectorAll('.tab-nav');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabNavs.forEach(nav => {
    nav.addEventListener('click', () => {
      // Retirer la classe active de tous les onglets
      tabNavs.forEach(n => n.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Ajouter la classe active à l'onglet cliqué
      nav.classList.add('active');
      
      // Afficher le contenu correspondant
      const tabId = nav.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Chargement des données depuis le stockage Chrome
function loadData() {
  chrome.storage.sync.get([
    'enabled',
    'blockedSites',
    'whitelist',
    'scheduleSettings',
    'categorySettings',
    'settings',
    'focusSettings',
    'stats',
    'gamification',
    'theme'
  ], (data) => {
    // État de l'extension
    updateExtensionState(data.enabled);
    
    // Sites bloqués
    updateBlockedSitesList(data.blockedSites || []);
    
    // Liste blanche
    updateWhitelistSitesList(data.whitelist || []);
    
    // Paramètres de planification
    updateScheduleSettings(data.scheduleSettings);
    
    // Paramètres généraux
    updateGeneralSettings(data.settings);
    
    // Paramètres de focus
    updateFocusSettings(data.focusSettings);
    
    // Statistiques
    updateStats(data.stats);
    
    // Gamification
    updateGamification(data.gamification);
    
    // Thème
    applyTheme(data.theme || 'blue');
  });
}

// Mise à jour de l'état de l'extension
function updateExtensionState(enabled) {
  document.getElementById('toggle-extension').checked = enabled !== false;
}

// Mise à jour de la liste des sites bloqués
function updateBlockedSitesList(sites = []) {
  const container = document.getElementById('blocked-sites-list');
  
  // Vider le conteneur
  container.innerHTML = '';
  
  // Si la liste est vide, afficher un message
  if (sites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-message">
          Ajoutez des sites à bloquer pour rester concentré
        </div>
        <button class="btn btn-secondary" id="add-current-site">
          <span class="btn-icon">➕</span> Ajouter le site actuel
        </button>
      </div>
    `;
    
    // Ajouter un écouteur d'événement au bouton
    const addCurrentSiteBtn = document.getElementById('add-current-site');
    if (addCurrentSiteBtn) {
      addCurrentSiteBtn.addEventListener('click', addCurrentSite);
    }
    
    return;
  }
  
  // Créer un élément pour chaque site
  sites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${site}</div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn edit-site" data-site="${site}">✏️</button>
        <button class="icon-btn danger remove-site" data-site="${site}">🗑️</button>
      </div>
    `;
    
    container.appendChild(item);
  });
  
  // Ajouter des écouteurs d'événements aux boutons d'édition et de suppression
  document.querySelectorAll('.edit-site').forEach(btn => {
    btn.addEventListener('click', function() {
      const site = this.getAttribute('data-site');
      editSite(site);
    });
  });
  
  document.querySelectorAll('.remove-site').forEach(btn => {
    btn.addEventListener('click', function() {
      const site = this.getAttribute('data-site');
      removeSite(site);
    });
  });
}

// Mise à jour de la liste blanche
function updateWhitelistSitesList(sites = []) {
  const container = document.getElementById('whitelist-sites-list');
  
  // Vider le conteneur
  container.innerHTML = '';
  
  // Si la liste est vide, afficher un message
  if (sites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-message">
          Ajoutez des sites à la liste blanche pour qu'ils soient toujours accessibles
        </div>
        <button class="btn btn-secondary" id="whitelist-current-site">
          <span class="btn-icon">➕</span> Ajouter le site actuel
        </button>
      </div>
    `;
    
    // Ajouter un écouteur d'événement au bouton
    const whitelistCurrentSiteBtn = document.getElementById('whitelist-current-site');
    if (whitelistCurrentSiteBtn) {
      whitelistCurrentSiteBtn.addEventListener('click', addCurrentSiteToWhitelist);
    }
    
    return;
  }
  
  // Créer un élément pour chaque site
  sites.forEach(site => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-content">
        <div class="list-item-title">${site}</div>
      </div>
      <div class="list-item-actions">
        <button class="icon-btn edit-whitelist" data-site="${site}">✏️</button>
        <button class="icon-btn danger remove-whitelist" data-site="${site}">🗑️</button>
      </div>
    `;
    
    container.appendChild(item);
  });
  
  // Ajouter des écouteurs d'événements aux boutons d'édition et de suppression
  document.querySelectorAll('.edit-whitelist').forEach(btn => {
    btn.addEventListener('click', function() {
      const site = this.getAttribute('data-site');
      editWhitelistSite(site);
    });
  });
  
  document.querySelectorAll('.remove-whitelist').forEach(btn => {
    btn.addEventListener('click', function() {
      const site = this.getAttribute('data-site');
      removeWhitelistSite(site);
    });
  });
}

// Mise à jour des paramètres de planification
function updateScheduleSettings(scheduleSettings) {
  if (!scheduleSettings) return;
  
  // État de la planification
  const scheduleEnabled = document.getElementById('schedule-enabled');
  scheduleEnabled.checked = scheduleSettings.enabled;
  
  // Afficher/masquer les paramètres de planification
  const scheduleSettingsContainer = document.getElementById('schedule-settings');
  scheduleSettingsContainer.style.display = scheduleSettings.enabled ? 'block' : 'none';
  
  // Jours
  const days = scheduleSettings.days || [1, 2, 3, 4, 5];
  document.querySelectorAll('input[name="schedule-day"]').forEach(checkbox => {
    checkbox.checked = days.includes(parseInt(checkbox.value));
  });
  
  // Mettre à jour les en-têtes des jours
  updateDayHeaders(days);
  
  // Plages horaires
  const timeRanges = scheduleSettings.timeRanges || [
    { name: 'Matin', start: '09:00', end: '12:00' },
    { name: 'Après-midi', start: '14:00', end: '18:00' }
  ];
  
  updateTimeRangesList(timeRanges);
}

// Mise à jour des en-têtes des jours (ajoute une classe aux jours actifs)
function updateDayHeaders(activeDays) {
  document.querySelectorAll('.day-header').forEach(header => {
    const day = parseInt(header.getAttribute('data-day'));
    if (activeDays.includes(day)) {
      header.classList.add('day-active');
    } else {
      header.classList.remove('day-active');
    }
  });
}

// Mise à jour de la liste des plages horaires
function updateTimeRangesList(timeRanges) {
  const container = document.getElementById('time-ranges-list');
  
  // Vider le conteneur
  container.innerHTML = '';
  
  // Créer un élément pour chaque plage horaire
  timeRanges.forEach((range, index) => {
    const item = document.createElement('div');
    item.className = 'time-range-item';
    item.setAttribute('data-index', index);
    
    const displayName = range.name ? `${range.name}: ${range.start} - ${range.end}` : `${range.start} - ${range.end}`;
    
    item.innerHTML = `
      <div class="time-range-text">${displayName}</div>
      <div class="time-range-actions">
        <button class="icon-btn edit-time-range">✏️</button>
        <button class="icon-btn danger delete-time-range">🗑️</button>
      </div>
    `;
    
    container.appendChild(item);
  });
  
  // Ajouter des écouteurs d'événements aux boutons d'édition et de suppression
  document.querySelectorAll('.edit-time-range').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.closest('.time-range-item').getAttribute('data-index'));
      editTimeRange(index);
    });
  });
  
  document.querySelectorAll('.delete-time-range').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.closest('.time-range-item').getAttribute('data-index'));
      deleteTimeRange(index);
    });
  });
}

// Mise à jour des paramètres généraux
function updateGeneralSettings(settings) {
  if (!settings) return;
  
  // Mode de blocage
  const blockingMode = document.getElementById('blocking-mode');
  if (blockingMode) {
    blockingMode.value = settings.blockingMode || 'standard';
  }
  
  // Notifications
  const notifyBlocked = document.getElementById('notify-blocked');
  if (notifyBlocked) {
    notifyBlocked.checked = settings.notifyBlocked !== false;
  }
  
  const notifySession = document.getElementById('notify-session');
  if (notifySession) {
    notifySession.checked = settings.notifySession || false;
  }
  
  const notifyStats = document.getElementById('notify-stats');
  if (notifyStats) {
    notifyStats.checked = settings.notifyStats || false;
  }
}

// Mise à jour des paramètres de focus
function updateFocusSettings(focusSettings) {
  if (!focusSettings) return;
  
  // Indicateur de focus
  const focusIndicator = document.getElementById('focus-indicator');
  if (focusIndicator) {
    focusIndicator.value = focusSettings.focusIndicator || 'highlight';
  }
}

// Mise à jour des statistiques
function updateStats(stats) {
  if (!stats) return;
  
  // Nombre de sites bloqués
  const blockedCount = document.getElementById('blocked-count');
  if (blockedCount) {
    blockedCount.textContent = stats.blockedCount || 0;
  }
  
  // Temps de concentration
  const focusTime = document.getElementById('focus-time');
  if (focusTime) {
    focusTime.textContent = formatTime(stats.totalFocusTime || 0);
  }
  
  // Nombre de sessions Pomodoro
  const pomodoroCount = document.getElementById('pomodoro-count');
  if (pomodoroCount) {
    pomodoroCount.textContent = stats.focusSessions?.length || 0;
  }
  
  // Streak (jours consécutifs)
  const streakCount = document.getElementById('streak-count');
  if (streakCount && stats.gamification) {
    streakCount.textContent = stats.gamification.streak || 0;
  }
}

// Mise à jour de la gamification
function updateGamification(gamification) {
  if (!gamification) return;
  
  // Niveau et XP
  const level = window.gamification.getCurrentLevel(gamification.xp || 0);
  
  // Badge de niveau
  const levelText = document.getElementById('level-text');
  if (levelText) {
    levelText.textContent = `Niveau ${level.level}: ${level.name}`;
  }
  
  const levelBadgeIcon = document.getElementById('level-badge-icon');
  if (levelBadgeIcon) {
    levelBadgeIcon.textContent = level.badge;
  }
  
  // XP actuel
  const currentXp = document.getElementById('current-xp');
  if (currentXp) {
    currentXp.textContent = `${gamification.xp || 0} XP`;
  }
  
  // Prochain niveau
  const nextLevel = document.getElementById('next-level');
  if (nextLevel) {
    const nextLevelData = level.maxXP < Infinity 
      ? `Niveau ${level.level + 1}: ${level.maxXP} XP`
      : 'Niveau maximum atteint';
    nextLevel.textContent = nextLevelData;
  }
  
  // Barre de progression XP
  const xpProgressBar = document.getElementById('xp-progress-bar');
  if (xpProgressBar) {
    const xp = gamification.xp || 0;
    const minXP = level.minXP;
    const maxXP = level.maxXP;
    
    if (maxXP < Infinity) {
      const percentage = ((xp - minXP) / (maxXP - minXP)) * 100;
      xpProgressBar.style.width = `${percentage}%`;
    } else {
      xpProgressBar.style.width = '100%';
    }
  }
  
  // Défis quotidiens
  updateDailyChallenges(gamification.challenges);
}

// Mise à jour des défis quotidiens
function updateDailyChallenges(challenges) {
  if (!challenges) return;
  
  const dailyChallengesContainer = document.getElementById('daily-challenges');
  if (!dailyChallengesContainer) return;
  
  // Vider le conteneur
  dailyChallengesContainer.innerHTML = '';
  
  // Ajouter les défis quotidiens
  const dailyChallenges = challenges.daily || [];
  
  if (dailyChallenges.length === 0) {
    dailyChallengesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-message">
          Pas de défis aujourd'hui. Revenez demain !
        </div>
      </div>
    `;
    return;
  }
  
  dailyChallenges.forEach(challenge => {
    // Extraire la valeur cible de la description
    const targetMatch = challenge.description.match(/(\d+)/);
    const target = targetMatch ? parseInt(targetMatch[1]) : 1;
    
    // Calculer le pourcentage de progression
    const progress = challenge.progress || 0;
    const percentage = Math.min((progress / target) * 100, 100);
    
    const item = document.createElement('div');
    item.className = 'daily-challenge';
    item.innerHTML = `
      <div class="challenge-info">
        <div class="challenge-name">${challenge.name}</div>
        <div class="challenge-description">${challenge.description}</div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percentage}%;"></div>
        </div>
        <div class="challenge-progress-text">${progress}/${target} complété</div>
      </div>
      <div class="challenge-xp">${challenge.xp} XP</div>
    `;
    
    dailyChallengesContainer.appendChild(item);
  });
}

// Initialisation des graphiques
function initCharts() {
  const productivityCtx = document.getElementById('productivity-chart');
  if (!productivityCtx) return;
  
  // Charger les données des 7 derniers jours
  chrome.storage.sync.get('stats', (data) => {
    const stats = data.stats || {};
    
    // Générer des données pour le graphique
    const chartData = generateProductivityChartData(stats);
    
    // Création du graphique
    new Chart(productivityCtx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Productivité',
          data: chartData.data,
          borderColor: 'var(--primary)',
          backgroundColor: 'var(--primary-bg)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  });
}

// Générer des données pour le graphique de productivité
function generateProductivityChartData(stats) {
  const labels = [];
  const data = [];
  
  // Générer des données pour les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Format jour mois (ex: 15 avr)
    labels.push(`${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'short' })}`);
    
    // Générer une valeur pour ce jour (dans une vraie implémentation, on utiliserait des données réelles)
    // Pour l'exemple, on génère une valeur entre 40 et 90 avec une tendance à la hausse
    const baseValue = 40 + Math.floor(Math.random() * 30); // Valeur de base entre 40 et 70
    const trend = Math.floor((6 - i) * 3); // Tendance à la hausse (0 à 18)
    const dayValue = Math.min(baseValue + trend, 100);
    
    data.push(dayValue);
  }
  
  return { labels, data };
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Toggle extension
  const toggleExtension = document.getElementById('toggle-extension');
  if (toggleExtension) {
    toggleExtension.addEventListener('change', function() {
      toggleExtensionState(this.checked);
    });
  }
  
  // Formulaire d'ajout de site
  const addSiteForm = document.getElementById('add-site-form');
  if (addSiteForm) {
    addSiteForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const siteInput = document.getElementById('site-input');
      const site = siteInput.value.trim();
      
      if (site) {
        addBlockedSite(site);
        siteInput.value = '';
      }
    });
  }
  
  // Formulaire d'ajout à la liste blanche
  const addWhitelistForm = document.getElementById('add-whitelist-form');
  if (addWhitelistForm) {
    addWhitelistForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const whitelistInput = document.getElementById('whitelist-input');
      const site = whitelistInput.value.trim();
      
      if (site) {
        addWhitelistSite(site);
        whitelistInput.value = '';
      }
    });
  }
  
  // Chips de catégories
  const categoryChips = document.querySelectorAll('.category-chip');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      toggleCategory(category, this);
    });
  });
  
  // Toggle de la planification
  const scheduleEnabled = document.getElementById('schedule-enabled');
  if (scheduleEnabled) {
    scheduleEnabled.addEventListener('change', function() {
      toggleSchedule(this.checked);
    });
  }
  
  // Jours de la planification
  const scheduleDays = document.querySelectorAll('input[name="schedule-day"]');
  scheduleDays.forEach(checkbox => {
    checkbox.addEventListener('change', updateScheduleDays);
  });
  
  // Ajout de plage horaire
  const addTimeRangeBtn = document.getElementById('add-time-range');
  if (addTimeRangeBtn) {
    addTimeRangeBtn.addEventListener('click', showAddTimeRangeModal);
  }
  
  // Boutons de la modale de plage horaire
  const saveTimeRangeBtn = document.getElementById('save-time-range');
  if (saveTimeRangeBtn) {
    saveTimeRangeBtn.addEventListener('click', saveTimeRange);
  }
  
  const cancelTimeRangeBtn = document.getElementById('cancel-time-range');
  if (cancelTimeRangeBtn) {
    cancelTimeRangeBtn.addEventListener('click', hideTimeRangeModal);
  }
  
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideTimeRangeModal);
  }
  
  // Sélecteur de thème
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', function() {
      const theme = this.getAttribute('data-theme');
      changeTheme(theme);
    });
  });
  
  // Paramètres
  const blockingMode = document.getElementById('blocking-mode');
  if (blockingMode) {
    blockingMode.addEventListener('change', saveSettings);
  }
  
  const focusIndicator = document.getElementById('focus-indicator');
  if (focusIndicator) {
    focusIndicator.addEventListener('change', saveFocusSettings);
  }
  
  const notificationCheckboxes = document.querySelectorAll('#notify-blocked, #notify-session, #notify-stats');
  notificationCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', saveSettings);
  });
  
  // Boutons d'action
  const exportSettingsBtn = document.getElementById('export-settings');
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener('click', exportSettings);
  }
  
  const importSettingsBtn = document.getElementById('import-settings');
  if (importSettingsBtn) {
    importSettingsBtn.addEventListener('click', importSettings);
  }
  
  const openOptionsBtn = document.getElementById('open-options');
  if (openOptionsBtn) {
    openOptionsBtn.addEventListener('click', openOptions);
  }
  
  const resetSettingsBtn = document.getElementById('reset-settings');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
  }
  
  // Contrôles du Pomodoro
  const startPomodoroBtn = document.getElementById('start-pomodoro');
  if (startPomodoroBtn) {
    startPomodoroBtn.addEventListener('click', startPomodoro);
  }
  
  const pausePomodoroBtn = document.getElementById('pause-pomodoro');
  if (pausePomodoroBtn) {
    pausePomodoroBtn.addEventListener('click', pausePomodoro);
  }
  
  const resetPomodoroBtn = document.getElementById('reset-pomodoro');
  if (resetPomodoroBtn) {
    resetPomodoroBtn.addEventListener('click', resetPomodoro);
  }
}

// Activer/désactiver l'extension
function toggleExtensionState(enabled) {
  chrome.runtime.sendMessage({ 
    action: 'toggleEnabled',
    enabled: enabled 
  }, (response) => {
    if (response && response.enabled !== undefined) {
      // Mettre à jour l'interface
      document.getElementById('toggle-extension').checked = response.enabled;
      
      // Afficher une notification
      showNotification(
        response.enabled ? 'Extension activée' : 'Extension désactivée',
        response.enabled ? 'success' : 'info'
      );
    }
  });
}

// Ajouter un site à la liste des sites bloqués
function addBlockedSite(site) {
  // Vérifier que le site est valide
  if (!isValidDomain(site)) {
    showNotification('Format de site invalide', 'error');
    return;
  }
  
  chrome.storage.sync.get('blockedSites', (data) => {
    const blockedSites = data.blockedSites || [];
    
    // Vérifier si le site existe déjà
    if (blockedSites.includes(site)) {
      showNotification('Ce site est déjà dans la liste', 'info');
      return;
    }
    
    // Ajouter le site à la liste
    const updatedSites = [...blockedSites, site];
    
    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      // Mettre à jour l'interface
      updateBlockedSitesList(updatedSites);
      
      // Afficher une notification
      showNotification('Site ajouté à la liste de blocage', 'success');
    });
  });
}

// Modifier un site dans la liste des sites bloqués
function editSite(site) {
  const newSite = prompt('Modifier le site', site);
  
  if (newSite && newSite !== site && isValidDomain(newSite)) {
    chrome.storage.sync.get('blockedSites', (data) => {
      const blockedSites = data.blockedSites || [];
      
      // Remplacer l'ancien site par le nouveau
      const siteIndex = blockedSites.indexOf(site);
      if (siteIndex !== -1) {
        blockedSites[siteIndex] = newSite;
        
        chrome.storage.sync.set({ blockedSites }, () => {
          // Mettre à jour l'interface
          updateBlockedSitesList(blockedSites);
          
          // Afficher une notification
          showNotification('Site modifié', 'success');
        });
      }
    });
  } else if (newSite && !isValidDomain(newSite)) {
    showNotification('Format de site invalide', 'error');
  }
}

// Supprimer un site de la liste des sites bloqués
function removeSite(site) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer ${site} de la liste de blocage ?`)) {
    chrome.storage.sync.get('blockedSites', (data) => {
      const blockedSites = data.blockedSites || [];
      
      // Filtrer le site à supprimer
      const updatedSites = blockedSites.filter(s => s !== site);
      
      chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
        // Mettre à jour l'interface
        updateBlockedSitesList(updatedSites);
        
        // Afficher une notification
        showNotification('Site supprimé de la liste de blocage', 'info');
      });
    });
  }
}

// Ajouter le site actuel à la liste des sites bloqués
function addCurrentSite() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        
        addBlockedSite(domain);
      } catch (e) {
        showNotification('Impossible d\'obtenir le domaine du site actuel', 'error');
      }
    }
  });
}

// Ajouter un site à la liste blanche
function addWhitelistSite(site) {
  // Vérifier que le site est valide
  if (!isValidDomain(site)) {
    showNotification('Format de site invalide', 'error');
    return;
  }
  
  chrome.storage.sync.get('whitelist', (data) => {
    const whitelist = data.whitelist || [];
    
    // Vérifier si le site existe déjà
    if (whitelist.includes(site)) {
      showNotification('Ce site est déjà dans la liste blanche', 'info');
      return;
    }
    
    // Ajouter le site à la liste
    const updatedSites = [...whitelist, site];
    
    chrome.storage.sync.set({ whitelist: updatedSites }, () => {
      // Mettre à jour l'interface
      updateWhitelistSitesList(updatedSites);
      
      // Afficher une notification
      showNotification('Site ajouté à la liste blanche', 'success');
    });
  });
}

// Modifier un site dans la liste blanche
function editWhitelistSite(site) {
  const newSite = prompt('Modifier le site', site);
  
  if (newSite && newSite !== site && isValidDomain(newSite)) {
    chrome.storage.sync.get('whitelist', (data) => {
      const whitelist = data.whitelist || [];
      
      // Remplacer l'ancien site par le nouveau
      const siteIndex = whitelist.indexOf(site);
      if (siteIndex !== -1) {
        whitelist[siteIndex] = newSite;
        
        chrome.storage.sync.set({ whitelist }, () => {
          // Mettre à jour l'interface
          updateWhitelistSitesList(whitelist);
          
          // Afficher une notification
          showNotification('Site modifié', 'success');
        });
      }
    });
  } else if (newSite && !isValidDomain(newSite)) {
    showNotification('Format de site invalide', 'error');
  }
}

// Supprimer un site de la liste blanche
function removeWhitelistSite(site) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer ${site} de la liste blanche ?`)) {
    chrome.storage.sync.get('whitelist', (data) => {
      const whitelist = data.whitelist || [];
      
      // Filtrer le site à supprimer
      const updatedSites = whitelist.filter(s => s !== site);
      
      chrome.storage.sync.set({ whitelist: updatedSites }, () => {
        // Mettre à jour l'interface
        updateWhitelistSitesList(updatedSites);
        
        // Afficher une notification
        showNotification('Site supprimé de la liste blanche', 'info');
      });
    });
  }
}

// Ajouter le site actuel à la liste blanche
function addCurrentSiteToWhitelist() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname;
        
        addWhitelistSite(domain);
      } catch (e) {
        showNotification('Impossible d\'obtenir le domaine du site actuel', 'error');
      }
    }
  });
}

// Activer/désactiver une catégorie de sites
function toggleCategory(category, chipElement) {
  chrome.storage.sync.get(['categorySettings', 'blockedSites'], (data) => {
    const categorySettings = data.categorySettings || {};
    const blockedSites = data.blockedSites || [];
    
    // Définir les sites pour chaque catégorie
    const categorySites = {
      social: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'pinterest.com', 'snapchat.com', 'tiktok.com'],
      video: ['youtube.com', 'netflix.com', 'twitch.tv', 'dailymotion.com', 'vimeo.com', 'hulu.com'],
      news: ['cnn.com', 'bbc.com', 'nytimes.com', 'huffpost.com', 'foxnews.com', 'lemonde.fr', 'lefigaro.fr'],
      games: ['miniclip.com', 'kongregate.com', 'poki.com', 'addictinggames.com', 'chess.com', 'coolmathgames.com'],
      shopping: ['amazon.com', 'ebay.com', 'etsy.com', 'aliexpress.com', 'walmart.com', 'target.com', 'cdiscount.com']
    };
    
    // Vérifier si la catégorie est active
    const isActive = categorySettings[category];
    
    // Mettre à jour les réglages de catégorie
    categorySettings[category] = !isActive;
    
    // Mettre à jour la liste des sites bloqués
    let updatedSites = [...blockedSites];
    
    if (!isActive) {
      // Ajouter les sites de la catégorie s'ils ne sont pas déjà présents
      categorySites[category].forEach(site => {
        if (!updatedSites.includes(site)) {
          updatedSites.push(site);
        }
      });
      
      // Marquer la puce comme active
      chipElement.classList.add('active');
    } else {
      // Retirer les sites de la catégorie qui ont été ajoutés automatiquement
      // Note: si l'utilisateur a ajouté un site manuellement, il faudrait le conserver
      updatedSites = updatedSites.filter(site => !categorySites[category].includes(site));
      
      // Retirer la classe active de la puce
      chipElement.classList.remove('active');
    }
    
    // Sauvegarder les changements
    chrome.storage.sync.set({ 
      categorySettings, 
      blockedSites: updatedSites 
    }, () => {
      // Mettre à jour l'interface
      updateBlockedSitesList(updatedSites);
      
      // Afficher une notification
      const message = !isActive 
        ? `Catégorie "${category}" activée` 
        : `Catégorie "${category}" désactivée`;
      
      showNotification(message, 'success');
    });
  });
}

// Activer/désactiver la planification
function toggleSchedule(enabled) {
  chrome.storage.sync.get('scheduleSettings', (data) => {
    const scheduleSettings = data.scheduleSettings || {
      days: [1, 2, 3, 4, 5],
      timeRanges: [
        { name: 'Matin', start: '09:00', end: '12:00' },
        { name: 'Après-midi', start: '14:00', end: '18:00' }
      ]
    };
    
    scheduleSettings.enabled = enabled;
    
    chrome.storage.sync.set({ scheduleSettings }, () => {
      // Afficher/masquer les paramètres de planification
      document.getElementById('schedule-settings').style.display = enabled ? 'block' : 'none';
      
      // Afficher une notification
      showNotification(
        enabled ? 'Planification activée' : 'Planification désactivée',
        'success'
      );
    });
  });
}

// Mise à jour des jours de planification
function updateScheduleDays() {
  const selectedDays = Array.from(document.querySelectorAll('input[name="schedule-day"]:checked'))
    .map(checkbox => parseInt(checkbox.value));
  
  chrome.storage.sync.get('scheduleSettings', (data) => {
    const scheduleSettings = data.scheduleSettings || {};
    scheduleSettings.days = selectedDays;
    
    chrome.storage.sync.set({ scheduleSettings }, () => {
      // Mettre à jour les en-têtes des jours
      updateDayHeaders(selectedDays);
    });
  });
}

// Afficher la modale d'ajout de plage horaire
function showAddTimeRangeModal() {
  const modal = document.getElementById('time-range-modal');
  if (modal) {
    // Réinitialiser les champs
    document.getElementById('time-range-name').value = '';
    document.getElementById('time-range-start').value = '09:00';
    document.getElementById('time-range-end').value = '12:00';
    
    // Supprimer l'attribut data-edit-index s'il existe
    const saveButton = document.getElementById('save-time-range');
    if (saveButton) {
      saveButton.removeAttribute('data-edit-index');
    }
    
    // Afficher la modale
    modal.style.display = 'flex';
  }
}

// Masquer la modale de plage horaire
function hideTimeRangeModal() {
  const modal = document.getElementById('time-range-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Éditer une plage horaire
function editTimeRange(index) {
  chrome.storage.sync.get('scheduleSettings', (data) => {
    const scheduleSettings = data.scheduleSettings || {};
    const timeRanges = scheduleSettings.timeRanges || [];
    
    if (index >= 0 && index < timeRanges.length) {
      const timeRange = timeRanges[index];
      
      // Remplir les champs de la modale
      document.getElementById('time-range-name').value = timeRange.name || '';
      document.getElementById('time-range-start').value = timeRange.start;
      document.getElementById('time-range-end').value = timeRange.end;
      
      // Stocker l'index pour la sauvegarde
      const saveButton = document.getElementById('save-time-range');
      if (saveButton) {
        saveButton.setAttribute('data-edit-index', index);
      }
      
      // Afficher la modale
      const modal = document.getElementById('time-range-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
  });
}

// Supprimer une plage horaire
function deleteTimeRange(index) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette plage horaire ?')) {
    chrome.storage.sync.get('scheduleSettings', (data) => {
      const scheduleSettings = data.scheduleSettings || {};
      const timeRanges = scheduleSettings.timeRanges || [];
      
      if (index >= 0 && index < timeRanges.length) {
        // Supprimer la plage horaire
        timeRanges.splice(index, 1);
        scheduleSettings.timeRanges = timeRanges;
        
        chrome.storage.sync.set({ scheduleSettings }, () => {
          // Mettre à jour l'interface
          updateTimeRangesList(timeRanges);
          
          // Afficher une notification
          showNotification('Plage horaire supprimée', 'success');
        });
      }
    });
  }
}

// Sauvegarder une plage horaire
function saveTimeRange() {
  const name = document.getElementById('time-range-name').value.trim();
  const start = document.getElementById('time-range-start').value;
  const end = document.getElementById('time-range-end').value;
  
  // Vérifier que l'heure de début est antérieure à l'heure de fin
  if (start >= end) {
    showNotification('L\'heure de début doit être antérieure à l\'heure de fin', 'error');
    return;
  }
  
  chrome.storage.sync.get('scheduleSettings', (data) => {
    const scheduleSettings = data.scheduleSettings || {};
    let timeRanges = scheduleSettings.timeRanges || [];
    
    // Vérifier s'il s'agit d'une édition ou d'un ajout
    const saveButton = document.getElementById('save-time-range');
    const editIndex = saveButton ? parseInt(saveButton.getAttribute('data-edit-index')) : -1;
    
    if (editIndex >= 0 && editIndex < timeRanges.length) {
      // Édition d'une plage existante
      timeRanges[editIndex] = { name, start, end };
    } else {
      // Ajout d'une nouvelle plage
      timeRanges.push({ name, start, end });
    }
    
    scheduleSettings.timeRanges = timeRanges;
    
    chrome.storage.sync.set({ scheduleSettings }, () => {
      // Mettre à jour l'interface
      updateTimeRangesList(timeRanges);
      
      // Masquer la modale
      hideTimeRangeModal();
      
      // Afficher une notification
      showNotification(
        editIndex >= 0 ? 'Plage horaire modifiée' : 'Plage horaire ajoutée',
        'success'
      );
    });
  });
}

// Changer le thème
function changeTheme(theme) {
  // Mettre à jour l'attribut data-theme sur le body
  document.body.setAttribute('data-theme', theme);
  
  // Mettre à jour la classe active sur les options de thème
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
  });
  
  const selectedOption = document.querySelector(`.theme-option[data-theme="${theme}"]`);
  if (selectedOption) {
    selectedOption.classList.add('active');
  }
  
  // Sauvegarder le thème
  chrome.storage.sync.set({ theme }, () => {
    showNotification(`Thème ${theme} appliqué`, 'success');
    
    // Vérifier la réalisation de personnalisation
    window.gamification.checkCustomizationAchievements();
  });
}

// Appliquer un thème
function applyTheme(theme) {
  // Mettre à jour l'attribut data-theme sur le body
  document.body.setAttribute('data-theme', theme);
  
  // Mettre à jour la classe active sur les options de thème
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.remove('active');
  });
  
  const selectedOption = document.querySelector(`.theme-option[data-theme="${theme}"]`);
  if (selectedOption) {
    selectedOption.classList.add('active');
  }
}

// Sauvegarder les paramètres généraux
function saveSettings() {
  const blockingMode = document.getElementById('blocking-mode').value;
  const notifyBlocked = document.getElementById('notify-blocked').checked;
  const notifySession = document.getElementById('notify-session').checked;
  const notifyStats = document.getElementById('notify-stats').checked;
  
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || {};
    
    settings.blockingMode = blockingMode;
    settings.notifyBlocked = notifyBlocked;
    settings.notifySession = notifySession;
    settings.notifyStats = notifyStats;
    
    chrome.storage.sync.set({ settings }, () => {
      showNotification('Paramètres enregistrés', 'success');
    });
  });
}

// Sauvegarder les paramètres de focus
function saveFocusSettings() {
  const focusIndicator = document.getElementById('focus-indicator').value;
  
  chrome.storage.sync.get('focusSettings', (data) => {
    const focusSettings = data.focusSettings || {};
    
    focusSettings.focusIndicator = focusIndicator;
    
    chrome.storage.sync.set({ focusSettings }, () => {
      showNotification('Paramètres de focus enregistrés', 'success');
    });
  });
}

// Exporter les paramètres
function exportSettings() {
  chrome.storage.sync.get(null, (data) => {
    // Convertir les données en JSON
    const settingsJson = JSON.stringify(data, null, 2);
    
    // Créer un objet Blob
    const blob = new Blob([settingsJson], { type: 'application/json' });
    
    // Créer une URL pour le blob
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auto-focus-settings.json';
    
    // Simuler un clic sur le lien
    a.click();
    
    // Libérer l'URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
    showNotification('Paramètres exportés', 'success');
  });
}

// Importer les paramètres
function importSettings() {
  // Créer un élément input file invisible
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  // Gérer l'événement de changement
  input.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        try {
          // Parser le JSON
          const settings = JSON.parse(event.target.result);
          
          // Confirmer l'importation
          if (confirm('Êtes-vous sûr de vouloir importer ces paramètres ? Cela remplacera tous vos paramètres actuels.')) {
            // Sauvegarder les paramètres
            chrome.storage.sync.set(settings, () => {
              // Recharger les données
              loadData();
              
              showNotification('Paramètres importés avec succès', 'success');
            });
          }
        } catch (error) {
          showNotification('Erreur lors de l\'importation des paramètres', 'error');
          console.error('Erreur lors de l\'importation des paramètres:', error);
        }
      };
      
      reader.readAsText(file);
    }
  });
  
  // Simuler un clic sur l'input
  input.click();
}

// Ouvrir la page d'options
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Réinitialiser les paramètres
function resetSettings() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action ne peut pas être annulée.')) {
    // Paramètres par défaut
    const defaultSettings = {
      enabled: true,
      blockedSites: ["youtube.com", "twitter.com", "reddit.com", "facebook.com", "instagram.com"],
      whitelist: ["google.com", "gmail.com", "docs.google.com", "drive.google.com"],
      scheduleSettings: {
        enabled: false,
        days: [1, 2, 3, 4, 5],
        timeRanges: [
          { name: 'Matin', start: '09:00', end: '12:00' },
          { name: 'Après-midi', start: '14:00', end: '18:00' }
        ]
      },
      categorySettings: {
        social: false,
        video: false,
        news: false,
        games: false,
        shopping: false
      },
      settings: {
        blockingMode: 'standard',
        notifyBlocked: true,
        notifySession: false,
        notifyStats: false
      },
      focusSettings: {
        preferInputs: true,
        focusDelay: 500,
        highlightFocused: true,
        focusIndicator: 'highlight',
        autoSubmit: false
      },
      theme: 'blue'
    };
    
    // Sauvegarder les paramètres par défaut
    chrome.storage.sync.set(defaultSettings, () => {
      // Recharger les données
      loadData();
      
      showNotification('Paramètres réinitialisés', 'success');
    });
  }
}

// Démarrer une session Pomodoro
function startPomodoro() {
  chrome.runtime.sendMessage({ action: 'startPomodoro' }, (response) => {
    if (response && response.success) {
      // Mettre à jour l'interface
      document.getElementById('start-pomodoro').disabled = true;
      document.getElementById('pause-pomodoro').disabled = false;
      document.getElementById('reset-pomodoro').disabled = false;
      
      // Mettre à jour le cercle de progression
      updatePomodoroCircle(1);
      
      // Mettre à jour le timer
      updatePomodoroTimer(25 * 60);
      
      // Afficher une notification
      showNotification('Session Pomodoro démarrée (25 minutes)', 'success');
    }
  });
}

// Mettre en pause une session Pomodoro
function pausePomodoro() {
  // Cette fonctionnalité nécessiterait de stocker l'état de la pause dans le stockage
  // Pour cet exemple, on se contente d'afficher une notification
  showNotification('Fonctionnalité de pause pas encore implémentée', 'info');
}

// Réinitialiser une session Pomodoro
function resetPomodoro() {
  // Réinitialiser l'interface
  document.getElementById('start-pomodoro').disabled = false;
  document.getElementById('pause-pomodoro').disabled = true;
  document.getElementById('reset-pomodoro').disabled = true;
  
  // Réinitialiser le cercle de progression
  updatePomodoroCircle(0);
  
  // Réinitialiser le timer
  updatePomodoroTimer(25 * 60);
  
  // Afficher une notification
  showNotification('Session Pomodoro réinitialisée', 'info');
}

// Mettre à jour le cercle de progression du Pomodoro
function updatePomodoroCircle(progress) {
  const circle = document.querySelector('.timer-circle-progress');
  if (circle) {
    const circumference = 2 * Math.PI * 65; // 2πr, où r = 65
    const offset = circumference * (1 - progress);
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  }
}

// Mettre à jour l'affichage du timer Pomodoro
function updatePomodoroTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const timerValue = document.querySelector('.timer-value');
  if (timerValue) {
    timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Charger une citation aléatoire
function loadRandomQuote() {
  const quote = window.gamification.getRandomQuote();
  
  const quoteText = document.getElementById('quote-text');
  if (quoteText) {
    quoteText.textContent = quote.text;
  }
  
  const quoteAuthor = document.getElementById('quote-author');
  if (quoteAuthor) {
    quoteAuthor.textContent = `- ${quote.author}`;
  }
}

// Afficher une notification
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  
  if (notification) {
    // Définir le contenu et le type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Afficher la notification
    notification.classList.add('show');
    
    // Masquer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Vérifier si une chaîne est un domaine valide
function isValidDomain(domain) {
  // Regex très simple pour vérifier le format d'un domaine
  const regex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
}

// Formater le temps (minutes -> heures et minutes)
function formatTime(minutes) {
  if (!minutes || minutes === 0) return '0h';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}