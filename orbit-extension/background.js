// ORBIT - Background Service Worker (Manifest V3)
// Handles messaging and webhook requests

console.log('🚀 ORBIT Background Service Worker loaded (v3.0)');

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('✅ ORBIT Extension installed successfully');
    } else if (details.reason === 'update') {
        console.log('✅ ORBIT Extension updated to v3.0');
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sendWebhook') {
        handleSendWebhook(request.url, request.payload)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function handleSendWebhook(url, payload) {
    if (!url || !payload) {
        return { success: false, error: 'Missing URL or payload' };
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('ORBIT: Webhook sent successfully');
        return { success: true };
    } catch (error) {
        console.error('ORBIT: Webhook failed:', error);
        return { success: false, error: error.message };
    }
}
