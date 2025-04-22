document.addEventListener('DOMContentLoaded', function() {
  // Initialisation des onglets
  initTabs();
  
  // Chargement des données depuis le stockage
  loadData();
  
  // Initialisation des graphiques
  initCharts();
  
  // Gestion des événements
  setupEventListeners();
  
  // Initialisation des modales
  initModals();
});

// Système d'onglets
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons et contenus
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Ajouter la classe active au bouton cliqué et au contenu correspondant
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

// Chargement des données depuis le stockage Chrome
function loadData() {
  chrome.storage.sync.get([
    'stats',
    'blockedSites',
    'whitelist',
    'scheduleSettings',
    'categorySettings',
    'settings',
    'focusSettings',
    'advancedSettings'
  ], (data) => {
    // Mise à jour du tableau de bord
    updateDashboard(data.stats);
    
    // Mise à jour des paramètres avancés
    updateAdvancedSettings(data.advancedSettings || {});
    
    // Chargement des règles d'automatisation
    loadRules(data.rules || []);
  });
}

// Mise à jour du tableau de bord avec les statistiques
function updateDashboard(stats) {
  if (!stats) return;
  
  // Mise à jour des statistiques globales
  document.getElementById('total-blocked').textContent = stats.blockedCount || 0;
  document.getElementById('total-time').textContent = formatTime(stats.totalFocusTime || 0);
  document.getElementById('sessions-completed').textContent = stats.focusSessions?.length || 0;
  
  // Calcul du score de productivité (formule exemple)
  const productivity = calculateProductivityScore(stats);
  document.getElementById('productivity-score').textContent = `${productivity}%`;
  
  // Mise à jour de la liste des sites les plus bloqués
  updateTopBlockedSites(stats.blockedSites || {});
  
  // Mise à jour des graphiques
  updateCharts(stats);
}

// Calcul d'un score de productivité basé sur les stats
function calculateProductivityScore(stats) {
  if (!stats) return 0;
  
  // Formule exemple: (temps de concentration / nombre de sites bloqués)
  // Plus le score est élevé, plus l'utilisateur a été concentré
  const focusTime = stats.totalFocusTime || 0;
  const blockCount = stats.blockedCount || 1; // Éviter division par zéro
  
  let score = Math.min(Math.round((focusTime / blockCount) * 10), 100);
  
  // Bonus pour les sessions complétées
  const sessionsBonus = Math.min((stats.focusSessions?.length || 0) * 5, 20);
  score = Math.min(score + sessionsBonus, 100);
  
  return score;
}

// Mise à jour de la liste des sites les plus bloqués
function updateTopBlockedSites(blockedSites) {
  const container = document.getElementById('top-sites-list');
  container.innerHTML = '';
  
  if (!blockedSites || Object.keys(blockedSites).length === 0) {
    container.innerHTML = '<p class="empty-state">Aucun site n\'a encore été bloqué</p>';
    return;
  }
  
  // Conversion de l'objet en tableau pour trier
  const sites = Object.entries(blockedSites)
    .sort((a, b) => b[1] - a[1]) // Tri par nombre de blocages décroissant
    .slice(0, 5); // Prendre les 5 premiers
  
  // Trouver la valeur maximale pour calculer les pourcentages de la barre de progression
  const maxCount = sites[0][1];
  
  sites.forEach(([domain, count]) => {
    const percentage = Math.round((count / maxCount) * 100);
    
    const item = document.createElement('div');
    item.className = 'progress-item';
    item.innerHTML = `
      <div class="progress-label">${domain}</div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${percentage}%;"></div>
        <div class="progress-value">${count} fois</div>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// Initialisation des graphiques
function initCharts() {
  // Créer un graphique vide pour l'évolution de la productivité
  const productivityCtx = document.getElementById('productivity-chart').getContext('2d');
  window.productivityChart = new Chart(productivityCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Score de productivité',
        data: [],
        borderColor: '#4285F4',
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20
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
  
  // Créer un graphique vide pour les sessions par jour
  const sessionsCtx = document.getElementById('sessions-chart').getContext('2d');
  window.sessionsChart = new Chart(sessionsCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Sessions Pomodoro',
        data: [],
        backgroundColor: '#4285F4'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
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
}

// Mise à jour des graphiques avec les données
function updateCharts(stats) {
  if (!stats) return;
  
  // Préparer les données pour le graphique d'évolution de la productivité
  // Pour l'exemple, nous générons des données sur les 7 derniers jours
  const productivityData = generateProductivityData(stats);
  
  // Mise à jour du graphique de productivité
  window.productivityChart.data.labels = productivityData.labels;
  window.productivityChart.data.datasets[0].data = productivityData.data;
  window.productivityChart.update();
  
  // Préparer les données pour le graphique des sessions par jour
  const sessionData = generateSessionData(stats.focusSessions || []);
  
  // Mise à jour du graphique des sessions
  window.sessionsChart.data.labels = sessionData.labels;
  window.sessionsChart.data.datasets[0].data = sessionData.data;
  window.sessionsChart.update();
}

// Génération de données d'exemple pour l'évolution de la productivité
function generateProductivityData(stats) {
  const labels = [];
  const data = [];
  
  // Générer des données pour les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Format jour mois (ex: 15 avril)
    const formattedDate = `${date.getDate()} ${date.toLocaleString('fr-FR', { month: 'short' })}`;
    labels.push(formattedDate);
    
    // Générer un score qui augmente progressivement
    // (dans une vraie implémentation, on utiliserait des données réelles)
    const currentScore = calculateProductivityScore(stats);
    // Varier légèrement le score pour chaque jour
    const dayVariation = Math.floor(Math.random() * 10) - 5; // -5 à +5
    let dayScore = Math.max(Math.min(currentScore + dayVariation - (i * 3), 100), 0);
    
    // Ajouter un bonus pour aujourd'hui
    if (i === 0) {
      dayScore = currentScore;
    }
    
    data.push(dayScore);
  }
  
  return { labels, data };
}

// Génération de données pour les sessions par jour
function generateSessionData(sessions) {
  const labels = [];
  const data = [];
  const counts = {};
  
  // Générer des labels pour les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Format jour mois (ex: 15 avril)
    const formattedDate = `${date.getDate()} ${date.toLocaleString('fr-FR', { month: 'short' })}`;
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    labels.push(formattedDate);
    counts[dateKey] = 0;
  }
  
  // Compter les sessions par jour
  if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const dateKey = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (counts[dateKey] !== undefined) {
        counts[dateKey]++;
      }
    });
  }
  
  // Convertir les comptages en tableau de données
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    data.push(counts[dateKey] || 0);
  }
  
  return { labels, data };
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Écouteurs pour le tableau de bord
  document.getElementById('export-stats').addEventListener('click', exportStats);
  document.getElementById('reset-stats').addEventListener('click', resetStats);
  
  // Écouteurs pour les paramètres avancés
  document.getElementById('save-advanced').addEventListener('click', saveAdvancedSettings);
  document.getElementById('reset-advanced').addEventListener('click', resetAdvancedSettings);
  
  // Écouteurs pour la méthode de blocage qui affiche/masque des options supplémentaires
  const blockMethodSelect = document.getElementById('block-method');
  blockMethodSelect.addEventListener('change', function() {
    const method = this.value;
    
    // Masquer tous les conteneurs d'options
    document.getElementById('redirect-site-container').style.display = 'none';
    document.getElementById('delay-time-container').style.display = 'none';
    document.getElementById('quota-time-container').style.display = 'none';
    
    // Afficher le conteneur approprié selon la méthode sélectionnée
    if (method === 'redirect') {
      document.getElementById('redirect-site-container').style.display = 'block';
    } else if (method === 'delay') {
      document.getElementById('delay-time-container').style.display = 'block';
    } else if (method === 'quota') {
      document.getElementById('quota-time-container').style.display = 'block';
    }
  });
  
  // Écouteurs pour l'automatisation
  document.getElementById('add-rule').addEventListener('click', showRuleModal);
  document.getElementById('save-automation').addEventListener('click', saveAutomationSettings);
  
  // Écouteurs pour la synchronisation
  document.getElementById('sync-cloud').addEventListener('change', function() {
    document.getElementById('cloud-options').style.display = this.checked ? 'block' : 'none';
  });
  
  document.getElementById('sync-local').addEventListener('change', function() {
    document.getElementById('cloud-options').style.display = this.checked ? 'none' : 'block';
  });
  
  document.getElementById('save-sync').addEventListener('click', saveSyncSettings);
  document.getElementById('export-all').addEventListener('click', exportAllData);
  document.getElementById('import-all').addEventListener('click', importAllData);
  
  // Écouteurs pour le type d'action dans la modal des règles
  document.getElementById('action-type').addEventListener('change', function() {
    document.getElementById('mode-action').style.display = 
      this.value === 'mode' ? 'block' : 'none';
  });
  
  // Écouteurs pour le type de condition dans la modal des règles
  document.getElementById('condition-type').addEventListener('change', function() {
    const conditionType = this.value;
    document.getElementById('time-condition').style.display = 'none';
    document.getElementById('day-condition').style.display = 'none';
    
    if (conditionType === 'time') {
      document.getElementById('time-condition').style.display = 'block';
    } else if (conditionType === 'day') {
      document.getElementById('day-condition').style.display = 'block';
    }
  });
}

// Initialisation des modales
function initModals() {
  // Fermeture de la modale avec le bouton de fermeture
  document.querySelector('.close-modal').addEventListener('click', closeRuleModal);
  
  // Fermeture de la modale avec le bouton Annuler
  document.getElementById('cancel-rule').addEventListener('click', closeRuleModal);
  
  // Enregistrement de la règle
  document.getElementById('save-rule').addEventListener('click', saveRule);
  
  // Délégation d'événements pour les boutons d'édition et de suppression des règles
  document.getElementById('rules-container').addEventListener('click', function(e) {
    if (e.target.closest('.edit-rule')) {
      const ruleItem = e.target.closest('.rule-item');
      const ruleId = ruleItem.dataset.ruleId;
      editRule(ruleId);
    } else if (e.target.closest('.delete-rule')) {
      const ruleItem = e.target.closest('.rule-item');
      const ruleId = ruleItem.dataset.ruleId;
      deleteRule(ruleId);
    }
  });
}

// Afficher la modale d'ajout de règle
function showRuleModal() {
  document.getElementById('rule-modal').classList.add('open');
}

// Fermer la modale d'ajout de règle
function closeRuleModal() {
  document.getElementById('rule-modal').classList.remove('open');
}

// Enregistrer une nouvelle règle
function saveRule() {
  const ruleName = document.getElementById('rule-name').value.trim();
  if (!ruleName) {
    alert('Veuillez donner un nom à la règle');
    return;
  }
  
  // Récupérer les conditions
  const conditionType = document.getElementById('condition-type').value;
  let condition = {};
  
  if (conditionType === 'time') {
    condition = {
      type: 'time',
      start: document.getElementById('time-start').value,
      end: document.getElementById('time-end').value
    };
  } else if (conditionType === 'day') {
    const selectedDays = Array.from(document.querySelectorAll('input[name="day"]:checked'))
      .map(cb => parseInt(cb.value));
    
    condition = {
      type: 'day',
      days: selectedDays
    };
  } else if (conditionType === 'location') {
    condition = {
      type: 'location',
      location: 'work' // Par défaut pour l'exemple
    };
  } else if (conditionType === 'app') {
    condition = {
      type: 'app',
      app: 'productivity' // Par défaut pour l'exemple
    };
  }
  
  // Récupérer les actions
  const actionType = document.getElementById('action-type').value;
  let action = {
    type: actionType
  };
  
  if (actionType === 'mode') {
    action.mode = document.getElementById('blocking-mode-select').value;
  }
  
  // Créer la règle
  const rule = {
    id: Date.now().toString(), // Identifiant unique basé sur le timestamp
    name: ruleName,
    conditions: [condition],
    actions: [action],
    enabled: true
  };
  
  // Sauvegarder la règle dans le stockage
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];
    rules.push(rule);
    chrome.storage.sync.set({ rules }, () => {
      // Rafraîchir l'affichage des règles
      loadRules(rules);
      // Fermer la modale
      closeRuleModal();
    });
  });
}

// Charger les règles depuis le stockage
function loadRules(rules) {
  const container = document.getElementById('rules-container');
  container.innerHTML = '';
  
  if (!rules || rules.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Aucune règle définie';
    container.appendChild(emptyState);
    return;
  }
  
  rules.forEach(rule => {
    const ruleElement = createRuleElement(rule);
    container.appendChild(ruleElement);
  });
}

// Créer un élément HTML pour une règle
function createRuleElement(rule) {
  const ruleItem = document.createElement('div');
  ruleItem.className = 'rule-item';
  ruleItem.dataset.ruleId = rule.id;
  
  const header = document.createElement('div');
  header.className = 'rule-header';
  header.innerHTML = `
    <h4>${rule.name}</h4>
    <div class="rule-actions">
      <button class="icon-btn edit-rule"><span class="icon">✏️</span></button>
      <button class="icon-btn delete-rule"><span class="icon">🗑️</span></button>
    </div>
  `;
  
  const body = document.createElement('div');
  body.className = 'rule-body';
  
  // Formatter les conditions
  const conditionsText = rule.conditions.map(condition => {
    if (condition.type === 'time') {
      return `Heure entre ${condition.start} et ${condition.end}`;
    } else if (condition.type === 'day') {
      const dayNames = {
        0: 'Di', 1: 'Lu', 2: 'Ma', 3: 'Me', 4: 'Je', 5: 'Ve', 6: 'Sa'
      };
      const days = condition.days.map(day => dayNames[day]).join(', ');
      return `Jours: ${days}`;
    } else if (condition.type === 'location') {
      return `Localisation: ${condition.location}`;
    } else if (condition.type === 'app') {
      return `Application active: ${condition.app}`;
    }
    return '';
  }).join(' ET ');
  
  // Formatter les actions
  const actionsText = rule.actions.map(action => {
    if (action.type === 'enable') {
      return 'Activer Auto-Focus';
    } else if (action.type === 'disable') {
      return 'Désactiver Auto-Focus';
    } else if (action.type === 'mode') {
      return `Mode blocage: ${action.mode}`;
    }
    return '';
  }).join(', ');
  
  body.innerHTML = `
    <div class="rule-condition"><strong>Si:</strong> ${conditionsText}</div>
    <div class="rule-action"><strong>Alors:</strong> ${actionsText}</div>
  `;
  
  ruleItem.appendChild(header);
  ruleItem.appendChild(body);
  
  return ruleItem;
}

// Éditer une règle existante
function editRule(ruleId) {
  // Récupérer les règles et trouver celle à éditer
  chrome.storage.sync.get('rules', (data) => {
    const rules = data.rules || [];
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) return;
    
    // Remplir le formulaire avec les données de la règle
    document.getElementById('rule-name').value = rule.name;
    
    // Pour simplifier, on ne gère que la première condition et action
    if (rule.conditions && rule.conditions.length > 0) {
      const condition = rule.conditions[0];
      document.getElementById('condition-type').value = condition.type;
      
      // Masquer tous les conteneurs de condition
      document.getElementById('time-condition').style.display = 'none';
      document.getElementById('day-condition').style.display = 'none';
      
      // Afficher et remplir le conteneur approprié
      if (condition.type === 'time') {
        document.getElementById('time-condition').style.display = 'block';
        document.getElementById('time-start').value = condition.start;
        document.getElementById('time-end').value = condition.end;
      } else if (condition.type === 'day') {
        document.getElementById('day-condition').style.display = 'block';
        // Décocher toutes les cases
        document.querySelectorAll('input[name="day"]').forEach(cb => {
          cb.checked = false;
        });
        // Cocher celles qui sont dans la condition
        condition.days.forEach(day => {
          const checkbox = document.querySelector(`input[name="day"][value="${day}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
    }
    
    if (rule.actions && rule.actions.length > 0) {
      const action = rule.actions[0];
      document.getElementById('action-type').value = action.type;
      
      // Masquer le conteneur d'action de mode
      document.getElementById('mode-action').style.display = 'none';
      
      // Afficher et remplir si nécessaire
      if (action.type === 'mode') {
        document.getElementById('mode-action').style.display = 'block';
        document.getElementById('blocking-mode-select').value = action.mode;
      }
    }
    
    // Sauvegarder l'ID de la règle à éditer dans un attribut data
    document.getElementById('save-rule').dataset.editRuleId = ruleId;
    
    // Afficher la modale
    showRuleModal();
  });
}

// Supprimer une règle
function deleteRule(ruleId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
    chrome.storage.sync.get('rules', (data) => {
      const rules = data.rules || [];
      const updatedRules = rules.filter(r => r.id !== ruleId);
      
      chrome.storage.sync.set({ rules: updatedRules }, () => {
        loadRules(updatedRules);
      });
    });
  }
}

// Exporter les statistiques
function exportStats() {
  chrome.storage.sync.get('stats', (data) => {
    const stats = data.stats || {};
    const statsJson = JSON.stringify(stats, null, 2);
    const blob = new Blob([statsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auto-focus-stats.json';
    a.click();
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  });
}

// Réinitialiser les statistiques
function resetStats() {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos statistiques ? Cette action ne peut pas être annulée.')) {
    chrome.runtime.sendMessage({ action: 'resetStats' }, (response) => {
      if (response.success) {
        alert('Statistiques réinitialisées avec succès');
        // Recharger les données
        loadData();
      }
    });
  }
}

// Mettre à jour l'affichage des paramètres avancés
function updateAdvancedSettings(settings) {
  // Paramètres de blocage
  document.getElementById('block-level').value = settings.blockLevel || 'moderate';
  document.getElementById('block-method').value = settings.blockMethod || 'page';
  document.getElementById('redirect-site').value = settings.redirectSite || '';
  document.getElementById('delay-time').value = settings.delayTime || 30;
  document.getElementById('quota-time').value = settings.quotaTime || 30;
  
  // Paramètres d'auto-focus
  document.getElementById('smart-focus').checked = settings.smartFocus !== false;
  document.getElementById('remember-focus').checked = settings.rememberFocus || false;
  document.getElementById('keyboard-navigation').checked = settings.keyboardNavigation || false;
  document.getElementById('focus-indicator').value = settings.focusIndicator || 'highlight';
  
  // Afficher ou masquer des options selon la méthode de blocage
  const blockMethod = settings.blockMethod || 'page';
  document.getElementById('redirect-site-container').style.display = blockMethod === 'redirect' ? 'block' : 'none';
  document.getElementById('delay-time-container').style.display = blockMethod === 'delay' ? 'block' : 'none';
  document.getElementById('quota-time-container').style.display = blockMethod === 'quota' ? 'block' : 'none';
}

// Enregistrer les paramètres avancés
function saveAdvancedSettings() {
  const advancedSettings = {
    // Paramètres de blocage
    blockLevel: document.getElementById('block-level').value,
    blockMethod: document.getElementById('block-method').value,
    redirectSite: document.getElementById('redirect-site').value,
    delayTime: parseInt(document.getElementById('delay-time').value),
    quotaTime: parseInt(document.getElementById('quota-time').value),
    
    // Paramètres d'auto-focus
    smartFocus: document.getElementById('smart-focus').checked,
    rememberFocus: document.getElementById('remember-focus').checked,
    keyboardNavigation: document.getElementById('keyboard-navigation').checked,
    focusIndicator: document.getElementById('focus-indicator').value
  };
  
  chrome.storage.sync.set({ advancedSettings }, () => {
    showNotification('Paramètres avancés enregistrés avec succès', 'success');
  });
}

// Réinitialiser les paramètres avancés
function resetAdvancedSettings() {
  const defaultSettings = {
    blockLevel: 'moderate',
    blockMethod: 'page',
    redirectSite: '',
    delayTime: 30,
    quotaTime: 30,
    smartFocus: true,
    rememberFocus: false,
    keyboardNavigation: false,
    focusIndicator: 'highlight'
  };
  
  // Mettre à jour l'interface
  updateAdvancedSettings(defaultSettings);
  
  // Enregistrer les paramètres par défaut
  chrome.storage.sync.set({ advancedSettings: defaultSettings }, () => {
    showNotification('Paramètres avancés réinitialisés', 'info');
  });
}

// Enregistrer les paramètres d'automatisation
function saveAutomationSettings() {
  // Les règles sont déjà sauvegardées via saveRule()
  
  const automationSettings = {
    integrateCalendar: document.getElementById('integrate-calendar').checked,
    integrateTasks: document.getElementById('integrate-tasks').checked,
    integrateLocation: document.getElementById('integrate-location').checked
  };
  
  chrome.storage.sync.set({ automationSettings }, () => {
    showNotification('Paramètres d\'automatisation enregistrés avec succès', 'success');
  });
}

// Enregistrer les paramètres de synchronisation
function saveSyncSettings() {
  const syncMethod = document.getElementById('sync-cloud').checked ? 'cloud' : 'local';
  
  const syncSettings = {
    method: syncMethod,
    email: document.getElementById('sync-email').value,
    syncStats: document.getElementById('sync-stats').checked,
    syncSettings: document.getElementById('sync-settings').checked,
    syncLists: document.getElementById('sync-lists').checked
  };
  
  chrome.storage.sync.set({ syncSettings }, () => {
    showNotification('Paramètres de synchronisation enregistrés avec succès', 'success');
  });
}

// Exporter toutes les données
function exportAllData() {
  chrome.storage.sync.get(null, (data) => {
    const dataJson = JSON.stringify(data, null, 2);
    const blob = new Blob([dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auto-focus-all-data.json';
    a.click();
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  });
}

// Importer toutes les données
function importAllData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (confirm('Êtes-vous sûr de vouloir importer ces données ? Cela remplacera toutes vos données actuelles.')) {
          chrome.storage.sync.set(data, () => {
            showNotification('Données importées avec succès. La page va être rechargée.', 'success');
            setTimeout(() => {
              location.reload();
            }, 2000);
          });
        }
      } catch (error) {
        showNotification('Erreur lors de l\'importation: format de fichier invalide', 'error');
      }
    };
    
    reader.readAsText(file);
  });
  
  input.click();
}

// Fonction utilitaire pour formater le temps
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

// Afficher une notification
function showNotification(message, type = 'info') {
  // Vérifier si une notification existe déjà
  let notification = document.querySelector('.notification');
  
  // Si non, en créer une nouvelle
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Ajouter la classe de type et définir le message
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Afficher la notification
  notification.classList.add('show');
  
  // La masquer après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}