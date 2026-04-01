// ═══════════════════════════════════════════════════
// ORBIT — Personal Dashboard Controller
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  await loadDashboardData();
  setupEventListeners();
});

// ═══ THEME SYSTEM ═══
async function loadTheme() {
  try {
    const result = await chrome.storage.local.get('orbitTheme');
    const theme = result.orbitTheme || 'dark';
    applyTheme(theme);
  } catch (e) {
    applyTheme('dark');
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Sync with content script
  try {
    chrome.storage.local.set({ orbitTheme: theme });
  } catch (e) {}
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  // Notify content script of theme change
  notifyContentScriptOfTheme(newTheme);
}

async function notifyContentScriptOfTheme(theme) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'themeChanged', 
        theme: theme 
      }).catch(() => {});
    }
  } catch (e) {}
}

async function loadDashboardData() {
  try {
    await Promise.all([
      loadProfile(),
      loadCredits(),
      loadStats()
    ]);
  } catch (e) {
    console.error('ORBIT Dashboard: Failed to load data', e);
  }
}

// ═══ PROFILE ═══
async function loadProfile() {
  try {
    const result = await chrome.storage.local.get(['authState', 'orbitCredits', 'orbitSettings']);
    const auth = result.authState || {};
    const credits = result.orbitCredits || { isPro: false, plan: 'free' };
    const settings = result.orbitSettings || {};

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const statusDot = document.getElementById('status-dot');
    const planBadge = document.getElementById('plan-badge');

    if (auth.signedIn && auth.email) {
      profileName.textContent = auth.name || auth.email.split('@')[0] || 'User';
      profileEmail.textContent = auth.email;
      statusDot.style.background = '#10b981';
      
      if (credits.isPro || credits.plan === 'pro') {
        planBadge.textContent = 'PRO';
        planBadge.classList.add('pro');
      } else {
        planBadge.textContent = 'FREE';
        planBadge.classList.remove('pro');
      }
    } else {
      const productName = settings.productName || 'Guest User';
      profileName.textContent = productName;
      profileEmail.textContent = settings.supportEmail || 'Click to sign in';
      statusDot.style.background = '#f59e0b';
      planBadge.textContent = 'FREE';
      planBadge.classList.remove('pro');
    }
  } catch (e) {
    console.error('ORBIT: Failed to load profile', e);
  }
}

// ═══ CREDITS ═══
async function loadCredits() {
  try {
    const result = await chrome.storage.local.get(['orbitCredits', 'orbitSettings']);
    const credits = result.orbitCredits || { used: 0, freeLimit: 20, isPro: false, plan: 'free' };
    const settings = result.orbitSettings || {};

    const isPro = credits.isPro || credits.plan === 'pro';
    const limit = isPro ? 500 : credits.freeLimit;
    const used = credits.used || 0;
    const remaining = Math.max(0, limit - used);
    const percent = Math.min(100, (used / limit) * 100);

    document.getElementById('credit-count').textContent = `${used} / ${limit}`;
    document.getElementById('credit-fill').style.width = `${percent}%`;

    const bonusSection = document.getElementById('bonus-section');
    const upgradeSection = document.getElementById('upgrade-section');

    if (isPro) {
      bonusSection.style.display = 'none';
      upgradeSection.style.display = 'none';
    } else {
      bonusSection.style.display = 'flex';
      upgradeSection.style.display = 'block';
    }

    const addCreditsBtn = document.getElementById('btn-add-credits');
    if (remaining <= 5) {
      addCreditsBtn.style.borderColor = '#ef4444';
      addCreditsBtn.style.color = '#ef4444';
    } else {
      addCreditsBtn.style.borderColor = '';
      addCreditsBtn.style.color = '';
    }

  } catch (e) {
    console.error('ORBIT: Failed to load credits', e);
  }
}

// ═══ STATS ═══
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['orbitStats', 'orbitCommentFeed']);
    const stats = result.orbitStats || {};
    const commentFeed = result.orbitCommentFeed || [];

    const timeSaved = stats.timeSavedMinutes || 0;
    const timeDisplay = timeSaved >= 60 
      ? `${Math.floor(timeSaved / 60)}h ${timeSaved % 60}m`
      : `${timeSaved}m`;

    document.getElementById('stat-time-saved').textContent = timeDisplay;

    const risksDetected = stats.risksCaught || 0;
    document.getElementById('stat-risks').textContent = risksDetected;

  } catch (e) {
    console.error('ORBIT: Failed to load stats', e);
  }
}

// ═══ EVENT LISTENERS ═══
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Settings button - opens in-extension settings
  document.getElementById('btn-settings').addEventListener('click', () => {
    // Switch to settings tab within popup, or open settings panel
    // For now, just show a message or navigate to settings tab
    const statusTitle = document.getElementById('status-title');
    const statusDesc = document.getElementById('status-desc');
    if (statusTitle && statusDesc) {
      statusTitle.textContent = 'Settings';
      statusDesc.textContent = 'Configure ORBIT in the Settings tab';
    }
    // The popup already has a Settings tab, so user can navigate there
  });

  // Upgrade to Pro
  document.getElementById('btn-upgrade').addEventListener('click', (e) => {
    e.preventDefault();
    const checkoutUrl = 'https://your-lemonsqueezy-checkout-link.com';
    chrome.tabs.create({ url: checkoutUrl });
  });

  // Connect Payment (Activation Bonus)
  document.getElementById('btn-connect-payment').addEventListener('click', () => {
    const checkoutUrl = 'https://your-lemonsqueezy-checkout-link.com';
    chrome.tabs.create({ url: checkoutUrl });
  });

  // Add Credits
  document.getElementById('btn-add-credits').addEventListener('click', () => {
    const checkoutUrl = 'https://your-lemonsqueezy-checkout-link.com';
    chrome.tabs.create({ url: checkoutUrl });
  });
}
