// Content script to detect paywalls and provide user interface

// Initialize content script
initializeContentScript();

function initializeContentScript() {
  // Get current settings and check if site is paywalled
  chrome.runtime.sendMessage({ action: 'getSettings' }, (settingsResponse) => {
    if (settingsResponse && settingsResponse.enabled) {
      chrome.runtime.sendMessage({
        action: 'checkPaywall',
        url: window.location.href
      }, (paywallResponse) => {
        if (paywallResponse && paywallResponse.isPaywalled) {
          // Check if this is an article page
          chrome.runtime.sendMessage({
            action: 'isArticlePage',
            url: window.location.href
          }, (articleResponse) => {
            const isArticle = articleResponse && articleResponse.isArticle;

            // Always detect and remove paywall elements
            detectPaywallElements();

            // Only add archive button in manual mode, or on homepages in automatic mode
            if (settingsResponse.redirectMode === 'manual' ||
                (settingsResponse.redirectMode === 'automatic' && !isArticle)) {
              addArchiveButton();
            }
          });
        }
      });
    }
  });
}

// Function to detect common paywall elements
function detectPaywallElements() {
  const paywallSelectors = [
    '[class*="paywall"]',
    '[class*="subscription"]',
    '[class*="premium"]',
    '[class*="subscriber"]',
    '[id*="paywall"]',
    '[id*="subscription"]',
    '.piano-template-container',
    '.tp-modal',
    '.meter-limit',
    '.article-meter',
    '.overlay',
    '.subscription-required',
    '.premium-content'
  ];

  let paywallDetected = false;

  paywallSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      paywallDetected = true;
      elements.forEach(el => {
        if (el.offsetHeight > 50 && el.offsetWidth > 100) {
          el.style.display = 'none';
        }
      });
    }
  });

  // Check for blurred content
  const blurredElements = document.querySelectorAll('[style*="blur"], .blurred, .fade-out');
  if (blurredElements.length > 0) {
    paywallDetected = true;
    blurredElements.forEach(el => {
      el.style.filter = 'none';
      el.style.opacity = '1';
    });
  }

  // Remove scroll lock
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';

  return paywallDetected;
}

// Add floating archive button
function addArchiveButton() {
  // Check if button already exists
  if (document.getElementById('archive-extension-button')) {
    return;
  }

  const button = document.createElement('div');
  button.id = 'archive-extension-button';
  button.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      border: none;
      user-select: none;
    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
      📚 View on Archive.ph
    </div>
  `;

  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'redirectToArchive',
      url: window.location.href
    });
  });

  document.body.appendChild(button);

  // Auto-hide button after 10 seconds
  setTimeout(() => {
    if (button.parentNode) {
      button.style.opacity = '0.3';
      button.style.transform = 'scale(0.8)';
    }
  }, 10000);

  // Show button on hover
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
    button.style.transform = 'scale(1)';
  });
}

// Monitor for dynamically added paywall elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      detectPaywallElements();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});