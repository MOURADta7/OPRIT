// ============================================================
// ORBIT - Smart Reply Assistant
// content.js - V5 (Multilingual Upsell + Smart Topics + React Fixes)
// ============================================================

console.log('🚀 ORBIT Content Script Loaded (V5 - Ultimate Edition)');

// ============================================================
// SECTION 0: STORAGE INITIALIZATION
// ============================================================

function initializeStorage() {
  chrome.storage.local.get(['orbitStats', 'orbitSettings'], (result) => {
    if (!result.orbitStats) {
      chrome.storage.local.set({
        orbitStats: {
          repliesGenerated: 0,
          timeSavedMinutes: 0,
          risksCaught: 0,
          commentsAnalyzed: 0
        }
      });
    }
    
    if (!result.orbitSettings) {
      chrome.storage.local.set({
        orbitSettings: {
          analyticsTracking: true,
          emailNotifications: false,
          privacyMode: false,
          orbitAIEnabled: true,
          webhookUrl: '',
          webhookEnabled: false
        }
      });
    }
  });
}

initializeStorage();

// Use WeakSet to prevent memory leaks and infinite loops
const injectedTextareas = new WeakSet();
let orbitObserver = null;

// ============================================================
// SECTION 1: CONFIGURATION & KEYWORDS
// ============================================================

const KEYWORDS = {
  NEGATIVE: ['refund', 'broken', 'doesnt work', "doesn't work", 'not working', 'disappointed', 'useless', 'waste', 'bug', 'crash', 'error', 'terrible', 'worst', 'scam', 'awful', 'horrible', 'hate', 'frustrated', 'frustrating', 'fails', 'failed', 'failure', 'problem'],
  QUESTION: ['how', 'does it', 'can i', 'will it', 'is there', 'what is', 'do you', 'when will', 'support', 'integrate', 'compatible', 'pricing', 'lifetime', 'does this', 'is this', 'are you', 'will you', 'have you', 'timeline', 'roadmap', 'when is', 'can it', 'does the', 'will the', 'any plans', 'any chance'],
  FEATURE: ['would love', 'please add', 'wish', 'feature request', 'suggestion', 'consider adding', 'it would be great', 'could you add', 'would be great', 'hope to see', 'looking forward', 'dark mode', 'mobile app', 'integration', 'zapier', 'api', 'export', 'import', 'would be nice', 'missing feature', 'need a', 'needs a'],
  POSITIVE: ['love', 'great', 'amazing', 'excellent', 'perfect', 'fantastic', 'works great', 'highly recommend', 'best', 'awesome', 'thank you', 'thanks', 'wonderful', 'brilliant', 'superb', 'impressed', 'exactly what', 'looking for', 'well done', 'keep it up', 'happy']
};

const PRIORITY = {
  NEGATIVE_TIER3: 100, NEGATIVE: 90, QUESTION_TIER3: 80, QUESTION: 60,
  FEATURE: 40, POSITIVE_FEATURE: 35, POSITIVE: 20, NEUTRAL: 10, NON_ENGLISH: 5
};

// ============================================================
// SECTION 2B: SETTINGS & STATS FUNCTIONS
// ============================================================

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('orbitSettings', (result) => {
      resolve(result.orbitSettings || {
        analyticsTracking: true,
        emailNotifications: false,
        privacyMode: false,
        orbitAIEnabled: true,
        webhookUrl: '',
        webhookEnabled: false
      });
    });
  });
}

function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get('orbitStats', (result) => {
      resolve(result.orbitStats || {
        repliesGenerated: 0,
        timeSavedMinutes: 0,
        risksCaught: 0,
        commentsAnalyzed: 0
      });
    });
  });
}

async function incrementReplyStats(wasRiskCaught = false) {
  const settings = await getSettings();
  if (!settings.analyticsTracking) return;
  
  const stats = await getStats();
  stats.repliesGenerated += 1;
  stats.timeSavedMinutes += 3;
  if (wasRiskCaught) {
    stats.risksCaught += 1;
  }
  chrome.storage.local.set({ orbitStats: stats });
}

async function incrementCommentsAnalyzed() {
  const settings = await getSettings();
  if (!settings.analyticsTracking) return;
  
  const stats = await getStats();
  stats.commentsAnalyzed += 1;
  chrome.storage.local.set({ orbitStats: stats });
}

async function checkAndTriggerEmailNotification(commentText, refundRisk) {
  const settings = await getSettings();
  if (!settings.emailNotifications) return false;
  if (refundRisk < 50) return false;
  
  const mailtoLink = `mailto:?subject=${encodeURIComponent('⚠️ ORBIT Alert: Urgent Refund Risk')}&body=${encodeURIComponent(commentText)}`;
  window.location.href = mailtoLink;
  return true;
}

async function saveReplyFeedback(commentText, generatedReply, reason) {
  return new Promise((resolve) => {
    chrome.storage.local.get('orbitFailures', (result) => {
      const failures = result.orbitFailures || [];
      failures.push({
        comment: commentText,
        generatedReply: generatedReply,
        reason: reason,
        timestamp: Date.now()
      });
      chrome.storage.local.set({ orbitFailures: failures }, () => {
        resolve();
      });
    });
  });
}

const alertedComments = new Set();

function hashComment(commentText) {
  let hash = 0;
  for (let i = 0; i < commentText.length; i++) {
    const char = commentText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function triggerWebhookAlert(commentText, authorName, refundRisk, platform) {
  const settings = await getSettings();
  
  if (!settings.webhookEnabled || !settings.webhookUrl) {
    return;
  }
  
  const commentHash = hashComment(commentText);
  
  if (alertedComments.has(commentHash)) {
    return;
  }
  
  alertedComments.add(commentHash);
  
  const payload = {
    text: `🚨 *URGENT: Refund Risk Detected!* 🚨\n*Platform:* ${platform}\n*Customer:* ${authorName}\n*Risk Score:* ${refundRisk}/100\n*Comment:* ${commentText}`
  };
  
  try {
    await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    console.log('ORBIT: Webhook alert sent successfully');
  } catch (error) {
    console.error('ORBIT: Webhook alert failed:', error);
  }
}

// ============================================================
// SECTION 2: SMART LANGUAGE DETECTOR
// ============================================================

function isEnglish(text) {
  if (!text || text.trim().length < 4) return true; // Too short to judge, default to English

  // A lightweight list of common English stop words & identifiers
  const engIndicators = /\b(the|is|to|and|a|in|it|you|for|on|with|this|that|of|how|what|when|why|can|will|my|does|any|has|have|but|not|are|be)\b/i;

  // If it has basic English grammar OR contains any of our target keywords, it's English
  const hasBasicEnglish = engIndicators.test(text);
  const hasOrbitKeyword = Object.values(KEYWORDS).flat().some(kw => text.toLowerCase().includes(kw));

  return hasBasicEnglish || hasOrbitKeyword;
}

// ============================================================
// SECTION 3: CLASSIFIER & TOPIC EXTRACTION
// ============================================================

function classifyComment(text) {
  if (!text || text.trim().length < 3) return { type: 'NEUTRAL', score: 0 };

  // --- NON-ENGLISH CHECK (The Upsell Trap) ---
  if (!isEnglish(text)) {
    return { type: 'NON_ENGLISH', score: 1 };
  }

  const lower = text.toLowerCase();
  const scores = { NEGATIVE: 0, QUESTION: 0, FEATURE: 0, POSITIVE: 0 };

  KEYWORDS.NEGATIVE.forEach(kw => { if (lower.includes(kw)) scores.NEGATIVE++; });
  KEYWORDS.QUESTION.forEach(kw => { if (lower.includes(kw)) scores.QUESTION++; });
  KEYWORDS.FEATURE.forEach(kw => { if (lower.includes(kw)) scores.FEATURE++; });
  KEYWORDS.POSITIVE.forEach(kw => { if (lower.includes(kw)) scores.POSITIVE++; });

  const max = Math.max(...Object.values(scores));
  if (max === 0) return { type: 'NEUTRAL', score: 0 };

  if (scores.POSITIVE > 0 && scores.FEATURE > 0 && scores.NEGATIVE === 0 && Math.abs(scores.POSITIVE - scores.FEATURE) <= 2) {
    return { type: 'POSITIVE_FEATURE', score: scores.POSITIVE + scores.FEATURE };
  }

  const winner = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
  return { type: winner[0], score: winner[1] };
}

function calculatePriority(type, tier) {
  if (type === 'NON_ENGLISH') return PRIORITY.NON_ENGLISH;
  const isTier3 = tier && tier.toString().includes('3');
  switch (type) {
    case 'NEGATIVE': return isTier3 ? PRIORITY.NEGATIVE_TIER3 : PRIORITY.NEGATIVE;
    case 'QUESTION': return isTier3 ? PRIORITY.QUESTION_TIER3 : PRIORITY.QUESTION;
    case 'FEATURE': return PRIORITY.FEATURE;
    case 'POSITIVE_FEATURE': return PRIORITY.POSITIVE_FEATURE;
    case 'POSITIVE': return PRIORITY.POSITIVE;
    default: return PRIORITY.NEUTRAL;
  }
}

function extractTopic(text) {
  // Safe Allowlist for SaaS terms
  const topics = [
    'mobile app', 'dark mode', 'notion', 'zapier', 'integration',
    'api', 'onboarding', 'timeline', 'pricing', 'export', 'import',
    'connection', 'timeout', 'setup', 'installation', 'roadmap',
    'white label', 'lifetime', 'support', 'documentation', 'webhook',
    'wordpress', 'shopify', 'woocommerce', 'mac', 'windows', 'linux',
    'dashboard', 'analytics', 'custom domain'
  ];

  const lower = text.toLowerCase();
  for (const t of topics) {
    if (lower.includes(t)) return t;
  }
  return null;
}

// ============================================================
// SECTION 3B: REFUND RISK RADAR (V5)
// ============================================================

function calculateRefundRisk(text, type) {
    let score = 0;
    const lower = text.toLowerCase();
    if (lower.includes('refund')) score += 40;
    if (lower.includes('60 day') || lower.includes('guarantee')) score += 30;
    if (lower.includes('disappointed') || lower.includes('not what i expected')) score += 25;
    if (lower.includes('waste of money') || lower.includes('overpriced')) score += 25;
    if (lower.includes('cancel') || lower.includes('cancellation')) score += 20;
    if (type === 'NEGATIVE' && (lower.includes("doesn't work") || lower.includes("doesnt work"))) score += 20;
    return Math.min(score, 100);
}

// ============================================================
// SECTION 4: HYBRID REPLY TEMPLATES
// ============================================================

async function generateReply(type, name, commentText) {
  const n = name || 'there';
  const topic = extractTopic(commentText);

  const topicPhrase = topic ? ` regarding ${topic}` : '';
  const suggestionPhrase = topic ? ` about ${topic}` : '';

  const templates = {
    NEGATIVE: `Hi ${n}, I'm truly sorry you've experienced this issue. Could you please email us the specific details so our team can investigate and fix it for you?`,
    QUESTION: `Hi ${n}, that's a great question${topicPhrase}! Could you share a bit more about your specific use case so I can give you the most accurate answer?`,
    FEATURE: `Hi ${n}, I absolutely love this suggestion${suggestionPhrase}! I've made a note of it and added it to our priority roadmap. Thanks for helping us improve!`,
    POSITIVE_FEATURE: `Hi ${n}, we're thrilled you love the product! Your suggestion${suggestionPhrase} is actually already on our radar for future enhancements. Stay tuned!`,
    POSITIVE: `Hi ${n}, thank you so much for the wonderful feedback! It truly means the world to our team and keeps us motivated.`,
    NEUTRAL: `Hi ${n}, thanks for reaching out and sharing your input! Let us know if there is anything specific we can help you with.`
  };

  return templates[type] || templates['NEUTRAL'];
}

// ============================================================
// SECTION 5: REACT-COMPATIBLE SETTER
// ============================================================

function setTextareaValue(textarea, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(textarea, value);
  } else {
    textarea.value = value;
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  textarea.focus();
}

// ============================================================
// SECTION 6: INJECT ORBIT BAR (DOUBLE INJECTION FIXED)
// ============================================================

let commentIndexCounter = 0;
let cachedSettings = {
  analyticsTracking: true,
  emailNotifications: false,
  privacyMode: false,
  orbitAIEnabled: true,
  webhookUrl: '',
  webhookEnabled: false
};

// Cache settings on load
chrome.storage.local.get('orbitSettings', (result) => {
  if (result.orbitSettings) {
    cachedSettings = result.orbitSettings;
  }
});

function injectOrbitBar(textarea) {
  // 🛡️ Double Injection Guards
  if (injectedTextareas.has(textarea)) return;
  if (!textarea.parentElement || !document.contains(textarea)) return;

  // Check master toggle synchronously using cached settings
  if (!cachedSettings.orbitAIEnabled) return;
  
  _injectOrbitBarInternal(textarea, cachedSettings);
}

function _injectOrbitBarInternal(textarea, settings) {
  // Ensure no existing bar is sitting right before this textarea
  if (textarea.parentElement.querySelector('.orbit-reply-assistant')) {
    injectedTextareas.add(textarea); // Mark as processed so we don't try again
    return;
  }

  injectedTextareas.add(textarea);

  let commentContainer = textarea.closest('.comment-card') || textarea.closest('.comment');
  if (!commentContainer) {
    let el = textarea;
    for (let i = 0; i < 6; i++) {
      el = el.parentElement;
      if (!el) break;
      if (el.children.length > 3) { commentContainer = el; break; }
    }
  }
  if (!commentContainer) return;

  let authorName = 'there';
  const extractedName = commentContainer.querySelector('h4, h3, .author-info, .user-name')?.textContent;
  authorName = extractedName && 
    extractedName.trim().length > 0 && 
    extractedName !== 'undefined' && 
    extractedName !== 'null' 
    ? extractedName.trim().split(' ')[0] 
    : 'there';

  // Apply privacy mode - replace author name with Customer # + index
  if (settings.privacyMode) {
    commentIndexCounter++;
    authorName = `Customer #${commentIndexCounter}`;
  }
  
  // Track comments analyzed
  incrementCommentsAnalyzed();
  
  _buildOrbitBar(textarea, commentContainer, authorName, settings);
}

function _buildOrbitBar(textarea, commentContainer, authorName, settings) {
  const tierMatch = commentContainer.textContent.match(/(?:tier|plan)\s*[:\-]?\s*(\d)/i);
  const tier = tierMatch ? tierMatch[1] : null;

  let commentText = '';
  const contentEl = commentContainer.querySelector('.comment-content, .comment-body, p');
  if (contentEl) {
    commentText = contentEl.textContent.trim();
  } else {
    const texts = [];
    commentContainer.querySelectorAll('p, div, span').forEach(node => {
      if (!node.closest('.reply-form') && !node.closest('.orbit-reply-assistant')) {
        const text = node.textContent.trim();
        if (text.length > 10 && text.length < 500) texts.push(text);
      }
    });
    commentText = texts.sort((a, b) => b.length - a.length)[0] || '';
  }

  let { type } = classifyComment(commentText);
  let priority = calculatePriority(type, tier);
  const refundRisk = calculateRefundRisk(commentText, type);
  
  // Override if critical
  if (refundRisk >= 50) {
      type = 'CRITICAL';
      priority = 1000;
  }

  console.warn("🟢 ORBIT_FINAL_DATA >>", { type, priority, authorName, refundRisk });

  const TYPE_COLORS = {
    NEGATIVE: '#ef4444',
    QUESTION: '#3b82f6',
    FEATURE: '#8b5cf6',
    POSITIVE_FEATURE: '#f59e0b',
    POSITIVE: '#10b981',
    NON_ENGLISH: '#ec4899', // Pinkish purple for the upsell
    NEUTRAL: '#6b7280'
  };

  const bar = document.createElement('div');
  bar.className = 'orbit-reply-assistant';
  bar.innerHTML = `
    <style>
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    </style>
  `;
  bar.style.cssText = `
    background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center;
    gap: 10px; z-index: 9999; font-family: sans-serif; font-size: 13px;
  `;

  // 🚨 Special UI for Critical Refund Risk
  if (type === 'CRITICAL') {
      // Check email notification setting
      if (settings.emailNotifications) {
        checkAndTriggerEmailNotification(commentText, refundRisk);
      }
      
      // Trigger webhook alert
      triggerWebhookAlert(commentText, authorName, refundRisk, 'Comments & Reviews');
      
      bar.innerHTML = `
        <style>@keyframes pulseRed { 0% { opacity: 1; box-shadow: 0 0 0 0 rgba(220,38,38,0.7); } 50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(220,38,38,0); } 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(220,38,38,0); } }</style>
        <span style="background:#4f46e5;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;">ORBIT</span>
        <span style="background:#dc2626;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;animation: pulseRed 1.5s infinite;">⚠️ REFUND RISK</span>
        <span style="color:#ef4444;flex:1;font-weight:bold;">URGENT: Score ${refundRisk}/100</span>
        <button class="orbit-generate-btn" style="background:#dc2626;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-weight:bold;">🚨 Auto-Reply Founder Message</button>
      `;
      textarea.parentElement.insertBefore(bar, textarea);

      const btn = bar.querySelector('.orbit-generate-btn');
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const urgentReply = `Hi ${authorName}, I am so sorry you are experiencing this. As the founder, I take this extremely seriously. Please email me directly at founder@orbit.com right now so I can personally investigate and resolve this for you immediately.`;
        setTextareaValue(textarea, urgentReply);
        btn.textContent = '✓ Urgent Reply Ready';
        btn.style.background = '#4f46e5';
        
        // Track stats - risk was caught
        incrementReplyStats(true);
      });
      updateOrbitDashboard();
      return; 
  }

  // 🌐 Special UI for Non-English
  if (type === 'NON_ENGLISH') {
    bar.innerHTML = `
        <span style="background:#4f46e5;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;">ORBIT</span>
        <span style="background:${TYPE_COLORS[type]};color:white;padding:2px 8px;border-radius:4px;">NON_ENGLISH</span>
        <span style="color:#9ca3af;flex:1;">Priority: ${priority}</span>
        <button class="orbit-upsell-btn" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; border: none; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-weight:bold;">🌐 Upgrade to Pro for multilingual replies</button>
      `;
    textarea.parentElement.insertBefore(bar, textarea);

    const btn = bar.querySelector('.orbit-upsell-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('🚀 PRO FEATURE: In the paid version, ORBIT uses advanced AI to automatically detect the language and reply fluently in French, Spanish, German, and 30+ other languages!');
    });
    updateOrbitDashboard();
    return; // Stop here, do not attach normal generation logic
  }

  // Normal UI for English
  bar.innerHTML = `
    <span style="background:#4f46e5;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;">ORBIT</span>
    <span style="background:${TYPE_COLORS[type] || '#6b7280'};color:white;padding:2px 8px;border-radius:4px;">${type}</span>
    <span style="color:#9ca3af;flex:1;">Priority: ${priority}</span>
    <button class="orbit-generate-btn" style="background:#10b981;color:white;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;">✨ Generate Reply</button>
  `;

  textarea.parentElement.insertBefore(bar, textarea);

  const btn = bar.querySelector('.orbit-generate-btn');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    btn.textContent = '⏳ Thinking...';
    btn.disabled = true;

    try {
      const replyText = await generateReply(type, authorName, commentText);
      setTextareaValue(textarea, replyText);

      btn.textContent = '✓ Reply Ready';
      btn.style.background = '#4f46e5';
      btn.disabled = false;
      
      // Remove any existing feedback buttons
      const existingFeedback = bar.querySelector('.orbit-feedback-btns');
      if (existingFeedback) existingFeedback.remove();

      // Add feedback buttons
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'orbit-feedback-btns';
      feedbackDiv.style.cssText = 'display:flex;gap:4px;margin-left:8px;';
      feedbackDiv.innerHTML = `
        <button class="orbit-feedback-good" style="background:#10b981;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">👍</button>
        <button class="orbit-feedback-bad" style="background:#ef4444;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">👎</button>
      `;
      bar.appendChild(feedbackDiv);

      // Handle good feedback
      feedbackDiv.querySelector('.orbit-feedback-good').addEventListener('click', (ev) => {
        ev.stopPropagation();
        feedbackDiv.innerHTML = '<span style="color:#10b981;font-size:12px;">Thanks! ✓</span>';
      });

      // Handle bad feedback
      feedbackDiv.querySelector('.orbit-feedback-bad').addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const reasons = ['Wrong Tone', 'Hallucination', 'Missed Context', 'Inaccurate', 'Other'];
        const reason = prompt('Why was this reply not good?\n\nOptions: ' + reasons.join(', '));
        if (reason) {
          await saveReplyFeedback(commentText, replyText, reason);
          feedbackDiv.innerHTML = '<span style="color:#f59e0b;font-size:12px;">Feedback saved! ✓</span>';
        }
      });
      
      // Track stats
      incrementReplyStats(false);
    } catch (err) {
      console.error('ORBIT: Error generating reply:', err);
      btn.textContent = '✗ Error';
      btn.disabled = false;
    }
  });
  
  updateOrbitDashboard();
}

// ============================================================
// SECTION 8: FLOATING ACTION DASHBOARD
// ============================================================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function initOrbitDashboard() {
  if (document.getElementById('orbit-dashboard')) return;

  const panel = document.createElement('div');
  panel.id = 'orbit-dashboard';
  panel.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 10000;
    background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 12px;
    padding: 14px 18px; font-family: sans-serif; font-size: 13px; color: #e2e8f0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5); min-width: 260px;
    display: flex; flex-direction: column; gap: 10px;
    transition: opacity 0.3s ease;
  `;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:700;color:#00d4ff;font-size:14px;">🛸 ORBIT AI Assistant</span>
      <div style="display:flex;gap:6px;">
        <button id="orbit-dash-close" title="Close" style="background:transparent;border:none;color:#9ca3af;cursor:pointer;font-size:16px;padding:0 4px;">×</button>
        <button id="orbit-toggle" title="Toggle ORBIT" style="
          background:#2d2d4e;border:1px solid #4f46e5;border-radius:12px;
          color:#10b981;cursor:pointer;font-size:12px;padding:4px 8px;
        ">ON</button>
      </div>
    </div>
    <div id="orbit-dash-stats" style="color:#9ca3af;font-size:12px;">Scanning...</div>
    <div id="orbit-dash-breakdown" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
    <button id="orbit-dash-autofill" style="
      background: linear-gradient(135deg, #10b981 0%, #4f46e5 100%);
      color: white; border: none; border-radius: 8px; padding: 10px 16px;
      cursor: pointer; font-size: 13px; font-weight: 600; width: 100%;
      transition: opacity 0.2s;
    ">✨ Draft All Replies</button>
    <div id="orbit-dash-progress" style="display:none;font-size:11px;color:#10b981;text-align:center;"></div>
  `;

  document.body.appendChild(panel);

  // Toggle button
  const toggleBtn = document.getElementById('orbit-toggle');
  chrome.storage.local.get('orbitEnabled', (result) => {
    const isEnabled = result.orbitEnabled !== false;
    updateToggleState(toggleBtn, isEnabled);
  });

  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get('orbitEnabled', (result) => {
      const newState = result.orbitEnabled === false ? true : false;
      chrome.storage.local.set({ orbitEnabled: newState });
      updateToggleState(toggleBtn, newState);

      if (newState) {
        scanForTextareas();
        showOrbitNotification('ORBIT enabled');
      } else {
        hideAllOrbitBars();
        showOrbitNotification('ORBIT paused');
      }
    });
  });

  // Close button
  document.getElementById('orbit-dash-close').addEventListener('click', () => {
    panel.style.opacity = '0';
    setTimeout(() => panel.remove(), 300);
  });

  // Auto-fill button
  document.getElementById('orbit-dash-autofill').addEventListener('click', () => orbitBulkFill());
}

function updateToggleState(btn, enabled) {
  btn.textContent = enabled ? 'ON' : 'OFF';
  btn.style.color = enabled ? '#10b981' : '#ef4444';
  btn.style.borderColor = enabled ? '#4f46e5' : '#ef4444';
}

function hideAllOrbitBars() {
  document.querySelectorAll('.orbit-reply-assistant').forEach(bar => {
    bar.style.display = 'none';
  });
}

function showOrbitNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    background:#1a1a2e;border:1px solid #4f46e5;border-radius:8px;
    color:#e2e8f0;padding:10px 20px;font-family:sans-serif;font-size:14px;
    z-index:99999;animation:fadeIn 0.3s;
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}

function updateOrbitDashboard() {
  const panel = document.getElementById('orbit-dashboard');
  if (!panel) return;

  // Detect Comments page using DOM content (SPA - URL doesn't change)
  const isCommentsPage = document.body.innerText.includes('Comments & Reviews') || document.querySelector('.comment-card') !== null;
  
  if (!isCommentsPage) {
    const statsEl = document.getElementById('orbit-dash-stats');
    if (statsEl) {
      statsEl.textContent = 'Monitoring paused. Navigate to Comments to use ORBIT.';
    }
    const autofillBtn = document.getElementById('orbit-dash-autofill');
    if (autofillBtn) {
      autofillBtn.style.display = 'none';
    }
    const breakdownEl = document.getElementById('orbit-dash-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML = '';
    }
    return;
  }

  const allBars = document.querySelectorAll('.orbit-reply-assistant');
  const genBtns = document.querySelectorAll('.orbit-generate-btn:not(:disabled)');

  // Count by type
  const typeCounts = {};
  allBars.forEach(bar => {
    const badges = bar.querySelectorAll('span');
    // Get the second span which contains the type badge
    const badge = badges[1];
    if (!badge) return;
    const t = badge.textContent.trim();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const total = allBars.length;
  const fillable = genBtns.length;

  // Update stats line
  const statsEl = document.getElementById('orbit-dash-stats');
  if (statsEl) {
    statsEl.textContent = total === 0
      ? 'No reply fields found yet — open a reply form.'
      : `🎯 ${total} comment${total !== 1 ? 's' : ''} detected · ${fillable} ready to fill`;
  }

  // Show autofill button on comments page
  const autofillBtn = document.getElementById('orbit-dash-autofill');
  if (autofillBtn) {
    autofillBtn.style.display = 'block';
  }

  // Update breakdown badges
  const TYPE_COLORS = {
    NEGATIVE: '#ef4444', QUESTION: '#3b82f6', FEATURE: '#8b5cf6',
    POSITIVE_FEATURE: '#f59e0b', POSITIVE: '#10b981', NEUTRAL: '#6b7280', 
    NON_ENGLISH: '#ec4899', CRITICAL: '#dc2626'
  };
  const breakdownEl = document.getElementById('orbit-dash-breakdown');
  if (breakdownEl) {
    breakdownEl.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
      // Map display text to type names for proper coloring
      let displayType = type;
      if (type.includes('REFUND RISK')) displayType = 'CRITICAL';
      if (type.includes('NON_ENGLISH')) displayType = 'NON_ENGLISH';
      return `<span style="background:${TYPE_COLORS[displayType] || '#6b7280'};color:white;padding:2px 8px;
        border-radius:12px;font-size:11px;font-weight:600;">${type}: ${count}</span>`;
    }).join('');
  }

  // Update button label
  const autoBtn = document.getElementById('orbit-dash-autofill');
  if (autoBtn) {
    autoBtn.textContent = fillable > 0
      ? `✨ Auto-Fill All ${fillable} Replies`
      : '✨ Draft All Replies';
    autoBtn.style.opacity = fillable > 0 ? '1' : '0.5';
  }
}

async function orbitBulkFill() {
  const autoBtn = document.getElementById('orbit-dash-autofill');
  const progressEl = document.getElementById('orbit-dash-progress');

  if (autoBtn) { autoBtn.disabled = true; autoBtn.textContent = '⏳ Processing...'; }
  if (progressEl) { progressEl.style.display = 'block'; progressEl.textContent = '👁️ Scanning targeted replies...'; }

  const commentCards = Array.from(document.querySelectorAll('.comment, .comment-card'));
  let processedCount = 0;

  for (let i = 0; i < commentCards.length; i++) {
    const card = commentCards[i];

    // Check if it already has a filled textarea
    const existingTextarea = card.querySelector('textarea');
    if (existingTextarea && existingTextarea.value.trim() !== '') {
      continue; // Already replied to
    }

    // Extract text for classification
    let commentText = '';
    const contentEl = card.querySelector('.comment-content, .comment-body, p');
    if (contentEl) {
      commentText = contentEl.textContent.trim();
    } else {
      const texts = [];
      card.querySelectorAll('p, div, span').forEach(node => {
        if (!node.closest('.reply-form') && !node.closest('.orbit-reply-assistant')) {
          const text = node.textContent.trim();
          if (text.length > 10 && text.length < 500) texts.push(text);
        }
      });
      commentText = texts.sort((a, b) => b.length - a.length)[0] || '';
    }

    // Filter Targets: qualify only English comments
    const { type } = classifyComment(commentText);
    if (type === 'NON_ENGLISH') {
      continue; // Skip non-English, don't expand, don't fill
    }

    // Selective Expansion
    if (!existingTextarea) {
      const btns = Array.from(card.querySelectorAll('button, .reply-btn, a'));
      const toggleBtn = btns.find(b => {
        const txt = b.textContent.toLowerCase().trim();
        return (txt === 'reply' || txt.includes('reply'))
          && !b.classList.contains('orbit-generate-btn')
          && !b.classList.contains('orbit-upsell-btn');
      });

      if (toggleBtn) {
        if (progressEl) progressEl.textContent = `👁️ Expanding targeted reply...`;
        toggleBtn.click();
        await sleep(250); // Wait for React to render and ORBIT Observer to inject
      }
    }

    // Find the newly injected generate button (if it was just expanded, or if it was already open)
    const genBtn = card.querySelector('.orbit-generate-btn');
    if (genBtn && !genBtn.disabled) {
      // One more safety check: is textarea actually empty?
      const bar = genBtn.closest('.orbit-reply-assistant');
      const textarea = bar ? bar.nextElementSibling : null;
      if (textarea && textarea.value.trim() === '') {
        if (progressEl) progressEl.textContent = `⚡ Filling reply ${processedCount + 1}...`;
        
        // Click and wait for async operation to complete
        const clickPromise = new Promise((resolve) => {
          const handler = () => {
            genBtn.removeEventListener('click', handler);
            resolve();
          };
          genBtn.addEventListener('click', handler);
        });
        genBtn.click();
        
        // Wait for button to be re-enabled (async operation complete)
        await (async () => {
          let waited = 0;
          while (genBtn.disabled && waited < 5000) {
            await sleep(50);
            waited += 50;
          }
        })();
        
        processedCount++;
        await sleep(200); // Stagger before moving to next targeted comment
      }
    }
  }

  if (progressEl) {
    if (processedCount === 0) {
      progressEl.textContent = '⚠️ No valid empty reply fields found.';
    } else {
      progressEl.textContent = `✅ ${processedCount} repl${processedCount !== 1 ? 'ies' : 'y'} filled successfully!`;
    }
    setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
  }

  if (autoBtn) {
    autoBtn.disabled = false;
    autoBtn.textContent = '✨ Draft All Replies';
    updateOrbitDashboard(); // Ensure dashboard reflects newly filled state
  }
}

// ============================================================
// SECTION 9: SCANNER & OBSERVER
// ============================================================

function scanAndInject() {
  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) return;
    
    document.querySelectorAll('textarea').forEach(textarea => {
      if (!injectedTextareas.has(textarea)) injectOrbitBar(textarea);
    });
    updateOrbitDashboard(); // keep dashboard count live after every scan
  });
}

let scanTimeout;
orbitObserver = new MutationObserver(mutations => {
  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) {
      orbitObserver.disconnect();
      return;
    }
    
    // Restart observer if it was disconnected
    if (!orbitObserver.takeRecords().length && document.body) {
      try {
        orbitObserver.observe(document.body, { childList: true, subtree: true, attributes: false });
      } catch (e) {}
    }
    
    const hasStructuralChange = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
    if (!hasStructuralChange) return;

    const isOrbitChange = mutations.some(m =>
      m.target.classList?.contains('orbit-reply-assistant') ||
      m.target.closest?.('.orbit-reply-assistant')
    );
    if (isOrbitChange) return;

    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanAndInject, 500);
  });
});

function scanForTextareas() {
  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) return;
    
    document.querySelectorAll('textarea').forEach(textarea => {
      if (!injectedTextareas.has(textarea)) injectOrbitBar(textarea);
    });
    updateOrbitDashboard();
  });
}

function removeAllOrbitUI() {
  document.querySelectorAll('.orbit-reply-assistant, #orbit-dashboard').forEach(el => el.remove());
  injectedTextareas.clear();
  if (orbitObserver) {
    orbitObserver.disconnect();
  }
}

async function initOrbitOnLoad() {
  const settings = await getSettings();
  
  if (settings.orbitAIEnabled) {
    initOrbitDashboard();
    setTimeout(scanForTextareas, 1000);
    
    if (orbitObserver) {
      orbitObserver.observe(document.body, { childList: true, subtree: true, attributes: false });
    }
  }
  
  // Handle SPA navigation - detect page changes
  handlePageNavigation();
}

// ============================================================
// SECTION 10: SIMPLE PAGE VISIBILITY CHECK
// ============================================================

function handlePageNavigation() {
  let lastUrl = window.location.href;
  
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      injectedTextareas.clear();
      if (orbitObserver) {
        orbitObserver.disconnect();
        orbitObserver = new MutationObserver(mutations => {
          const hasStructuralChange = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
          if (!hasStructuralChange) return;
          
          clearTimeout(scanTimeout);
          scanTimeout = setTimeout(scanAndInject, 500);
        });
      }
    }
    
    const isCommentsPage = document.body.innerText.includes('Comments & Reviews');
    const panel = document.getElementById('orbit-dashboard');
    
    if (panel) {
      if (isCommentsPage) {
        panel.style.display = 'flex';
        scanForTextareas();
        updateOrbitDashboard();
      } else {
        panel.style.display = 'none';
      }
    }
  }, 1000);
}

function startPageVisibilityChecker() {
  let lastUrl = location.href;
  
  setInterval(() => {
    const url = location.href;
    const isCommentsPage = document.body.innerText.includes('Comments & Reviews') || document.querySelector('.comment-card') !== null;
    const isOverviewPage = document.body.innerText.includes('Dashboard Overview') || document.getElementById('orbit-replies-generated') !== null;
    const isSettingsPage = document.body.innerText.includes('Configure your dashboard preferences');
    
    const panel = document.getElementById('orbit-dashboard');
    
    if (isCommentsPage) {
      if (panel && panel.style.display === 'none') {
        panel.style.display = 'flex';
      }
      scanForTextareas();
      updateOrbitDashboard();
    } else if (isOverviewPage) {
      if (panel) panel.style.display = 'none';
      updateOverviewStats();
    } else if (isSettingsPage) {
      if (panel) panel.style.display = 'none';
      handleSettingsPage();
    } else {
      if (panel) panel.style.display = 'none';
    }
    
    lastUrl = url;
  }, 1000);
}

async function updateOverviewStats() {
  const stats = await getStats();
  
  // Find the stat cards in the Overview page and update by ID
  const repliesEl = document.getElementById('orbit-replies-generated');
  const timeEl = document.getElementById('orbit-time-saved');
  const risksEl = document.getElementById('orbit-risks-caught');
  const commentsEl = document.getElementById('orbit-comments-analyzed');
  
  if (repliesEl) repliesEl.textContent = stats.repliesGenerated;
  if (timeEl) timeEl.textContent = formatTimeSaved(stats.timeSavedMinutes);
  if (risksEl) risksEl.textContent = stats.risksCaught;
  if (commentsEl) commentsEl.textContent = stats.commentsAnalyzed;
}

function formatTimeSaved(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================
// SECTION 11: SETTINGS PAGE HANDLER
// ============================================================

function handleSettingsPage() {
  // Detect Settings page using DOM content (SPA - URL doesn't change)
  const isSettingsPage = document.body.innerText.includes('Configure your dashboard preferences');
  if (!isSettingsPage) return;
  
  const toggleContainer = document.querySelector('div:has(span:contains("ORBIT AI Assistant"))');
  if (!toggleContainer) return;
  
  let toggleBtn = toggleContainer.querySelector('#orbit-settings-toggle');
  if (toggleBtn) return;
  
  toggleBtn = document.createElement('button');
  toggleBtn.id = 'orbit-settings-toggle';
  toggleBtn.style.cssText = `
    background:#2d2d4e;border:1px solid #4f46e5;border-radius:12px;
    color:#10b981;cursor:pointer;font-size:12px;padding:4px 10px;margin-left:8px;
  `;
  
  const headerSpan = toggleContainer.querySelector('span');
  if (headerSpan) {
    headerSpan.parentElement.insertBefore(toggleBtn, headerSpan.nextSibling);
  }
  
  getSettings().then(settings => {
    updateToggleBtnState(toggleBtn, settings.orbitAIEnabled);
  });
  
  toggleBtn.addEventListener('click', async () => {
    const settings = await getSettings();
    const newState = !settings.orbitAIEnabled;
    
    const newSettings = { ...settings, orbitAIEnabled: newState };
    chrome.storage.local.set({ orbitSettings: newSettings });
    
    updateToggleBtnState(toggleBtn, newState);
    
    if (newState) {
      initOrbitDashboard();
      setTimeout(scanForTextareas, 500);
      showOrbitNotification('ORBIT enabled');
    } else {
      removeAllOrbitUI();
      showOrbitNotification('ORBIT Paused');
    }
  });

  // Team Alerts Section - Webhook Configuration
  const settingsContainer = document.querySelector('div:has(> span:contains("Configure your dashboard"))');
  if (!settingsContainer) return;

  if (document.getElementById('orbit-webhook-section')) return;

  const webhookSection = document.createElement('div');
  webhookSection.id = 'orbit-webhook-section';
  webhookSection.style.cssText = `
    background: #1a1a2e; border: 1px solid #2d2d4e; border-radius: 8px;
    padding: 16px; margin-top: 16px; font-family: sans-serif;
  `;

  webhookSection.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <span style="color:#00d4ff;font-weight:600;font-size:14px;">Team Alerts</span>
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;color:#9ca3af;font-size:12px;margin-bottom:6px;">Slack/Discord Webhook URL</label>
      <input type="url" id="orbit-webhook-url" placeholder="https://hooks.slack.com/services/..." 
        style="width:100%;padding:8px 12px;border:1px solid #2d2d4e;border-radius:6px;
        background:#0d0d1a;color:#e2e8f0;font-size:13px;outline:none;box-sizing:border-box;">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="color:#9ca3af;font-size:12px;">Enable Webhook Alerts</span>
      <button id="orbit-webhook-toggle" style="
        background:#2d2d4e;border:1px solid #4f46e5;border-radius:12px;
        color:#ef4444;cursor:pointer;font-size:12px;padding:4px 10px;
      ">OFF</button>
    </div>
    <div id="orbit-webhook-status" style="margin-top:8px;font-size:11px;color:#6b7280;"></div>
  `;

  settingsContainer.appendChild(webhookSection);

  const webhookUrlInput = document.getElementById('orbit-webhook-url');
  const webhookToggleBtn = document.getElementById('orbit-webhook-toggle');
  const webhookStatus = document.getElementById('orbit-webhook-status');

  getSettings().then(settings => {
    if (webhookUrlInput) {
      webhookUrlInput.value = settings.webhookUrl || '';
    }
    updateWebhookToggleState(webhookToggleBtn, settings.webhookEnabled);
    updateWebhookStatus(webhookStatus, settings.webhookEnabled, settings.webhookUrl);
  });

  webhookUrlInput.addEventListener('input', async () => {
    const settings = await getSettings();
    const newSettings = { ...settings, webhookUrl: webhookUrlInput.value };
    chrome.storage.local.set({ orbitSettings: newSettings });
    cachedSettings.webhookUrl = webhookUrlInput.value;
    updateWebhookStatus(webhookStatus, settings.webhookEnabled, webhookUrlInput.value);
  });

  webhookToggleBtn.addEventListener('click', async () => {
    const settings = await getSettings();
    const newState = !settings.webhookEnabled;
    
    const newSettings = { ...settings, webhookEnabled: newState };
    chrome.storage.local.set({ orbitSettings: newSettings });
    cachedSettings.webhookEnabled = newState;
    
    updateWebhookToggleState(webhookToggleBtn, newState);
    updateWebhookStatus(webhookStatus, newState, settings.webhookUrl);
    
    if (newState) {
      showOrbitNotification('Webhook alerts enabled');
    } else {
      showOrbitNotification('Webhook alerts disabled');
    }
  });
}

function updateWebhookToggleState(btn, enabled) {
  btn.textContent = enabled ? 'ON' : 'OFF';
  btn.style.color = enabled ? '#10b981' : '#ef4444';
  btn.style.borderColor = enabled ? '#4f46e5' : '#ef4444';
}

function updateWebhookStatus(statusEl, enabled, url) {
  if (!statusEl) return;
  if (!url) {
    statusEl.textContent = 'Enter a webhook URL to enable team alerts';
    statusEl.style.color = '#f59e0b';
  } else if (enabled) {
    statusEl.textContent = 'Active - Alerts will be sent to Slack/Discord';
    statusEl.style.color = '#10b981';
  } else {
    statusEl.textContent = 'Webhook configured - Toggle ON to enable alerts';
    statusEl.style.color = '#6b7280';
  }
}

function updateToggleBtnState(btn, enabled) {
  btn.textContent = enabled ? 'ON' : 'OFF';
  btn.style.color = enabled ? '#10b981' : '#ef4444';
  btn.style.borderColor = enabled ? '#4f46e5' : '#ef4444';
}

async function initExtension() {
  const settings = await getSettings();
  
  if (settings.orbitAIEnabled) {
    initOrbitDashboard();
    setTimeout(scanForTextareas, 1000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleSettingsPage);
  } else {
    handleSettingsPage();
  }
  
  // Start simple page visibility checker
  startPageVisibilityChecker();
}

initExtension();

console.log('✅ ORBIT V5 - Protection & Intelligence Active');