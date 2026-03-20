/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background/background.ts"
/*!**************************************!*\
  !*** ./src/background/background.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_aiRouter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../lib/aiRouter */ "./src/lib/aiRouter.ts");
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/logger */ "./src/utils/logger.ts");
/**
 * Background Service Worker
 * Handles API calls, message passing, and background tasks
 */


// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('ORBIT installed:', details.reason);
    // Set default settings
    chrome.storage.local.set({
        monthlyBudget: 10,
        warningThreshold: 80,
        autoOptimize: true,
        preferredTone: 'friendly',
        installTime: Date.now()
    });
});
// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info('Background received message:', request.action);
    switch (request.action) {
        case 'generateReply':
            handleGenerateReply(request.data).then(sendResponse);
            return true; // Keep channel open for async
        case 'analyzeSales':
            handleAnalyzeSales(request.data).then(sendResponse);
            return true;
        case 'getUsage':
            handleGetUsage().then(sendResponse);
            return true;
        case 'testApiKey':
            handleTestApiKey(request.data).then(sendResponse);
            return true;
        case 'getBudget':
            handleGetBudget().then(sendResponse);
            return true;
        default:
            sendResponse({ success: false, error: 'Unknown action' });
            return false;
    }
});
/**
 * Generate AI reply for a comment
 */
async function handleGenerateReply(data) {
    try {
        const { comment, customerName, context } = data;
        const productContext = await chrome.storage.local.get('orbitProductContext');
        const { productName, shortDescription } = productContext.orbitProductContext || {};
        const productIntro = productName
            ? `Our product is called "${productName}". ${shortDescription || ''}`
            : '';
        const prompt = `Customer comment: "${comment}"

Generate a helpful, professional reply to this customer.`;
        const systemContext = `You are a customer support assistant for a digital product. 
The customer's name is ${customerName || 'there'}.
${productIntro}
${context || ''}

Be friendly, helpful, and concise.`;
        const result = await _lib_aiRouter__WEBPACK_IMPORTED_MODULE_0__.AIRouter.generateReply(prompt, systemContext, {
            taskComplexity: 'medium'
        });
        // Update stats
        const stats = await chrome.storage.local.get(['responsesGenerated', 'timeSaved', 'repliesGenerated', 'timeSavedMinutes']);
        await chrome.storage.local.set({
            responsesGenerated: (stats.responsesGenerated || 0) + 1,
            repliesGenerated: (stats.repliesGenerated || 0) + 1,
            timeSaved: (stats.timeSaved || 0) + 5,
            timeSavedMinutes: (stats.timeSavedMinutes || 0) + 5
        });
        return {
            success: true,
            reply: result.reply,
            cost: result.cost,
            provider: result.provider
        };
    }
    catch (error) {
        _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.error('Generate reply error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate reply'
        };
    }
}
/**
 * Analyze sales data
 */
async function handleAnalyzeSales(data) {
    try {
        if (!data || data.length === 0) {
            return {
                success: false,
                error: 'No sales data provided'
            };
        }
        // Calculate basic metrics
        const totalRevenue = data.reduce((sum, row) => {
            const amount = parseFloat(row.amount?.replace(/[^0-9.]/g, '') || 0);
            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        const totalSales = data.length;
        const context = `Analyze this sales data and provide insights:
Total Revenue: $${totalRevenue}
Total Sales: ${totalSales}
Sample data: ${JSON.stringify(data.slice(0, 5))}`;
        const result = await _lib_aiRouter__WEBPACK_IMPORTED_MODULE_0__.AIRouter.generateReply('Provide a brief analysis of these sales metrics.', context, { taskComplexity: 'low' });
        return {
            success: true,
            analysis: {
                summary: result.reply,
                totalRevenue,
                totalSales,
                avgOrderValue: totalRevenue / totalSales
            }
        };
    }
    catch (error) {
        _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.error('Analyze sales error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get usage statistics
 */
async function handleGetUsage() {
    try {
        const month = new Date().toISOString().slice(0, 7);
        const usage = await chrome.storage.local.get(`usage_${month}`);
        return {
            success: true,
            usage: usage[`usage_${month}`] || {}
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Test API key
 */
async function handleTestApiKey(data) {
    try {
        // Simple test request
        let endpoint;
        let headers;
        switch (data.provider) {
            case 'openai':
                endpoint = 'https://api.openai.com/v1/models';
                headers = { 'Authorization': `Bearer ${data.key}` };
                break;
            case 'claude':
                endpoint = 'https://api.anthropic.com/v1/models';
                headers = {
                    'x-api-key': data.key,
                    'anthropic-version': '2023-06-01'
                };
                break;
            case 'gemini':
                endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
                headers = {};
                endpoint += `?key=${data.key}`;
                break;
            case 'groq':
                endpoint = 'https://api.groq.com/openai/v1/models';
                headers = { 'Authorization': `Bearer ${data.key}` };
                break;
            default:
                return { success: false, error: 'Unknown provider' };
        }
        const response = await fetch(endpoint, { headers });
        return {
            success: response.ok,
            error: response.ok ? undefined : `HTTP ${response.status}`
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
/**
 * Get current budget status
 */
async function handleGetBudget() {
    try {
        const settings = await chrome.storage.local.get(['monthlyBudget', 'warningThreshold']);
        const budget = settings.monthlyBudget || 10;
        const month = new Date().toISOString().slice(0, 7);
        const usageData = await chrome.storage.local.get(`usage_${month}`);
        let totalCost = 0;
        if (usageData[`usage_${month}`]) {
            Object.values(usageData[`usage_${month}`]).forEach((p) => {
                totalCost += p.cost || 0;
            });
        }
        const percentage = (totalCost / budget) * 100;
        let status = 'healthy';
        if (percentage >= 95)
            status = 'critical';
        else if (percentage >= 80)
            status = 'warning';
        return {
            success: true,
            budget: {
                total: budget,
                used: totalCost,
                remaining: budget - totalCost,
                percentage,
                status
            }
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
// Tab change listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if we're on a supported platform
        const supportedDomains = ['appsumo.com', 'gumroad.com', 'lemonsqueezy.com', 'shopify.com'];
        const isSupported = supportedDomains.some(domain => tab.url?.includes(domain));
        if (isSupported) {
            chrome.action.setBadgeText({ text: '●', tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
        }
        else {
            chrome.action.setBadgeText({ text: '', tabId });
        }
    }
});
// Periodic cleanup
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        // Clean up old data (keep last 90 days)
        cleanupOldData();
    }
});
async function cleanupOldData() {
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const allData = await chrome.storage.local.get(null);
    const keysToDelete = [];
    for (const [key, _value] of Object.entries(allData)) {
        // Delete old usage data
        if (key.startsWith('usage_')) {
            const month = key.replace('usage_', '');
            const monthDate = new Date(month + '-01');
            if (monthDate.getTime() < cutoff) {
                keysToDelete.push(key);
            }
        }
    }
    if (keysToDelete.length > 0) {
        await chrome.storage.local.remove(keysToDelete);
        _utils_logger__WEBPACK_IMPORTED_MODULE_1__.logger.info(`Cleaned up ${keysToDelete.length} old data entries`);
    }
}


/***/ },

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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"background": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkorbit_extension"] = self["webpackChunkorbit_extension"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["src_lib_aiRouter_ts"], () => (__webpack_require__("./src/background/background.ts")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=background.js.map