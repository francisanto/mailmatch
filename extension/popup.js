document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = document.querySelectorAll('.nav-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const statusDot = document.querySelector('.status-dot');
  const statusLabel = document.getElementById('status-label');
  const automatchToggle = document.getElementById('toggle-automatch');
  const autoBadge = document.getElementById('auto-badge');
  const backendUrlInput = document.getElementById('backend-url');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const logList = document.getElementById('log-list');
  const logEmptyState = document.getElementById('log-empty-state');

  // Load configuration from local storage
  const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function loadSettings() {
    if (isChromeExtension) {
      chrome.storage.local.get({
        automatch: true,
        backendUrl: 'http://localhost:8000',
        logs: []
      }, (items) => {
        automatchToggle.checked = items.automatch;
        backendUrlInput.value = items.backendUrl;
        updateBadge(items.automatch);
        renderLogs(items.logs);
        checkBackendStatus(items.backendUrl);
      });
    } else {
      // Local development fallback
      const automatch = localStorage.getItem('automatch') !== 'false';
      const backendUrl = localStorage.getItem('backendUrl') || 'http://localhost:8000';
      automatchToggle.checked = automatch;
      backendUrlInput.value = backendUrl;
      updateBadge(automatch);
      renderLogs([]);
      checkBackendStatus(backendUrl);
    }
  }

  function updateBadge(active) {
    if (active) {
      autoBadge.textContent = 'Active';
      autoBadge.style.background = 'rgba(168, 85, 247, 0.15)';
      autoBadge.style.color = '#a855f7';
      autoBadge.style.borderColor = 'rgba(168, 85, 247, 0.3)';
    } else {
      autoBadge.textContent = 'Paused';
      autoBadge.style.background = 'rgba(255, 255, 255, 0.05)';
      autoBadge.style.color = '#6b7280';
      autoBadge.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
  }

  // Save Settings
  btnSaveSettings.addEventListener('click', () => {
    const url = backendUrlInput.value.trim();
    if (isChromeExtension) {
      chrome.storage.local.set({ backendUrl: url }, () => {
        showSaveFeedback();
        checkBackendStatus(url);
      });
    } else {
      localStorage.setItem('backendUrl', url);
      showSaveFeedback();
      checkBackendStatus(url);
    }
  });

  function showSaveFeedback() {
    const originalText = btnSaveSettings.textContent;
    btnSaveSettings.textContent = 'Settings Saved!';
    btnSaveSettings.style.opacity = '0.8';
    setTimeout(() => {
      btnSaveSettings.textContent = originalText;
      btnSaveSettings.style.opacity = '1';
    }, 1500);
  }

  // Toggle Automatch
  automatchToggle.addEventListener('change', () => {
    const isChecked = automatchToggle.checked;
    updateBadge(isChecked);
    if (isChromeExtension) {
      chrome.storage.local.set({ automatch: isChecked });
    } else {
      localStorage.setItem('automatch', isChecked);
    }
  });

  // Navigation tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // Logs rendering
  function renderLogs(logs) {
    if (!logs || logs.length === 0) {
      logEmptyState.style.display = 'flex';
      const existingItems = logList.querySelectorAll('.log-item:not(#log-empty-state)');
      existingItems.forEach(el => el.remove());
      return;
    }

    logEmptyState.style.display = 'none';
    const existingItems = logList.querySelectorAll('.log-item:not(#log-empty-state)');
    existingItems.forEach(el => el.remove());

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = 'log-item';
      
      const timeSpan = document.createElement('span');
      timeSpan.style.color = 'var(--text-muted)';
      timeSpan.style.fontSize = '9px';
      timeSpan.textContent = new Date(log.timestamp).toLocaleTimeString();
      
      const textSpan = document.createElement('span');
      textSpan.style.fontWeight = '500';
      textSpan.style.marginTop = '2px';
      textSpan.textContent = log.message;

      item.appendChild(timeSpan);
      item.appendChild(textSpan);
      logList.appendChild(item);
    });
  }

  // Clear Logs
  btnClearLogs.addEventListener('click', () => {
    if (isChromeExtension) {
      chrome.storage.local.set({ logs: [] }, () => {
        renderLogs([]);
      });
    } else {
      renderLogs([]);
    }
  });

  // Ping backend to check status
  async function checkBackendStatus(url) {
    statusDot.className = 'status-dot connecting';
    statusLabel.textContent = 'Connecting...';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout

      const response = await fetch(`${url}/health`, { 
        method: 'GET',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        statusDot.className = 'status-dot connected';
        statusLabel.textContent = 'Online';
      } else {
        statusDot.className = 'status-dot disconnected';
        statusLabel.textContent = 'Err Status';
      }
    } catch (e) {
      statusDot.className = 'status-dot disconnected';
      statusLabel.textContent = 'Offline';
    }
  }

  // Initial load
  loadSettings();
});
