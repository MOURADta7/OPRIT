// ============================================================
// ORBIT - Smart Reply Assistant
// content.js - V6 (Safe Initialization + Bulletproof SPA Router)
// ============================================================

console.log('[ORBIT] Content Script Loaded (V7 - Premium Edition)');

// ============================================================
// SECTION 0A: SVG ICON LIBRARY & GLOBAL STYLES
// ============================================================

const ORBIT_ICONS = {
  orbit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" stroke-dasharray="4 3"/></svg>',
  sparkle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  loader: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  thumbUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>',
  thumbDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/></svg>',
  box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  target: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  trash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  link: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  plus: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  chart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  book: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  scan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>',
  pen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

// Inject global premium styles once
(function injectOrbitGlobalStyles() {
  if (document.getElementById('orbit-global-styles')) return;
  const style = document.createElement('style');
  style.id = 'orbit-global-styles';
  style.textContent = `
    @keyframes orbitFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes orbitPulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    @keyframes orbitPulseRed { 0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 70% { box-shadow: 0 0 0 8px rgba(220,38,38,0); } 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); } }
    @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .orbit-glass {
      background: rgba(15, 15, 30, 0.85) !important;
      backdrop-filter: blur(16px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
      border: 1px solid rgba(79, 70, 229, 0.3) !important;
    }
    .orbit-btn {
      font-family: system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .orbit-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .orbit-btn:active { transform: translateY(0); }
    .orbit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: none; }
    .orbit-input {
      font-family: system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(45, 45, 54, 0.8);
      color: #e2e8f0;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline: none;
    }
    .orbit-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .orbit-input::placeholder { color: #6b7280; }
    .orbit-badge {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .orbit-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  `;
  document.head.appendChild(style);
})();

// ============================================================
// SECTION 0: SAFE INITIALIZATION (Critical Fix)
// ============================================================

let isStorageReady = false;

// localStorage polyfill for demo/dev mode (when chrome.storage is unavailable)
if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
  console.log('ORBIT: Setting up localStorage fallback for demo/dev mode');
  if (typeof chrome === 'undefined') window.chrome = {};
  if (!chrome.storage) chrome.storage = {};
  if (!chrome.storage.local) {
    chrome.storage.local = {
      get(keys, cb) {
        const result = {};
        const keyArr = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
        keyArr.forEach(k => {
          try { const v = localStorage.getItem('orbit_' + k); if (v) result[k] = JSON.parse(v); } catch(e) {}
        });
        if (cb) cb(result);
      },
      set(items, cb) {
        Object.entries(items).forEach(([k, v]) => {
          try { localStorage.setItem('orbit_' + k, JSON.stringify(v)); } catch(e) {}
        });
        if (cb) cb();
      }
    };
  }
  if (!chrome.storage.onChanged) {
    chrome.storage.onChanged = { addListener() {} };
  }
  if (!chrome.runtime) {
    chrome.runtime = { sendMessage() {} };
  }
}

function safeInitialize() {
  try {
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
// SECTION 0C: ADAPTER PATTERN (Omnichannel Support)
// ============================================================

class PlatformAdapter {
  isActive() { return false; }
  getCommentContainers() { return []; }
  getAuthorName(container) { return 'Customer'; }
  getAuthorEmail(container) { return ''; }
  getCommentText(container) { return ''; }
  getReplyInput(container) { return null; }
  getReplyButton(container) { return null; }
  getSubmitButton(container) { return null; }
  isCommentsPage() {
    // SPA-resilient check: URL doesn't change, so we look for specific headings or reply boxes
    const hasHeading = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, .title'))
      .some(h => {
        const txt = h.textContent.toLowerCase();
        return txt.includes('comments & reviews') || txt.includes('customer feedback') || txt === 'comments' || txt === 'reviews';
      });
      
    if (hasHeading) return true;

    // Check if there are any reply boxes or buttons anywhere on the page
    const hasReplyBox = !!document.querySelector('textarea, .reply-btn, button[aria-label*="reply" i], button[title*="reply" i]');
    if (hasReplyBox) return true;
    
    // If the URL explicitly says comments/reviews (for other platforms)
    const path = window.location.href.toLowerCase();
    if (path.includes('/comments') || path.includes('/reviews') || path.includes('?tab=comments') || path.includes('?tab=reviews')) {
      return true;
    }

    return false;
  }

  isProductPage() {
    return window.location.href.includes('/products/');
  }

  extractProductData() {
    const name = document.querySelector('h1')?.textContent?.trim() ||
                 document.querySelector('.product-title, .product-name, [data-testid="product-title"]')?.textContent?.trim() ||
                 document.title.split('|')[0].trim() || '';

    const description = document.querySelector('meta[name="description"]')?.content ||
                        document.querySelector('.product-description, .product-summary, [data-testid="product-description"]')?.textContent?.trim() ||
                        document.querySelector('h2, .subtitle, .tagline')?.textContent?.trim() || '';

    const featureEls = document.querySelectorAll('.feature-item, .feature-list li, .features li, ul li, .product-features li');
    let features = '';
    if (featureEls.length > 0) {
      features = Array.from(featureEls)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 5 && text.length < 200)
        .slice(0, 15)
        .join('\n');
    }

    return { name, description, features };
  }
}

// ============================================================
// ADAPTER: AppSumo
// ============================================================
class AppSumoAdapter extends PlatformAdapter {
  isActive() {
    return window.location.hostname.includes('appsumo.com');
  }

  getCommentContainers() {
    return Array.from(document.querySelectorAll(
      '.comment-card, .comment, .review-item, [data-testid="comment"], ' +
      '[class*="comment" i], [class*="review" i]'
    ));
  }

  getAuthorName(container) {
    const el = container.querySelector('h4, h3, .author-info, .user-name, strong, b');
    return el ? el.textContent.trim().split(' ')[0] : 'Customer';
  }

  getCommentText(container) {
    const el = container.querySelector('.comment-content, .comment-body, p');
    if (el && el.textContent.trim().length > 15) return el.textContent.trim();
    const texts = [];
    container.querySelectorAll(':scope > p, :scope > div > p').forEach(node => {
      const text = node.textContent.trim();
      if (text.length > 15 && text.length < 1000) texts.push(text);
    });
    return texts.sort((a, b) => b.length - a.length)[0] || '';
  }

  getReplyInput(container) {
    return container.querySelector('textarea, input[type="text"]');
  }

  isCommentsPage() {
    const hasHeading = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, .title'))
      .some(h => {
        const txt = h.textContent.toLowerCase();
        return txt.includes('comments & reviews') || txt.includes('customer feedback') || txt === 'comments' || txt === 'reviews';
      });
    if (hasHeading) return true;

    const path = window.location.href.toLowerCase();
    if (path.includes('/comments') || path.includes('/reviews') || path.includes('?tab=comments')) return true;

    const containers = this.getCommentContainers();
    return containers.some(c => c.querySelector('textarea, .reply-btn, button[aria-label*="reply" i]'));
  }

  isProductPage() {
    const url = window.location.href.toLowerCase();
    if (url.includes('/products/') || url.includes('/apps/')) return true;

    const hasCartUI = document.querySelector(
      'button[class*="cart" i], [class*="price" i], [id*="cart" i], .checkout, ' +
      'a[href*="/pricing"], a[href*="/checkout"], a[href*="/cart"]'
    ) !== null;

    const bodyText = (document.body.innerText || '').toLowerCase();
    const hasSalesText = bodyText.includes('add to cart') ||
                         bodyText.includes('buy now') ||
                         bodyText.includes('get started');
    return hasCartUI || hasSalesText;
  }

  extractProductData() {
    const name = document.querySelector('h1')?.textContent?.trim() ||
                 document.querySelector('.product-title, .product-name')?.textContent?.trim() ||
                 document.title.split('|')[0].trim() || '';

    const description = document.querySelector('meta[name="description"]')?.content ||
                        document.querySelector('meta[property="og:description"]')?.content ||
                        document.querySelector('.product-description, .product-summary')?.textContent?.trim() ||
                        document.querySelector('h2, .subtitle, .tagline')?.textContent?.trim() || '';

    const featureEls = document.querySelectorAll('.feature-item, .feature-list li, .features li, ul li, .product-features li');
    let features = '';
    if (featureEls.length > 0) {
      features = Array.from(featureEls)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 5 && text.length < 200)
        .slice(0, 15)
        .join('\n');
    }

    return { name, description, features };
  }
}

// ============================================================
// ADAPTER: Gumroad
// ============================================================
class GumroadAdapter extends PlatformAdapter {
  isActive() {
    return window.location.hostname.includes('gumroad.com');
  }

  getCommentContainers() {
    return Array.from(document.querySelectorAll('.comment, .customer-message, .review-item, [class*="review" i]'));
  }

  getAuthorName(container) {
    const el = container.querySelector('.author-name, .name, h4, strong');
    return el ? el.textContent.trim().split(' ')[0] : 'Customer';
  }

  getCommentText(container) {
    const el = container.querySelector('.content, .text, .body, p');
    return el ? el.textContent.trim() : '';
  }

  getReplyInput(container) {
    return container.querySelector('textarea, input[type="text"]');
  }

  isCommentsPage() {
    return this.getCommentContainers().length > 0;
  }

  isProductPage() {
    const url = window.location.href.toLowerCase();
    return url.includes('/l/') || url.includes('/products/') ||
           !!document.querySelector('[class*="price" i], .product-page, .product-card');
  }

  extractProductData() {
    const name = document.querySelector('h1, [itemprop="name"], .product-title')?.textContent?.trim() ||
                 document.title.split('|')[0].trim() || '';
    const description = document.querySelector('meta[name="description"]')?.content ||
                        document.querySelector('[itemprop="description"], .product-description')?.textContent?.trim() || '';
    let features = '';
    const featureEls = document.querySelectorAll('li');
    if (featureEls.length > 0) {
      features = Array.from(featureEls)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 10 && text.length < 150)
        .slice(0, 10)
        .join('\n');
    }
    return { name, description, features };
  }
}

// ============================================================
// ADAPTER: Universal (Fallback for any marketplace)
// ============================================================
class UniversalSalesAdapter extends PlatformAdapter {
  isActive() {
    // Active if the page is either a product page OR has comments
    return this.isProductPage() || this.isCommentsPage();
  }

  getCommentContainers() {
    return Array.from(document.querySelectorAll('.comment, .review, .testimonial, [id*="comment" i], [class*="comment" i], [class*="review" i], [class*="feedback" i]'));
  }

  getAuthorName(container) {
    const el = container.querySelector('[itemprop="author"], .author-name, .author, .name, h3, h4, strong, b');
    return el ? el.textContent.trim() : 'Customer';
  }

  getAuthorEmail(container) {
    const el = container.querySelector('a[href^="mailto:"], [class*="email" i]');
    return el ? el.textContent.trim() : '';
  }

  getCommentText(container) {
    const el = container.querySelector('[itemprop="reviewBody"], .content, .text, .body, p');
    if (el && el.textContent.trim().length > 15) return el.textContent.trim();
    
    const texts = [];
    const directPs = container.querySelectorAll(':scope > p, :scope > div > p');
    directPs.forEach(node => {
      const text = node.textContent.trim();
      if (text.length > 15 && text.length < 1000) texts.push(text);
    });
    return texts.sort((a, b) => b.length - a.length)[0] || '';
  }

  getReplyInput(container) {
    return container.querySelector('textarea, input[type="text"]');
  }

  getReplyButton(container) {
    return container.querySelector('button[aria-label*="reply" i], .reply-btn, .reply, button');
  }

  getSubmitButton(container) {
    return container.querySelector('button[type="submit"], input[type="submit"], .btn-post, .submit, .post, .send');
  }

  isCommentsPage() {
    return this.getCommentContainers().length > 0;
  }

  isProductPage() {
    const bodyText = document.body.innerText || "";
    const lowerBody = bodyText.toLowerCase();
    
    const hasCartUI = document.querySelector('button[class*="cart" i], [class*="price" i], [id*="cart" i], form[action*="cart" i], .checkout, a[href*="/pricing"], a[href*="/checkout"], a[href*="/cart"]') !== null;
    
    const hasSalesText = lowerBody.includes('add to cart') || 
                         lowerBody.includes('buy now') || 
                         lowerBody.includes('get started') || 
                         lowerBody.includes('subscribe') || 
                         lowerBody.includes('pricing');

    const urlHasProduct = window.location.href.toLowerCase().includes('/products/');

    return hasCartUI || hasSalesText || urlHasProduct;
  }

  extractProductData() {
    const name = document.querySelector('h1, [itemprop="name"], .product-title, .product-name')?.textContent?.trim() || document.title.split('|')[0].trim() || '';
    const description = document.querySelector('meta[name="description"]')?.content || document.querySelector('[itemprop="description"], .product-description, .description')?.textContent?.trim() || '';
    
    let features = '';
    const featureEls = document.querySelectorAll('li');
    if (featureEls.length > 0) {
      features = Array.from(featureEls)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 10 && text.length < 150)
        .slice(0, 10)
        .join('\n');
    }
    return { name, description, features };
  }
}

// ============================================================
// ADAPTER FACTORY (Safe, try-catch guarded)
// ============================================================
class AdapterFactory {
  static getActiveAdapter() {
    try {
      if (!this.adapters) {
        this.adapters = [new AppSumoAdapter(), new GumroadAdapter(), new UniversalSalesAdapter()];
      }
      for (const adapter of this.adapters) {
        if (adapter.isActive()) return adapter;
      }
    } catch (e) {
      console.warn('ORBIT: AdapterFactory error, using base adapter', e);
    }
    return new PlatformAdapter();
  }
}

// BUG-001 FIX: Dynamic adapter selection for SPA navigation
function getOrbitAdapter() { return AdapterFactory.getActiveAdapter(); }

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

  const mailtoLink = `mailto:?subject=${encodeURIComponent('ORBIT Alert: Urgent Refund Risk')}&body=${encodeURIComponent(commentText)}`;
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
    text: `[URGENT] Refund Risk Detected\n*Platform:* ${platform}\n*Customer:* ${authorName}\n*Risk Score:* ${refundRisk}/100\n*Comment:* ${commentText}`
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

  // BUG-007 FIX: Improved language detection with character ratio analysis
  const engIndicators = /\b(the|is|to|and|a|in|it|you|for|on|with|this|that|of|how|what|when|why|can|will|my|does|any|has|have|but|not|are|be|i|we|they|our|your|its|just)\b/gi;
  const matches = text.match(engIndicators) || [];
  const wordCount = text.split(/\s+/).length;
  const engRatio = matches.length / wordCount;

  // If >15% of words are common English words, likely English
  if (engRatio > 0.15) return true;

  // Fallback: check for ORBIT keywords
  const hasOrbitKeyword = Object.values(KEYWORDS).flat().some(kw => text.toLowerCase().includes(kw));
  if (hasOrbitKeyword) return true;

  // Check if text is predominantly Latin characters (vs Arabic, Chinese, etc.)
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;
  return totalChars > 0 && (latinChars / totalChars) > 0.7;
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

  let contextSnippet = '';
  if (isStorageReady) {
    await new Promise((resolve) => {
      chrome.storage.local.get(['orbitProducts'], (res) => {
        const products = res.orbitProducts || [];
        if (products.length > 0) {
          const url = window.location.href;
          const pageTitle = document.title || '';
          const match = products.find(p => url.includes(p.url) || p.url.includes(url) || pageTitle.toLowerCase().includes(p.name.toLowerCase()));
          if (match && match.description) {
            // In a production LLM, this becomes the System Prompt. Here it acts as an injected dynamic appendix.
            contextSnippet = ''; // BUG-005 FIX: Context used for logging only, not injected into reply text
          }
        }
        resolve();
      });
    });
  }

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

function injectOrbitBar(textarea, container) {
  if (!isStorageReady) return;
  if (injectedTextareas.has(textarea)) return;
  if (!textarea.parentElement || !document.contains(textarea)) return;
  if (!cachedSettings.orbitAIEnabled) return;

  _injectOrbitBarInternal(textarea, container, cachedSettings);
}

function _injectOrbitBarInternal(textarea, commentContainer, settings) {
  if (textarea.parentElement.querySelector('.orbit-reply-assistant')) {
    injectedTextareas.add(textarea);
    return;
  }

  injectedTextareas.add(textarea);

  if (!commentContainer) return;

  let authorName = getOrbitAdapter().getAuthorName(commentContainer);
  if (!authorName || authorName === 'Customer') authorName = 'there';

  if (settings.privacyMode) {
    commentIndexCounter++;
    authorName = `Customer #${commentIndexCounter}`;
  }

  _buildOrbitBar(textarea, commentContainer, authorName, settings);
}

function _buildOrbitBar(textarea, commentContainer, authorName, settings) {
  const tierMatch = commentContainer.textContent.match(/(?:tier|plan)\s*[:\-]?\s*(\d)/i);
  const tier = tierMatch ? tierMatch[1] : null;

  let commentText = getOrbitAdapter().getCommentText(commentContainer);

  let { type } = classifyComment(commentText);
  let priority = calculatePriority(type, tier);
  const refundRisk = calculateRefundRisk(commentText, type);

  let isRefundRisk = false;
  if (refundRisk >= 50) {
    type = 'CRITICAL';
    priority = 1000;
    isRefundRisk = true;
  }

  console.warn("[ORBIT] FINAL_DATA >>", { type, priority, authorName, refundRisk });

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
  bar.className = 'orbit-reply-assistant orbit-glass';
  bar.setAttribute('data-orbit-hash', hashComment(authorName + commentText.substring(0, 100)));
  bar.style.cssText = `
    border-radius: 10px; padding: 10px 14px; margin-bottom: 8px; display: flex; align-items: center;
    gap: 10px; z-index: 9999; font-family: system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif; font-size: 13px;
    animation: orbitFadeIn 0.3s ease; color: #e2e8f0;
  `;

  if (type === 'CRITICAL') {
    if (settings.emailNotifications) {
      checkAndTriggerEmailNotification(commentText, refundRisk);
    }

    triggerWebhookAlert(commentText, authorName, refundRisk, 'Comments & Reviews');

    bar.innerHTML = `
      <span class="orbit-badge" style="background:#4f46e5;color:white;">${ORBIT_ICONS.orbit} ORBIT</span>
      <span class="orbit-badge" style="background:#dc2626;color:white;animation:orbitPulseRed 1.5s infinite;">${ORBIT_ICONS.alert} REFUND RISK</span>
      <span style="color:#ef4444;flex:1;font-weight:bold;">URGENT: Score ${refundRisk}/100</span>
      <button class="orbit-generate-btn orbit-btn" style="background:#dc2626;color:white;border-radius:8px;padding:8px 16px;">${ORBIT_ICONS.send} Auto-Reply Founder</button>
    `;
    textarea.parentElement.insertBefore(bar, textarea);

    const btn = bar.querySelector('.orbit-generate-btn');
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const urgentReply = `Hi ${authorName}, I am so sorry you are experiencing this. As the founder, I take this extremely seriously. Please email me directly at founder@orbit.com right now so I can personally investigate and resolve this for you immediately.`;
      setTextareaValue(textarea, urgentReply);
      btn.innerHTML = `${ORBIT_ICONS.check} Urgent Reply Ready`;
      btn.style.background = '#4f46e5';
      incrementReplyStats(true);
    });
    updateOrbitDashboard();
    return;
  }

  if (type === 'NON_ENGLISH') {
    bar.innerHTML = `
        <span class="orbit-badge" style="background:#4f46e5;color:white;">${ORBIT_ICONS.orbit} ORBIT</span>
        <span class="orbit-badge" style="background:${TYPE_COLORS[type]};color:white;">NON_ENGLISH</span>
        <span style="color:#9ca3af;flex:1;">Priority: ${priority}</span>
        <button class="orbit-upsell-btn orbit-btn" style="background:linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);color:white;border-radius:8px;padding:8px 16px;">${ORBIT_ICONS.globe} Upgrade to Pro</button>
      `;
    textarea.parentElement.insertBefore(bar, textarea);

    const btn = bar.querySelector('.orbit-upsell-btn');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('PRO FEATURE: In the paid version, ORBIT uses advanced AI to automatically detect the language and reply fluently in French, Spanish, German, and 30+ other languages!');
    });
    updateOrbitDashboard();
    return;
  }

  bar.innerHTML = `
    <span class="orbit-badge" style="background:#4f46e5;color:white;">${ORBIT_ICONS.orbit} ORBIT</span>
    <span class="orbit-badge" style="background:${TYPE_COLORS[type] || '#6b7280'};color:white;">${type}</span>
    <span style="color:#9ca3af;flex:1;">Priority: ${priority}</span>
    <button class="orbit-generate-btn orbit-btn" style="background:#10b981;color:white;border-radius:8px;padding:8px 16px;">${ORBIT_ICONS.sparkle} Generate Reply</button>
  `;

  textarea.parentElement.insertBefore(bar, textarea);

  const btn = bar.querySelector('.orbit-generate-btn');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (btn.getAttribute('data-action') === 'post') {
      btn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Posting...`;
      btn.disabled = true;
      const submitBtn = getOrbitAdapter().getSubmitButton(commentContainer);
      if (submitBtn) {
        submitBtn.click();
        btn.innerHTML = `✅ Posted`;
        btn.style.background = '#10b981';
        setTimeout(() => bar.remove(), 2000);
      } else {
        btn.innerHTML = `${ORBIT_ICONS.alert} Manual Submit Required`;
        btn.style.background = '#f59e0b';
      }
      updateOrbitDashboard();
      return;
    }

    btn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Thinking...`;
    btn.disabled = true;

    try {
      const replyText = await generateReply(type, authorName, commentText);
      setTextareaValue(textarea, replyText);

      btn.setAttribute('data-action', 'post');
      btn.innerHTML = `${ORBIT_ICONS.check} Reply Ready`; btn.style.cursor = "default";
      btn.style.background = '#8b5cf6';
      btn.disabled = false;

      const existingFeedback = bar.querySelector('.orbit-feedback-btns');
      if (existingFeedback) existingFeedback.remove();

      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'orbit-feedback-btns';
      feedbackDiv.style.cssText = 'display:flex;gap:4px;margin-left:8px;';
      feedbackDiv.innerHTML = `
        <button class="orbit-feedback-good orbit-btn" style="background:#10b981;border-radius:6px;padding:5px 10px;font-size:12px;color:white;">${ORBIT_ICONS.thumbUp}</button>
        <button class="orbit-feedback-bad orbit-btn" style="background:#ef4444;border-radius:6px;padding:5px 10px;font-size:12px;color:white;">${ORBIT_ICONS.thumbDown}</button>
      `;
      bar.appendChild(feedbackDiv);

      feedbackDiv.querySelector('.orbit-feedback-good').addEventListener('click', (ev) => {
        ev.stopPropagation();
        feedbackDiv.innerHTML = '<span style="color:#10b981;font-size:12px;">Thanks!</span>';
      });

      feedbackDiv.querySelector('.orbit-feedback-bad').addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const reasons = ['Wrong Tone', 'Hallucination', 'Missed Context', 'Inaccurate', 'Other'];
        const reason = prompt('Why was this reply not good?\n\nOptions: ' + reasons.join(', '));
        if (reason) {
          await saveReplyFeedback(commentText, replyText, reason);
          feedbackDiv.innerHTML = '<span style="color:#f59e0b;font-size:12px;">Feedback saved</span>';
        }
      });

      incrementReplyStats(false);
    } catch (err) {
      console.error('ORBIT: Error generating reply:', err);
      btn.innerHTML = `${ORBIT_ICONS.alert} Error`;
      btn.disabled = false;
    }
  });

  updateOrbitDashboard();
}

// ============================================================
// SECTION 5: FLOATING DASHBOARD
// ============================================================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let orbitBulkDrafted = false;
let orbitDashboardDismissed = false;

function initOrbitDashboard() {
  if (document.getElementById('orbit-dashboard')) return;
  if (orbitDashboardDismissed) return;

  // === STRICT INJECTION GUARD ===
  const adapter = getOrbitAdapter();
  const isComments = adapter.isCommentsPage();
  const isProduct = adapter.isProductPage();
  if (!isComments && !isProduct) return;

  const panel = document.createElement('div');
  panel.id = 'orbit-dashboard';
  panel.className = 'orbit-glass';
  panel.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 10000;
    border-radius: 16px; padding: 16px 20px;
    font-family: system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif;
    font-size: 13px; color: #e2e8f0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(79,70,229,0.25);
    min-width: 310px; max-width: 380px; display: flex; flex-direction: column; gap: 10px;
    transition: opacity 0.3s ease, transform 0.3s ease; animation: orbitFadeIn 0.4s ease;
  `;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-weight:700;color:#00d4ff;font-size:14px;display:flex;align-items:center;gap:6px;">${ORBIT_ICONS.orbit} ORBIT</span>
      <div style="display:flex;gap:6px;">
        <button id="orbit-dash-close" title="Close" class="orbit-btn" style="background:transparent;color:#9ca3af;font-size:16px;padding:0 4px;">×</button>
        <button id="orbit-toggle" title="Toggle ORBIT" class="orbit-btn" style="
          background:rgba(45,45,78,0.8);border:1px solid #4f46e5;border-radius:12px;
          color:#10b981;font-size:12px;padding:4px 10px;
        ">ON</button>
      </div>
    </div>
    <div id="orbit-dash-stats" style="color:#9ca3af;font-size:12px;">Scanning...</div>
    <div id="orbit-dash-breakdown" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
    <div style="display:flex;gap:8px;">
      <button id="orbit-dash-autofill" class="orbit-btn" style="
        background: linear-gradient(135deg, #10b981 0%, #4f46e5 100%);
        color: white; border-radius: 10px; padding: 10px 16px; flex:3;
        font-size: 13px; justify-content:center; white-space:nowrap;
      ">${ORBIT_ICONS.sparkle} Draft All Replies</button>
      <button id="orbit-dash-open-saas" class="orbit-btn" style="
        background: #2d2d4e; border: 1px solid #4f46e5;
        color: #00d4ff; border-radius: 10px; padding: 10px; flex:1;
        font-size: 13px; justify-content:center;
      ">${ORBIT_ICONS.target} Panel</button>
    </div>
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
  notif.className = 'orbit-glass';
  notif.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%);
    border-radius:10px;
    color:#e2e8f0;padding:12px 24px;font-family:system-ui, -apple-system, 'Inter', sans-serif;font-size:14px;
    z-index:99999;animation:orbitFadeIn 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}

// ============================================================
// SECTION 5B: PRODUCT PAGE EXTRACTION
// ============================================================

function extractProductData() {
  return getOrbitAdapter().extractProductData();
}

function updateOrbitDashboard() {
  const panel = document.getElementById('orbit-dashboard');
  if (!panel) return;

  const isCommentsPage = getOrbitAdapter().isCommentsPage();
  const isProductPage = getOrbitAdapter().isProductPage();

  if (!isCommentsPage && isProductPage) {
    // === TASK 1: Scraping UI for product pages ===
    const extStatsEl = document.getElementById('orbit-dash-stats');
    if (extStatsEl) {
      extStatsEl.innerHTML = `<span style="color:#00d4ff;font-weight:600;display:flex;align-items:center;gap:6px;">${ORBIT_ICONS.box} Product Page Detected</span>`;
    }
    const extBreakdownEl = document.getElementById('orbit-dash-breakdown');
    if (extBreakdownEl) {
      extBreakdownEl.innerHTML = '<span style="color:#9ca3af;font-size:12px;">Extract marketing data to use in the Command Center.</span>';
    }
    const extAutofillBtn = document.getElementById('orbit-dash-autofill');
    if (extAutofillBtn) {
      extAutofillBtn.style.display = 'block';
      extAutofillBtn.innerHTML = `${ORBIT_ICONS.download} Extract & Save Product Data`;
      extAutofillBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)';
      extAutofillBtn.style.opacity = '1';
      extAutofillBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        extAutofillBtn.disabled = true;
        extAutofillBtn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Extracting...`;
        try {
          const data = extractProductData();
          await new Promise((resolve) => {
            chrome.storage.local.set({ orbitTempExtractedData: data }, resolve);
          });
          const updateStatsEl = document.getElementById('orbit-dash-stats');
          if (updateStatsEl) {
            updateStatsEl.innerHTML = `<span style="color:#10b981;font-weight:600;display:flex;align-items:center;gap:6px;">${ORBIT_ICONS.check} Data Saved</span>`;
          }
          extAutofillBtn.innerHTML = `${ORBIT_ICONS.check} Data Saved! Open Command Center to paste.`;
          extAutofillBtn.style.background = '#10b981';
          const updateBreakdownEl = document.getElementById('orbit-dash-breakdown');
          if (updateBreakdownEl) {
            updateBreakdownEl.innerHTML = '<span style="color:#9ca3af;font-size:12px;">Navigate to Settings → Command Center and click "Auto-Detect Context".</span>';
          }
        } catch (err) {
          extAutofillBtn.innerHTML = `${ORBIT_ICONS.alert} Extraction Failed`;
          extAutofillBtn.style.background = '#ef4444';
        }
        setTimeout(() => { extAutofillBtn.disabled = false; }, 2000);
      };
    }
    return;
  }

  if (!isCommentsPage) {
    const dashStatsEl = document.getElementById('orbit-dash-stats');
    if (dashStatsEl) {
      dashStatsEl.textContent = 'Monitoring paused. Navigate to Comments to use ORBIT.';
    }
    const dashAutofillBtn = document.getElementById('orbit-dash-autofill');
    if (dashAutofillBtn) {
      dashAutofillBtn.style.display = 'none';
    }
    const dashBreakdownEl = document.getElementById('orbit-dash-breakdown');
    if (dashBreakdownEl) {
      dashBreakdownEl.innerHTML = '';
    }
    return;
  }

  const allBars = document.querySelectorAll('.orbit-reply-assistant');
  const genBtns = document.querySelectorAll('.orbit-generate-btn');
  const filledTextareas = Array.from(document.querySelectorAll('textarea')).filter(t => t.value.trim().length > 30);
  const draftBtns = Array.from(genBtns).filter(btn => !btn.disabled);

  const typeCounts = {};
  allBars.forEach(bar => {
    const badges = bar.querySelectorAll('span');
    const badge = badges[1];
    if (!badge) return;
    const t = badge.textContent.trim();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const postable = filledTextareas.length;
  const total = allBars.length;

  const countStatsEl = document.getElementById('orbit-dash-stats');
  if (countStatsEl) {
    if (orbitBulkDrafted && postable > 0) {
      countStatsEl.textContent = `${postable} repl${postable !== 1 ? 'ies' : 'y'} ready — click to post all!`;
    } else {
      countStatsEl.textContent = total === 0
        ? 'No reply fields found yet — open a reply form.'
        : `${total} comment${total !== 1 ? 's' : ''} detected · ${allBars.length - filledTextareas.length} to draft`;
    }
  }

  const dashBtn = document.getElementById('orbit-dash-autofill');
  if (dashBtn) {
    dashBtn.style.display = 'block';
    
    // Instead of cloneNode (which causes flashing), we update directly
    if (orbitBulkDrafted && postable > 0) {
      if (dashBtn._currentState !== 'post') {
        dashBtn.innerHTML = `🚀 Approve & Post All (${postable})`;
        dashBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)';
        dashBtn.style.opacity = '1';
        dashBtn.disabled = false;
        dashBtn.onclick = (e) => { e.preventDefault(); orbitBulkPost(); orbitBulkDrafted = false; };
        dashBtn._currentState = 'post';
      } else {
        dashBtn.innerHTML = `🚀 Approve & Post All (${postable})`;
      }
    } else {
      const isDisabled = draftBtns.length === 0;
      if (dashBtn._currentState !== 'draft' || dashBtn.disabled !== isDisabled) {
        dashBtn.innerHTML = `${ORBIT_ICONS.sparkle} Draft All Replies`;
        dashBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #4f46e5 100%)';
        dashBtn.style.opacity = isDisabled ? '0.5' : '1';
        dashBtn.disabled = isDisabled;
        orbitBulkDrafted = false;
        dashBtn.onclick = (e) => { e.preventDefault(); orbitBulkFill(); };
        dashBtn._currentState = 'draft';
      }
    }
  }

  const TYPE_COLORS = {
    NEGATIVE: '#ef4444', QUESTION: '#3b82f6', FEATURE: '#8b5cf6',
    POSITIVE_FEATURE: '#f59e0b', POSITIVE: '#10b981', NEUTRAL: '#6b7280',
    NON_ENGLISH: '#ec4899', CRITICAL: '#dc2626'
  };
const uiBreakdownEl = document.getElementById('orbit-dash-breakdown');
  if (uiBreakdownEl) {
    uiBreakdownEl.innerHTML = Object.entries(typeCounts).map(([type, count]) => {
      let displayType = type;
      if (type.includes('REFUND RISK')) displayType = 'CRITICAL';
      if (type.includes('NON_ENGLISH')) displayType = 'NON_ENGLISH';
      return `<span style="background:${TYPE_COLORS[displayType] || '#6b7280'};color:white;padding:2px 8px;
        border-radius:12px;font-size:11px;font-weight:600;">${type}: ${count}</span>`;
    }).join('');
  }
}

async function orbitBulkPost() {
  const autoBtn = document.getElementById('orbit-dash-autofill');
  const progressEl = document.getElementById('orbit-dash-progress');

  if (autoBtn) { autoBtn.disabled = true; autoBtn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Posting...`; }
  if (progressEl) { progressEl.style.display = 'block'; progressEl.innerHTML = `🚀 Submitting approved replies...`; }

  const postBtns = Array.from(document.querySelectorAll('.orbit-generate-btn')).filter(b => b.getAttribute('data-action') === 'post');
  let postedCount = 0;

  for (let i = 0; i < postBtns.length; i++) {
    const btn = postBtns[i];
    if (progressEl) progressEl.innerHTML = `🚀 Submitting ${i + 1}/${postBtns.length}...`;
    
    // Trigger the exact click handler of the individual button
    btn.click();
    postedCount++;
    await sleep(600); // Stagger to prevent rate limiting 
  }

  if (progressEl) {
    progressEl.innerHTML = `✅ ${postedCount} replies posted successfully!`;
    setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
  }

  orbitBulkDrafted = false; // BUG-002 FIX
  updateOrbitDashboard();
}

async function orbitBulkFill() {
  const autoBtn = document.getElementById('orbit-dash-autofill');
  const progressEl = document.getElementById('orbit-dash-progress');

  if (autoBtn) { autoBtn.disabled = true; autoBtn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Processing...`; }
  if (progressEl) { progressEl.style.display = 'block'; progressEl.innerHTML = `${ORBIT_ICONS.scan} Scanning targeted replies...`; }

  const commentCards = getOrbitAdapter().getCommentContainers();
  let processedCount = 0;

  for (let i = 0; i < commentCards.length; i++) {
    const card = commentCards[i];

    const existingTextarea = getOrbitAdapter().getReplyInput(card);
    if (existingTextarea && existingTextarea.value.trim() !== '') {
      continue;
    }

    let commentText = getOrbitAdapter().getCommentText(card);
    let authorName = getOrbitAdapter().getAuthorName(card);
    if (!authorName || authorName === 'Customer') authorName = 'there';

    const { type } = classifyComment(commentText);
    if (type === 'NON_ENGLISH') {
      continue;
    }

    let textarea = existingTextarea;

    if (!textarea) {
      const toggleBtn = getOrbitAdapter().getReplyButton(card);
      if (toggleBtn) {
        if (progressEl) progressEl.innerHTML = `${ORBIT_ICONS.scan} Expanding reply ${i + 1}/${commentCards.length}...`;
        toggleBtn.click();
        await sleep(300);
        textarea = getOrbitAdapter().getReplyInput(card);
      }
    }

    if (!textarea) continue;

    if (progressEl) progressEl.innerHTML = `${ORBIT_ICONS.pen} Drafting reply ${processedCount + 1}...`;

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

      const bar = textarea.parentElement.querySelector('.orbit-reply-assistant');
      if (bar) {
        const btn = bar.querySelector('.orbit-generate-btn');
        if (btn) {
          btn.setAttribute('data-action', 'post');
          btn.innerHTML = `${ORBIT_ICONS.check} Reply Ready`; btn.style.cursor = "default";
          btn.style.background = '#8b5cf6';
          btn.disabled = false;
        }
      }

      await incrementReplyStats(false);
      processedCount++;
    } catch (err) {
      console.error('ORBIT: Error generating reply:', err);
    }

    await sleep(100);
  }

  if (progressEl) {
    if (processedCount === 0) {
      progressEl.innerHTML = `${ORBIT_ICONS.alert} No valid empty reply fields found.`;
    } else {
      progressEl.innerHTML = `${ORBIT_ICONS.check} ${processedCount} repl${processedCount !== 1 ? 'ies' : 'y'} drafted successfully!`;
    }
    setTimeout(() => { progressEl.style.display = 'none'; }, 3000);
  }

  if (autoBtn) {
    autoBtn.disabled = false;
    autoBtn.textContent = 'Draft All Replies';
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

    getOrbitAdapter().getCommentContainers().forEach(container => {
      const textarea = getOrbitAdapter().getReplyInput(container);
      if (textarea && !injectedTextareas.has(textarea)) {
        injectOrbitBar(textarea, container);
      }
    });
    initOrbitDashboard();
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
        // BUG-009 FIX: Targeted observation scope
        const observeTarget = document.querySelector('.comments-section, .reviews-section, main, #content') || document.body;
        orbitObserver.observe(observeTarget, { childList: true, subtree: true, attributes: false });
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

    getOrbitAdapter().getCommentContainers().forEach(container => {
      const textarea = getOrbitAdapter().getReplyInput(container);
      if (textarea && !injectedTextareas.has(textarea)) {
        injectOrbitBar(textarea, container);
      }
    });
    initOrbitDashboard();
    updateOrbitDashboard();
    saveBulkScanStats();
  });
}

function saveBulkScanStats() {
  if (!isStorageReady) return;

  const replyBars = Array.from(document.querySelectorAll('.orbit-reply-assistant'));
  if (replyBars.length === 0) return;

  chrome.storage.local.get(['orbitStats', 'orbitScannedHashes'], (result) => {
    const stats = result.orbitStats || {
      repliesGenerated: 0,
      timeSavedMinutes: 0,
      risksCaught: 0,
      commentsAnalyzed: 0
    };
    let scannedHashes = result.orbitScannedHashes || [];

    // SELF-HEALING: If stats were reset to 0 but hashes remain, the user wiped storage. We must clear hashes to recount!
    if (stats.commentsAnalyzed === 0 && scannedHashes.length > 0) {
      console.log('ORBIT: Stat reset detected. Clearing hash memory to recount.');
      scannedHashes = [];
    }

    let newComments = 0;
    let newRisks = 0;

    replyBars.forEach(bar => {
      const hash = bar.getAttribute('data-orbit-hash');
      if (hash && !scannedHashes.includes(hash)) {
        scannedHashes.push(hash);
        newComments++;
        
        const badges = bar.querySelectorAll('span');
        let hasRisk = false;
        badges.forEach(badge => {
          if (badge.textContent && badge.textContent.includes('REFUND RISK')) {
            hasRisk = true;
          }
        });
        if (hasRisk) newRisks++;
      }
    });

    if (newComments > 0) {
      stats.commentsAnalyzed += newComments;
      stats.risksCaught += newRisks;

      if (scannedHashes.length > 5000) {
        scannedHashes.splice(0, scannedHashes.length - 5000);
      }

      chrome.storage.local.set({ 
        orbitStats: stats,
        orbitScannedHashes: scannedHashes
      }, () => {
        console.log('ORBIT Scan Stats Saved:', stats);
        // Refresh panel stats if applicable
        if (typeof window.populateOverviewTab === 'function') {
           window.populateOverviewTab();
        }
      });
    }
  });
}

 function renderMasterFilter() { /* legacy - handled by panel */ }

function renderStatsUI() {
  if (!isStorageReady) return;
  // Update stats in the panel if it exists
  const panel = document.getElementById('orbit-saas-panel');
  if (!panel) return;
  try {
    chrome.storage.local.get(['orbitStats', 'orbitActiveFilter'], (result) => {
      const allStats = result.orbitStats || {};
      const activeFilter = result.orbitActiveFilter || 'Global';
      let ds;
      if (activeFilter === 'Global') {
        ds = { repliesGenerated: allStats.repliesGenerated || 0, timeSavedMinutes: allStats.timeSavedMinutes || 0, risksCaught: allStats.risksCaught || 0, commentsAnalyzed: allStats.commentsAnalyzed || 0 };
      } else {
        ds = (allStats.byProduct && allStats.byProduct[activeFilter]) || { repliesGenerated: 0, timeSavedMinutes: 0, risksCaught: 0, commentsAnalyzed: 0 };
      }
      const re = document.getElementById('orbit-replies-generated');
      const te = document.getElementById('orbit-time-saved');
      const ri = document.getElementById('orbit-risks-caught');
      const co = document.getElementById('orbit-comments-analyzed');
      if (re) re.innerText = ds.repliesGenerated;
      if (te) te.innerText = formatTimeSaved(ds.timeSavedMinutes);
      if (ri) ri.innerText = ds.risksCaught;
      if (co) co.innerText = ds.commentsAnalyzed;
    });
  } catch (e) {}
}

function renderAutoFAQ() { /* legacy - handled by panel */ }

function renderCommandCenter() { /* legacy - handled by panel */ }

// === POPULATE OVERVIEW ===
window.populateOverviewTab = function() {
  chrome.storage.local.get(['orbitStats', 'orbitFAQs', 'orbitProducts', 'orbitActiveFilter'], (res) => {
    const stats = res.orbitStats || {};
    const faqs = res.orbitFAQs || [];
    const products = res.orbitProducts || [];
    const activeFilter = res.orbitActiveFilter || 'Global';

    document.querySelectorAll('[id="orbit-replies-generated"]').forEach(el => el.innerText = stats.repliesGenerated || 0);
    document.querySelectorAll('[id="orbit-time-saved"]').forEach(el => el.innerText = formatTimeSaved(stats.timeSavedMinutes || 0));
    document.querySelectorAll('[id="orbit-risks-caught"]').forEach(el => el.innerText = stats.risksCaught || 0);
    document.querySelectorAll('[id="orbit-comments-analyzed"]').forEach(el => el.innerText = stats.commentsAnalyzed || 0);

    const filterSelects = document.querySelectorAll('[id="orbit-panel-filter"]');
    filterSelects.forEach(filterSelect => {
      if (filterSelect.options.length <= 1) {
        products.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.name;
          opt.textContent = p.name;
          filterSelect.appendChild(opt);
        });
        filterSelect.value = activeFilter;
        filterSelect.addEventListener('change', (e) => {
          chrome.storage.local.set({ orbitActiveFilter: e.target.value }, () => window.populateOverviewTab());
        });
      }
    });

    const faqLists = document.querySelectorAll('[id="orbit-panel-faq-list"]');
    faqLists.forEach(faqList => {
      const filtered = activeFilter === 'Global' ? faqs : faqs.filter(f => f.product === activeFilter);
      if (filtered.length === 0) {
        faqList.innerHTML = '<p style="color:#4b5563;font-size:13px;text-align:center;padding:20px 0;">No questions captured yet.</p>';
      } else {
        faqList.innerHTML = filtered.map(faq => `
          <div class="orbit-faq-item">
            <p style="color:#e2e8f0;font-size:13px;margin:0 0 6px 0;line-height:1.5;">${escapeHtml(faq.text)}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#6b7280;font-size:11px;">${escapeHtml(faq.author || 'Customer')}</span>
              <span style="background:rgba(79,70,229,0.15);color:#a78bfa;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;">${escapeHtml(faq.product || 'Global')}</span>
            </div>
          </div>
        `).join('');
      }
    });
  });
};

// ============================================================
// SECTION 8B: UNIFIED SAAS DASHBOARD PANEL
// ============================================================

let orbitPanelActiveTab = 'overview';

function renderOrbitPanel() {
  if (!isStorageReady) return;
  if (document.getElementById('orbit-saas-panel')) return;

  // Inject panel-specific CSS
  if (!document.getElementById('orbit-panel-styles')) {
    const s = document.createElement('style');
    s.id = 'orbit-panel-styles';
    s.textContent = `
      #orbit-saas-panel {
        position: fixed; top: 0; right: 0; height: 100vh; width: 460px;
        background: #0A0A0B;
        border-left: 1px solid rgba(255,255,255,0.08);
        box-shadow: -25px 0 50px -12px rgba(0,0,0,0.5);
        z-index: 10001; overflow-y: auto; overflow-x: hidden;
        font-family: system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif;
        color: #e2e8f0;
        animation: orbitSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes orbitSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes orbitSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
      #orbit-saas-panel::-webkit-scrollbar { width: 4px; }
      #orbit-saas-panel::-webkit-scrollbar-track { background: transparent; }
      #orbit-saas-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      .orbit-tab-nav { display: flex; gap: 2px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 3px; }
      .orbit-tab-btn {
        flex: 1; padding: 9px 8px; border: none; border-radius: 8px;
        background: transparent; color: #6b7280; cursor: pointer;
        font-size: 12px; font-weight: 600; font-family: inherit;
        transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 5px;
        white-space: nowrap;
      }
      .orbit-tab-btn:hover { color: #9ca3af; background: rgba(255,255,255,0.04); }
      .orbit-tab-btn.active {
        background: rgba(79, 70, 229, 0.2); color: #a78bfa;
        box-shadow: 0 0 12px rgba(79,70,229,0.15);
      }
      .orbit-stat-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 6px;
        transition: border-color 0.2s ease;
      }
      .orbit-stat-card:hover { border-color: rgba(79,70,229,0.3); }
      .orbit-stat-value { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
      .orbit-stat-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; }
      .orbit-section-title { font-size: 13px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 10px 0; }
      .orbit-card-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .orbit-faq-item {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
        transition: border-color 0.2s ease;
      }
      .orbit-faq-item:hover { border-color: rgba(79,70,229,0.3); }
      .orbit-prod-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center;
        transition: border-color 0.2s ease; margin-bottom: 8px;
      }
      .orbit-prod-card:hover { border-color: rgba(79,70,229,0.3); }
      .orbit-pro-gradient {
        background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%);
        border-radius: 14px; padding: 28px 24px; text-align: center; position: relative; overflow: hidden;
      }
      .orbit-pro-gradient::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1), transparent 50%);
      }
      .orbit-pro-feature { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #d1d5db; font-size: 13px; }
      .orbit-pro-feature:last-child { border-bottom: none; }
      .orbit-tab-content { display: none; animation: orbitFadeIn 0.25s ease; }
      .orbit-tab-content.active { display: block; }
    `;
    document.head.appendChild(s);
  }

  const panel = document.createElement('div');
  panel.id = 'orbit-saas-panel';

  // Build header
  panel.innerHTML = `
    <div style="padding: 20px 24px 0 24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:flex;align-items:center;">${ORBIT_ICONS.orbit}</span>
          <span style="font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.3px;">ORBIT</span>
          <span style="font-size:10px;color:#6b7280;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:20px;font-weight:600;">v7</span>
        </div>
        <button id="orbit-panel-close" class="orbit-btn" style="background:rgba(255,255,255,0.06);color:#9ca3af;width:32px;height:32px;border-radius:8px;font-size:16px;display:flex;align-items:center;justify-content:center;padding:0;">&times;</button>
      </div>
      <nav class="orbit-tab-nav">
        <button class="orbit-tab-btn active" data-tab="overview">${ORBIT_ICONS.chart} Overview</button>
        <button class="orbit-tab-btn" data-tab="products">${ORBIT_ICONS.box} Products</button>
        <button class="orbit-tab-btn" data-tab="settings">${ORBIT_ICONS.target} Settings</button>
        <button class="orbit-tab-btn" data-tab="pro" style="color:#a78bfa;">${ORBIT_ICONS.sparkle} Pro</button>
      </nav>
    </div>
    <div style="padding: 16px 24px 24px 24px;">

      <!-- ========== OVERVIEW TAB ========== -->
      <div class="orbit-tab-content active" data-content="overview">
        <div class="orbit-card-row" style="margin-bottom:12px;">
          <div class="orbit-stat-card">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="orbit-icon" style="color:#3b82f6;">${ORBIT_ICONS.send}</span>
              <span class="orbit-stat-label">Replies</span>
            </div>
            <span class="orbit-stat-value" id="orbit-replies-generated">0</span>
          </div>
          <div class="orbit-stat-card">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="orbit-icon" style="color:#10b981;">${ORBIT_ICONS.loader}</span>
              <span class="orbit-stat-label">Time Saved</span>
            </div>
            <span class="orbit-stat-value" id="orbit-time-saved">0m</span>
          </div>
        </div>
        <div class="orbit-card-row">
          <div class="orbit-stat-card">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="orbit-icon" style="color:#ef4444;">${ORBIT_ICONS.alert}</span>
              <span class="orbit-stat-label">Risks</span>
            </div>
            <span class="orbit-stat-value" id="orbit-risks-caught">0</span>
          </div>
          <div class="orbit-stat-card">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="orbit-icon" style="color:#f59e0b;">${ORBIT_ICONS.scan}</span>
              <span class="orbit-stat-label">Analyzed</span>
            </div>
            <span class="orbit-stat-value" id="orbit-comments-analyzed">0</span>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;">
          <select id="orbit-panel-filter" class="orbit-input" style="flex:1;color:#10b981;font-weight:600;font-size:13px;padding:10px 12px;">
            <option value="Global">All Products</option>
          </select>
        </div>
        <p class="orbit-section-title" style="display:flex;align-items:center;gap:6px;">${ORBIT_ICONS.book} Recent Questions</p>
        <div id="orbit-panel-faq-list"></div>
      </div>

      <!-- ========== PRODUCTS TAB ========== -->
      <div class="orbit-tab-content" data-content="products">
        <p class="orbit-section-title">Add a Product</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <input type="text" id="orbit-prod-name" class="orbit-input" placeholder="Product Name">
          <input type="url"  id="orbit-prod-url"  class="orbit-input" placeholder="Comments Page URL">
          <textarea id="orbit-prod-description" class="orbit-input" placeholder="Product Description (1-2 sentences)" rows="2" style="resize:vertical;"></textarea>
          <textarea id="orbit-prod-features" class="orbit-input" placeholder="Key Features (one per line)" rows="3" style="resize:vertical;"></textarea>
          <div style="display:flex;gap:8px;">
            <button id="orbit-auto-detect" class="orbit-btn" style="flex:1;background:linear-gradient(135deg,#8b5cf6 0%,#3b82f6 100%);color:#fff;padding:12px;border-radius:10px;justify-content:center;font-size:13px;">${ORBIT_ICONS.download} Auto-Detect Context</button>
            <button id="orbit-add-prod" class="orbit-btn" style="background:#10b981;color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;">${ORBIT_ICONS.plus} Add</button>
          </div>
          <div id="orbit-auto-detect-status" style="display:none;padding:10px;border-radius:8px;font-size:13px;"></div>
        </div>
        <p class="orbit-section-title" style="margin-top:20px;">Your Products</p>
        <div id="orbit-prod-list"></div>
      </div>

      <!-- ========== SETTINGS TAB ========== -->
      <div class="orbit-tab-content" data-content="settings">
        <p class="orbit-section-title">Configuration</p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <label class="orbit-faq-item" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0;">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600;">Analytics Tracking</div>
              <div style="color:#6b7280;font-size:12px;">Track reply stats and comment analysis</div>
            </div>
            <input type="checkbox" id="orbit-set-analytics" style="accent-color:#4f46e5;width:18px;height:18px;">
          </label>
          <label class="orbit-faq-item" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0;">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600;">Email Notifications</div>
              <div style="color:#6b7280;font-size:12px;">Get alerted on high refund risk comments</div>
            </div>
            <input type="checkbox" id="orbit-set-email" style="accent-color:#4f46e5;width:18px;height:18px;">
          </label>
          <label class="orbit-faq-item" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0;">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600;">Privacy Mode</div>
              <div style="color:#6b7280;font-size:12px;">Anonymize customer names in replies</div>
            </div>
            <input type="checkbox" id="orbit-set-privacy" style="accent-color:#4f46e5;width:18px;height:18px;">
          </label>
          <label class="orbit-faq-item" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;margin-bottom:0;">
            <div>
              <div style="color:#fff;font-size:14px;font-weight:600;">Webhook Alerts</div>
              <div style="color:#6b7280;font-size:12px;">Send refund risk alerts to Slack/Discord</div>
            </div>
            <input type="checkbox" id="orbit-set-webhook" style="accent-color:#4f46e5;width:18px;height:18px;">
          </label>
          <input type="url" id="orbit-set-webhook-url" class="orbit-input" placeholder="Webhook URL (Slack/Discord)" style="font-size:13px;">
        </div>
        <div style="margin-top:16px;">
          <button id="orbit-save-settings" class="orbit-btn" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:10px;width:100%;justify-content:center;font-size:13px;">${ORBIT_ICONS.check} Save Settings</button>
        </div>
      </div>

      <!-- ========== PRO TAB ========== -->
      <div class="orbit-tab-content" data-content="pro">
        <div class="orbit-pro-gradient" style="margin-bottom:20px;">
          <div style="position:relative;z-index:1;">
            <div style="font-size:32px;margin-bottom:8px;display:flex;justify-content:center;">${ORBIT_ICONS.sparkle}</div>
            <h3 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px 0;letter-spacing:-0.5px;">Upgrade to ORBIT Pro</h3>
            <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0 0 20px 0;">Unlock the full power of AI-driven comment management.</p>
            <button class="orbit-btn" style="background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);color:#fff;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;border:1px solid rgba(255,255,255,0.3);width:100%;justify-content:center;">Get Pro — $49/mo</button>
          </div>
        </div>
        <p class="orbit-section-title">What you unlock</p>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:4px 16px;">
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> AI-powered multilingual replies (30+ languages)</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> GPT-4 contextual reply generation</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> Bulk auto-reply with smart scheduling</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> Advanced refund risk prediction</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> Priority email + Slack support</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> Custom reply templates & brand voice</div>
          <div class="orbit-pro-feature"><span style="color:#10b981;">${ORBIT_ICONS.check}</span> Export analytics to CSV/PDF</div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(panel);

  // === TAB SWITCHING ===
  panel.querySelectorAll('.orbit-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      orbitPanelActiveTab = tab;
      panel.querySelectorAll('.orbit-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panel.querySelectorAll('.orbit-tab-content').forEach(c => c.classList.remove('active'));
      panel.querySelector(`[data-content="${tab}"]`)?.classList.add('active');
      if (tab === 'overview') populateOverviewTab();
      if (tab === 'settings') populateSettingsTab();
    });
  });

  // === CLOSE BUTTON ===
  document.getElementById('orbit-panel-close').addEventListener('click', () => {
    panel.style.animation = 'orbitSlideOut 0.25s ease forwards';
    setTimeout(() => panel.remove(), 250);
  });

  // === POPULATE OVERVIEW ===
  populateOverviewTab();

  // === AUTO-DETECT CONTEXT ===
  document.getElementById('orbit-auto-detect').addEventListener('click', () => {
    const statusEl = document.getElementById('orbit-auto-detect-status');
    const btn = document.getElementById('orbit-auto-detect');
    btn.disabled = true;
    btn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Fetching...`;

    chrome.storage.local.get(['orbitTempExtractedData'], (result) => {
      const data = result.orbitTempExtractedData;
      if (data) {
        const nameInput = document.getElementById('orbit-prod-name');
        const descInput = document.getElementById('orbit-prod-description');
        const featInput = document.getElementById('orbit-prod-features');
        if (nameInput && data.name) nameInput.value = data.name;
        if (descInput && data.description) descInput.value = data.description;
        if (featInput && data.features) featInput.value = data.features;
        chrome.storage.local.remove('orbitTempExtractedData');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = 'rgba(16,185,129,0.1)'; statusEl.style.color = '#10b981';
          statusEl.style.border = '1px solid rgba(16,185,129,0.2)';
          statusEl.innerHTML = `${ORBIT_ICONS.check} Product data auto-filled! Review and click Add.`;
          setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
        }
      } else {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = 'rgba(245,158,11,0.1)'; statusEl.style.color = '#f59e0b';
          statusEl.style.border = '1px solid rgba(245,158,11,0.2)';
          statusEl.innerHTML = `${ORBIT_ICONS.alert} No data found. Visit a product page first.`;
          setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
        }
      }
      btn.innerHTML = `${ORBIT_ICONS.download} Auto-Detect Context`;
      btn.disabled = false;
    });
  });

  // === PRODUCT LIST ===
  const renderProducts = (prods) => {
    const list = document.getElementById('orbit-prod-list');
    if (!list) return;
    if (!prods || prods.length === 0) {
      list.innerHTML = '<p style="color:#4b5563;font-size:13px;text-align:center;padding:20px 0;">No products added yet.</p>';
      return;
    }
    list.innerHTML = prods.map(p => `
      <div class="orbit-prod-card">
        <div style="flex:1;min-width:0;">
          <strong style="color:#fff;font-size:14px;display:block;">${escapeHtml(p.name)}</strong>
          <span style="color:#6b7280;font-size:12px;word-break:break-all;">${escapeHtml(p.url)}</span>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;margin-left:10px;">
          <a href="${escapeHtml(p.url)}" target="_blank" class="orbit-btn" style="background:rgba(59,130,246,0.15);color:#60a5fa;padding:7px 12px;border-radius:8px;font-size:11px;text-decoration:none;">${ORBIT_ICONS.link} Open</a>
          <button class="orbit-del-prod orbit-btn" data-id="${p.id}" style="background:rgba(239,68,68,0.15);color:#f87171;padding:7px 10px;border-radius:8px;font-size:11px;">${ORBIT_ICONS.trash}</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.orbit-del-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        chrome.storage.local.get(['orbitProducts'], res => {
          const updated = (res.orbitProducts || []).filter(p => p.id !== id);
          chrome.storage.local.set({ orbitProducts: updated }, () => renderProducts(updated));
        });
      });
    });
  };

  chrome.storage.local.get(['orbitProducts'], res => renderProducts(res.orbitProducts || []));

  // === ADD PRODUCT ===
  document.getElementById('orbit-add-prod').addEventListener('click', () => {
    const name = document.getElementById('orbit-prod-name').value.trim();
    const url = document.getElementById('orbit-prod-url').value.trim();
    if (name && url) {
      chrome.storage.local.get(['orbitProducts'], res => {
        const prods = res.orbitProducts || [];
        prods.push({ id: Date.now(), name, url });
        chrome.storage.local.set({ orbitProducts: prods }, () => {
          renderProducts(prods);
          document.getElementById('orbit-prod-name').value = '';
          document.getElementById('orbit-prod-url').value = '';
          document.getElementById('orbit-prod-description').value = '';
          document.getElementById('orbit-prod-features').value = '';
        });
      });
    }
  });

  // === SETTINGS ===
  function populateSettingsTab() {
    chrome.storage.local.get('orbitSettings', (res) => {
      const s = res.orbitSettings || {};
      const a = document.getElementById('orbit-set-analytics');
      const e = document.getElementById('orbit-set-email');
      const p = document.getElementById('orbit-set-privacy');
      const w = document.getElementById('orbit-set-webhook');
      const u = document.getElementById('orbit-set-webhook-url');
      if (a) a.checked = s.analyticsTracking !== false;
      if (e) e.checked = !!s.emailNotifications;
      if (p) p.checked = !!s.privacyMode;
      if (w) w.checked = !!s.webhookEnabled;
      if (u) u.value = s.webhookUrl || '';
    });
  }

  document.getElementById('orbit-save-settings').addEventListener('click', () => {
    const newSettings = {
      analyticsTracking: document.getElementById('orbit-set-analytics').checked,
      emailNotifications: document.getElementById('orbit-set-email').checked,
      privacyMode: document.getElementById('orbit-set-privacy').checked,
      orbitAIEnabled: true,
      webhookEnabled: document.getElementById('orbit-set-webhook').checked,
      webhookUrl: document.getElementById('orbit-set-webhook-url').value.trim(),
      productName: '',
      productDescription: ''
    };
    chrome.storage.local.set({ orbitSettings: newSettings }, () => {
      cachedSettings = { ...cachedSettings, ...newSettings };
      const btn = document.getElementById('orbit-save-settings');
      btn.innerHTML = `${ORBIT_ICONS.check} Saved!`;
      btn.style.background = '#4f46e5';
      setTimeout(() => { btn.innerHTML = `${ORBIT_ICONS.check} Save Settings`; btn.style.background = '#10b981'; }, 2000);
    });
  });

  // Initial data load
  populateOverviewTab();
  populateSettingsTab();
}

// ============================================================
// SECTION 8: UNIFIED SPA ROUTER
// ============================================================

let routerInterval = null;

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
          <h3 style="color:#fff;margin:0;font-size:16px;display:flex;align-items:center;gap:8px;">${ORBIT_ICONS.book} Auto-FAQ: <span style="color:#10b981;">${escapeHtml(activeFilter)}</span></h3>
          <button id="orbit-clear-faqs" class="orbit-btn" style="background:transparent;border:1px solid #ef4444;color:#ef4444;padding:6px 12px;border-radius:6px;font-size:12px;">${ORBIT_ICONS.trash} Clear</button>
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
    cmdDiv.className = 'orbit-glass';
    cmdDiv.style.cssText = 'margin: 20px 0; padding: 24px; border-radius: 14px; max-width: 700px; font-family: system-ui, -apple-system, "Inter", "Segoe UI", sans-serif; animation: orbitFadeIn 0.4s ease;';
    
    cmdDiv.innerHTML = `
      <h3 style="color:#00d4ff;margin:0 0 12px 0;font-size:18px;display:flex;align-items:center;gap:8px;">${ORBIT_ICONS.target} Command Center</h3>
      <p style="color:#9ca3af;margin:0 0 16px 0;font-size:13px;">Add products. Click "Open" to launch their comments page where ORBIT activates.</p>
      <div style="display:flex;gap:10px;margin-bottom:12px;">
        <input type="text" id="orbit-prod-name" placeholder="Product Name" class="orbit-input" style="flex:1;">
        <input type="url" id="orbit-prod-url" placeholder="Comments URL" class="orbit-input" style="flex:2;">
        <button id="orbit-add-prod" class="orbit-btn" style="background:#10b981;color:#fff;padding:12px 20px;border-radius:8px;">${ORBIT_ICONS.plus} Add</button>
      </div>
      <div style="margin-bottom:12px;">
        <textarea id="orbit-prod-description" placeholder="Product Description (1-2 sentences)" rows="2" class="orbit-input" style="width:100%;resize:vertical;"></textarea>
      </div>
      <div style="margin-bottom:16px;">
        <textarea id="orbit-prod-features" placeholder="Key Features (one per line)" rows="3" class="orbit-input" style="width:100%;resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <button id="orbit-auto-detect" class="orbit-btn" style="background:linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);color:#fff;padding:12px 20px;border-radius:8px;flex:1;justify-content:center;">${ORBIT_ICONS.sparkle} Auto-Detect Context</button>
      </div>
      <div id="orbit-auto-detect-status" style="display:none;margin-bottom:12px;padding:10px;border-radius:8px;font-size:13px;"></div>
      <div id="orbit-prod-list" style="display:flex;flex-direction:column;gap:10px;"></div>
    `;
    
    targetEl.appendChild(cmdDiv);

    // === TASK 3: Auto-Detect Context button ===
    document.getElementById('orbit-auto-detect').addEventListener('click', () => {
      const statusEl = document.getElementById('orbit-auto-detect-status');
      const btn = document.getElementById('orbit-auto-detect');
      btn.disabled = true;
      btn.innerHTML = `<span class="orbit-icon" style="animation:orbitSpin 1s linear infinite;">${ORBIT_ICONS.loader}</span> Fetching extracted data...`;
      
      chrome.storage.local.get(['orbitTempExtractedData'], (result) => {
        const data = result.orbitTempExtractedData;
        if (data) {
          const nameInput = document.getElementById('orbit-prod-name');
          const descInput = document.getElementById('orbit-prod-description');
          const featInput = document.getElementById('orbit-prod-features');
          
          if (nameInput && data.name) nameInput.value = data.name;
          if (descInput && data.description) descInput.value = data.description;
          if (featInput && data.features) featInput.value = data.features;
          
          // Clear the temp data
          chrome.storage.local.remove('orbitTempExtractedData', () => {
            console.log('ORBIT: Temp extracted data cleared after paste.');
          });
          
          if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.style.background = '#064e3b';
            statusEl.style.color = '#10b981';
            statusEl.innerHTML = `${ORBIT_ICONS.check} Product data auto-filled from extracted page! Review and click Add.`;
            setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
          }
          btn.innerHTML = `${ORBIT_ICONS.sparkle} Auto-Detect Context`;
          btn.disabled = false;
        } else {
          if (statusEl) {
            statusEl.style.display = 'block';
            statusEl.style.background = '#451a03';
            statusEl.style.color = '#f59e0b';
            statusEl.innerHTML = `${ORBIT_ICONS.alert} No extracted data found. Visit a product page and click "Extract & Save" first.`;
            setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
          }
          btn.innerHTML = `${ORBIT_ICONS.sparkle} Auto-Detect Context`;
          btn.disabled = false;
        }
      });
    });
    
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
            <a href="${escapeHtml(p.url)}" target="_blank" class="orbit-btn" style="background:#3b82f6;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px;">${ORBIT_ICONS.link} Open</a>
            <button class="orbit-del-prod orbit-btn" data-id="${p.id}" style="background:#ef4444;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;">${ORBIT_ICONS.trash}</button>
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
            document.getElementById('orbit-prod-description').value = '';
            document.getElementById('orbit-prod-features').value = '';
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
      if (typeof window.renderOrbitPanel === 'function') window.renderOrbitPanel();
      if (!document.getElementById('orbit-saas-panel') && typeof renderOrbitPanel === 'function') renderOrbitPanel();
    } 
    else if (isOverview) {
      document.getElementById('orbit-saas-panel')?.remove();
      if (typeof renderMasterFilter === 'function') renderMasterFilter();
      if (typeof window.populateOverviewTab === 'function') window.populateOverviewTab();
      if (typeof renderAutoFAQ === 'function') renderAutoFAQ();
    }
    else {
      document.getElementById('orbit-saas-panel')?.remove();
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
  } else if (e.target.id === 'orbit-dash-open-saas') {
    if (typeof renderOrbitPanel === 'function') renderOrbitPanel();
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

console.log('[ORBIT] V7 - Premium Edition Loaded');
