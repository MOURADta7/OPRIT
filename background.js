const DEFAULT_AUTH_STATE = {
  signedIn: false,
  uid: null,
  email: null,
  idToken: null,
  refreshToken: null,
  signInTime: null
};

const DEFAULT_SETTINGS = {
  productName: '',
  productDescription: '',
  orbitAIEnabled: true,
  privacyMode: false,
  webhookEnabled: false,
  webhookUrl: '',
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

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: ''
};

const DEFAULT_BACKEND_CONFIG = {
  geminiApiKey: '', // Managed by ORBIT backend - do not expose to users
  apiEndpoint: 'https://api.orbit-backend.com/v1' // ORBIT managed proxy
};

const DEFAULT_USER_PROFILE = {
  plan: 'free',
  creditsUsed: 0,
  monthlyLimit: 500
};
const REQUEST_WINDOW_MS = 5000;
const MAX_REQUESTS_PER_WINDOW = 3;
const RATE_LIMIT_STATE = {
  requestQueue: [],
  isProcessing: false,
  recentRequestStarts: []
};

chrome.runtime.onInstalled.addListener(() => {
  ensureInitialState();
  hydrateAuthState();
});

chrome.runtime.onStartup.addListener(() => {
  ensureInitialState();
  hydrateAuthState();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const requestType = request?.type || request?.action;

  if (requestType === 'ORBIT_AI_REQUEST' || requestType === 'analyzeWithAI') {
    const payload = requestType === 'ORBIT_AI_REQUEST'
      ? request.payload
      : {
          commentText: request.comment || request.commentText || '',
          productName: request.productName || '',
          productDescription: request.productDescription || '',
          tone: request.tone || 'professional'
        };

    enqueueAiRequest(payload)
      .then(sendResponse)
      .catch(() => sendResponse({ success: false, error: 'API_ERROR' }));
    return true;
  }

  if (requestType === 'getAuthState') {
    handleGetAuthState().then(sendResponse);
    return true;
  }

  if (requestType === 'getStats') {
    handleGetStats().then(sendResponse);
    return true;
  }

  if (requestType === 'sendWebhook') {
    handleSendWebhook(request.url, request.payload)
      .then(sendResponse)
      .catch(() => sendResponse({ success: false, error: 'API_ERROR' }));
    return true;
  }

  if (requestType === 'testApiKey') {
    handleTestApiKey(request.provider, request.key)
      .then(sendResponse)
      .catch(() => sendResponse({ success: false, error: 'API_ERROR' }));
    return true;
  }

  if (requestType === 'ORBIT_AUTH_GOOGLE') {
    handleGoogleSignIn()
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: normalizeAiError(error) }));
    return true;
  }

  return false;
});

async function ensureInitialState() {
  const stored = await chrome.storage.local.get([
    'authState',
    'orbitSettings',
    'orbitCredits',
    'orbitStats',
    'orbitFirebaseConfig',
    'orbitBackendConfig'
  ]);

  await chrome.storage.local.set({
    authState: { ...DEFAULT_AUTH_STATE, ...(stored.authState || {}) },
    orbitSettings: { ...DEFAULT_SETTINGS, ...(stored.orbitSettings || {}) },
    orbitCredits: { ...DEFAULT_CREDITS, ...(stored.orbitCredits || {}) },
    orbitStats: { ...DEFAULT_STATS, ...(stored.orbitStats || {}) },
    orbitFirebaseConfig: { ...DEFAULT_FIREBASE_CONFIG, ...(stored.orbitFirebaseConfig || {}) },
    orbitBackendConfig: { ...DEFAULT_BACKEND_CONFIG, ...(stored.orbitBackendConfig || {}) }
    , orbitUser: { ...DEFAULT_USER_PROFILE, ...(stored.orbitUser || {}) }
  });
}

async function getFirebaseConfig() {
  const stored = await chrome.storage.local.get('orbitFirebaseConfig');
  return { ...DEFAULT_FIREBASE_CONFIG, ...(stored.orbitFirebaseConfig || {}) };
}

async function getBackendConfig() {
  const stored = await chrome.storage.local.get('orbitBackendConfig');
  return { ...DEFAULT_BACKEND_CONFIG, ...(stored.orbitBackendConfig || {}) };
}

function hasFirebaseConfig(config) {
  return Boolean(config.apiKey && config.projectId);
}

async function handleGetAuthState() {
  const authState = await hydrateAuthState();
  return { authState };
}

async function handleGetStats() {
  const result = await chrome.storage.local.get('orbitStats');
  return { success: true, stats: result.orbitStats || DEFAULT_STATS };
}

async function handleSendWebhook(url, payload) {
  if (!url || !payload) {
    return { success: false, error: 'API_ERROR' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return { success: false, error: 'API_ERROR' };
  }

  return { success: true };
}

async function hydrateAuthState() {
  const firebaseConfig = await getFirebaseConfig();
  const stored = await chrome.storage.local.get('authState');
  const authState = { ...DEFAULT_AUTH_STATE, ...(stored.authState || {}) };

  if (!hasFirebaseConfig(firebaseConfig) || !authState.signedIn || !authState.idToken || !authState.uid) {
    const nextState = { ...DEFAULT_AUTH_STATE, email: authState.email || null };
    await chrome.storage.local.set({ authState: nextState });
    return nextState;
  }

  const verified = await verifyFirebaseSession(authState, firebaseConfig);
  await chrome.storage.local.set({ authState: verified });
  return verified;
}

async function verifyFirebaseSession(authState, firebaseConfig) {
  try {
    const lookup = await lookupFirebaseAccount(authState.idToken, firebaseConfig);
    const user = lookup.users?.[0];
    if (!user?.localId) {
      return { ...DEFAULT_AUTH_STATE, email: authState.email || null };
    }

    return {
      ...authState,
      signedIn: true,
      uid: user.localId,
      email: user.email || authState.email || null
    };
  } catch (error) {
    if (!authState.refreshToken) {
      return { ...DEFAULT_AUTH_STATE, email: authState.email || null };
    }

    try {
      const refreshed = await refreshFirebaseToken(authState.refreshToken, firebaseConfig);
      const lookup = await lookupFirebaseAccount(refreshed.idToken, firebaseConfig);
      const user = lookup.users?.[0];
      if (!user?.localId) {
        return { ...DEFAULT_AUTH_STATE, email: authState.email || null };
      }

      return {
        signedIn: true,
        uid: user.localId,
        email: user.email || authState.email || null,
        idToken: refreshed.idToken,
        refreshToken: refreshed.refreshToken,
        signInTime: authState.signInTime || Date.now()
      };
    } catch {
      return { ...DEFAULT_AUTH_STATE, email: authState.email || null };
    }
  }
}

async function lookupFirebaseAccount(idToken, firebaseConfig) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    throw new Error('AUTH_LOOKUP_FAILED');
  }

  return response.json();
}

async function refreshFirebaseToken(refreshToken, firebaseConfig) {
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()
  });

  if (!response.ok) {
    throw new Error('TOKEN_REFRESH_FAILED');
  }

  const data = await response.json();
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token
  };
}

function enqueueAiRequest(payload) {
  return new Promise((resolve) => {
    RATE_LIMIT_STATE.requestQueue.push({ payload, resolve });
    processRequestQueue();
  });
}

async function processRequestQueue() {
  if (RATE_LIMIT_STATE.isProcessing) return;
  RATE_LIMIT_STATE.isProcessing = true;

  while (RATE_LIMIT_STATE.requestQueue.length > 0) {
    const nextItem = RATE_LIMIT_STATE.requestQueue.shift();
    const response = await processAiRequest(nextItem.payload);
    nextItem.resolve(response);
  }

  RATE_LIMIT_STATE.isProcessing = false;
}

async function processAiRequest(payload) {
  try {
    await throttleIfNeeded();
    const authState = await hydrateAuthState();
    const creditContext = await validateCredits(authState);
    const reply = await executeAiPipeline(payload);
    const creditsUsed = await persistCreditUsage(creditContext);
    return { success: true, reply, creditsUsed };
  } catch (error) {
    return { success: false, error: normalizeAiError(error) };
  }
}

async function throttleIfNeeded() {
  const now = Date.now();
  RATE_LIMIT_STATE.recentRequestStarts = RATE_LIMIT_STATE.recentRequestStarts.filter(ts => now - ts < REQUEST_WINDOW_MS);

  if (RATE_LIMIT_STATE.recentRequestStarts.length >= MAX_REQUESTS_PER_WINDOW) {
    const waitMs = REQUEST_WINDOW_MS - (now - RATE_LIMIT_STATE.recentRequestStarts[0]);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    return throttleIfNeeded();
  }

  RATE_LIMIT_STATE.recentRequestStarts.push(Date.now());
}

async function validateCredits(authState) {
  const firebaseConfig = await getFirebaseConfig();

  if (authState.signedIn && hasFirebaseConfig(firebaseConfig)) {
    const userRecord = await fetchFirestoreUser(authState, firebaseConfig);
    if (userRecord.plan === 'pro' || userRecord.plan === 'ltd') {
      if (userRecord.creditsUsed >= userRecord.monthlyLimit) {
        throw new Error('CREDIT_LIMIT');
      }

      return {
        source: 'firestore',
        uid: authState.uid,
        idToken: authState.idToken,
        firebaseConfig,
        userRecord,
        nextCreditsUsed: userRecord.creditsUsed + 1
      };
    }
  }

  const stored = await chrome.storage.local.get('orbitCredits');
  const localCredits = { ...DEFAULT_CREDITS, ...(stored.orbitCredits || {}) };
  if (localCredits.used >= localCredits.freeLimit) {
    throw new Error('CREDIT_LIMIT');
  }

  return {
    source: 'local',
    nextCreditsUsed: localCredits.used + 1,
    localCredits
  };
}

async function fetchFirestoreUser(authState, firebaseConfig) {
  const path = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/(default)/documents/users/${encodeURIComponent(authState.uid)}`;
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${authState.idToken}` }
  });

  if (response.status === 404) {
    return {
      plan: 'free',
      creditsUsed: 0,
      monthlyLimit: DEFAULT_CREDITS.freeLimit,
      lastReset: null
    };
  }

  if (!response.ok) {
    throw new Error('AUTH_REQUIRED');
  }

  const documentData = await response.json();
  return parseFirestoreUser(documentData);
}

function parseFirestoreUser(documentData) {
  const fields = documentData.fields || {};
  return {
    plan: fields.plan?.stringValue || 'free',
    creditsUsed: Number(fields.creditsUsed?.integerValue || 0),
    monthlyLimit: Number(fields.monthlyLimit?.integerValue || DEFAULT_CREDITS.freeLimit),
    lastReset: fields.lastReset?.timestampValue || null
  };
}

async function persistCreditUsage(context) {
  if (context.source === 'firestore') {
    await updateFirestoreUserCredits(context);
    return context.nextCreditsUsed;
  }

  const nextLocalCredits = {
    ...context.localCredits,
    used: context.nextCreditsUsed
  };
  await chrome.storage.local.set({ orbitCredits: nextLocalCredits });
  return context.nextCreditsUsed;
}

async function updateFirestoreUserCredits(context) {
  const path = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(context.firebaseConfig.projectId)}/databases/(default)/documents/users/${encodeURIComponent(context.uid)}?updateMask.fieldPaths=creditsUsed&updateMask.fieldPaths=lastReset`;
  const body = {
    fields: {
      creditsUsed: { integerValue: String(context.nextCreditsUsed) },
      lastReset: { timestampValue: context.userRecord.lastReset || new Date().toISOString() }
    }
  };

  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${context.idToken}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error('AUTH_REQUIRED');
  }
}

async function executeAiPipeline(payload) {
  const requestPayload = normalizeAiPayload(payload);
  
  // MANAGED SAAS MODEL: Send to ORBIT backend proxy
  // The backend uses our managed API keys - client never sees them
  try {
    const reply = await requestManagedBackend(requestPayload);
    if (reply) return reply;
  } catch (e) {
    console.log('ORBIT: Managed backend unavailable, using local fallback');
  }

  // Direct Gemini fallback if a key is configured
  const backendConfig = await getBackendConfig();
  if (backendConfig.geminiApiKey) {
    const systemPrompt = buildSystemPrompt(requestPayload.productName, requestPayload.productDescription);
    const reply = await requestGeminiReply(systemPrompt, requestPayload, backendConfig.geminiApiKey);
    if (reply) {
      return reply;
    }
  }

  // Fallback to local templates if backend + Gemini fail
  return buildFallbackReply(requestPayload);
}

// Managed Backend Proxy - ORBIT servers handle API keys
async function requestManagedBackend(payload) {
  const authState = await hydrateAuthState();
  
  const response = await fetch('https://api.orbit-backend.com/v1/ai/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authState.idToken ? `Bearer ${authState.idToken}` : '',
      'X-ORBIT-Version': '1.0.0'
    },
    body: JSON.stringify({
      commentText: payload.commentText,
      productName: payload.productName,
      productDescription: payload.productDescription,
      tone: payload.tone
    })
  });
  
  if (!response.ok) {
    throw new Error('BACKEND_ERROR');
  }
  
  const data = await response.json();
  return data.reply || null;
}

function normalizeAiPayload(payload) {
  return {
    commentText: String(payload?.commentText || '').trim(),
    productName: String(payload?.productName || '').trim(),
    productDescription: String(payload?.productDescription || '').trim(),
    tone: String(payload?.tone || 'professional').trim() || 'professional'
  };
}

function buildSystemPrompt(productName, productDescription) {
  return `You are ORBIT, the founder's AI assistant.

Product: ${productName || 'Unknown product'}
Description: ${productDescription || 'No description provided'}

Your goals:
- Prevent refunds
- Provide helpful support

Rules:
- Be concise
- Be human
- Never sound like AI
- Max 80 words`;
}

async function requestGeminiReply(systemPrompt, payload, apiKey) {
  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Comment: ${payload.commentText}\nTone: ${payload.tone}\nWrite one reply ready to paste.`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 120
    }
  };

  const execute = async () => {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('API_ERROR');
    }

    const data = await response.json();
    return extractGeminiText(data);
  };

  try {
    return await execute();
  } catch (error) {
    if (!isRetryableNetworkError(error)) {
      throw error;
    }
    return execute();
  }
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map(part => part.text || '').join('\n').trim()
    : '';
  return text;
}

function buildFallbackReply(payload) {
  const tone = payload.tone.toLowerCase();
  if (tone === 'empathetic') {
    return 'I understand your concern, and I appreciate you raising it. We are looking into this now and will help you as quickly as possible.';
  }
  if (tone === 'friendly') {
    return 'Thanks for flagging this. We are checking it now and will help you get this sorted as fast as possible.';
  }
  return 'Thank you for reaching out. We are reviewing this now and will help you resolve it as quickly as possible.';
}

function isRetryableNetworkError(error) {
  return error instanceof TypeError || /network/i.test(error?.message || '');
}

function normalizeAiError(error) {
  const code = error?.message || error;
  if (code === 'CREDIT_LIMIT') return 'CREDIT_LIMIT';
  if (code === 'AUTH_REQUIRED') return 'AUTH_REQUIRED';
  return 'API_ERROR';
}

async function handleTestApiKey(provider, key) {
  if (!key) {
    return { success: false, error: 'API_ERROR' };
  }

  if (provider === 'gemini') {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: { 'x-goog-api-key': key }
    });
    return { success: response.ok, error: response.ok ? null : 'API_ERROR' };
  }
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` }
    });
    return { success: response.ok, error: response.ok ? null : 'API_ERROR' };
  }
  if (provider === 'claude') {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      }
    });
    return { success: response.ok, error: response.ok ? null : 'API_ERROR' };
  }
  if (provider === 'groq') {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` }
    });
    return { success: response.ok, error: response.ok ? null : 'API_ERROR' };
  }

  return { success: false, error: 'API_ERROR' };
}

async function handleGoogleSignIn() {
  const firebaseConfig = await getFirebaseConfig();
  if (!hasFirebaseConfig(firebaseConfig)) {
    throw new Error('AUTH_REQUIRED');
  }

  const accessToken = await new Promise((resolve, reject) => {
    if (!chrome.identity?.getAuthToken) {
      reject(new Error('AUTH_REQUIRED'));
      return;
    }
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error('AUTH_REQUIRED'));
        return;
      }
      resolve(token);
    });
  });

  const requestUri = chrome.identity.getRedirectURL('orbit');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri,
      postBody: `access_token=${encodeURIComponent(accessToken)}&providerId=google.com`,
      returnSecureToken: true,
      returnIdpCredential: false
    })
  });

  if (!response.ok) {
    throw new Error('AUTH_REQUIRED');
  }

  const data = await response.json();
  const authState = {
    signedIn: true,
    uid: data.localId || null,
    email: data.email || null,
    idToken: data.idToken || null,
    refreshToken: data.refreshToken || null,
    signInTime: Date.now()
  };
  await chrome.storage.local.set({ authState });
  return { success: true, authState };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
