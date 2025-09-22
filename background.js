// Import paywall sites list
importScripts('paywall-sites.js');

// Extension settings with defaults
let settings = {
  enabled: true,
  redirectMode: 'automatic'
};

// Initialize extension settings
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.set(settings);
  console.log('Extension installed with default settings');
});

// Load settings from storage on startup
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['enabled', 'redirectMode']);
    settings.enabled = result.enabled !== false;
    settings.redirectMode = result.redirectMode || 'automatic';
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load settings when service worker starts
loadSettings();

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    settings.enabled = changes.enabled.newValue;
  }
  if (changes.redirectMode) {
    settings.redirectMode = changes.redirectMode.newValue;
  }
  console.log('Settings updated:', settings);
});

// Function to redirect to archive.ph newest version
function redirectToArchive(url) {
  // Use the "newest" endpoint to get the most recent archived version
  // If no archived version exists, archive.ph will redirect to the search/submit page
  const archiveUrl = `https://archive.ph/newest/${url}`;
  return archiveUrl;
}

// Function to create a fallback archive URL (search results)
function getFallbackArchiveUrl(url) {
  return `https://archive.ph/${url}`;
}

// Handle navigation to check for paywalled sites
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId !== 0) {
    return;
  }

  // Quick synchronous checks first
  const url = new URL(details.url);
  const hostname = url.hostname;

  // Skip if already on archive.ph to prevent loops
  if (hostname.includes('archive.ph') || hostname.includes('archive.today')) {
    return;
  }

  // Quick check if this is a paywalled site (synchronous)
  if (!isPaywalledSite(hostname)) {
    return;
  }

  // Quick check if extension is enabled (use cached settings)
  if (!settings.enabled) {
    console.log('Extension disabled, skipping redirect for:', details.url);
    return;
  }

  // Quick article detection (synchronous)
  const isArticle = isArticlePage(details.url);

  // Fast redirect decision
  if (settings.redirectMode === 'automatic' && isArticle) {
    // Immediate redirect for articles in automatic mode
    const archiveUrl = redirectToArchive(details.url);
    console.log('Fast auto-redirecting article to:', archiveUrl);
    chrome.tabs.update(details.tabId, { url: archiveUrl }).catch(error => {
      console.error('Error redirecting:', error);
    });
    return;
  }

  // Handle non-article pages and manual mode asynchronously
  handleNonImmediateRedirect(details, isArticle);
});

// Handle cases that don't need immediate redirect
async function handleNonImmediateRedirect(details, isArticle) {
  try {
    const url = new URL(details.url);
    const hostname = url.hostname;

    console.log(`Paywalled site detected: ${hostname}, Mode: ${settings.redirectMode}, Article: ${isArticle}`);

    if (settings.redirectMode === 'automatic' && !isArticle) {
      // Homepage in automatic mode - show badge for manual option
      console.log('Showing badge for homepage in automatic mode');
      await chrome.action.setBadgeText({
        text: '🏠',
        tabId: details.tabId
      });
      await chrome.action.setBadgeBackgroundColor({
        color: '#FFA500',
        tabId: details.tabId
      });
      await chrome.storage.local.set({
        [`paywalled_${details.tabId}`]: details.url
      });
    } else if (settings.redirectMode === 'manual') {
      // Manual mode - show badge for both articles and homepages
      console.log('Setting badge for manual mode');
      await chrome.action.setBadgeText({
        text: isArticle ? '📚' : '🏠',
        tabId: details.tabId
      });
      await chrome.action.setBadgeBackgroundColor({
        color: isArticle ? '#FF6B6B' : '#FFA500',
        tabId: details.tabId
      });
      await chrome.storage.local.set({
        [`paywalled_${details.tabId}`]: details.url
      });
    }
  } catch (error) {
    console.error('Error in handleNonImmediateRedirect:', error);
  }
}

// Handle tab updates to maintain badge state
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await loadSettings();

    if (settings.enabled && settings.redirectMode === 'manual') {
      try {
        const url = new URL(tab.url);
        const hostname = url.hostname;

        // Skip archive sites
        if (hostname.includes('archive.ph') || hostname.includes('archive.today')) {
          await chrome.action.setBadgeText({ text: '', tabId: tabId });
          return;
        }

        // Check if this is a paywalled site and show badge
        if (isPaywalledSite(hostname)) {
          const isArticle = isArticlePage(tab.url);
          await chrome.action.setBadgeText({
            text: isArticle ? '📚' : '🏠',
            tabId: tabId
          });
          await chrome.action.setBadgeBackgroundColor({
            color: isArticle ? '#FF6B6B' : '#FFA500',
            tabId: tabId
          });
        } else {
          await chrome.action.setBadgeText({ text: '', tabId: tabId });
        }
      } catch (error) {
        console.error('Error updating badge:', error);
      }
    } else {
      // Clear badge if extension disabled or in automatic mode
      await chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});

// Clear badge and stored URL when tab is removed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.local.remove(`paywalled_${tabId}`);
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleAsync = async () => {
    try {
      if (request.action === 'redirectToArchive') {
        const archiveUrl = redirectToArchive(request.url);

        if (sender.tab) {
          // Called from content script
          await chrome.tabs.update(sender.tab.id, { url: archiveUrl });
        } else if (request.tabId) {
          // Called from popup with specific tab ID
          await chrome.tabs.update(request.tabId, { url: archiveUrl });
        } else {
          // Called from popup, get active tab
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]) {
            await chrome.tabs.update(tabs[0].id, { url: archiveUrl });
          } else {
            throw new Error('No active tab found');
          }
        }
        return { success: true };
      } else if (request.action === 'getSettings') {
        // Ensure we have the latest settings
        await loadSettings();
        return {
          enabled: settings.enabled,
          redirectMode: settings.redirectMode
        };
      } else if (request.action === 'updateSettings') {
        // Update local settings and storage
        Object.assign(settings, request.settings);
        await chrome.storage.sync.set(request.settings);
        console.log('Settings updated:', settings);
        return { success: true };
      } else if (request.action === 'checkPaywall') {
        const url = new URL(request.url);
        const isPaywalled = isPaywalledSite(url.hostname);
        return { isPaywalled: isPaywalled };
      } else if (request.action === 'isArticlePage') {
        const isArticle = isArticlePage(request.url);
        return { isArticle: isArticle };
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle async operations
  handleAsync().then(sendResponse);
  return true; // Keep message channel open for async response
});

// Handle extension icon click (for manual redirects)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if we have a stored paywalled URL for this tab
    const stored = await chrome.storage.local.get(`paywalled_${tab.id}`);
    const urlToArchive = stored[`paywalled_${tab.id}`] || tab.url;

    const url = new URL(urlToArchive);
    if (isPaywalledSite(url.hostname)) {
      const archiveUrl = redirectToArchive(urlToArchive);
      console.log('Manual redirect via icon click to:', archiveUrl);
      await chrome.tabs.update(tab.id, { url: archiveUrl });

      // Clear the stored URL and badge
      await chrome.storage.local.remove(`paywalled_${tab.id}`);
      await chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  } catch (error) {
    console.error('Error handling action click:', error);
  }
});