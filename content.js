// ============================================================
// ORBIT - Smart Reply Assistant
// content.js - V6 (Safe Initialization + Bulletproof SPA Router)
// ============================================================

console.log('🚀 ORBIT Content Script Loaded (V6 - Safe Edition)');

// ============================================================
// SECTION 0: SAFE INITIALIZATION (Critical Fix)
// ============================================================

let isStorageReady = false;

function safeInitialize() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['orbitStats', 'orbitSettings', 'orbitFAQs'], (result) => {
        try {
          let needsUpdate = false;
          const updates = {};

          if (!result.orbitStats) {
            updates.orbitStats = {
              repliesGenerated: 0,
              timeSavedMinutes: 0,
              risksCaught: 0,
              commentsAnalyzed: 0
            };
            needsUpdate = true;
          }

          if (!result.orbitSettings) {
            updates.orbitSettings = {
              analyticsTracking: true,
              emailNotifications: false,
              privacyMode: false,
              orbitAIEnabled: true,
              webhookUrl: '',
              webhookEnabled: false,
              productName: '',
              productDescription: ''
            };
            needsUpdate = true;
          }

          if (!result.orbitFAQs) {
            updates.orbitFAQs = [];
            needsUpdate = true;
          }

          if (needsUpdate) {
            chrome.storage.local.set(updates, () => {
              console.log('ORBIT: Storage initialized successfully');
            });
          }

          isStorageReady = true;
          onStorageReady();
        } catch (e) {
          console.warn('ORBIT: Failed to process storage initialization', e);
        }
      });
    } else {
      console.warn('ORBIT: Chrome storage API not available');
    }
  } catch (e) {
    console.warn('ORBIT: Failed to access storage during initialization', e);
  }
}

function onStorageReady() {
  console.log('ORBIT: Storage ready, initializing features...');
  initExtension();
}

safeInitialize();

// ============================================================
// SECTION 0B: POSTMESSAGE LISTENER (Fallback for FAQ saving)
// ============================================================
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ORBIT_SAVE_FAQ') {
    console.log("ORBIT DEBUG: Received FAQ save request via postMessage");
    const { text, author } = event.data.payload;

    if (!isStorageReady) return;

    const productName = getActiveProduct();
    
    chrome.storage.local.get(['orbitFAQs'], (data) => {
      let faqs = data.orbitFAQs || [];
      if (!faqs.some(faq => faq.text === text)) {
        faqs.unshift({ text: text, author: author || 'Customer', product: productName, timestamp: Date.now() });
        faqs = faqs.slice(0, 10);
        chrome.storage.local.set({ orbitFAQs: faqs }, () => {
          console.log("ORBIT DEBUG: FAQ saved via postMessage, product:", productName);
        });
      }
    });
  }
});

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
// SECTION 1B: ACTIVE PRODUCT DETECTOR
// ============================================================

function getActiveProduct() {
  const activeSidebarLink = document.querySelector('nav a[class*="bg-gray"], nav a[aria-current="page"], nav a.active, .sidebar a.active, .nav-item.active');
  
  if (activeSidebarLink) {
    const text = activeSidebarLink.textContent.trim();
    const genericTabs = ['Overview', 'Settings', 'Sales', 'Comments', 'Dashboard', 'Team Alerts'];
    if (!genericTabs.includes(text)) {
      return text;
    }
  }
  
  return "Global";
}

// ============================================================
// SECTION 2: SETTINGS & STATS FUNCTIONS (All guarded)
// ============================================================

function getSettings() {
  if (!isStorageReady) {
    return Promise.resolve({
      analyticsTracking: true,
      emailNotifications: false,
      privacyMode: false,
      orbitAIEnabled: true,
      webhookUrl: '',
      webhookEnabled: false,
      productName: '',
      productDescription: ''
    });
  }

  return new Promise((resolve) => {
    chrome.storage.local.get('orbitSettings', (result) => {
      resolve(result.orbitSettings || {
        analyticsTracking: true,
        emailNotifications: false,
        privacyMode: false,
        orbitAIEnabled: true,
        webhookUrl: '',
        webhookEnabled: false,
        productName: '',
        productDescription: ''
      });
    });
  });
}

function getStats() {
  if (!isStorageReady) {
    return Promise.resolve({
      repliesGenerated: 0,
      timeSavedMinutes: 0,
      risksCaught: 0,
      commentsAnalyzed: 0
    });
  }

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
  if (!isStorageReady) return;

  try {
    const settings = await getSettings();
    if (!settings.analyticsTracking) return;

    const stats = await getStats();
    stats.repliesGenerated += 1;
    stats.timeSavedMinutes += 3;
    if (wasRiskCaught) {
      stats.risksCaught += 1;
    }

    await new Promise((resolve) => {
      chrome.storage.local.set({ orbitStats: stats }, () => {
        console.log('ORBIT Stats Updated:', stats);
        resolve();
      });
    });

    updateOverviewStatsIfVisible();
  } catch (e) {
    console.warn('ORBIT: Failed to increment reply stats', e);
  }
}

async function incrementCommentsAnalyzed(isRefundRisk = false) {
  if (!isStorageReady) return;

  try {
    const settings = await getSettings();
    if (!settings.analyticsTracking) return;

    const stats = await new Promise((resolve) => {
      chrome.storage.local.get('orbitStats', (result) => {
        resolve(result.orbitStats || {
          repliesGenerated: 0,
          timeSavedMinutes: 0,
          risksCaught: 0,
          commentsAnalyzed: 0
        });
      });
    });

    stats.commentsAnalyzed = (stats.commentsAnalyzed || 0) + 1;

    if (isRefundRisk) {
      stats.risksCaught = (stats.risksCaught || 0) + 1;
    }

    await new Promise((resolve) => {
      chrome.storage.local.set({ orbitStats: stats }, resolve);
    });

    updateOverviewStatsIfVisible();
  } catch (e) {
    console.warn('ORBIT: Failed to increment comments analyzed', e);
  }
}

function captureQuestionFAQ(commentText, authorName) {
  if (!isStorageReady) return;

  console.log('ORBIT: Capturing FAQ -', commentText.substring(0, 50));
  chrome.storage.local.get('orbitFAQs', (result) => {
    let faqs = result.orbitFAQs || [];

    const isDuplicate = faqs.some(faq => faq.text === commentText);
    if (isDuplicate) {
      console.log('ORBIT: FAQ duplicate detected, skipping');
      return;
    }

    faqs.unshift({
      text: commentText,
      author: authorName,
      timestamp: Date.now()
    });

    faqs = faqs.slice(0, 10);

    chrome.storage.local.set({ orbitFAQs: faqs }, () => {
      console.log('ORBIT: FAQ saved successfully, total:', faqs.length);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimeSaved(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function updateOverviewStatsIfVisible() {
  if (!isStorageReady) return;

  const isOverviewPage = document.body.innerText.includes('Dashboard Overview') ||
                         document.querySelector('[data-page="overview"]') !== null;
  if (isOverviewPage) {
    const repliesEl = document.getElementById('orbit-replies-generated');
    const timeEl = document.getElementById('orbit-time-saved');
    const risksEl = document.getElementById('orbit-risks-caught');
    const commentsEl = document.getElementById('orbit-comments-analyzed');

    if (repliesEl || timeEl || risksEl || commentsEl) {
      chrome.storage.local.get('orbitStats', (result) => {
        const stats = result.orbitStats || { repliesGenerated: 0, timeSavedMinutes: 0, risksCaught: 0, commentsAnalyzed: 0 };
        if (repliesEl) repliesEl.innerText = stats.repliesGenerated || 0;
        if (timeEl) timeEl.innerText = formatTimeSaved(stats.timeSavedMinutes || 0);
        if (risksEl) risksEl.innerText = stats.risksCaught || 0;
        if (commentsEl) commentsEl.innerText = stats.commentsAnalyzed || 0;
      });
    }
  }
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
  if (!isStorageReady) return;

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
  if (!isStorageReady) return;

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

  chrome.runtime.sendMessage({
    action: 'sendWebhook',
    url: settings.webhookUrl,
    payload: payload
  }, (response) => {
    if (response && response.success) {
      console.log('ORBIT: Webhook alert sent successfully');
    } else if (response && response.error) {
      console.error('ORBIT: Webhook alert failed:', response.error);
    }
  });
}

// ============================================================
// SECTION 2B: LANGUAGE DETECTOR & CLASSIFIER
// ============================================================

function isEnglish(text) {
  if (!text || text.trim().length < 4) return true;

  const engIndicators = /\b(the|is|to|and|a|in|it|you|for|on|with|this|that|of|how|what|when|why|can|will|my|does|any|has|have|but|not|are|be)\b/i;
  const hasBasicEnglish = engIndicators.test(text);
  const hasOrbitKeyword = Object.values(KEYWORDS).flat().some(kw => text.toLowerCase().includes(kw));

  return hasBasicEnglish || hasOrbitKeyword;
}

function classifyComment(text) {
  if (!text || text.trim().length < 3) return { type: 'NEUTRAL', score: 0 };

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
// SECTION 3: REACT-COMPATIBLE SETTER
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
// SECTION 4: ORBIT BAR INJECTION
// ============================================================

const injectedTextareas = new WeakSet();
let orbitObserver = null;
let commentIndexCounter = 0;
let cachedSettings = {
  analyticsTracking: true,
  emailNotifications: false,
  privacyMode: false,
  orbitAIEnabled: true,
  webhookUrl: '',
  webhookEnabled: false,
  productName: '',
  productDescription: ''
};

function injectOrbitBar(textarea) {
  if (!isStorageReady) return;
  if (injectedTextareas.has(textarea)) return;
  if (!textarea.parentElement || !document.contains(textarea)) return;
  if (!cachedSettings.orbitAIEnabled) return;

  _injectOrbitBarInternal(textarea, cachedSettings);
}

function _injectOrbitBarInternal(textarea, settings) {
  if (textarea.parentElement.querySelector('.orbit-reply-assistant')) {
    injectedTextareas.add(textarea);
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

  if (settings.privacyMode) {
    commentIndexCounter++;
    authorName = `Customer #${commentIndexCounter}`;
  }

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

  let isRefundRisk = false;
  if (refundRisk >= 50) {
    type = 'CRITICAL';
    priority = 1000;
    isRefundRisk = true;
  }

  console.warn("🟢 ORBIT_FINAL_DATA >>", { type, priority, authorName, refundRisk });

  incrementCommentsAnalyzed(isRefundRisk);

  const typeStr = String(type).toUpperCase();
  if (typeStr.includes('QUESTION')) {
    console.log("ORBIT DEBUG: Caught a question!", commentText.substring(0, 50));

    chrome.storage.local.get(['orbitProducts', 'orbitFAQs'], (data) => {
      const products = data.orbitProducts || [];
      const faqs = data.orbitFAQs || [];
      
      let productName = 'Global';
      
      if (products.length > 0) {
        const pageTitle = document.querySelector('h1, .page-title, .product-title')?.textContent?.trim();
        
        if (pageTitle) {
          const matchedProduct = products.find(p => 
            pageTitle.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(pageTitle.toLowerCase())
          );
          if (matchedProduct) {
            productName = matchedProduct.name;
          } else {
            const currentUrl = window.location.href;
            const matchedUrl = products.find(p => currentUrl.includes(p.url) || p.url.includes(currentUrl));
            if (matchedUrl) {
              productName = matchedUrl.name;
            }
          }
        } else {
          const currentUrl = window.location.href;
          const matchedUrl = products.find(p => currentUrl.includes(p.url) || p.url.includes(currentUrl));
          if (matchedUrl) {
            productName = matchedUrl.name;
          }
        }
      }

      if (!faqs.some(faq => faq.text === commentText)) {
        faqs.unshift({ text: commentText, author: authorName || 'Customer', product: productName, timestamp: Date.now() });
        faqs = faqs.slice(0, 10);
        chrome.storage.local.set({ orbitFAQs: faqs }, () => {
          console.log("ORBIT DEBUG: Saved FAQ for product:", productName);
        });
      } else {
        console.log("ORBIT DEBUG: Duplicate question, skipping");
      }
    });
  }

  const TYPE_COLORS = {
    NEGATIVE: '#ef4444',
    QUESTION: '#3b82f6',
    FEATURE: '#8b5cf6',
    POSITIVE_FEATURE: '#f59e0b',
    POSITIVE: '#10b981',
    NON_ENGLISH: '#ec4899',
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

  if (type === 'CRITICAL') {
    if (settings.emailNotifications) {
      checkAndTriggerEmailNotification(commentText, refundRisk);
    }

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
      incrementReplyStats(true);
    });
    updateOrbitDashboard();
    return;
  }

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
    return;
  }

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

      const existingFeedback = bar.querySelector('.orbit-feedback-btns');
      if (existingFeedback) existingFeedback.remove();

      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'orbit-feedback-btns';
      feedbackDiv.style.cssText = 'display:flex;gap:4px;margin-left:8px;';
      feedbackDiv.innerHTML = `
        <button class="orbit-feedback-good" style="background:#10b981;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">👍</button>
        <button class="orbit-feedback-bad" style="background:#ef4444;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:12px;">👎</button>
      `;
      bar.appendChild(feedbackDiv);

      feedbackDiv.querySelector('.orbit-feedback-good').addEventListener('click', (ev) => {
        ev.stopPropagation();
        feedbackDiv.innerHTML = '<span style="color:#10b981;font-size:12px;">Thanks! ✓</span>';
      });

      feedbackDiv.querySelector('.orbit-feedback-bad').addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const reasons = ['Wrong Tone', 'Hallucination', 'Missed Context', 'Inaccurate', 'Other'];
        const reason = prompt('Why was this reply not good?\n\nOptions: ' + reasons.join(', '));
        if (reason) {
          await saveReplyFeedback(commentText, replyText, reason);
          feedbackDiv.innerHTML = '<span style="color:#f59e0b;font-size:12px;">Feedback saved! ✓</span>';
        }
      });

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
// SECTION 5: FLOATING DASHBOARD
// ============================================================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let orbitDashboardDismissed = false;

function initOrbitDashboard() {
  if (document.getElementById('orbit-dashboard')) return;
  if (orbitDashboardDismissed) return;

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

  const toggleBtn = document.getElementById('orbit-toggle');

  chrome.storage.local.get('orbitSettings', (result) => {
    const settings = result.orbitSettings || {};
    const isEnabled = settings.orbitAIEnabled !== false;
    updateToggleState(toggleBtn, isEnabled);
  });
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

  const typeCounts = {};
  allBars.forEach(bar => {
    const badges = bar.querySelectorAll('span');
    const badge = badges[1];
    if (!badge) return;
    const t = badge.textContent.trim();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const total = allBars.length;
  const fillable = genBtns.length;

  const statsEl = document.getElementById('orbit-dash-stats');
  if (statsEl) {
    statsEl.textContent = total === 0
      ? 'No reply fields found yet — open a reply form.'
      : `🎯 ${total} comment${total !== 1 ? 's' : ''} detected · ${fillable} ready to fill`;
  }

  const autofillBtn = document.getElementById('orbit-dash-autofill');
  if (autofillBtn) {
    autofillBtn.style.display = 'block';
  }

  const TYPE_COLORS = {
    NEGATIVE: '#ef4444', QUESTION: '#3b82f6', FEATURE: '#8b5cf6',
    POSITIVE_FEATURE: '#f59e0b', POSITIVE: '#10b981', NEUTRAL: '#6b7280',
    NON_ENGLISH: '#ec4899', CRITICAL: '#dc2626'
  };
  const breakdownEl = document.getElementById('orbit-dash-breakdown');
  if (breakdownEl) {
    breakdownEl.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
      let displayType = type;
      if (type.includes('REFUND RISK')) displayType = 'CRITICAL';
      if (type.includes('NON_ENGLISH')) displayType = 'NON_ENGLISH';
      return `<span style="background:${TYPE_COLORS[displayType] || '#6b7280'};color:white;padding:2px 8px;
        border-radius:12px;font-size:11px;font-weight:600;">${type}: ${count}</span>`;
    }).join('');
  }

  const autoBtn = document.getElementById('orbit-dash-autofill');
  if (autoBtn) {
    autoBtn.textContent = '✨ Draft All Replies';
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

    const existingTextarea = card.querySelector('textarea');
    if (existingTextarea && existingTextarea.value.trim() !== '') {
      continue;
    }

    let commentText = '';
    let authorName = 'there';

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

    const nameEl = card.querySelector('h4, h3, .author-info, .user-name');
    if (nameEl) {
      const name = nameEl.textContent.trim();
      if (name && name !== 'undefined' && name !== 'null') {
        authorName = name.split(' ')[0];
      }
    }

    const { type } = classifyComment(commentText);
    if (type === 'NON_ENGLISH') {
      continue;
    }

    let textarea = existingTextarea;

    if (!textarea) {
      const btns = Array.from(card.querySelectorAll('button, .reply-btn, a'));
      const toggleBtn = btns.find(b => {
        const txt = b.textContent.toLowerCase().trim();
        return (txt === 'reply' || txt.includes('reply'))
          && !b.classList.contains('orbit-generate-btn')
          && !b.classList.contains('orbit-upsell-btn');
      });

      if (toggleBtn) {
        if (progressEl) progressEl.textContent = `👁️ Expanding reply ${i + 1}/${commentCards.length}...`;
        toggleBtn.click();
        await sleep(300);
        textarea = card.querySelector('textarea');
      }
    }

    if (!textarea) continue;

    if (progressEl) progressEl.textContent = `✍️ Drafting reply ${processedCount + 1}...`;

    try {
      const replyText = await generateReply(type, authorName, commentText);

      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, replyText);
      } else {
        textarea.value = replyText;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await incrementReplyStats(false);
      processedCount++;
    } catch (err) {
      console.error('ORBIT: Error generating reply:', err);
    }

    await sleep(100);
  }

  if (progressEl) {
    if (processedCount === 0) {
      progressEl.textContent = '⚠️ No valid empty reply fields found.';
    } else {
      progressEl.textContent = `✅ ${processedCount} repl${processedCount !== 1 ? 'ies' : 'y'} drafted successfully!`;
    }
    setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
  }

  if (autoBtn) {
    autoBtn.disabled = false;
    autoBtn.textContent = '✨ Draft All Replies';
    updateOrbitDashboard();
  }
}

// ============================================================
// SECTION 6: SCANNER & OBSERVER
// ============================================================

function scanAndInject() {
  if (!isStorageReady) return;

  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) return;

    document.querySelectorAll('textarea').forEach(textarea => {
      if (!injectedTextareas.has(textarea)) injectOrbitBar(textarea);
    });
    updateOrbitDashboard();
  });
}

let scanTimeout;
orbitObserver = new MutationObserver(mutations => {
  if (!isStorageReady) return;

  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) {
      orbitObserver.disconnect();
      return;
    }

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

let hasScannedThisCycle = false;

function scanForTextareas() {
  if (!isStorageReady) return;
  if (hasScannedThisCycle) return;
  hasScannedThisCycle = true;

  setTimeout(() => { hasScannedThisCycle = false; }, 5000);

  getSettings().then(settings => {
    if (!settings.orbitAIEnabled) return;

    document.querySelectorAll('textarea').forEach(textarea => {
      if (!injectedTextareas.has(textarea)) injectOrbitBar(textarea);
    });
    updateOrbitDashboard();
    saveBulkScanStats();
  });
}

function saveBulkScanStats() {
  if (!isStorageReady) return;

  const totalComments = document.querySelectorAll('.orbit-reply-assistant').length;

  if (totalComments === 0) return;

  chrome.storage.local.get('orbitStats', (result) => {
    const stats = result.orbitStats || {
      repliesGenerated: 0,
      timeSavedMinutes: 0,
      risksCaught: 0,
      commentsAnalyzed: 0
    };

    let riskCount = 0;
    document.querySelectorAll('.orbit-reply-assistant').forEach(bar => {
      const badges = bar.querySelectorAll('span');
      badges.forEach(badge => {
        if (badge.textContent && badge.textContent.includes('REFUND RISK')) {
          riskCount++;
        }
      });
    });

    stats.commentsAnalyzed = (stats.commentsAnalyzed || 0) + totalComments;
    stats.risksCaught = (stats.risksCaught || 0) + riskCount;

    chrome.storage.local.set({ orbitStats: stats }, () => {
      console.log('ORBIT Scan Stats Saved:', stats);
      updateOverviewStatsIfVisible();
    });
  });
}

 function renderMasterFilter() {
    if (!isStorageReady) return;
    if (document.getElementById('orbit-master-filter-container')) return;

    // بحث ذكي ومضمون عن مكان العدادات للصق الفلتر فوقها
    const repliesEl = document.querySelector('[id*="replies"]');
    if (!repliesEl) return;
    const statsGrid = repliesEl.closest('div[class*="grid"], div[class*="flex"]') || repliesEl.parentElement.parentElement;
    if (!statsGrid || !statsGrid.parentNode) return;

    const container = document.createElement('div');
    container.id = 'orbit-master-filter-container';
    container.style.cssText = 'margin-bottom: 24px; padding: 16px 24px; background: #1e1e24; border-radius: 12px; border: 1px solid #4f46e5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; box-sizing: border-box;';

    container.innerHTML = `
        <div style="display:flex; align-items:center; gap: 12px;">
            <span style="font-size:24px;">📊</span>
            <div>
                <h3 style="color:#fff; margin:0 0 4px 0; font-size:16px; font-weight:bold;">Dashboard Overview</h3>
                <p style="color:#9ca3af; margin:0; font-size:12px;">Select a product to filter your FAQs.</p>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
            <label style="color:#9ca3af; font-size:14px; font-weight:600;">Active Product:</label>
            <select id="orbit-master-filter" style="background:#2d2d36; color:#10b981; border:2px solid #374151; border-radius:8px; padding:10px 16px; font-size:14px; font-weight:bold; outline:none; cursor:pointer; min-width: 200px;">
                <option value="Global">🌍 All Products (Global)</option>
            </select>
        </div>
    `;

    statsGrid.parentNode.insertBefore(container, statsGrid);

    chrome.storage.local.get(['orbitProducts', 'orbitActiveFilter'], (res) => {
        const select = document.getElementById('orbit-master-filter');
        (res.orbitProducts || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = "📦 " + p.name;
            select.appendChild(opt);
        });
        
        if (res.orbitActiveFilter) select.value = res.orbitActiveFilter;

        select.addEventListener('change', (e) => {
            chrome.storage.local.set({ orbitActiveFilter: e.target.value }, () => {
                document.getElementById('orbit-dynamic-faq')?.remove();
                if (typeof renderAutoFAQ === 'function') renderAutoFAQ();
                renderStatsUI();
            });
        });
    });
}

// ============================================================
// SECTION 8: UNIFIED SPA ROUTER
// ============================================================

let routerInterval = null;

function renderStatsUI() {
  if (!isStorageReady) return;
  try {
    chrome.storage.local.get(['orbitStats', 'orbitActiveFilter'], (result) => {
      const allStats = result.orbitStats || {};
      const activeFilter = result.orbitActiveFilter || 'Global';
      
      let displayStats;

      if (activeFilter === 'Global') {
        displayStats = {
          repliesGenerated: allStats.repliesGenerated || 0,
          timeSavedMinutes: allStats.timeSavedMinutes || 0,
          risksCaught: allStats.risksCaught || 0,
          commentsAnalyzed: allStats.commentsAnalyzed || 0
        };
      } else {
        displayStats = (allStats.byProduct && allStats.byProduct[activeFilter]) || {
          repliesGenerated: 0,
          timeSavedMinutes: 0,
          risksCaught: 0,
          commentsAnalyzed: 0
        };
      }

      const repliesEl = document.getElementById('orbit-replies-generated');
      const timeEl = document.getElementById('orbit-time-saved');
      const risksEl = document.getElementById('orbit-risks-caught');
      const commentsEl = document.getElementById('orbit-comments-analyzed');

      if (repliesEl) repliesEl.innerText = displayStats.repliesGenerated;
      if (timeEl) timeEl.innerText = formatTimeSaved(displayStats.timeSavedMinutes);
      if (risksEl) risksEl.innerText = displayStats.risksCaught;
      if (commentsEl) commentsEl.innerText = displayStats.commentsAnalyzed;
    });
  } catch (e) { console.error("Stats Render Error:", e); }
}

function renderAutoFAQ() {
  if (!isStorageReady) return;
  if (document.getElementById('orbit-dynamic-faq')) return;
  
  try {
    const statsEl = document.querySelector('[id*="replies"], [id*="time-saved"], [id*="risks"]');
    if (!statsEl) return;
    
    const container = statsEl.closest('.bg-gray-50, .stats-container, .overview-container, .main-content') || statsEl.parentElement?.parentElement || statsEl.parentElement;
    if (!container) return;

    chrome.storage.local.get(['orbitFAQs', 'orbitActiveFilter'], (result) => {
      const faqs = result.orbitFAQs || [];
      const activeFilter = result.orbitActiveFilter || 'Global';
      
      const faqDiv = document.createElement('div');
      faqDiv.id = 'orbit-dynamic-faq';
      faqDiv.style.cssText = 'margin-top: 20px; padding: 16px; background: #1e1e24; border-radius: 8px; border: 1px solid #333; font-family: sans-serif;';
      
      const filteredFaqs = activeFilter === 'Global' ? faqs : faqs.filter(faq => faq.product === activeFilter);
      
      faqDiv.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="color:#fff;margin:0;font-size:16px;">📚 Auto-FAQ: <span style="color:#10b981;">${escapeHtml(activeFilter)}</span></h3>
          <button id="orbit-clear-faqs" style="background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;">🗑️ Clear</button>
        </div>
        <div id="orbit-faq-list" style="display:flex;flex-direction:column;gap:8px;"></div>
      `;
      
      container.appendChild(faqDiv);
      
      const listContainer = document.getElementById('orbit-faq-list');
      
      if (filteredFaqs.length === 0) {
        listContainer.innerHTML = '<p style="color:#6b7280;font-size:13px;text-align:center;padding:10px 0;">No questions for ' + escapeHtml(activeFilter) + '.</p>';
      } else {
        listContainer.innerHTML = filteredFaqs.map(faq => `
          <div style="background:#2d2d36;padding:12px;border-radius:6px;border:1px solid #444;display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <p style="color:#e2e8f0;font-size:13px;margin:0 0 6px 0;line-height:1.4;">${escapeHtml(faq.text)}</p>
              <span style="color:#888;font-size:11px;">— ${escapeHtml(faq.author || 'Customer')}</span>
            </div>
            <span style="background:#4f46e5;color:#fff;font-size:10px;padding:3px 8px;border-radius:12px;white-space:nowrap;margin-left:10px;font-weight:bold;">${escapeHtml(faq.product || 'Global')}</span>
          </div>
        `).join('');
      }
      
      document.getElementById('orbit-clear-faqs')?.addEventListener('click', () => {
        chrome.storage.local.set({ orbitFAQs: [] }, () => {
          listContainer.innerHTML = '<p style="color:#6b7280;font-size:13px;text-align:center;padding:10px 0;">Memory cleared.</p>';
        });
      });
    });
  } catch (e) { /* container not found */ }
}

function renderCommandCenter() {
  if (!isStorageReady) return;
  if (document.getElementById('orbit-command-center')) return;
  
  try {
    let targetEl = null;
    const allElements = document.querySelectorAll('h1, h2, h3, h4, div, section');
    
    for (const el of allElements) {
      const text = el.textContent || '';
      if (text.includes('Email Notifications') || text.includes('Configure your dashboard') || text.includes('Analytics Tracking')) {
        targetEl = el;
        break;
      }
    }
    
    if (!targetEl) {
      targetEl = document.querySelector('#settings, .settings-page, .main-content, [role="main"]');
    }
    
    if (!targetEl) {
      targetEl = document.body;
    }
    
    const cmdDiv = document.createElement('div');
    cmdDiv.id = 'orbit-command-center';
    cmdDiv.style.cssText = 'margin: 20px 0; padding: 24px; background: #1e1e24; border-radius: 12px; border: 1px solid #4f46e5; max-width: 700px; font-family: sans-serif;';
    
    cmdDiv.innerHTML = `
      <h3 style="color:#00d4ff;margin:0 0 12px 0;font-size:18px;">🎯 Command Center - My Products</h3>
      <p style="color:#9ca3af;margin:0 0 16px 0;font-size:13px;">Add products. Click "Open" to launch their comments page where ORBIT activates.</p>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <input type="text" id="orbit-prod-name" placeholder="Product Name" style="flex:1;padding:12px;border-radius:6px;border:1px solid #444;background:#2d2d36;color:#fff;font-size:14px;box-sizing:border-box;">
        <input type="url" id="orbit-prod-url" placeholder="Comments URL" style="flex:2;padding:12px;border-radius:6px;border:1px solid #444;background:#2d2d36;color:#fff;font-size:14px;box-sizing:border-box;">
        <button id="orbit-add-prod" style="background:#10b981;color:#fff;border:none;padding:12px 20px;border-radius:6px;cursor:pointer;font-weight:600;">➕ Add</button>
      </div>
      <div id="orbit-prod-list" style="display:flex;flex-direction:column;gap:10px;"></div>
    `;
    
    targetEl.appendChild(cmdDiv);
    
    const renderList = (prods) => {
      const list = document.getElementById('orbit-prod-list');
      if (!list) return;
      
      if (!prods || prods.length === 0) {
        list.innerHTML = '<p style="color:#6b7280;font-size:13px;">No products yet.</p>';
        return;
      }
      
      list.innerHTML = prods.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#2d2d36;padding:14px;border-radius:8px;border:1px solid #444;">
          <div>
            <strong style="color:#fff;font-size:14px;">${escapeHtml(p.name)}</strong>
            <div style="color:#888;font-size:12px;margin-top:4px;">${escapeHtml(p.url)}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <a href="${escapeHtml(p.url)}" target="_blank" style="background:#3b82f6;color:#fff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:12px;">🔗 Open</a>
            <button class="orbit-del-prod" data-id="${p.id}" style="background:#ef4444;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>
          </div>
        </div>
      `).join('');
      
      list.querySelectorAll('.orbit-del-prod').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          chrome.storage.local.get(['orbitProducts'], res => {
            const updated = (res.orbitProducts || []).filter(p => p.id !== id);
            chrome.storage.local.set({ orbitProducts: updated }, () => renderList(updated));
          });
        });
      });
    };
    
    chrome.storage.local.get(['orbitProducts'], res => renderList(res.orbitProducts || []));
    
    document.getElementById('orbit-add-prod').addEventListener('click', () => {
      const name = document.getElementById('orbit-prod-name').value.trim();
      const url = document.getElementById('orbit-prod-url').value.trim();
      if (name && url) {
        chrome.storage.local.get(['orbitProducts'], res => {
          const prods = res.orbitProducts || [];
          prods.push({ id: Date.now(), name, url });
          chrome.storage.local.set({ orbitProducts: prods }, () => {
            renderList(prods);
            document.getElementById('orbit-prod-name').value = '';
            document.getElementById('orbit-prod-url').value = '';
          });
        });
      }
    });
  } catch (e) { /* render failed */ }
}

// SINGLE UNIFIED SPA ROUTER
routerInterval = setInterval(() => {
  try {
    if (!isStorageReady) return;
    
    if (!chrome.runtime?.id) {
      clearInterval(routerInterval);
      return;
    }

    const bodyText = document.body.innerText || "";
    
    const isSettings = bodyText.includes('Configure your dashboard preferences') || bodyText.includes('Email Notifications');
    const isOverview = (bodyText.includes('REPLIES GENERATED') || bodyText.includes('Dashboard Overview')) && !isSettings;

    if (isSettings) {
      document.getElementById('orbit-dynamic-faq')?.remove();
      if (typeof renderCommandCenter === 'function') renderCommandCenter();
    } 
    else if (isOverview) {
      document.getElementById('orbit-command-center')?.remove();
      if (typeof renderMasterFilter === 'function') renderMasterFilter();
      if (typeof renderStatsUI === 'function') renderStatsUI();
      if (typeof renderAutoFAQ === 'function') renderAutoFAQ();
    }
    else {
      document.getElementById('orbit-command-center')?.remove();
      document.getElementById('orbit-dynamic-faq')?.remove();
    }
  } catch (e) {
    if (e.message?.includes('Extension context invalidated')) {
      clearInterval(routerInterval);
    }
  }
}, 500);

console.log('ORBIT: Unified SPA Router started');

// Re-scan Comments on sidebar click
document.addEventListener('click', (e) => {
  const target = e.target.closest('a, button, [role="button"]');
  if (!target) return;
  
  const text = (target.textContent || '').toLowerCase();
  const href = target.href || '';
  
  if (text.includes('comment') || href.includes('comment')) {
    setTimeout(() => {
      if (isStorageReady) {
        scanForTextareas();
        initOrbitDashboard();
      }
    }, 1000);
  }
});

// ============================================================
// SECTION 9: GLOBAL EVENT HANDLERS
// ============================================================

document.addEventListener('click', async (e) => {
  if (e.target.id === 'orbit-dash-close') {
    orbitDashboardDismissed = true;
    const panel = document.getElementById('orbit-dashboard');
    if (panel) {
      panel.style.opacity = '0';
      setTimeout(() => panel.remove(), 300);
    }
  } else if (e.target.id === 'orbit-toggle') {
    if (!isStorageReady) return;
    const toggleBtn = e.target;
    chrome.storage.local.get('orbitSettings', (result) => {
      const settings = result.orbitSettings || {};
      const newState = !settings.orbitAIEnabled;
      const newSettings = { ...settings, orbitAIEnabled: newState };
      chrome.storage.local.set({ orbitSettings: newSettings });
      cachedSettings.orbitAIEnabled = newState;
      updateToggleState(toggleBtn, newState);
      if (newState) {
        scanForTextareas();
        showOrbitNotification('ORBIT enabled');
      } else {
        hideAllOrbitBars();
        showOrbitNotification('ORBIT paused');
      }
    });
  } else if (e.target.id === 'orbit-dash-autofill') {
    orbitBulkFill();
  }
});

// ============================================================
// SECTION 10: INITIALIZATION
// ============================================================

async function initExtension() {
  console.log('ORBIT: Starting initialization...');

  const settings = await getSettings();
  cachedSettings = { ...cachedSettings, ...settings };

  chrome.storage.local.get('orbitSettings', (result) => {
    if (result.orbitSettings) {
      cachedSettings = result.orbitSettings;
    }
  });

  if (settings.orbitAIEnabled) {
    initOrbitDashboard();
    setTimeout(scanForTextareas, 1000);

    if (orbitObserver && document.body) {
      try {
        orbitObserver.observe(document.body, { childList: true, subtree: true, attributes: false });
      } catch (e) {
        console.warn('ORBIT: Failed to start observer', e);
      }
    }
  }

  setupStatsStorageListener();

  console.log('ORBIT V6: Protection & Intelligence Active');
}

function setupStatsStorageListener() {
  if (!isStorageReady) return;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.orbitStats) {
      const newStats = changes.orbitStats.newValue;
      if (!newStats) return;

      const repliesEl = document.getElementById('orbit-replies-generated');
      const timeEl = document.getElementById('orbit-time-saved');
      const risksEl = document.getElementById('orbit-risks-caught');
      const commentsEl = document.getElementById('orbit-comments-analyzed');

      if (repliesEl) repliesEl.innerText = newStats.repliesGenerated || 0;
      if (timeEl) timeEl.innerText = formatTimeSaved(newStats.timeSavedMinutes || 0);
      if (risksEl) risksEl.innerText = newStats.risksCaught || 0;
      if (commentsEl) commentsEl.innerText = newStats.commentsAnalyzed || 0;
    }
  });

  console.log('ORBIT: Stats storage listener registered');
}

console.log('✅ ORBIT V6 - Safe Initialization Complete');
