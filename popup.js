// Popup script for extension settings and controls

// Helper function to send messages and handle promises
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  const enabledToggle = document.getElementById('enabled');
  const redirectModeSelect = document.getElementById('redirectMode');
  const archiveButton = document.getElementById('archiveCurrentPage');
  const statusDiv = document.getElementById('status');

  // Load current settings
  try {
    const response = await sendMessage({ action: 'getSettings' });
    if (response && response.enabled !== undefined) {
      enabledToggle.checked = response.enabled;
      redirectModeSelect.value = response.redirectMode || 'automatic';
      updateStatus(response.enabled);
      console.log('Settings loaded in popup:', response);
    } else {
      // Fallback to default settings
      enabledToggle.checked = true;
      redirectModeSelect.value = 'automatic';
      updateStatus(true);
      console.log('Using default settings');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    // Set defaults on error
    enabledToggle.checked = true;
    redirectModeSelect.value = 'automatic';
    updateStatus(true);
  }

  // Handle enabled toggle
  enabledToggle.addEventListener('change', async function() {
    const enabled = this.checked;
    try {
      const response = await sendMessage({
        action: 'updateSettings',
        settings: { enabled: enabled }
      });
      if (response && response.success) {
        updateStatus(enabled);
        showTemporaryMessage('Settings saved!', 'success');
        console.log('Enabled setting updated:', enabled);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error updating enabled setting:', error);
      showTemporaryMessage('Failed to save settings', 'error');
      // Revert toggle on error
      this.checked = !enabled;
    }
  });

  // Handle redirect mode change
  redirectModeSelect.addEventListener('change', async function() {
    const redirectMode = this.value;
    try {
      // If extension is disabled, automatically enable it when user changes redirect mode
      const settingsToUpdate = { redirectMode: redirectMode };
      if (!enabledToggle.checked) {
        settingsToUpdate.enabled = true;
        enabledToggle.checked = true;
        updateStatus(true);
        console.log('Auto-enabling extension due to redirect mode change');
      }

      const response = await sendMessage({
        action: 'updateSettings',
        settings: settingsToUpdate
      });
      if (response && response.success) {
        showTemporaryMessage('Settings saved!', 'success');
        console.log('Redirect mode updated:', redirectMode);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error updating redirect mode:', error);
      showTemporaryMessage('Failed to save settings', 'error');
    }
  });

  // Handle archive current page button
  archiveButton.addEventListener('click', async function() {
    try {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });

      const currentTab = tabs[0];
      if (currentTab) {
        const response = await sendMessage({
          action: 'redirectToArchive',
          url: currentTab.url
        });

        if (response && response.success) {
          showTemporaryMessage('Redirecting to archive...', 'success');
          setTimeout(() => window.close(), 1000);
        } else {
          throw new Error('Failed to redirect');
        }
      }
    } catch (error) {
      console.error('Error redirecting to archive:', error);
      showTemporaryMessage('Failed to redirect', 'error');
    }
  });

  // Check if current page is paywalled
  try {
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });

    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const response = await sendMessage({
        action: 'checkPaywall',
        url: currentTab.url
      });

      if (response && response.isPaywalled) {
        archiveButton.style.background = '#FF6B6B';
        archiveButton.textContent = '📚 Archive This Paywalled Page';
      } else {
        archiveButton.style.background = '#6c757d';
        archiveButton.textContent = '📚 Archive Current Page';
      }
    }
  } catch (error) {
    console.error('Error checking paywall status:', error);
  }

  function updateStatus(enabled) {
    if (enabled) {
      statusDiv.className = 'status enabled';
      statusDiv.textContent = '✅ Extension Enabled';
    } else {
      statusDiv.className = 'status disabled';
      statusDiv.textContent = '❌ Extension Disabled';
    }
  }

  function showTemporaryMessage(message, type) {
    const originalContent = statusDiv.textContent;
    const originalClass = statusDiv.className;

    statusDiv.textContent = message;
    statusDiv.className = `status ${type === 'success' ? 'enabled' : 'disabled'}`;

    setTimeout(() => {
      statusDiv.textContent = originalContent;
      statusDiv.className = originalClass;
    }, 2000);
  }
});