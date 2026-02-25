// ORBIT Popup Script
// Handles authentication state and user interactions

console.log('🚀 ORBIT Popup Loaded');

// DOM Elements
const elements = {
  signinSection: document.getElementById('signin-section'),
  dashboardSection: document.getElementById('dashboard-section'),
  statusIcon: document.getElementById('status-icon'),
  statusTitle: document.getElementById('status-title'),
  statusDesc: document.getElementById('status-desc'),
  signinBtn: document.getElementById('signin-btn'),
  statResponses: document.getElementById('stat-responses'),
  statTime: document.getElementById('stat-time'),
  statComments: document.getElementById('stat-comments'),
  statReplies: document.getElementById('stat-replies')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthState();
  await loadStats();
  setupEventListeners();
});

// Check authentication state
async function checkAuthState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAuthState' });
    const isSignedIn = response && response.authState && response.authState.signedIn;
    
    if (isSignedIn) {
      showDashboard();
    } else {
      showSignIn();
    }
  } catch (error) {
    console.error('Failed to check auth state:', error);
    showSignIn();
  }
}

// Show sign in screen
function showSignIn() {
  elements.signinSection.classList.remove('hidden');
  elements.dashboardSection.classList.add('hidden');
  
  elements.statusIcon.innerHTML = '<span class="status-dot"></span>';
  elements.statusTitle.textContent = 'Not Signed In';
  elements.statusDesc.textContent = 'Sign in to get started';
}

// Show dashboard
function showDashboard() {
  elements.signinSection.classList.add('hidden');
  elements.dashboardSection.classList.remove('hidden');
  
  elements.statusIcon.innerHTML = '<span class="status-dot active"></span>';
  elements.statusTitle.textContent = 'Signed In';
  elements.statusDesc.textContent = 'ORBIT is ready to help';
}

// Load stats
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    let repliesApproved = 0;
    
    if (response.success && response.stats) {
      elements.statResponses.textContent = response.stats.responsesGenerated || 0;
      elements.statTime.textContent = Math.floor((response.stats.timeSaved || 0) / 60) + 'h';
      elements.statComments.textContent = response.stats.commentsAnalyzed || 0;
      repliesApproved = response.stats.repliesApproved || 0;
    }
    
    const analyzedData = await chrome.storage.local.get('orbitAnalyzedData');
    if (analyzedData.orbitAnalyzedData) {
      const { responses, totalComments } = analyzedData.orbitAnalyzedData;
      if (responses !== undefined) elements.statResponses.textContent = responses;
      if (totalComments !== undefined) elements.statComments.textContent = totalComments;
    }
    
    // Get library count for Replies Approved
    const libraryData = await chrome.storage.local.get('orbit_library');
    if (libraryData.orbit_library) {
      repliesApproved = libraryData.orbit_library.length;
    }
    elements.statReplies.textContent = repliesApproved;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}}

// Setup event listeners
function setupEventListeners() {
  // Sign in button
  elements.signinBtn.addEventListener('click', handleSignIn);
  
  // Footer links
  document.getElementById('help-link').addEventListener('click', () => {
    window.open('https://orbitsales.ai/help', '_blank');
  });
  document.getElementById('privacy-link').addEventListener('click', () => {
    window.open('https://orbitsales.ai/privacy', '_blank');
  });
  document.getElementById('feedback-link').addEventListener('click', () => {
    window.open('https://orbitsales.ai/feedback', '_blank');
  });
}

// Handle sign in (mock implementation)
async function handleSignIn() {
  elements.signinBtn.textContent = 'Signing in...';
  elements.signinBtn.disabled = true;
  
  // Simulate sign in delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Store auth state in chrome.storage.local
  await chrome.storage.local.set({
    authState: {
      signedIn: true,
      email: 'user@example.com',
      signInTime: Date.now()
    }
  });
  
  showDashboard();
  await loadStats();
}

console.log('✅ ORBIT Popup Ready');
