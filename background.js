// ORBIT Background Service Worker
// Handles authentication state, messaging, and webhook requests

console.log('🚀 ORBIT Background Service Worker Initialized');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('ORBIT installed');
  
  chrome.storage.local.set({
    authState: {
      signedIn: false,
      email: null,
      signInTime: null
    },
    stats: {
      commentsAnalyzed: 0,
      responsesGenerated: 0,
      timeSaved: 0,
      repliesApproved: 0,
      lastActive: Date.now()
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request.action);
  
  if (request.action === 'getAuthState') {
    handleGetAuthState().then(sendResponse);
    return true;
  }
  
  if (request.action === 'getStats') {
    handleGetStats().then(sendResponse);
    return true;
  }
  
  if (request.action === 'sendWebhook') {
    handleSendWebhook(request.url, request.payload)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Get auth state
async function handleGetAuthState() {
  const result = await chrome.storage.local.get('authState');
  return { authState: result.authState || { signedIn: false } };
}

// Get stats
async function handleGetStats() {
  const { stats } = await chrome.storage.local.get('stats');
  return { success: true, stats };
}

// Send webhook alert
async function handleSendWebhook(url, payload) {
  if (!url || !payload) {
    return { success: false, error: 'Missing URL or payload' };
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('ORBIT: Webhook sent successfully');
    return { success: true };
  } catch (error) {
    console.error('ORBIT: Webhook failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('✅ ORBIT Background Service Worker Ready');
