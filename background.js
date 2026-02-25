// ORBIT Background Service Worker
// Handles authentication state and basic messaging

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

// Listen for messages
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

console.log('✅ ORBIT Background Service Worker Ready');
