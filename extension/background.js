// MailMatch Chrome Extension Background Service Worker
console.log('[MailMatch] Service worker active');

// Initialize settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      automatch: true,
      backendUrl: 'http://localhost:8000',
      logs: [
        {
          timestamp: Date.now(),
          message: 'MailMatch installed and initialized.'
        }
      ]
    });
  }
});

// Listener for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'logMessage') {
    addLog(request.message);
    sendResponse({ success: true });
  } else if (request.action === 'parseEmail') {
    processEmailContent(request.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => {
        addLog(`Error parsing: ${err.message}`);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep response channel open for async fetch
  }
});

// Helper function to append to log history in storage
function addLog(messageText) {
  chrome.storage.local.get({ logs: [] }, (items) => {
    const updatedLogs = [
      { timestamp: Date.now(), message: messageText },
      ...items.logs
    ].slice(0, 30); // Cap at 30 entries
    chrome.storage.local.set({ logs: updatedLogs });
  });
}

// POST email text content to the backend matching service
async function processEmailContent(payload) {
  const { backendUrl } = await new Promise(res => {
    chrome.storage.local.get({ backendUrl: 'http://localhost:8000' }, res);
  });

  const response = await fetch(`${backendUrl}/api/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Server returned status: ${response.status}`);
  }

  const result = await response.json();
  addLog(`Match success: ${result.match_found ? 'Matched' : 'No Match'} (${result.category})`);
  return result;
}
