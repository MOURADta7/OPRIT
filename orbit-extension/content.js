// ============================================================
// ORBIT - Smart Reply Assistant
// content.js - Complete & Clean Version
// ============================================================

console.log('🚀 ORBIT Content Script Loaded');

// ============================================================
// SECTION 1: CONFIGURATION
// ============================================================

const KEYWORDS = {
  NEGATIVE: [
    'refund', 'broken', 'doesnt work', "doesn't work", 'not working',
    'disappointed', 'useless', 'waste', 'bug', 'crash', 'error',
    'terrible', 'worst', 'scam', 'awful', 'horrible', 'hate',
    'frustrated', 'frustrating', 'fails', 'failed', 'failure', 'problem'
  ],
  QUESTION: [
    'how', 'does it', 'can i', 'will it', 'is there', 'what is',
    'do you', 'when will', 'support', 'integrate', 'compatible',
    'pricing', 'lifetime', 'does this', 'is this', 'are you',
    'will you', 'have you', 'timeline', 'roadmap?', 'when is',
    'can it', 'does the', 'will the', 'any plans', 'any chance'
  ],
  FEATURE: [
    'would love', 'please add', 'wish', 'feature request', 'roadmap',
    'suggestion', 'consider adding', 'it would be great', 'could you add',
    'would be great', 'hope to see', 'looking forward', 'dark mode',
    'mobile app', 'integration', 'zapier', 'api', 'export', 'import',
    'would be nice', 'missing feature', 'need a', 'needs a'
  ],
  POSITIVE: [
    'love', 'great', 'amazing', 'excellent', 'perfect', 'fantastic',
    'works great', 'highly recommend', 'best', 'awesome', 'thank you',
    'thanks', 'wonderful', 'brilliant', 'superb', 'impressed',
    'exactly what', 'looking for', 'well done', 'keep it up', 'happy'
  ]
};

const PRIORITY = {
  NEGATIVE_TIER3: 100,
  NEGATIVE: 90,
  QUESTION_TIER3: 80,
  QUESTION: 60,
  FEATURE: 40,
  POSITIVE_FEATURE: 35,
  POSITIVE: 20,
  NEUTRAL: 10
};

// ============================================================
// SECTION 2: CLASSIFIER
// ============================================================

function classifyComment(text) {
  if (!text || text.length < 10) {
    return { type: 'NEUTRAL', score: 0 };
  }

  const lower = text.toLowerCase();
  const scores = { NEGATIVE: 0, QUESTION: 0, FEATURE: 0, POSITIVE: 0 };

  KEYWORDS.NEGATIVE.forEach(kw => { if (lower.includes(kw)) scores.NEGATIVE++; });
  KEYWORDS.QUESTION.forEach(kw => { if (lower.includes(kw)) scores.QUESTION++; });
  KEYWORDS.FEATURE.forEach(kw => { if (lower.includes(kw)) scores.FEATURE++; });
  KEYWORDS.POSITIVE.forEach(kw => { if (lower.includes(kw)) scores.POSITIVE++; });

  console.log('ORBIT classify scores:', scores, 'for:', lower.substring(0, 80));

  const max = Math.max(...Object.values(scores));
  if (max === 0) return { type: 'NEUTRAL', score: 0 };

  // Mixed: POSITIVE + FEATURE
  if (scores.POSITIVE > 0 && scores.FEATURE > 0 &&
      scores.NEGATIVE === 0 &&
      Math.abs(scores.POSITIVE - scores.FEATURE) <= 2) {
    return { type: 'POSITIVE_FEATURE', score: scores.POSITIVE + scores.FEATURE };
  }

  const winner = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
  return { type: winner[0], score: winner[1] };
}

// ============================================================
// SECTION 3: PRIORITY CALCULATOR
// ============================================================

function calculatePriority(type, tier) {
  const isTier3 = tier && tier.toString().includes('3');
  switch (type) {
    case 'NEGATIVE':     return isTier3 ? PRIORITY.NEGATIVE_TIER3 : PRIORITY.NEGATIVE;
    case 'QUESTION':     return isTier3 ? PRIORITY.QUESTION_TIER3 : PRIORITY.QUESTION;
    case 'FEATURE':      return PRIORITY.FEATURE;
    case 'POSITIVE_FEATURE': return PRIORITY.POSITIVE_FEATURE;
    case 'POSITIVE':     return PRIORITY.POSITIVE;
    default:             return PRIORITY.NEUTRAL;
  }
}

// ============================================================
// SECTION 4: EXTRACT KEY TOPIC FROM COMMENT
// ============================================================

function extractTopic(text) {
  const stopWords = new Set([
    'the','a','an','is','it','i','my','to','do','in','of','for',
    'and','or','but','was','with','this','that','have','had','not',
    'are','be','as','at','by','we','he','she','they','you','your',
    'our','its','also','just','very','so','if','when','then','than',
    'been','has','from','would','could','should','will','did','does'
  ]);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  // Find most meaningful word
  const topicPhrases = [
    'mobile app', 'dark mode', 'zapier', 'integration', 'api',
    'onboarding', 'timeline', 'pricing', 'export', 'import',
    'notification', 'dashboard', 'analytics', 'support', 'documentation'
  ];

  const lowerText = text.toLowerCase();
  for (const phrase of topicPhrases) {
    if (lowerText.includes(phrase)) return phrase;
  }

  return words[0] || 'your feedback';
}

// ============================================================
// SECTION 5: REPLY TEMPLATES
// ============================================================

function generateReply(type, name, commentText) {
  const topic = extractTopic(commentText);
  const n = name || 'there';
  const variants = {
    NEGATIVE: [
      `Hi ${n}, we're truly sorry to hear this. Could you share more details about the issue with ${topic}? Our team will follow up within 24 hours to make this right.`,
      `Hi ${n}, this is not the experience we want for you. Please reach out directly and we'll prioritize fixing the ${topic} issue immediately.`,
      `Hi ${n}, we take this seriously. Send us the details about ${topic} and we'll personally make sure it's resolved for you.`
    ],
    QUESTION: [
      `Hi ${n}, great question about ${topic}! We'd love to give you the most accurate answer — could you share a bit more about your use case?`,
      `Hi ${n}, thanks for asking about ${topic}. Yes, this is something we support! Drop us a message with more details and we'll walk you through it.`,
      `Hi ${n}, regarding ${topic} — absolutely. Let us know your specific setup and we'll give you a tailored answer.`
    ],
    FEATURE: [
      `Hi ${n}, love the suggestion about ${topic}! We've added it to our roadmap and will keep you posted on progress.`,
      `Hi ${n}, we've noted your ${topic} request — our team is reviewing it. Stay tuned for updates!`,
      `Hi ${n}, thanks for the ${topic} idea! This aligns with our roadmap. We'll announce when it's ready.`
    ],
    POSITIVE_FEATURE: [
      `Hi ${n}, this made our day! Your point about ${topic} is well taken and it's now on our roadmap.`,
      `Hi ${n}, so glad it's working for you! We've captured your ${topic} suggestion and our team is reviewing it.`,
      `Hi ${n}, thank you! The feedback about ${topic} is exactly what helps us improve. Watch this space!`
    ],
    POSITIVE: [
      `Hi ${n}, this genuinely made our team smile! Don't hesitate to reach out if you ever need anything.`,
      `Hi ${n}, thank you so much for the kind words! We're glad ${topic} is working well for you.`,
      `Hi ${n}, we really appreciate this! Feedback like yours keeps us motivated. Thank you!`
    ],
    NEUTRAL: [
      `Hi ${n}, thanks for your comment! Let us know if there's anything we can help you with regarding ${topic}.`,
      `Hi ${n}, we appreciate you reaching out. Feel free to share more details and we'll be happy to assist.`,
      `Hi ${n}, thank you! If you have any questions about ${topic} or anything else, we're here to help.`
    ]
  };

  const options = variants[type] || variants['NEUTRAL'];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================
// SECTION 6: NAME EXTRACTOR
// ============================================================

function extractAuthorName(commentContainer) {
  const exclude = ['reply', 'flag', 'ago', 'hours', 'days', 'minutes',
                   'tier', 'post', 'write', 'cancel', 'mark', 'resolved',
                   '@', 'http', 'www'];

  const selectors = ['h4', 'h3', 'h2',
    '[class*="author"] h4', '[class*="author"] h3',
    '[class*="name"]', '[class*="user-name"]',
    '[class*="username"]', '[class*="display-name"]',
    'strong', 'b'];

  for (const sel of selectors) {
    try {
      const el = commentContainer.querySelector(sel);
      if (!el) continue;
      const text = el.textContent.trim();
      if (text.length < 2 || text.length > 50) continue;
      if (exclude.some(ex => text.toLowerCase().includes(ex))) continue;
      if (text.includes('@')) continue;
      if (/\d{4}/.test(text)) continue;
      const firstName = text.split(/\s+/)[0];
      if (firstName && firstName.length > 1) {
        console.log('ORBIT name found:', firstName);
        return firstName;
      }
    } catch(e) {}
  }

  // Fallback: walk all text nodes in container
  const walker = document.createTreeWalker(
    commentContainer, NodeFilter.SHOW_TEXT, null, false
  );
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim();
    if (text.length < 3 || text.length > 40) continue;
    if (exclude.some(ex => text.toLowerCase().includes(ex))) continue;
    if (text.includes('@') || /\d/.test(text)) continue;
    const words = text.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      console.log('ORBIT name fallback:', words[0]);
      return words[0];
    }
  }

  return 'there';
}

// ============================================================
// SECTION 7: GET COMMENT TEXT
// ============================================================

function getCommentText(orbitBar) {
  // Walk up from orbit bar to find comment container
  let el = orbitBar;
  for (let i = 0; i < 8; i++) {
    el = el.parentElement;
    if (!el) break;

    // Find all text nodes inside this container
    const texts = [];
    el.querySelectorAll('p, span, div').forEach(node => {
      // Skip orbit elements, buttons, inputs
      if (node.closest('.orbit-reply-assistant')) return;
      if (node.tagName === 'BUTTON' || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') return;
      if (node.classList.toString().includes('orbit')) return;

      const text = node.textContent.trim();
      if (text.length > 30) texts.push(text);
    });

    // Return longest meaningful text
    if (texts.length > 0) {
      const longest = texts.reduce((a, b) => b.length > a.length ? b : a, '');
      if (longest.length > 20) {
        console.log('ORBIT comment text found:', longest.substring(0, 100));
        return longest;
      }
    }
  }
  return '';
}

// ============================================================
// SECTION 8: GET TIER
// ============================================================

function getTier(commentContainer) {
  const text = commentContainer.textContent || '';
  const match = text.match(/tier\s*(\d)/i);
  return match ? match[1] : null;
}

// ============================================================
// SECTION 9: LIBRARY (chrome.storage safe wrapper)
// ============================================================

function getLibrary() {
  return new Promise(resolve => {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      resolve([]);
      return;
    }
    chrome.storage.local.get('orbit_library', result => {
      resolve(result.orbit_library || []);
    });
  });
}

function saveToLibrary(entry) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  getLibrary().then(library => {
    const similar = library.find(e =>
      e.commentType === entry.commentType &&
      similarity(e.replyText, entry.replyText) > 0.9
    );
    if (similar) {
      similar.usedCount = (similar.usedCount || 1) + 1;
      similar.lastUsed = Date.now();
    } else {
      library.push({ ...entry, id: Date.now(), usedCount: 1, lastUsed: Date.now() });
    }
    chrome.storage.local.set({ orbit_library: library });
    updatePopupStats();
  });
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  return intersection / Math.max(wordsA.size, wordsB.size);
}

async function findLibraryMatch(type, commentText) {
  const library = await getLibrary();
  const commentWords = new Set(commentText.toLowerCase().split(/\s+/));
  return library.find(entry => {
    if (entry.commentType !== type) return false;
    const entryWords = new Set((entry.commentKeywords || []).map(w => w.toLowerCase()));
    const matches = [...entryWords].filter(w => commentWords.has(w)).length;
    return matches >= 2;
  });
}

// ============================================================
// SECTION 10: POPUP STATS UPDATE
// ============================================================

function updatePopupStats() {
  if (typeof chrome === 'undefined' || !chrome.runtime) return;
  try {
    chrome.runtime.sendMessage({ action: 'updateStats' });
  } catch(e) {}
}

// ============================================================
// SECTION 11: INJECT ORBIT BAR
// ============================================================

function injectOrbitBar(textarea) {
  // Guard: don't inject twice
  if (textarea.dataset.orbitInjected === 'true') return;
  textarea.dataset.orbitInjected = 'true';

  // Find comment card container - check for .comment-card first (demo page)
  // Then fall back to walking up from textarea
  let commentContainer = textarea.closest('.comment-card') || textarea.closest('.comment');
  
  if (!commentContainer) {
    // Walk up to find container
    let el = textarea;
    for (let i = 0; i < 6; i++) {
      el = el.parentElement;
      if (!el) break;
      // Look for common comment container patterns
      if (el.classList && (
        el.classList.contains('comment') ||
        el.classList.contains('comment-card') ||
        el.classList.contains('review') ||
        el.id?.includes('comment')
      )) {
        commentContainer = el;
        break;
      }
    }
  }
  
  // Final fallback
  if (!commentContainer) {
    let el = textarea;
    for (let i = 0; i < 6; i++) {
      el = el.parentElement;
      if (el && el.children.length > 3) {
        commentContainer = el;
        break;
      }
    }
  }

  if (!commentContainer) {
    console.log('ORBIT: Could not find comment container for textarea');
    return;
  }

  // Extract data - try multiple methods for name
  let authorName = 'there';
  const nameEl = commentContainer.querySelector('h4') || commentContainer.querySelector('h3') || commentContainer.querySelector('.author-info');
  if (nameEl) {
    const nameText = nameEl.textContent.trim();
    if (nameText && nameText.length < 50) {
      authorName = nameText.split(' ')[0];
    }
  }
  
  // Get tier
  const tierMatch = commentContainer.textContent.match(/tier\s*(\d)/i);
  const tier = tierMatch ? tierMatch[1] : null;

  // Get comment text - from .comment-content first
  let commentText = '';
  const contentEl = commentContainer.querySelector('.comment-content');
  if (contentEl) {
    commentText = contentEl.textContent.trim();
  } else {
    // Fallback: get longest text from container excluding form elements
    const texts = [];
    commentContainer.querySelectorAll('p, div, span').forEach(node => {
      if (node.closest('.reply-form') || node.closest('.comment-actions')) return;
      const text = node.textContent.trim();
      if (text.length > 30 && text.length < 500) texts.push(text);
    });
    commentText = texts.sort((a,b) => b.length - a.length)[0] || '';
  }

  console.log('ORBIT: Found comment - author:', authorName, 'tier:', tier, 'text:', commentText.substring(0, 50));

  // Classify
  const { type } = classifyComment(commentText);
  const priority = calculatePriority(type, tier);

  // Create bar
  const bar = document.createElement('div');
  bar.className = 'orbit-reply-assistant';
  bar.dataset.authorName = authorName;
  bar.dataset.tier = tier || '';
  bar.dataset.commentType = type;
  bar.dataset.commentText = commentText;

  bar.style.cssText = `
    background: #1a1a2e;
    border: 1px solid #2d2d4e;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  const badge = document.createElement('span');
  badge.className = 'orbit-badge';
  badge.textContent = 'ORBIT';
  badge.style.cssText = `
    background: #4f46e5;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  `;

  const typeBadge = document.createElement('span');
  typeBadge.className = 'orbit-type-badge';
  
  const colors = {
    NEGATIVE: '#ef4444',
    QUESTION: '#f59e0b',
    FEATURE: '#3b82f6',
    POSITIVE_FEATURE: '#8b5cf6',
    POSITIVE: '#10b981',
    NEUTRAL: '#6b7280'
  };
  const labels = {
    NEGATIVE: '🔴 NEGATIVE',
    QUESTION: '🟡 QUESTION',
    FEATURE: '🔵 FEATURE',
    POSITIVE_FEATURE: '💜 POSITIVE+FEATURE',
    POSITIVE: '🟢 POSITIVE',
    NEUTRAL: '⚪ NEUTRAL'
  };

  typeBadge.style.cssText = `
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    background: ${colors[type] || '#6b7280'};
  `;
  typeBadge.textContent = labels[type] || type;

  const priorityLabel = document.createElement('span');
  priorityLabel.className = 'orbit-priority';
  priorityLabel.style.cssText = `color: #9ca3af; font-size: 11px;`;
  priorityLabel.textContent = `Priority: ${priority}`;

  const spacer = document.createElement('span');
  spacer.style.flex = '1';

  const btn = document.createElement('button');
  btn.className = 'orbit-generate-btn';
  btn.textContent = '✨ Generate Reply';
  btn.style.cssText = `
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  `;
  btn.onmouseenter = () => btn.style.background = '#059669';
  btn.onmouseleave = () => btn.style.background = '#10b981';

  bar.appendChild(badge);
  bar.appendChild(typeBadge);
  bar.appendChild(priorityLabel);
  bar.appendChild(spacer);
  bar.appendChild(btn);

  // Insert bar BEFORE the reply-form (so it shows even when form is hidden)
  const replyForm = textarea.closest('.reply-form');
  if (replyForm && replyForm.parentElement) {
    replyForm.parentElement.insertBefore(bar, replyForm);
  } else if (textarea.parentElement) {
    textarea.parentElement.insertBefore(bar, textarea);
  }

  // Generate button click handler
  btn.addEventListener('click', async () => {
    btn.textContent = '⏳ Thinking...';
    btn.disabled = true;

    // Use stored data
    const finalCommentText = bar.dataset.commentText || commentText;
    const finalType = bar.dataset.commentType || 'NEUTRAL';
    const finalName = bar.dataset.authorName || 'there';

    console.log('ORBIT: Generating reply for:', finalType, finalName, finalCommentText.substring(0, 50));

    // Check library first
    let replyText = null;
    let fromLibrary = false;

    const libraryMatch = await findLibraryMatch(finalType, finalCommentText);
    if (libraryMatch) {
      replyText = libraryMatch.replyText;
      fromLibrary = true;
      console.log('ORBIT: Using library match');
    } else {
      replyText = generateReply(finalType, finalName, finalCommentText);
      console.log('ORBIT: Using generated reply');
    }

    // Inject into textarea
    textarea.value = replyText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();

    // Update button
    btn.textContent = fromLibrary ? '💾 From Library - Ready' : '✓ Reply Ready';
    btn.style.background = '#4f46e5';
    btn.disabled = false;

    // Find and setup Post Reply listener
    const postBtn = textarea.closest('.reply-form')?.querySelector('.btn-post');
    
    if (postBtn && !postBtn.dataset.orbitListener) {
      postBtn.dataset.orbitListener = 'true';
      postBtn.addEventListener('click', () => {
        if (textarea.value.trim().length > 10) {
          saveToLibrary({
            commentType: finalType,
            commentKeywords: extractKeywords(finalCommentText),
            replyText: textarea.value.trim()
          });
          console.log('ORBIT: Saved to library');
        }
      });
    }
  });
}

function findNearbyPostButton(textarea) {
  let el = textarea;
  for (let i = 0; i < 5; i++) {
    el = el.parentElement;
    if (!el) break;
    const btn = el.querySelector('button');
    if (btn && /post|send|submit|reply/i.test(btn.textContent)) return btn;
  }
  return null;
}

function extractKeywords(text) {
  const stop = new Set(['the','a','an','is','it','i','my','to','do','in',
    'of','for','and','or','but','this','that','have','with']);
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,'')
    .split(/\s+/).filter(w => w.length > 3 && !stop.has(w)).slice(0, 5);
}

// ============================================================
// SECTION 12: SCAN PAGE FOR TEXTAREAS
// ============================================================

function scanAndInject() {
  // All possible textarea selectors - include hidden ones too
  const selectors = [
    'textarea[placeholder*="reply" i]',
    'textarea[placeholder*="write" i]',
    'textarea[placeholder*="comment" i]',
    'textarea[placeholder*="response" i]',
    '.reply-form textarea',
    '[class*="reply"] textarea',
    '[class*="comment"] textarea',
    'textarea'
  ];

  const found = new Set();
  selectors.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(ta => found.add(ta));
    } catch(e) {}
  });

  console.log(`ORBIT: Found ${found.size} textareas`);

  let count = 0;
  found.forEach(textarea => {
    if (textarea.dataset.orbitInjected !== 'true') {
      injectOrbitBar(textarea);
      count++;
    }
  });

  if (count > 0) console.log(`ORBIT: Injected ${count} bars`);
}

// ============================================================
// SECTION 13: MUTATION OBSERVER
// ============================================================

const observer = new MutationObserver(mutations => {
  let shouldScan = false;
  mutations.forEach(m => {
    // Check for new textareas
    m.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        if (node.tagName === 'TEXTAREA') {
          shouldScan = true;
        } else if (node.querySelector) {
          // Check if node has textarea
          if (node.querySelector('textarea')) shouldScan = true;
          // Check if reply button was clicked (reply-form became visible)
          if (node.classList?.contains('reply-form') || node.classList?.contains('active')) {
            shouldScan = true;
          }
        }
      }
    });
    
    // Check for class changes (like .active being added to show reply form)
    if (m.type === 'attributes' && m.attributeName === 'class') {
      const target = m.target;
      if (target.classList?.contains('reply-form') || 
          target.classList?.contains('active') ||
          target.closest?.('.reply-form')) {
        shouldScan = true;
      }
    }
    
    // Check for style changes (display:none -> block)
    if (m.type === 'attributes' && m.attributeName === 'style') {
      if (m.target.tagName === 'TEXTAREA' || m.target.classList?.contains('reply-form')) {
        shouldScan = true;
      }
    }
  });
  
  if (shouldScan) {
    setTimeout(scanAndInject, 300);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'class']
});

// ============================================================
// SECTION 14: INITIALIZE
// ============================================================

console.log('🚀 ORBIT initializing...');

// Initial scan - try multiple times
const doScan = () => {
  scanAndInject();
  // Also check for reply button clicks
  document.querySelectorAll('.reply-btn').forEach(btn => {
    if (!btn.dataset.orbitClickHandled) {
      btn.dataset.orbitClickHandled = 'true';
      btn.addEventListener('click', () => {
        console.log('ORBIT: Reply button clicked');
        setTimeout(scanAndInject, 100);
      });
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('ORBIT: DOM loaded');
    setTimeout(doScan, 300);
    setTimeout(doScan, 800);
    setTimeout(doScan, 1500);
    setTimeout(doScan, 3000);
  });
} else {
  setTimeout(doScan, 300);
  setTimeout(doScan, 800);
  setTimeout(doScan, 1500);
  setTimeout(doScan, 3000);
}

// Keep scanning periodically
let scanCount = 0;
const periodicScan = setInterval(() => {
  doScan();
  scanCount++;
  if (scanCount >= 10) clearInterval(periodicScan);
}, 3000);

console.log('✅ ORBIT Comment Intelligence Ready');
