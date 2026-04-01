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
 * Content Script - ORBIT "Bodyguard" Experience
 * Zero-friction, action-oriented UI
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
function calculateRefundRisk(text) {
    const lowerText = text.toLowerCase();
    const platform = detectPlatform();
    let risk = 0;
    let isNegative = false;
    const baseKeywords = [
        { keyword: 'refund', weight: 30 },
        { keyword: '60 day', weight: 25 },
        { keyword: 'lifetime', weight: 20 },
        { keyword: 'money back', weight: 35 },
        { keyword: 'not worth', weight: 25 },
        { keyword: 'waste of', weight: 30 },
        { keyword: 'disappointed', weight: 20 }
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
            isNegative = true;
        }
    }
    if (platform === 'TRUSTPILOT') {
        for (const { keyword, weight } of trustpilotKeywords) {
            if (lowerText.includes(keyword)) {
                risk += weight;
                isNegative = true;
            }
        }
    }
    if (platform === 'G2') {
        for (const { keyword, weight } of g2Keywords) {
            if (lowerText.includes(keyword)) {
                risk += weight;
                isNegative = true;
            }
        }
    }
    risk = Math.min(risk, 100);
    return {
        risk,
        isCritical: risk >= 50,
        isNegative
    };
}
if (_utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__.PlatformDetector.isSupported()) {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('ORBIT Bodyguard loaded on supported platform');
    initializeOrbit();
}
else {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('Platform not supported, ORBIT inactive');
}
let statusPill = null;
let riskCount = 0;
function initializeOrbit() {
    injectStatusPill();
    scanPageForRisks();
    observePageChanges();
    setupMessageListener();
}
function injectStatusPill() {
    const existing = document.getElementById('orbit-status-pill');
    if (existing)
        existing.remove();
    statusPill = document.createElement('div');
    statusPill.id = 'orbit-status-pill';
    statusPill.innerHTML = `
    <span class="orbit-pill-dot"></span>
    <span class="orbit-pill-text">You are safe</span>
  `;
    document.body.appendChild(statusPill);
    injectStatusPillStyles();
}
function injectStatusPillStyles() {
    if (document.getElementById('orbit-status-styles'))
        return;
    const styles = document.createElement('style');
    styles.id = 'orbit-status-styles';
    styles.textContent = `
    #orbit-status-pill {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(16, 185, 129, 0.15);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 50px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #10b981;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
    }
    
    #orbit-status-pill.danger {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #ef4444;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25);
      animation: orbit-danger-pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes orbit-danger-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25); }
      50% { box-shadow: 0 4px 30px rgba(239, 68, 68, 0.45); }
    }
    
    .orbit-pill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      transition: all 0.3s ease;
    }
    
    #orbit-status-pill.danger .orbit-pill-dot {
      background: #ef4444;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.8);
    }
  `;
    document.head.appendChild(styles);
}
function updateStatusPill(risksFound) {
    if (!statusPill)
        return;
    const text = statusPill.querySelector('.orbit-pill-text');
    if (risksFound > 0) {
        statusPill.classList.add('danger');
        if (text)
            text.textContent = `${risksFound} Risk${risksFound > 1 ? 's' : ''} Detected`;
    }
    else {
        statusPill.classList.remove('danger');
        if (text)
            text.textContent = 'You are safe';
    }
}
function scanPageForRisks() {
    const comments = _utils_platformDetector__WEBPACK_IMPORTED_MODULE_0__.PlatformDetector.extractComments();
    riskCount = 0;
    comments.forEach((comment) => {
        const text = comment.textContent || '';
        const { isCritical, isNegative } = calculateRefundRisk(text);
        if (isCritical || isNegative) {
            riskCount++;
            applyRiskStyling(comment);
            injectReplyButton(comment);
        }
    });
    updateStatusPill(riskCount);
}
function applyRiskStyling(element) {
    if (element.querySelector('.orbit-risk-glow'))
        return;
    element.classList.add('orbit-risk-glow');
    const glowStyles = document.createElement('style');
    glowStyles.textContent = `
    .orbit-risk-glow {
      position: relative;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0) !important;
      transition: box-shadow 0.3s ease !important;
    }
    
    .orbit-risk-glow:hover {
      box-shadow: 0 0 20px rgba(255, 0, 110, 0.3), 0 0 40px rgba(239, 68, 68, 0.15) !important;
    }
    
    .orbit-risk-glow::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, #ff006e 0%, #ef4444 100%);
      border-radius: 2px;
    }
  `;
    document.head.appendChild(glowStyles);
    element.style.boxShadow = '0 0 15px rgba(255, 0, 110, 0.25), 0 0 30px rgba(239, 68, 68, 0.1)';
}
function injectReplyButton(comment) {
    if (comment.querySelector('.orbit-reply-ready-btn'))
        return;
    const btn = document.createElement('button');
    btn.className = 'orbit-reply-ready-btn';
    btn.innerHTML = '⚡ Reply Ready';
    const btnStyles = document.createElement('style');
    btnStyles.textContent = `
    .orbit-reply-ready-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 10px 18px;
      background: linear-gradient(135deg, #ff006e 0%, #00d4ff 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(255, 0, 110, 0.3);
      animation: orbit-btn-pulse 2s ease-in-out infinite;
    }
    
    @keyframes orbit-btn-pulse {
      0%, 100% { box-shadow: 0 4px 15px rgba(255, 0, 110, 0.3); }
      50% { box-shadow: 0 4px 25px rgba(255, 0, 110, 0.5), 0 0 40px rgba(0, 212, 255, 0.2); }
    }
    
    .orbit-reply-ready-btn:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 25px rgba(255, 0, 110, 0.5);
    }
    
    .orbit-reply-ready-btn:active {
      transform: translateY(0) scale(0.98);
    }
  `;
    document.head.appendChild(btnStyles);
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        generateAndShowReply(comment);
    });
    comment.appendChild(btn);
}
async function generateAndShowReply(comment) {
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
            showReplyModal(response.reply);
        }
    }
    catch (error) {
        _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.error('Failed to generate reply:', error);
    }
}
function showReplyModal(reply) {
    const existingModal = document.getElementById('orbit-reply-modal');
    if (existingModal)
        existingModal.remove();
    const modal = document.createElement('div');
    modal.id = 'orbit-reply-modal';
    modal.innerHTML = `
    <div class="orbit-modal-backdrop"></div>
    <div class="orbit-modal-content">
      <div class="orbit-modal-header">
        <span class="orbit-modal-icon">⚡</span>
        <span>Reply Ready</span>
        <button class="orbit-modal-close">&times;</button>
      </div>
      <div class="orbit-modal-body">
        <textarea id="orbit-reply-text">${reply}</textarea>
      </div>
      <div class="orbit-modal-footer">
        <button class="orbit-btn-cancel">Cancel</button>
        <button class="orbit-btn-copy">Copy to Clipboard</button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
    #orbit-reply-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    .orbit-modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    
    .orbit-modal-content {
      position: relative;
      width: 90%;
      max-width: 480px;
      background: rgba(20, 22, 30, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      animation: orbit-modal-in 0.3s ease-out;
    }
    
    @keyframes orbit-modal-in {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    .orbit-modal-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px;
      background: linear-gradient(135deg, rgba(255, 0, 110, 0.15) 0%, rgba(0, 212, 255, 0.15) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 15px;
      font-weight: 700;
      color: white;
    }
    
    .orbit-modal-icon {
      font-size: 18px;
    }
    
    .orbit-modal-close {
      margin-left: auto;
      background: none;
      border: none;
      color: #A0AEC0;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    
    .orbit-modal-close:hover {
      color: white;
    }
    
    .orbit-modal-body {
      padding: 20px;
    }
    
    #orbit-reply-text {
      width: 100%;
      min-height: 140px;
      padding: 14px;
      background: rgba(10, 11, 15, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: white;
      font-size: 14px;
      line-height: 1.6;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    }
    
    #orbit-reply-text:focus {
      outline: none;
      border-color: rgba(0, 212, 255, 0.5);
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }
    
    .orbit-modal-footer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .orbit-btn-cancel {
      flex: 1;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #A0AEC0;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .orbit-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .orbit-btn-copy {
      flex: 2;
      padding: 12px 16px;
      background: linear-gradient(135deg, #00f5d4 0%, #7c3aed 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .orbit-btn-copy:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
    }
  `;
    document.head.appendChild(modalStyles);
    modal.querySelector('.orbit-modal-close')?.addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('.orbit-modal-backdrop')?.addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('.orbit-btn-cancel')?.addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('.orbit-btn-copy')?.addEventListener('click', () => {
        const textarea = document.getElementById('orbit-reply-text');
        if (textarea) {
            navigator.clipboard.writeText(textarea.value);
            const btn = modal.querySelector('.orbit-btn-copy');
            if (btn) {
                btn.textContent = '✓ Copied!';
                setTimeout(() => {
                    btn.textContent = 'Copy to Clipboard';
                    modal.remove();
                }, 1500);
            }
        }
    });
}
function observePageChanges() {
    const observer = new MutationObserver(() => {
        setTimeout(scanPageForRisks, 500);
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'refreshUI') {
            scanPageForRisks();
            sendResponse({ success: true });
        }
        return true;
    });
}

})();

/******/ })()
;
//# sourceMappingURL=content.js.map