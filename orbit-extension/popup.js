// ═══════════════════════════════════════════════════
// ORBIT — Premium Popup Controller
// ═══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  await checkAuth();
  await loadStats();
  await loadSettings();
  await loadLibraryData();
  setupListeners();
});

// ═══ TAB NAVIGATION ═══
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = 'panel-' + tab.dataset.tab;
      document.getElementById(panelId).classList.add('active');
    });
  });
}

// ═══ AUTH STATE ═══
async function checkAuth() {
  try {
    const result = await chrome.storage.local.get('authState');
    const isSignedIn = result.authState && result.authState.signedIn;
    updateAuthUI(isSignedIn);
  } catch (e) {
    updateAuthUI(false);
  }
}

function updateAuthUI(signedIn) {
  const card = document.getElementById('status-card');
  const dot = document.getElementById('pulse-dot');
  const title = document.getElementById('status-title');
  const desc = document.getElementById('status-desc');
  const chip = document.getElementById('action-chip');
  const actionsCard = document.getElementById('quick-actions-card');

  if (signedIn) {
    card.classList.add('active');
    dot.classList.add('active');
    title.textContent = 'Active & Monitoring';
    desc.textContent = 'ORBIT is ready on compatible pages';
    chip.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Connected`;
    chip.style.pointerEvents = 'none';
    chip.style.background = 'rgba(16,185,129,0.2)';
    chip.style.color = '#10b981';
    if (actionsCard) actionsCard.style.display = 'block';
  } else {
    card.classList.remove('active');
    dot.classList.remove('active');
    title.textContent = 'Not Connected';
    desc.textContent = 'Sign in to activate ORBIT';
    chip.textContent = 'Sign In';
    chip.style.pointerEvents = 'auto';
    if (actionsCard) actionsCard.style.display = 'none';
  }
}

// ═══ STATS ═══
async function loadStats() {
  try {
    const data = await chrome.storage.local.get(['orbitStats', 'orbitAnalyzedData', 'orbit_library']);
    const stats = data.orbitStats || {};
    const analyzed = data.orbitAnalyzedData || {};
    const library = data.orbit_library || [];

    const el = (id) => document.getElementById(id);
    el('stat-responses').textContent = analyzed.responses || stats.repliesGenerated || 0;
    const mins = stats.timeSavedMinutes || 0;
    el('stat-time').textContent = mins >= 60 ? Math.floor(mins/60) + 'h' : mins + 'm';
    el('stat-comments').textContent = analyzed.totalComments || stats.commentsAnalyzed || 0;
    el('stat-replies').textContent = library.length || 0;
  } catch (e) {
    console.error('ORBIT: Failed to load stats', e);
  }
}

// ═══ SETTINGS ═══
async function loadSettings() {
  try {
    const data = await chrome.storage.local.get('orbitSettings');
    const s = data.orbitSettings || {};

    document.getElementById('toggle-ai').checked = s.orbitAIEnabled !== false;
    document.getElementById('toggle-privacy').checked = !!s.privacyMode;
    document.getElementById('toggle-webhook').checked = !!s.webhookEnabled;
    document.getElementById('webhook-url').value = s.webhookUrl || '';
    document.getElementById('product-name').value = s.productName || '';
    document.getElementById('product-desc').value = s.productDescription || '';

    // Show/hide webhook config
    toggleWebhookConfig(!!s.webhookEnabled);
  } catch (e) {
    console.error('ORBIT: Failed to load settings', e);
  }
}

function toggleWebhookConfig(open) {
  const el = document.getElementById('webhook-config');
  if (open) el.classList.add('open');
  else el.classList.remove('open');
}

async function saveSettings() {
  const btn = document.getElementById('btn-save-settings');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Saving...`;
  btn.disabled = true;

  const settings = {
    orbitAIEnabled: document.getElementById('toggle-ai').checked,
    privacyMode: document.getElementById('toggle-privacy').checked,
    webhookEnabled: document.getElementById('toggle-webhook').checked,
    webhookUrl: document.getElementById('webhook-url').value.trim(),
    productName: document.getElementById('product-name').value.trim(),
    productDescription: document.getElementById('product-desc').value.trim(),
    analyticsTracking: true,
    emailNotifications: false
  };

  try {
    await chrome.storage.local.set({ orbitSettings: settings });
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saved!`;
    btn.style.background = 'var(--green)';
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Settings`;
      btn.style.background = '';
      btn.disabled = false;
    }, 1500);
  } catch (e) {
    btn.textContent = 'Error!';
    btn.disabled = false;
  }
}

// ═══ LIBRARY & FAQ DATA ═══
async function loadLibraryData() {
  try {
    const data = await chrome.storage.local.get(['orbit_library', 'orbitFAQs']);
    const library = data.orbit_library || [];
    const faqs = data.orbitFAQs || [];

    const libList = document.getElementById('library-list');
    if (library.length > 0) {
      libList.innerHTML = library.slice(0, 20).map(item =>
        `<div class="library-item">${escapeHtml(typeof item === 'string' ? item : (item.reply || item.text || JSON.stringify(item))).substring(0, 120)}...</div>`
      ).join('');
    }

    const faqList = document.getElementById('faq-list');
    if (faqs.length > 0) {
      faqList.innerHTML = faqs.slice(0, 10).map(faq =>
        `<div class="library-item" style="border-left-color:var(--amber);">${escapeHtml(faq.text || '').substring(0, 120)}${faq.text && faq.text.length > 120 ? '...' : ''}</div>`
      ).join('');
    }
  } catch (e) {
    console.error('ORBIT: Failed to load library', e);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══ EVENT LISTENERS ═══
function setupListeners() {
  // Sign in
  document.getElementById('action-chip').addEventListener('click', async () => {
    const chip = document.getElementById('action-chip');
    chip.textContent = 'Connecting...';
    chip.disabled = true;
    await new Promise(r => setTimeout(r, 800));
    await chrome.storage.local.set({ authState: { signedIn: true, email: 'user@orbit.ai', signInTime: Date.now() } });
    updateAuthUI(true);
    await loadStats();
  });

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

  // Toggle webhook config visibility
  document.getElementById('toggle-webhook').addEventListener('change', (e) => {
    toggleWebhookConfig(e.target.checked);
  });

  // Test webhook
  document.getElementById('btn-test-webhook').addEventListener('click', async () => {
    const url = document.getElementById('webhook-url').value.trim();
    const status = document.getElementById('webhook-status');
    if (!url) {
      status.textContent = 'Please enter a webhook URL first';
      status.className = 'field-hint error';
      return;
    }
    status.textContent = 'Testing...';
    status.className = 'field-hint';
    try {
      const resp = await chrome.runtime.sendMessage({ action: 'sendWebhook', url, payload: { text: '[ORBIT] Test webhook — connection is working!' } });
      if (resp && resp.success) {
        status.textContent = 'Webhook is working!';
        status.className = 'field-hint success';
      } else {
        status.textContent = 'Failed: ' + (resp?.error || 'Unknown error');
        status.className = 'field-hint error';
      }
    } catch (e) {
      status.textContent = 'Error: ' + e.message;
      status.className = 'field-hint error';
    }
  });

  // Reset stats
  const resetBtn = document.getElementById('btn-reset-stats');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Reset all ORBIT statistics?')) return;
      await chrome.storage.local.set({
        orbitStats: { repliesGenerated: 0, timeSavedMinutes: 0, risksCaught: 0, commentsAnalyzed: 0 },
        orbitAnalyzedData: null
      });
      await loadStats();
    });
  }

  // Clear all data
  const clearBtn = document.getElementById('btn-clear-data');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('This will delete all saved replies and FAQs. Continue?')) return;
      await chrome.storage.local.set({ orbit_library: [], orbitFAQs: [], orbitFailures: [] });
      await loadLibraryData();
    });
  }

  // Export data
  const exportBtn = document.getElementById('btn-export-data');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const data = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orbit-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
