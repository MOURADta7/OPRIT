/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/logger.ts"
/*!*****************************!*\
  !*** ./src/utils/logger.ts ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logger: () => (/* binding */ logger)
/* harmony export */ });
/**
 * Logger Utility
 * Debug logging with environment-based levels
 */
class Logger {
    constructor() {
        this.level = 'debug';
        this.prefix = '[ORBIT]';
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.level];
    }
    log(level, message, ...args) {
        if (!this.shouldLog(level))
            return;
        const timestamp = new Date().toISOString();
        const fullMessage = `${this.prefix} [${level.toUpperCase()}] ${timestamp} - ${message}`;
        switch (level) {
            case 'debug':
                console.debug(fullMessage, ...args);
                break;
            case 'info':
                console.info(fullMessage, ...args);
                break;
            case 'warn':
                console.warn(fullMessage, ...args);
                break;
            case 'error':
                console.error(fullMessage, ...args);
                break;
        }
    }
    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
    info(message, ...args) {
        this.log('info', message, ...args);
    }
    warn(message, ...args) {
        this.log('warn', message, ...args);
    }
    error(message, ...args) {
        this.log('error', message, ...args);
    }
    setLevel(level) {
        this.level = level;
    }
}
const logger = new Logger();


/***/ },

/***/ "./src/utils/platformDetector.ts"
/*!***************************************!*\
  !*** ./src/utils/platformDetector.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PlatformDetector: () => (/* binding */ PlatformDetector)
/* harmony export */ });
/**
 * Platform Detector Module
 * Detects current platform using generic terms only
 * No company names in user-facing code
 */
// Platform configurations with generic names
const PLATFORMS = new Map([
    ['appsumo.com', {
            name: 'Marketplace Dashboard',
            type: 'marketplace',
            selectors: {
                comments: '.comment-item, .review-item, [data-testid="comment"]',
                salesTable: 'table[data-sales], .sales-table, .revenue-table',
                priceContainer: '.pricing-section, .tier-container, .pricing-card',
                dashboardContainer: '.partner-dashboard, .seller-dashboard'
            },
            detected: false
        }],
    ['trustpilot.com', {
            name: 'Review Platform',
            type: 'review',
            selectors: {
                comments: '.review-content, .review-card, [data-review-body]',
                salesTable: '',
                priceContainer: '',
                dashboardContainer: '.dashboard, .business-profile'
            },
            detected: false
        }],
    ['g2.com', {
            name: 'Software Reviews',
            type: 'review',
            selectors: {
                comments: '.review-content, .review-body, [data-track-product-review]',
                salesTable: '',
                priceContainer: '.pricing-card, .price-attribute',
                dashboardContainer: '.dashboard, .admin-panel'
            },
            detected: false
        }],
    ['gumroad.com', {
            name: 'Sales Platform',
            type: 'store',
            selectors: {
                comments: '.comment, .customer-message, .review-item',
                salesTable: '.sales-data-table, .revenue-table',
                priceContainer: '.product-price, .pricing-container',
                dashboardContainer: '.dashboard-container'
            },
            detected: false
        }],
    ['lemonsqueezy.com', {
            name: 'Digital Store',
            type: 'store',
            selectors: {
                comments: '.comment, .review-card',
                salesTable: '.sales-table, .orders-table',
                priceContainer: '.price-container, .variant-price',
                dashboardContainer: '.store-dashboard'
            },
            detected: false
        }],
    ['shopify.com', {
            name: 'E-commerce Platform',
            type: 'platform',
            selectors: {
                comments: '.review-item, .comment',
                salesTable: '.sales-table, .orders-table',
                priceContainer: '.price, .product-price',
                dashboardContainer: '.shopify-dashboard'
            },
            detected: false
        }]
]);
class PlatformDetector {
    /**
     * Detect current platform
     * Returns generic name for display
     */
    static detect() {
        const hostname = window.location.hostname.toLowerCase();
        for (const [domain, config] of PLATFORMS) {
            if (hostname.includes(domain)) {
                return {
                    ...config,
                    detected: true
                };
            }
        }
        return null;
    }
    /**
     * Check if current page is a supported platform
     */
    static isSupported() {
        return this.detect() !== null;
    }
    /**
     * Get platform name (always generic)
     */
    static getDisplayName() {
        const platform = this.detect();
        return platform?.name || 'Sales Dashboard';
    }
    /**
     * Get platform type
     */
    static getType() {
        const platform = this.detect();
        return platform?.type || 'unknown';
    }
    /**
     * Get DOM selectors for current platform
     */
    static getSelectors() {
        const platform = this.detect();
        return platform?.selectors || null;
    }
    /**
     * Extract comments from page
     */
    static extractComments() {
        const selectors = this.getSelectors();
        if (!selectors)
            return [];
        const comments = [];
        const selectorList = selectors.comments.split(', ');
        for (const selector of selectorList) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!comments.includes(el)) {
                    comments.push(el);
                }
            });
        }
        return comments;
    }
    /**
     * Extract sales data from page
     */
    static extractSalesData() {
        const selectors = this.getSelectors();
        if (!selectors)
            return [];
        const data = [];
        const table = document.querySelector(selectors.salesTable);
        if (table) {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    data.push({
                        date: cells[0]?.textContent?.trim(),
                        item: cells[1]?.textContent?.trim(),
                        amount: cells[2]?.textContent?.trim()
                    });
                }
            });
        }
        return data;
    }
    /**
     * Extract pricing tiers
     */
    static extractPricing() {
        const selectors = this.getSelectors();
        if (!selectors)
            return [];
        const pricing = [];
        const containers = document.querySelectorAll(selectors.priceContainer);
        containers.forEach((container, index) => {
            const priceText = container.textContent || '';
            const priceMatch = priceText.match(/\$([\d,]+\.?\d*)/);
            const tierMatch = priceText.match(/(tier|plan)\s*(\d+)/i);
            if (priceMatch) {
                pricing.push({
                    tier: tierMatch ? parseInt(tierMatch[2]) : index + 1,
                    price: parseFloat(priceMatch[1].replace(',', '')),
                    name: `Tier ${index + 1}`,
                    element: container
                });
            }
        });
        return pricing;
    }
    /**
     * Get all supported platform domains
     * For internal use only (host_permissions)
     */
    static getSupportedDomains() {
        return Array.from(PLATFORMS.keys());
    }
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/content/content.ts ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/platformDetector */ "./src/utils/platformDetector.ts");
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
/**
 * Content Script - Injects ORBIT overlay into sales dashboards
 * Runs on supported platforms only
 */


function detectPlatform() {
    const url = window.location.href.toLowerCase();
    if (url.includes('appsumo.com')) {
        return 'APPSUMO';
    }
    if (url.includes('trustpilot.com')) {
        return 'TRUSTPILOT';
    }
    if (url.includes('g2.com')) {
        return 'G2';
    }
    return 'GENERIC';
}
function calculateRefundRisk(text, _type) {
    const lowerText = text.toLowerCase();
    const platform = detectPlatform();
    let risk = 0;
    const baseKeywords = [
        { keyword: 'refund', weight: 30 },
        { keyword: '60 day', weight: 25 },
        { keyword: 'lifetime', weight: 20 }
    ];
    const trustpilotKeywords = [
        { keyword: 'scam', weight: 40 },
        { keyword: 'fraud', weight: 45 },
        { keyword: 'avoid', weight: 35 },
        { keyword: 'reported', weight: 30 },
        { keyword: 'fake', weight: 35 }
    ];
    const g2Keywords = [
        { keyword: 'cancel subscription', weight: 35 },
        { keyword: 'switching', weight: 25 },
        { keyword: 'competitor', weight: 20 }
    ];
    for (const { keyword, weight } of baseKeywords) {
        if (lowerText.includes(keyword)) {
            risk += weight;
        }
    }
    if (platform === 'TRUSTPILOT') {
        for (const { keyword, weight } of trustpilotKeywords) {
            if (lowerText.includes(keyword)) {
                risk += weight;
            }
        }
    }
    if (platform === 'G2') {
        for (const { keyword, weight } of g2Keywords) {
            if (lowerText.includes(keyword)) {
                risk += weight;
            }
        }
    }
    risk = Math.min(risk, 100);
    return {
        risk,
        isCritical: risk >= 50
    };
}
// Check if we're on a supported platform
if (_utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__.PlatformDetector.isSupported()) {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('ORBIT content script loaded on supported platform');
    // Initialize ORBIT
    initializeOrbit();
}
else {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('Platform not supported, ORBIT inactive');
}
function highlightTier3Rows() {
    const url = window.location.href;
    const isCommentsPage = url.includes('/comments');
    if (isCommentsPage)
        return;
    const isSalesPage = url.includes('/sales') || document.querySelector('table');
    if (!isSalesPage)
        return;
    const rows = document.querySelectorAll('tr');
    rows.forEach((row) => {
        if (row.textContent?.includes('Tier 3')) {
            row.style.borderLeft = '3px solid #f59e0b';
        }
    });
}
function initializeOrbit() {
    // Inject floating widget
    injectWidget();
    // Inject settings panel
    injectSettingsPanel();
    // Highlight Tier 3 rows on Sales page only
    highlightTier3Rows();
    // Watch for dynamic content
    observePageChanges();
    // Set up message listener
    setupMessageListener();
}
function injectWidget() {
    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'orbit-widget';
    widget.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: linear-gradient(135deg, #1a1f36 0%, #252b47 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      min-width: 200px;
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#00d4ff" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#00d4ff"/>
        </svg>
        <span style="font-weight: 700; font-size: 16px;">ORBIT</span>
        <span style="
          width: 8px;
          height: 8px;
          background: #51cf66;
          border-radius: 50%;
          margin-left: auto;
        "></span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="orbit-analytics" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">📊 Analytics</button>
        
        <button id="orbit-replies" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">💬 Replies</button>
        
        <button id="orbit-keywords" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">🔍 Keywords</button>

        <button id="orbit-settings" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">⚙️ Settings</button>
      </div>
      
      <div style="
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-around;
        font-size: 11px;
        color: #8b92a8;
      ">
        <div style="text-align: center;">
          <div id="orbit-stat-responses" style="font-size: 18px; font-weight: 700; color: #00d4ff;">0</div>
          <div>Responses</div>
        </div>
        <div style="text-align: center;">
          <div id="orbit-stat-time" style="font-size: 18px; font-weight: 700; color: #00d4ff;">0h</div>
          <div>Saved</div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(widget);
    // Add event listeners
    widget.querySelector('#orbit-analytics')?.addEventListener('click', () => {
        showAnalyticsPanel();
    });
    widget.querySelector('#orbit-replies')?.addEventListener('click', () => {
        scanForComments();
    });
    widget.querySelector('#orbit-keywords')?.addEventListener('click', () => {
        analyzeKeywords();
    });
    widget.querySelector('#orbit-settings')?.addEventListener('click', () => {
        injectSettingsPanel();
    });
    // Update stats periodically
    updateStats();
    setInterval(updateStats, 5000);
}
async function updateStats() {
    const responses = document.getElementById('orbit-stat-responses');
    const time = document.getElementById('orbit-stat-time');
    if (responses && time) {
        const stored = await chrome.storage.local.get(['responsesGenerated', 'timeSaved']);
        responses.textContent = (stored.responsesGenerated || 0).toString();
        time.textContent = Math.floor((stored.timeSaved || 0) / 60) + 'h';
    }
}
function showAnalyticsPanel() {
    // Create analytics panel
    const panel = document.createElement('div');
    panel.id = 'orbit-analytics-panel';
    panel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 260px;
      width: 350px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    ">
      <div style="
        padding: 16px;
        background: #1a1f36;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 16px;">📊 Sales Analytics</h3>
        <button id="orbit-close-analytics" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>
      <div style="padding: 16px; overflow-y: auto;">
        <p style="color: #666;">Analytics will appear here...</p>
      </div>
    </div>
  `;
    document.body.appendChild(panel);
    panel.querySelector('#orbit-close-analytics')?.addEventListener('click', () => {
        panel.remove();
    });
}
async function injectSettingsPanel() {
    const existingPanel = document.getElementById('orbit-settings-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    const stored = await chrome.storage.local.get('orbitProductContext');
    const productContext = stored.orbitProductContext || { productName: '', shortDescription: '' };
    const panel = document.createElement('div');
    panel.id = 'orbit-settings-panel';
    panel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 260px;
      width: 380px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    ">
      <div style="
        padding: 16px;
        background: #1a1f36;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 16px;">⚙️ Product Settings</h3>
        <button id="orbit-close-settings" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>
      <div style="padding: 16px; overflow-y: auto;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151;">
            Product Name
          </label>
          <input 
            id="orbit-product-name" 
            type="text" 
            value="${productContext.productName || ''}"
            placeholder="e.g., My Awesome App"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
          />
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151;">
            Short Description (1-2 sentences)
          </label>
          <textarea 
            id="orbit-product-description" 
            rows="3"
            placeholder="e.g., A powerful tool that helps automate your workflow and save time."
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              box-sizing: border-box;
            "
          >${productContext.shortDescription || ''}</textarea>
        </div>
        
        <button 
          id="orbit-save-settings"
          style="
            width: 100%;
            padding: 10px 16px;
            background: #00d4ff;
            color: #1a1f36;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Save Settings
        </button>
        
        <div id="orbit-settings-message" style="
          margin-top: 12px;
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          display: none;
        "></div>
      </div>
    </div>
  `;
    document.body.appendChild(panel);
    panel.querySelector('#orbit-close-settings')?.addEventListener('click', () => {
        panel.remove();
    });
    panel.querySelector('#orbit-save-settings')?.addEventListener('click', async () => {
        const productName = panel.querySelector('#orbit-product-name')?.value || '';
        const shortDescription = panel.querySelector('#orbit-product-description')?.value || '';
        await chrome.storage.local.set({
            orbitProductContext: {
                productName,
                shortDescription
            }
        });
        const messageEl = panel.querySelector('#orbit-settings-message');
        if (messageEl) {
            messageEl.textContent = '✓ Settings saved successfully!';
            messageEl.style.background = '#d1fae5';
            messageEl.style.color = '#065f46';
            messageEl.style.display = 'block';
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    });
}
function scanForComments() {
    const comments = _utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__.PlatformDetector.extractComments();
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info(`Found ${comments.length} comments`);
    comments.forEach((comment, _index) => {
        // Add reply button to each comment
        if (!comment.querySelector('.orbit-reply-btn')) {
            const replyBtn = document.createElement('button');
            replyBtn.className = 'orbit-reply-btn';
            replyBtn.textContent = '🤖 AI Reply';
            replyBtn.style.cssText = `
        margin-left: 8px;
        padding: 6px 12px;
        background: #00d4ff;
        color: #1a1f36;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      `;
            replyBtn.addEventListener('click', () => {
                generateReplyForComment(comment);
            });
            comment.appendChild(replyBtn);
        }
    });
}
async function generateReplyForComment(comment) {
    // Send message to background script
    const commentText = comment.textContent || '';
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'generateReply',
            data: {
                comment: commentText,
                customerName: 'Customer',
                context: ''
            }
        });
        if (response.success) {
            // Show reply modal
            showReplyModal(comment, response.reply);
        }
    }
    catch (error) {
        _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.error('Failed to generate reply:', error);
    }
}
function showReplyModal(_comment, reply) {
    const modal = document.createElement('div');
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
    modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
    ">
      <h3 style="margin: 0 0 16px 0;">AI-Generated Reply</h3>
      <textarea style="
        width: 100%;
        min-height: 120px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        margin-bottom: 16px;
      ">${reply}</textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="orbit-modal-cancel" style="
          padding: 10px 20px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Cancel</button>
        <button id="orbit-modal-copy" style="
          padding: 10px 20px;
          background: #00d4ff;
          color: #1a1f36;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        ">Copy</button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    modal.querySelector('#orbit-modal-cancel')?.addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('#orbit-modal-copy')?.addEventListener('click', () => {
        const textarea = modal.querySelector('textarea');
        if (textarea) {
            navigator.clipboard.writeText(textarea.value);
        }
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
function analyzeKeywords() {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('Analyzing keywords...');
    const comments = _utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__.PlatformDetector.extractComments();
    let highRiskCount = 0;
    comments.forEach((comment) => {
        const text = comment.textContent || '';
        const { risk, isCritical } = calculateRefundRisk(text, 'review');
        if (isCritical) {
            highRiskCount++;
            comment.style.borderLeft = '3px solid #ef4444';
        }
        else if (risk >= 25) {
            comment.style.borderLeft = '3px solid #f59e0b';
        }
    });
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info(`Found ${highRiskCount} high-risk comments out of ${comments.length}`);
    const platform = detectPlatform();
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info(`Current platform: ${platform}`);
}
function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        // Check if new comments were added
        const hasNewComments = mutations.some(mutation => Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && (node.matches?.('.comment, .review') ||
            node.querySelector?.('.comment, .review'))));
        if (hasNewComments) {
            setTimeout(scanForComments, 500);
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'refreshUI') {
            updateStats();
            sendResponse({ success: true });
        }
        return true;
    });
}

})();

/******/ })()
;
//# sourceMappingURL=content.js.map