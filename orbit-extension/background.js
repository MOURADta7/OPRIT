// ORBIT - Background Service Worker (Manifest V3)
// Minimal service worker — all intelligence lives in content.js

console.log('🚀 ORBIT Background Service Worker loaded (v3.0)');

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('✅ ORBIT Extension installed successfully');
    } else if (details.reason === 'update') {
        console.log('✅ ORBIT Extension updated to v3.0');
    }
});
