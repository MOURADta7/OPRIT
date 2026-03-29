// ORBIT Background Service Worker
// Handles auth state, stats, webhooks, and deterministic AI generation.

const DEFAULT_AUTH_STATE = {
  signedIn: false,
  email: null,
  signInTime: null
};

const DEFAULT_SETTINGS = {
  productName: '',
  productDescription: '',
  orbitAIEnabled: true,
  privacyMode: false,
  webhookEnabled: false,
  webhookUrl: '',
  aiApiKey: '',
  defaultTone: 'professional'
};

const DEFAULT_CREDITS = {
  used: 0,
  freeLimit: 20,
  isPro: false
};

const DEFAULT_STATS = {
  timeSaved: 0,
  timeSavedMinutes: 0,
  risksDetected: 0,
  risksCaught: 0,
  commentsAnalyzed: 0,
  repliesGenerated: 0
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(['authState', 'orbitSettings', 'orbitCredits', 'orbitStats']);
  await chrome.storage.local.set({
    authState: { ...DEFAULT_AUTH_STATE, ...(stored.authState || {}) },
    orbitSettings: { ...DEFAULT_SETTINGS, ...(stored.orbitSettings || {}) },
    orbitCredits: { ...DEFAULT_CREDITS, ...(stored.orbitCredits || {}) },
    orbitStats: { ...DEFAULT_STATS, ...(stored.orbitStats || {}) }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getAuthState') {
    handleGetAuthState().then(sendResponse);
    return true;
  }
  
  if (request.action === 'getStats') {
    handleGetStats().then(sendResponse);
    return true;
  }
  
  if (request.action === 'sendWebhook') {
    handleSendWebhook(request.url, request.payload)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'analyzeWithAI') {
    handleAnalyzeWithAI(request)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'testApiKey') {
    handleTestApiKey(request.provider, request.key)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  return false;
});

// Get auth state
async function handleGetAuthState() {
  const result = await chrome.storage.local.get('authState');
  return { authState: result.authState || DEFAULT_AUTH_STATE };
}

// Get stats
async function handleGetStats() {
  const result = await chrome.storage.local.get('orbitStats');
  return { success: true, stats: result.orbitStats || DEFAULT_STATS };
}

// Send webhook alert
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
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function buildSystemPrompt(productName, productDescription) {
  return `You are ORBIT, the founder's AI assistant.

Product: ${productName || 'Unknown product'}
Description: ${productDescription || 'No description provided'}

Goal:
- Prevent refunds
- Provide expert support

Rules:
- Be concise
- Be human
- Never sound like AI`;
}

async function handleAnalyzeWithAI(request) {
  const stored = await chrome.storage.local.get('orbitSettings');
  const orbitSettings = { ...DEFAULT_SETTINGS, ...(stored.orbitSettings || {}) };
  const apiKey = orbitSettings.aiApiKey || '';

  if (!apiKey) {
    return { success: false, error: 'AI API key is missing in ORBIT settings.' };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 220,
      temperature: 0,
      system: buildSystemPrompt(
        request.productName || orbitSettings.productName,
        request.productDescription || orbitSettings.productDescription
      ),
      messages: [
        {
          role: 'user',
          content: `Customer comment: "${request.comment || ''}"\nCustomer name: ${request.author || 'Customer'}\nWrite one direct reply ready to paste.`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `Anthropic request failed: ${response.status} ${errorText}` };
  }

  const data = await response.json();
  const reply = Array.isArray(data.content)
    ? data.content.map((item) => item.text || '').join('\n').trim()
    : '';

  return reply
    ? { success: true, reply }
    : { success: false, error: 'AI response was empty.' };
}

async function handleTestApiKey(provider, key) {
  if (!key) return { success: false, error: 'Missing API key' };

  let url;
  let options;

  if (provider === 'claude') {
    url = 'https://api.anthropic.com/v1/messages';
    options = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 8,
        temperature: 0,
        messages: [{ role: 'user', content: 'Reply with OK.' }]
      })
    };
  } else if (provider === 'openai') {
    url = 'https://api.openai.com/v1/models';
    options = { method: 'GET', headers: { Authorization: `Bearer ${key}` } };
  } else if (provider === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    options = { method: 'GET' };
  } else if (provider === 'groq') {
    url = 'https://api.groq.com/openai/v1/models';
    options = { method: 'GET', headers: { Authorization: `Bearer ${key}` } };
  } else {
    return { success: false, error: 'Unknown provider' };
  }

  const response = await fetch(url, options);
  return { success: response.ok, error: response.ok ? null : `HTTP ${response.status}` };
}
