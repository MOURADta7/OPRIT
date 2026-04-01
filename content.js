// ============================================================
// ORBIT V9 - Premium SaaS Panel (Early Warning System)
// content.js - Full 5-Layer Panel Implementation
// ============================================================
console.log('[ORBIT] V9 - Premium Panel Loading...');

// SECTION 0: SAFE INITIALIZATION
let isStorageReady = false;
const orbitState = {view:'layer0',tab:'all',selectedIdx:-1,panelOpen:false,activeProduct:'all'};
let orbitComments = [];
if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
  if (typeof chrome === 'undefined') window.chrome = {};
  if (!chrome.storage) chrome.storage = {};
  if (!chrome.storage.local) {
    chrome.storage.local = {
      get(keys, cb) {
        const result = {};
        (Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}))).forEach(k => {
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
  if (!chrome.storage.onChanged) chrome.storage.onChanged = { addListener() {} };
  if (!chrome.runtime) chrome.runtime = { id: 'dev', sendMessage() {}, onMessage: { addListener() {} } };
}
function safeInitialize() {
  try {
    chrome.storage.local.get(['orbitStats','orbitSettings','orbitCredits','orbitFAQs','orbitProducts','orbitCommentFeed'], (r) => {
      try {
        const u = {};
        if (!r.orbitStats) u.orbitStats = { repliesGenerated:0, timeSavedMinutes:0, risksCaught:0, commentsAnalyzed:0 };
        if (!r.orbitSettings) u.orbitSettings = { analyticsTracking:true, emailNotifications:false, privacyMode:false, orbitAIEnabled:true, webhookUrl:'', webhookEnabled:false, productName:'', productDescription:'', defaultTone:'professional' };
        if (!r.orbitCredits) u.orbitCredits = { used:0, freeLimit:20, isPro:false, plan:'free' };
        if (!r.orbitFAQs) u.orbitFAQs = [];
        if (!r.orbitProducts) u.orbitProducts = [];
        if (!r.orbitCommentFeed) u.orbitCommentFeed = [];
        if (Object.keys(u).length > 0) chrome.storage.local.set(u);
        isStorageReady = true;
        onStorageReady();
      } catch(e) { console.warn('ORBIT init error', e); }
    });
  } catch(e) { console.warn('ORBIT storage error', e); }
}
function onStorageReady() { initExtension(); }
safeInitialize();

// THEME SYSTEM
let currentTheme = 'dark';
function initTheme() {
  try {
    chrome.storage.local.get('orbitTheme', (r) => {
      currentTheme = r.orbitTheme || 'dark';
      applyThemeToDOM(currentTheme);
    });
  } catch (e) {
    currentTheme = 'dark';
  }
}
function applyThemeToDOM(theme) {
  document.documentElement?.setAttribute('data-theme', theme);
  const panel = document.getElementById('orbit-panel');
  const widget = document.getElementById('orbit-widget');
  if (panel) panel.setAttribute('data-theme', theme);
  if (widget) widget.setAttribute('data-theme', theme);
  updateBadgeTheme(theme);
}
function updateBadgeTheme(theme) {
  document.querySelectorAll('.orbit-bar-mini').forEach(badge => {
    if (theme === 'light') {
      badge.style.background = 'rgba(255,255,255,0.9)';
      badge.style.borderColor = 'rgba(0,0,0,0.1)';
      badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    } else {
      badge.style.background = 'rgba(0,0,0,0.6)';
      badge.style.borderColor = 'rgba(255,255,255,0.08)';
      badge.style.boxShadow = 'none';
    }
  });
}

// THEME TOGGLE
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyThemeToDOM(currentTheme);
  try {
    chrome.storage.local.set({ orbitTheme: currentTheme });
  } catch(e) {}
  const panel = document.getElementById('orbit-panel');
  if (panel) {
    const toggle = panel.querySelector('#orbit-theme-toggle');
    if (toggle) {
      const moonIcon = toggle.querySelector('.theme-icon-moon');
      const sunIcon = toggle.querySelector('.theme-icon-sun');
      if (currentTheme === 'light') {
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
      } else {
        if (moonIcon) moonIcon.style.display = 'block';
        if (sunIcon) sunIcon.style.display = 'none';
      }
    }
  }
}

// PANEL SIZE PERSISTENCE
function savePanelSize(panel) {
  try {
    const width = panel.offsetWidth;
    chrome.storage.local.set({ orbitPanelWidth: width });
  } catch(e) {}
}

function restorePanelSize(panel) {
  try {
    chrome.storage.local.get('orbitPanelWidth', (r) => {
      if (r.orbitPanelWidth && r.orbitPanelWidth >= 340 && r.orbitPanelWidth <= 680) {
        panel.style.width = r.orbitPanelWidth + 'px';
      }
    });
  } catch(e) {}
}

// Listen for messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'themeChanged') {
      currentTheme = request.theme || 'dark';
      applyThemeToDOM(currentTheme);
      sendResponse({ success: true });
    }
    if (request.action === 'openOrbitPanel') {
      togglePanel();
      sendResponse({ success: true });
    }
    if (request.action === 'openReport') {
      orbitState.view = 'layer2';
      togglePanel();
      renderView();
      sendResponse({ success: true });
    }
    return true;
  });
}

function safeStorageGet(keys, cb) {
  try {
    if (!chrome?.runtime?.id) return;
    chrome.storage.local.get(keys, cb);
  } catch (e) {
    if ((e?.message || '').includes('Extension context invalidated')) return;
    throw e;
  }
}

// SECTION 1: ADAPTER REGISTRY
const ADAPTERS = [
  { id:'appsumo', detect:()=>location.hostname.includes('appsumo.com'),
    sel:{ card:'.comment-card,.comment,[data-testid="comment"],[class*="comment" i],[class*="review" i]', text:'textarea' },
    meta:()=>({ name: document.querySelector('meta[property="og:title"]')?.content || document.querySelector('h1')?.textContent?.trim() || '', desc: document.querySelector('meta[property="og:description"]')?.content || '' })
  },
  { id:'gumroad', detect:()=>location.hostname.includes('gumroad.com'),
    sel:{ card:'.comment,.customer-message,.review-item,[class*="review" i]', text:'textarea' },
    meta:()=>({ name: document.querySelector('h1')?.textContent?.trim()||'', desc: document.querySelector('meta[name="description"]')?.content||'' })
  },
  { id:'lemonsqueezy', detect:()=>location.hostname.includes('lemonsqueezy.com'),
    sel:{ card:'.comment,.review-card,[class*="comment" i],[class*="review" i]', text:'textarea' },
    meta:()=>({ name: document.querySelector('h1')?.textContent?.trim()||'', desc: document.querySelector('meta[name="description"]')?.content||'' })
  },
  { id:'universal', detect:()=>true,
    sel:{ card:'article,.comment,.review,.testimonial,[class*="comment" i]:not(.comment-content):not(.comment-body),[class*="review" i]:not(.review-stars),[class*="feedback" i]', text:'textarea' },
    meta:()=>({ name: document.querySelector('meta[property="og:title"]')?.content || document.title.split('|')[0].trim(), desc: document.querySelector('meta[property="og:description"]')?.content||'' })
  }
];
let activeAdapter = null;
function getAdapter() { if (activeAdapter) return activeAdapter; activeAdapter = ADAPTERS.find(a=>a.detect())||ADAPTERS[3]; return activeAdapter; }
function isSalesPage() { const id=getAdapter()?.id; return id==='appsumo'||id==='gumroad'||id==='lemonsqueezy'; }
function getContainers() {
  const a = getAdapter();
  const root = (a.id==='universal') ? (document.querySelector('main,[role="main"],.main-content,.content,#content,article')||document.body) : document.body;
  return Array.from(root.querySelectorAll(a.sel.card));
}
function getCommentText(el) {
  const p = el.querySelector('.comment-content,.comment-body,p');
  if (p && !p.closest('.orbit-panel') && p.textContent.trim().length > 15) return p.textContent.trim();
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.orbit-bar,.orbit-panel,textarea,button,input,.orbit-bar-mini').forEach(n=>n.remove());
  return clone.textContent.replace(/\s+/g,' ').trim();
}
function getAuthor(el) { const n=el.querySelector('h4,h3,.author-info,.user-name,strong'); return n?n.textContent.trim().split(' ')[0]:'there'; }

// SECTION 2: DETECTION ENGINE
const KW = {
  NEG:['refund','broken','doesnt work',"doesn't work",'not working','disappointed','useless','waste','bug','crash','error','terrible','worst','scam','awful','horrible','hate','frustrated','fails','failed','problem'],
  Q:['how','does it','can i','will it','is there','what is','do you','when will','support','integrate','compatible','pricing','lifetime','does this','is this','any plans','any chance','timeline','roadmap'],
  F:['would love','please add','wish','feature request','suggestion','consider adding','would be great','could you add','hope to see','dark mode','mobile app','integration','zapier','api','export','import','missing feature'],
  P:['love','great','amazing','excellent','perfect','fantastic','works great','highly recommend','best','awesome','thank you','wonderful','brilliant','superb','impressed']
};
function classify(text) {
  if (!text||text.length<3) return {type:'NEUTRAL',score:0};
  const isNonEnglish = /[\u0600-\u06FF]/.test(text) ||
    /\b(je|vous|est|que|bonjour|merci|es|de|para|hola|gracias)\b/i.test(text);
  if (isNonEnglish) return {type:'NON_ENGLISH',score:1};
  const l=text.toLowerCase(), s={NEG:0,Q:0,F:0,P:0};
  KW.NEG.forEach(k=>{if(l.includes(k))s.NEG++;}); KW.Q.forEach(k=>{if(l.includes(k))s.Q++;}); KW.F.forEach(k=>{if(l.includes(k))s.F++;}); KW.P.forEach(k=>{if(l.includes(k))s.P++;});
  const mx=Math.max(...Object.values(s)); if(mx===0) return {type:'NEUTRAL',score:0};
  if(s.P>0&&s.F>0&&s.NEG===0) return {type:'POSITIVE_FEATURE',score:s.P+s.F};
  const map={NEG:'NEGATIVE',Q:'QUESTION',F:'FEATURE',P:'POSITIVE'}, w=Object.entries(s).reduce((a,b)=>b[1]>a[1]?b:a);
  return {type:map[w[0]],score:w[1]};
}
function riskScore(text) { let s=0; const l=text.toLowerCase(); if(l.includes('refund'))s+=40; if(l.includes('cancel'))s+=30; if(l.includes('disappointed'))s+=20; if(l.includes('not working'))s+=25; return Math.min(s,100); }
function extractTopic(t) { const topics=['mobile app','dark mode','notion','zapier','integration','api','onboarding','timeline','pricing','export','import','roadmap','white label','lifetime','support','documentation','webhook','wordpress','shopify','dashboard','analytics','custom domain']; const l=t.toLowerCase(); for(const tp of topics) if(l.includes(tp)) return tp; return null; }
function hashStr(s) { let h=0; for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;} return h.toString(36); }
function esc(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
function fmtTime(m) { if(m<60) return m+'m'; const h=Math.floor(m/60),r=m%60; return r>0?h+'h '+r+'m':h+'h'; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const COLORS = {NEGATIVE:'#ef4444',QUESTION:'#3b82f6',FEATURE:'#8b5cf6',POSITIVE_FEATURE:'#f59e0b',POSITIVE:'#10b981',NEUTRAL:'#4A5568',NON_ENGLISH:'#ec4899',CRITICAL:'#ff006e'};

// SECTION 3: UI SYSTEM
function injectPanelCSS() {
  if (document.getElementById('orbit-panel-css')) return;
  const s = document.createElement('style'); s.id = 'orbit-panel-css';
  s.textContent = `
@keyframes orbitSlideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes orbitFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(0,245,212,0.4),0 0 40px rgba(0,245,212,0.2)}50%{box-shadow:0 0 30px rgba(0,245,212,0.6),0 0 60px rgba(0,245,212,0.3)}}
@keyframes riskPulse{0%,100%{box-shadow:0 0 20px rgba(255,0,110,0.5),0 0 40px rgba(255,0,110,0.3)}50%{box-shadow:0 0 35px rgba(255,0,110,0.7),0 0 70px rgba(255,0,110,0.4)}}
@keyframes riskGlow{from{text-shadow:0 0 15px rgba(255,0,110,0.5),0 0 30px rgba(239,68,68,0.2)}to{text-shadow:0 0 25px rgba(255,0,110,0.7),0 0 50px rgba(239,68,68,0.4)}}
#orbit-widget{position:fixed;bottom:28px;right:28px;z-index:9999999 !important;cursor:pointer;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#00f5d4,#7c3aed) !important;display:flex !important;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(0,245,212,0.3),0 0 0 1px rgba(255,255,255,0.1);transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);font-family:'Inter',system-ui,-apple-system,sans-serif !important}
#orbit-widget:hover{transform:scale(1.1) translateY(-2px);box-shadow:0 12px 40px rgba(0,245,212,0.5),0 0 0 2px rgba(0,245,212,0.3)}
#orbit-widget.risks{animation:riskPulse 2s infinite;background:linear-gradient(135deg,#ff006e,#ef4444) !important}
#orbit-widget .badge{position:absolute;top:-6px;right:-6px;background:#fff;color:#0d0d0d;font-size:11px;font-weight:800;min-width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:99999999 !important}
#orbit-panel{position:fixed;top:0;right:0;width:420px;min-width:340px;max-width:680px;height:100vh;background:rgba(232,245,233,0.98) !important;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-left:1px solid rgba(76,175,80,0.2);z-index:9999998 !important;display:flex !important;flex-direction:column;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;transform:translateX(100%);transition:all 0.5s cubic-bezier(0.16, 1, 0.3, 1);box-shadow:-20px 0 60px rgba(0,0,0,0.15);resize:horizontal;overflow:hidden}
#orbit-panel.visible{transform:translateX(0) !important}
#orbit-panel .op-header,#orbit-panel .op-header .title,#orbit-panel .op-status-title,#orbit-panel .op-action-author,#orbit-panel .op-action-quote,#orbit-panel .op-queue-author,#orbit-panel .op-card p,#orbit-panel .op-banner{color:#1B5E20 !important}
#orbit-panel .op-status-copy,#orbit-panel .op-action-meta,#orbit-panel .op-action-note,#orbit-panel .op-queue-text,#orbit-panel .op-banner .sub,#orbit-panel .op-section-label,#orbit-panel .op-metric .lbl,#orbit-panel .op-lock p,#orbit-panel .op-nav button,#orbit-panel .op-tabs button,#orbit-panel .op-footer,#orbit-panel .op-header .close{color:#4A5568 !important}
#orbit-panel .op-header{padding:18px 24px;background:rgba(255,255,255,0.5);border-bottom:1px solid rgba(76,175,80,0.15);display:flex;align-items:center;justify-content:space-between}
#orbit-panel .op-header::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(76,175,80,0.4),transparent)}
#orbit-panel .op-header .title{display:flex;align-items:center;gap:12px;font-size:16px;font-weight:700;color:#1B5E20 !important}
#orbit-panel .op-header .orbit-status{display:flex;align-items:center;justify-content:center;gap:10px;flex:1;font-size:13px;font-weight:600}
#orbit-panel .op-header .orbit-status .status-icon{font-size:16px}
#orbit-panel .op-header .orbit-status .status-text{color:#2E7D32 !important;text-shadow:none}
#orbit-panel .op-header .orbit-status.alert .status-text{color:#ff006e !important;text-shadow:0 0 20px rgba(255,0,110,0.3)}
#orbit-panel .op-header .live{background:#2E7D32;width:8px;height:8px;border-radius:50%;box-shadow:0 0 12px rgba(46,125,50,0.4)}
#orbit-panel .op-header .close{background:rgba(0,0,0,0.04);border:none;color:#4A5568 !important;font-size:18px;cursor:pointer;padding:8px 12px;border-radius:8px;transition:all 0.2s}
#orbit-panel .op-header .close:hover{background:rgba(0,0,0,0.08);color:#1B5E20 !important}
#orbit-panel .op-nav{display:flex;border-bottom:1px solid rgba(76,175,80,0.15);background:rgba(255,255,255,0.3);padding:0 12px}
#orbit-panel .op-nav button{flex:1;padding:14px 0;background:none;border:none;border-bottom:2px solid transparent;color:#4A5568 !important;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.3s ease;position:relative}
#orbit-panel .op-nav button::after{content:'';position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);width:0;height:2px;background:linear-gradient(90deg,#00f5d4,#7c3aed);transition:width 0.3s ease}
#orbit-panel .op-nav button.active{color:#1B5E20 !important}
#orbit-panel .op-nav button.active::after{width:60%}
#orbit-panel .op-nav button:hover{color:#1B5E20 !important}
#orbit-panel .op-body{flex:1;overflow-y:auto;padding:24px;scrollbar-width:thin;scrollbar-color:rgba(76,175,80,0.3) transparent;background:transparent}
#orbit-panel .op-body::-webkit-scrollbar{width:6px}.#orbit-panel .op-body::-webkit-scrollbar-thumb{background:rgba(76,175,80,0.3);border-radius:3px}
#orbit-panel .op-footer{padding:16px 24px;border-top:1px solid rgba(76,175,80,0.15);background:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#4A5568 !important}
#orbit-panel .op-card{background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(76,175,80,0.15);border-radius:16px;padding:20px;margin-bottom:16px;animation:orbitFade 0.4s ease;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);position:relative;overflow:hidden}
#orbit-panel .op-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(76,175,80,0.2),transparent)}
#orbit-panel .op-card:hover{background:rgba(255,255,255,0.95);border-color:rgba(76,175,80,0.25);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.08)}
#orbit-panel .op-banner{margin:0 0 16px;padding:16px 20px;border-radius:14px;background:linear-gradient(135deg,rgba(0,245,212,0.08) 0%,rgba(139,92,246,0.05) 100%);border:1px solid rgba(0,245,212,0.15);color:#1B5E20 !important;display:flex;align-items:center;gap:14px;font-size:13px;font-weight:500;position:relative;overflow:hidden}
#orbit-panel .op-banner::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:linear-gradient(45deg,transparent,rgba(0,0,0,0.02),transparent);animation:shimmer 3s infinite}
#orbit-panel .op-banner .dot{width:10px;height:10px;border-radius:50%;background:#00f5d4;box-shadow:0 0 12px rgba(0,245,212,0.4)}
#orbit-panel .op-banner .sub{font-size:12px;font-weight:400;color:#4A5568 !important}
#orbit-panel .op-card.urgent{border-left:4px solid #ff006e;background:linear-gradient(135deg,rgba(254,226,226,0.5) 0%,rgba(255,255,255,0.9) 100%)}
#orbit-panel .op-card.question{border-left:4px solid #3b82f6}#orbit-panel .op-card.feature{border-left:4px solid #8b5cf6}#orbit-panel .op-card.positive{border-left:4px solid #10b981}
#orbit-panel .op-badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:rgba(0,245,212,0.1);color:#00c8b2 !important;border:1px solid rgba(0,245,212,0.15)}
#orbit-panel .op-btn{padding:12px 24px;border:none;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);display:inline-flex;align-items:center;gap:10px;position:relative;overflow:hidden}
#orbit-panel .op-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);transition:left 0.5s}
#orbit-panel .op-btn:hover::before{left:100%}
#orbit-panel .op-btn:hover{transform:translateY(-2px)}
#orbit-panel .op-btn.primary{background:linear-gradient(135deg,#00f5d4,#7c3aed);color:#FFFFFF !important;box-shadow:0 8px 24px rgba(0,245,212,0.3)}
#orbit-panel .op-btn.primary:hover{box-shadow:0 12px 32px rgba(0,245,212,0.4)}
#orbit-panel .op-btn.success{background:linear-gradient(135deg,#10b981,#059669);color:#FFFFFF !important;box-shadow:0 8px 24px rgba(16,185,129,0.2)}
#orbit-panel .op-btn.success:hover{box-shadow:0 12px 32px rgba(16,185,129,0.3)}
#orbit-panel .op-btn.danger{background:linear-gradient(135deg,#ff006e,#ef4444);color:#FFFFFF !important;box-shadow:0 8px 24px rgba(255,0,110,0.2)}
#orbit-panel .op-btn.danger:hover{box-shadow:0 12px 32px rgba(255,0,110,0.3)}
#orbit-panel .op-btn.ghost{background:rgba(0,0,0,0.04);color:#1B5E20 !important;border:1px solid rgba(76,175,80,0.15)}
#orbit-panel .op-btn.ghost:hover{background:rgba(0,0,0,0.08);border-color:rgba(76,175,80,0.25)}
#orbit-panel .op-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
#orbit-panel .op-fix-btn{background:linear-gradient(135deg,#ff006e,#ef4444) !important;color:#FFFFFF !important;font-weight:700 !important;padding:14px 28px !important;border-radius:12px !important;box-shadow:0 8px 24px rgba(255,0,110,0.3) !important;animation:pulseGlow 2s infinite}
#orbit-panel .op-fix-btn:hover{box-shadow:0 12px 32px rgba(255,0,110,0.4) !important}
#orbit-panel .op-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.9);border:1px solid rgba(76,175,80,0.15);border-radius:12px;color:#1B5E20 !important;font-size:13px;box-sizing:border-box;outline:none;font-family:inherit;transition:all 0.3s}
#orbit-panel .op-input:focus{border-color:#00f5d4;box-shadow:0 0 0 3px rgba(0,245,212,0.1);background:rgba(255,255,255,1)}
#orbit-panel .op-metric{text-align:center;padding:20px;background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:16px;border:1px solid rgba(76,175,80,0.15)}
#orbit-panel .op-metric .val{font-size:32px;font-weight:800;background:linear-gradient(135deg,#00f5d4,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
#orbit-panel .op-metric .lbl{font-size:11px;color:#4A5568 !important;text-transform:uppercase;margin-top:6px;letter-spacing:1px}
#orbit-panel .op-risk-bar{height:8px;border-radius:4px;background:rgba(0,0,0,0.06);overflow:hidden;margin:8px 0}
#orbit-panel .op-risk-bar .fill{height:100%;border-radius:4px;transition:width 0.5s ease;background:linear-gradient(90deg,#00f5d4,#7c3aed)}
#orbit-panel .op-tabs{display:flex;gap:6px;margin-bottom:16px}
#orbit-panel .op-tabs button{padding:8px 16px;border-radius:20px;border:1px solid rgba(76,175,80,0.15);background:transparent;color:#4A5568 !important;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.3s}
#orbit-panel .op-tabs button.active{background:linear-gradient(135deg,#00f5d4,#7c3aed);color:#FFFFFF !important;border-color:transparent;box-shadow:0 4px 16px rgba(0,245,212,0.2)}
#orbit-panel .op-tabs button:hover:not(.active){border-color:#00f5d4;color:#1B5E20 !important}
#orbit-panel .op-lock{background:linear-gradient(135deg,rgba(139,92,246,0.05) 0%,rgba(255,255,255,0.8) 100%);border:1px dashed rgba(139,92,246,0.2);border-radius:14px;padding:20px;text-align:center;margin:14px 0}
#orbit-panel .op-lock p{color:#4A5568 !important;font-size:12px;margin:6px 0}
#orbit-panel .orbit-bar-mini{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:rgba(255,255,255,0.9);border-radius:8px;border:1px solid rgba(76,175,80,0.15);font-size:11px;font-family:'Inter',system-ui,sans-serif;margin:4px 0;backdrop-filter:blur(10px);box-shadow:0 4px 12px rgba(0,0,0,0.06)}
#orbit-panel .op-status-shell{padding:24px 4px 16px}
#orbit-panel .op-status-kicker{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:12px;background:linear-gradient(90deg,#00f5d4,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
#orbit-panel .op-status-title{font-size:32px;line-height:1.1;font-weight:800;color:#1B5E20 !important;margin:0 0 12px;letter-spacing:-0.02em}
#orbit-panel .op-status-copy{font-size:15px;line-height:1.7;color:#4A5568 !important;max-width:100%}
#orbit-panel .op-status-shell.calm .op-status-kicker{background:linear-gradient(90deg,#00f5d4,#10b981);-webkit-background-clip:text}
#orbit-panel .op-status-shell.alert .op-status-kicker{background:linear-gradient(90deg,#ff006e,#ef4444);-webkit-background-clip:text}
#orbit-panel .op-action-shell{margin-top:12px}
#orbit-panel .op-section-label{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#4A5568 !important;margin:0 0 12px}
#orbit-panel .op-action-card{background:rgba(255,255,255,0.8);border:1px solid rgba(76,175,80,0.15);border-radius:16px;padding:16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 18px 40px rgba(0,0,0,.08)}
#orbit-panel .op-action-card.risk{border-color:rgba(255,0,110,0.2);box-shadow:0 18px 40px rgba(0,0,0,.08),0 0 0 1px rgba(255,0,110,0.08)}
#orbit-panel .op-action-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
#orbit-panel .op-action-author{font-size:18px;font-weight:600;color:#1B5E20 !important;line-height:1.2}
#orbit-panel .op-action-meta{font-size:12px;color:#4A5568 !important;margin-top:4px}
#orbit-panel .op-action-quote{font-size:15px;line-height:1.65;color:#1B5E20 !important;margin:0 0 14px}
#orbit-panel .op-action-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
#orbit-panel .op-action-note{font-size:12px;color:#4A5568 !important}
#orbit-panel .op-risk-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em}
#orbit-panel .op-risk-chip.alert{background:rgba(255,0,110,0.08);color:#ff006e !important;border:1px solid rgba(255,0,110,0.15)}
#orbit-panel .op-risk-chip.safe{background:rgba(0,245,212,0.08);color:#00c8b2 !important;border:1px solid rgba(0,245,212,0.12)}
#orbit-panel .op-fix-btn{padding:11px 18px;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:#FFFFFF !important;background:linear-gradient(135deg,#00f5d4,#14b8a6);box-shadow:0 0 0 rgba(0,245,212,0);transition:all .2s ease}
#orbit-panel .op-fix-btn:hover{transform:translateY(-1px);box-shadow:0 0 20px rgba(0,245,212,0.25)}
#orbit-panel .op-queue{margin-top:12px;border-top:1px solid rgba(76,175,80,0.1);padding-top:12px}
#orbit-panel .op-queue-item{padding:10px 0;border-bottom:1px solid rgba(76,175,80,0.08)}
#orbit-panel .op-queue-item:last-child{border-bottom:none;padding-bottom:0}
#orbit-panel .op-queue-line{display:flex;align-items:center;justify-content:space-between;gap:10px}
#orbit-panel .op-queue-author{font-size:13px;font-weight:600;color:#1B5E20 !important}
#orbit-panel .op-queue-text{font-size:12px;color:#4A5568 !important;line-height:1.5;margin-top:4px}
#orbit-panel .op-product-bar{display:flex;gap:6px;padding:8px 16px;background:rgba(255,255,255,0.5);border-bottom:1px solid rgba(76,175,80,0.1);overflow-x:auto;scrollbar-width:none}
#orbit-panel .op-product-bar::-webkit-scrollbar{display:none}
#orbit-panel .op-product-bar .ptab{padding:5px 12px;border-radius:16px;border:1px solid rgba(76,175,80,0.1);background:transparent;color:#4A5568 !important;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0}
#orbit-panel .op-product-bar .ptab.active{background:rgba(0,245,212,0.1);color:#00c8b2 !important;border-color:rgba(0,245,212,0.2)}
#orbit-panel .op-product-bar .ptab:hover{color:#1B5E20 !important;border-color:rgba(0,245,212,0.15)}
#orbit-panel .op-product-bar .ptab .pcount{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;border-radius:8px;font-size:9px;font-weight:700;margin-left:4px;background:rgba(0,0,0,0.06);color:#4A5568 !important}
#orbit-panel .op-product-bar .ptab.active .pcount{background:rgba(0,245,212,0.2);color:#00c8b2 !important}

/* THEME TOGGLE BUTTON */
.op-theme-toggle{background:rgba(0,0,0,0.04);border:none;color:#4A5568 !important;font-size:16px;cursor:pointer;padding:8px;border-radius:8px;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;margin-right:8px;width:36px;height:36px}
.op-theme-toggle:hover{background:rgba(0,0,0,0.08);color:#1B5E20 !important;transform:rotate(15deg)}

/* THEME TRANSITION */
#orbit-panel,#orbit-panel .op-header,#orbit-panel .op-nav,#orbit-panel .op-body,#orbit-panel .op-footer,#orbit-panel .op-card,#orbit-panel .op-banner,#orbit-panel .op-action-card,#orbit-panel .op-metric,#orbit-panel .op-lock,#orbit-panel .op-product-bar,#orbit-panel .orbit-bar-mini{transition:background 0.4s cubic-bezier(0.4,0,0.2,1),color 0.4s cubic-bezier(0.4,0,0.2,1),border-color 0.4s cubic-bezier(0.4,0,0.2,1),box-shadow 0.4s cubic-bezier(0.4,0,0.2,1) !important}
`;
  document.head.appendChild(s);
}

// 3B: State
let cachedSettings = {orbitAIEnabled:true,productName:'',productDescription:'',privacyMode:false,analyticsTracking:true,webhookUrl:'',webhookEnabled:false,defaultTone:'professional'};
function normalizeProductName(name) {
  return (name || '').trim();
}
function getActiveProduct() {
  if (orbitState.activeProduct && orbitState.activeProduct !== 'all') return orbitState.activeProduct;
  return 'All Products';
}
function getScopedOrbitComments() {
  const activeProduct = getActiveProduct();
  if (activeProduct === 'All Products') return orbitComments;
  return orbitComments.filter(comment => comment.product === activeProduct);
}
function refreshPanelProductLabel() {
  const productLabel = document.getElementById('op-product-name');
  if (!productLabel) return;
  const activeProduct = getActiveProduct();
  const scopedCount = getScopedOrbitComments().length;
  productLabel.textContent = activeProduct + ' • ' + scopedCount + ' comments';
}

async function persistOrbitCommentFeed() {
  if (!isStorageReady) return;
  const stored = await new Promise(resolve => chrome.storage.local.get('orbitCommentFeed', resolve));
  const existingFeed = Array.isArray(stored.orbitCommentFeed) ? stored.orbitCommentFeed : [];
  const feedMap = new Map(existingFeed.map(item => [item.hash, item]));
  orbitComments.forEach((comment, index) => {
    const previous = feedMap.get(comment.hash) || {};
    feedMap.set(comment.hash, {
      id: previous.id || comment.hash,
      hash: comment.hash,
      product: normalizeProductName(comment.product) || 'Untitled Product',
      author: comment.author || 'Customer',
      email: previous.email || '',
      time: previous.time || 'Just now',
      avatar: previous.avatar || ((index % 8) + 1),
      tier: previous.tier || (comment.risk >= 50 ? 1 : comment.type === 'QUESTION' ? 2 : 3),
      content: comment.text,
      type: previous.type || (comment.type === 'NEGATIVE' ? 'issue' : comment.type === 'QUESTION' ? 'question' : comment.type === 'FEATURE' ? 'review' : comment.type === 'POSITIVE' ? 'positive' : 'review'),
      resolved: Boolean(comment.replied),
      flagged: previous.flagged ?? (comment.risk >= 50),
      risk: comment.risk || 0,
      source: getAdapter().id,
      url: location.href,
      updatedAt: Date.now()
    });
  });
  await new Promise(resolve => chrome.storage.local.set({ orbitCommentFeed: Array.from(feedMap.values()) }, resolve));
}

async function saveCurrentProductContext() {
  const nameInput = document.getElementById('op-s-name');
  const descInput = document.getElementById('op-s-desc');
  const emailInput = document.getElementById('op-s-email');
  const adapterMeta = getAdapter().meta();
  const productName = normalizeProductName(nameInput?.value || cachedSettings.productName || adapterMeta.name || document.title);
  const productDescription = (descInput?.value || cachedSettings.productDescription || adapterMeta.desc || '').trim();
  const supportEmail = (emailInput?.value || cachedSettings.supportEmail || '').trim();
  if (!productName) return { ok: false, message: 'Product name required.' };

  const stored = await new Promise(resolve => chrome.storage.local.get(['orbitProducts', 'orbitSettings'], resolve));
  const orbitProducts = Array.isArray(stored.orbitProducts) ? stored.orbitProducts.slice() : [];
  const entry = {
    id: hashStr(productName + location.href),
    name: productName,
    description: productDescription,
    supportEmail,
    url: location.href,
    source: getAdapter().id,
    addedAt: Date.now()
  };
  const existingIndex = orbitProducts.findIndex(product => product.url === entry.url || product.name === entry.name);
  if (existingIndex >= 0) orbitProducts[existingIndex] = { ...orbitProducts[existingIndex], ...entry };
  else orbitProducts.unshift(entry);

  const nextSettings = {
    ...(stored.orbitSettings || cachedSettings),
    productName,
    productDescription,
    supportEmail
  };
  cachedSettings = { ...cachedSettings, ...nextSettings };
  await new Promise(resolve => chrome.storage.local.set({ orbitProducts, orbitSettings: nextSettings }, resolve));
  orbitComments.forEach(comment => {
    comment.product = productName;
  });
  await persistOrbitCommentFeed();
  refreshPanelProductLabel();
  renderProductSwitcher();
  updateWidgetBadge();
  return { ok: true, message: 'Product added to ORBIT.' };
}

// 3C: Widget & Panel
function createWidget() {
  if (document.getElementById('orbit-widget')) return;
  try {
    const w = document.createElement('div'); w.id = 'orbit-widget';
    w.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.5)"/><circle cx="12" cy="12" r="4" fill="#fff"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#fff" stroke-width="1.5" opacity="0.8"/></svg><div class="badge" style="display:none">0</div>';
    w.style.cssText = 'position:fixed !important;bottom:28px !important;right:28px !important;z-index:9999999 !important;cursor:pointer !important;width:52px !important;height:52px !important;border-radius:16px !important;background:linear-gradient(135deg,#00f5d4,#7c3aed) !important;display:flex !important;align-items:center !important;justify-content:center !important;box-shadow:0 8px 32px rgba(6,182,212,0.3),0 0 0 1px rgba(255,255,255,0.1) !important;transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;font-family:"Inter",system-ui,-apple-system,sans-serif !important';
    w.onclick = function() { console.log('[ORBIT] Widget clicked!'); togglePanel(); };
    document.body.appendChild(w);
    console.log('[ORBIT] Floating button created with click handler');
  } catch(e) {
    console.error('[ORBIT] Failed to create widget:', e);
  }
}
function updateWidgetBadge() {
  const w = document.getElementById('orbit-widget');
  const b=document.querySelector('#orbit-widget .badge'); if(!b) return;
  const scopedComments = getScopedOrbitComments();
  const urgent=scopedComments.filter(c=>c.risk>=50).length; // Count of high-risk comments (risks)
  const unread=scopedComments.filter(c=>!c.replied).length; // Count of unreplied comments
  
  // Show urgent risks count in the badge as specified ("2 Risks")
  b.textContent=urgent; 
  b.style.display=urgent>0?'flex':'none'; 
  b.style.background=urgent>0?'#ef4444':'#3b82f6';
  
  if (w) {
    if (urgent > 0) {
      w.classList.add('risks');
      // Add pulse animation for high risk
      w.style.animation = 'riskPulse 2s infinite';
    } else {
      w.classList.remove('risks');
      w.style.animation = '';
    }
  }
  refreshPanelProductLabel();
}

// Add the risk pulse animation if it doesn't exist
if (!document.getElementById('risk-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'risk-pulse-style';
  style.textContent = `
    @keyframes riskPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
    }
  `;
  document.head.appendChild(style);
}
function createPanel() {
  if (document.getElementById('orbit-panel')) return;
  const p = document.createElement('div'); p.id = 'orbit-panel';
  p.style.cssText = 'position:fixed !important;top:0 !important;right:0 !important;width:420px !important;min-width:340px !important;max-width:680px !important;height:100vh !important;background:rgba(232,245,233,0.98) !important;-webkit-backdrop-filter:blur(12px) !important;backdrop-filter:blur(12px) !important;border-left:1px solid rgba(76,175,80,0.2) !important;z-index:9999998 !important;display:flex !important;flex-direction:column !important;font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif !important;box-shadow:-8px 0 40px rgba(0,0,0,0.15) !important;resize:horizontal !important;overflow:hidden !important';
  const banner = isSalesPage()
    ? '<div class="op-banner" id="orbit-banner"><span class="dot"></span><div><div style="font-weight:700">ORBIT Chrome Extension Active</div><div class="sub">AI reply assistant is running. Click "Reply" on any comment to see ORBIT in action.</div></div></div>'
    : '';
  p.innerHTML = '<div class="op-header"><div class="orbit-status" id="orbit-status"><span class="status-icon">✅</span><span class="status-text">Protected</span></div><button class="op-theme-toggle" id="orbit-theme-toggle" title="Toggle theme"><svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button><button class="close" id="orbit-close">x</button></div>' + banner + '<div class="op-nav"><button data-view="layer0" class="active">Dashboard</button><button data-view="layer2">Report</button><button data-view="layer3">Settings</button></div><div class="op-product-bar" id="orbit-product-bar"></div><div class="op-body" id="orbit-body"></div><div class="op-footer"><span>Time: <span id="op-time">0m</span> saved</span><span>Risks: <span id="op-risks">0</span></span><span>Rate: <span id="op-rate">0</span>%</span></div>';
  document.body.appendChild(p);
  refreshPanelProductLabel();
  renderProductSwitcher();
  p.querySelector('#orbit-close').addEventListener('click', togglePanel);
  p.querySelector('.op-nav').addEventListener('click', (e) => {
    const v=e.target.dataset?.view; if(!v) return;
    orbitState.view=v; orbitState.selectedIdx=-1;
    p.querySelectorAll('.op-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
    renderView();
  });
  p.querySelector('#orbit-theme-toggle').addEventListener('click', () => toggleTheme());
  p.addEventListener('mouseup', () => savePanelSize(p));
  p.addEventListener('touchend', () => savePanelSize(p));
  restorePanelSize(p);
  applyThemeToDOM(currentTheme);
}
function renderProductSwitcher() {
  const bar = document.getElementById('orbit-product-bar');
  if (!bar) return;
  safeStorageGet('orbitProducts', (r) => {
    const products = r.orbitProducts || [];
    const active = orbitState.activeProduct || 'all';
    const allCount = orbitComments.length;
    let html = '<button class="ptab' + (active === 'all' ? ' active' : '') + '" data-product="all">All Products<span class="pcount">' + allCount + '</span></button>';
    products.forEach(prod => {
      const count = orbitComments.filter(c => c.product === prod.name).length;
      const isActive = active === prod.name;
      html += '<button class="ptab' + (isActive ? ' active' : '') + '" data-product="' + esc(prod.name) + '">' + esc(prod.name.length > 18 ? prod.name.substring(0, 18) + '...' : prod.name) + '<span class="pcount">' + count + '</span></button>';
    });
    bar.innerHTML = html;
    bar.querySelectorAll('.ptab').forEach(btn => {
      btn.addEventListener('click', () => {
        const prod = btn.dataset.product;
        orbitState.activeProduct = prod === 'all' ? 'all' : prod;
        bar.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.product === prod));
        refreshPanelProductLabel();
        updateWidgetBadge();
        renderView();
      });
    });
  });
}
function togglePanel() { 
  console.log('[ORBIT] Click Detected, Panel State:', orbitState?.panelOpen);
  if (typeof orbitState === 'undefined') {
    console.error('[ORBIT] Error: orbitState is not initialized.');
    return;
  }
  const p=document.getElementById('orbit-panel'); 
  if(!p) {
    console.log('[ORBIT] Panel not found, creating...');
    createPanel();
    return;
  }
  orbitState.panelOpen=!orbitState.panelOpen; 
  console.log('[ORBIT] Toggled Panel State:', orbitState.panelOpen);
  if (orbitState.panelOpen) {
    p.classList.add('visible');
    renderView();
  } else {
    p.classList.remove('visible');
  }
}
function renderView() { const body=document.getElementById('orbit-body'); if(!body) return; renderProductSwitcher(); switch(orbitState.view){case 'layer0':renderLayer0(body);break;case 'layer1':renderLayer1(body);break;case 'layer2':renderLayer2(body);break;case 'layer3':renderLayer3(body);break;case 'layer4':renderLayer4(body);break;} updateFooter(); }

// Layer 0: Dashboard
function renderLayer0(body) {
  const scopedComments = getScopedOrbitComments();
  const pending = scopedComments.filter(c => !c.replied);
  const urgent = pending.filter(c => c.risk >= 50);
  const done = scopedComments.filter(c => c.replied);
  const focus = urgent[0] || pending[0] || null;
  const queue = pending.filter(c => c !== focus).slice(0, 3);

  if (!focus) {
    body.innerHTML = '<div class="op-status-shell calm"><div class="op-status-kicker">ORBIT</div><h2 class="op-status-title">You are safe</h2><p class="op-status-copy">No urgent comments. Everything is calm, controlled, and under watch.</p></div><div style="margin-top:22px;color:#4A5568;font-size:12px">Replies complete: '+done.length+'/'+scopedComments.length+'</div><div style="margin-top:18px"><button class="op-btn ghost" onclick="document.querySelector(\'[data-view=layer2]\').click()">View Weekly Report</button></div>';
    return;
  }

  const focusIndex = orbitComments.indexOf(focus);
  const riskLabel = focus.risk >= 50 ? 'High Risk' : 'Reply Ready';
  const statusTitle = urgent.length > 0 ? 'Action required' : 'Everything is under control';
  const statusCopy = urgent.length > 0
    ? urgent.length + ' customer' + (urgent.length > 1 ? 's may refund' : ' may refund')
    : pending.length + ' comment' + (pending.length > 1 ? 's are waiting for a reply' : ' is waiting for a reply');

  body.innerHTML = '<div class="op-status-shell '+(urgent.length > 0 ? 'alert' : 'calm')+'"><div class="op-status-kicker">'+(urgent.length > 0 ? 'Action Required' : 'ORBIT')+'</div><h2 class="op-status-title">'+statusTitle+'</h2><p class="op-status-copy">'+statusCopy+'</p></div><div class="op-action-shell"><div class="op-section-label">Current Action</div><div class="op-action-card '+(focus.risk >= 50 ? 'risk' : '')+'" id="op-focus-card"><div class="op-action-top"><div><div class="op-action-author">'+esc(focus.author)+'</div><div class="op-action-meta">'+(focus.type === 'NEGATIVE' ? 'Potential refund risk' : focus.type.replace('_',' '))+' • Score '+focus.risk+'/100</div></div><span class="op-risk-chip '+(focus.risk >= 50 ? 'alert' : 'safe')+'">'+riskLabel+'</span></div><p class="op-action-quote">"'+esc(focus.text.substring(0, 180))+(focus.text.length > 180 ? '...' : '')+'"</p><div class="op-action-row"><div><div style="font-size:12px;color:#1B5E20;font-weight:600;margin-bottom:4px">Reply ready</div><div class="op-action-note">'+(focus.risk >= 50 ? 'This is the one comment to fix first.' : 'This comment is waiting for your response.')+'</div></div><button class="op-fix-btn" id="op-fix-now">Fix This Now</button></div>'+(queue.length ? '<div class="op-queue"><div class="op-section-label" style="margin-bottom:8px">Next In Queue</div>'+queue.map(item => '<div class="op-queue-item"><div class="op-queue-line"><span class="op-queue-author">'+esc(item.author)+'</span><span style="font-size:11px;color:'+(item.risk >= 50 ? '#4A5568' : '#4A5568')+'">'+item.risk+'/100</span></div><div class="op-queue-text">'+esc(item.text.substring(0, 88))+(item.text.length > 88 ? '...' : '')+'</div></div>').join('')+'</div>' : '')+'</div></div>'+(pending.length > 1 && pending.filter(c => c.type !== 'NON_ENGLISH').length > 1 ? '<div style="margin-top:14px"><button class="op-btn ghost" id="op-autofill" style="width:100%;justify-content:center">Auto-Fill Remaining '+(pending.length > 1 && pending.filter(c => c.type !== 'NON_ENGLISH').length - 1)+' comments</button></div>' : '');
  
  body.querySelector('#op-fix-now')?.addEventListener('click', () => {
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-focus-card')?.addEventListener('click', (e) => {
    if (e.target.closest('#op-fix-now')) return;
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-autofill')?.addEventListener('click', () => bulkFill());
}

/*  const focusIndex = orbitComments.indexOf(focus);
  const riskLabel = focus.risk >= 50 ? 'High Risk' : 'Reply Ready';
  const statusTitle = urgent.length > 0 ? 'Action required' : 'Everything is under control';
  const statusCopy = urgent.length > 0
    ? urgent.length + ' customer' + (urgent.length > 1 ? 's may refund' : ' may refund')
    : pending.length + ' comment' + (pending.length > 1 ? 's are waiting for a reply' : ' is waiting for a reply');

  body.innerHTML = '<div class="op-status-shell '+(urgent.length > 0 ? 'alert' : 'calm')+'"><div class="op-status-kicker">'+(urgent.length > 0 ? 'Action Required' : 'ORBIT')+'</div><h2 class="op-status-title">'+statusTitle+'</h2><p class="op-status-copy">'+statusCopy+'</p></div><div class="op-action-shell"><div class="op-section-label">Current Action</div><div class="op-action-card '+(focus.risk >= 50 ? 'risk' : '')+'" id="op-focus-card"><div class="op-action-top"><div><div class="op-action-author">'+esc(focus.author)+'</div><div class="op-action-meta">'+(focus.type === 'NEGATIVE' ? 'Potential refund risk' : focus.type.replace('_',' '))+' • Score '+focus.risk+'/100</div></div><span class="op-risk-chip '+(focus.risk >= 50 ? 'alert' : 'safe')+'">'+riskLabel+'</span></div><p class="op-action-quote">"'+esc(focus.text.substring(0, 180))+(focus.text.length > 180 ? '...' : '')+'"</p><div class="op-action-row"><div><div style="font-size:12px;color:#1B5E20;font-weight:600;margin-bottom:4px">Reply ready</div><div class="op-action-note">'+(focus.risk >= 50 ? 'This is the one comment to fix first.' : 'This comment is waiting for your response.')+'</div></div><button class="op-fix-btn" id="op-fix-now">Fix This Now</button></div>'+(queue.length ? '<div class="op-queue"><div class="op-section-label" style="margin-bottom:8px">Next In Queue</div>'+queue.map(item => '<div class="op-queue-item"><div class="op-queue-line"><span class="op-queue-author">'+esc(item.author)+'</span><span style="font-size:11px;color:'+(item.risk >= 50 ? '#4A5568' : '#4A5568')+'">'+item.risk+'/100</span></div><div class="op-queue-text">'+esc(item.text.substring(0, 88))+(item.text.length > 88 ? '...' : '')+'</div></div>').join('')+'</div>' : '')+'</div>'+(pending.length > 1 && pending.filter(c => c.type !== 'NON_ENGLISH').length > 1 ? '<div style="margin-top:14px"><button class="op-btn ghost" id="op-autofill" style="width:100%;justify-content:center">Auto-Fill Remaining '+(pending.length > 1 && pending.filter(c => c.type !== 'NON_ENGLISH').length - 1)+' comments</button></div>' : '');
  
  body.querySelector('#op-fix-now')?.addEventListener('click', () => {
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-focus-card')?.addEventListener('click', (e) => {
    if (e.target.closest('#op-fix-now')) return;
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-autofill')?.addEventListener('click', () => bulkFill());
}

  const focusIndex = orbitComments.indexOf(focus);
  const riskLabel = focus.risk >= 50 ? 'High Risk' : 'Reply Ready';
  const statusTitle = urgent.length > 0 ? 'Action required' : 'Everything is under control';
  const statusCopy = urgent.length > 0
    ? urgent.length + ' customer' + (urgent.length > 1 ? 's may refund' : ' may refund')
    : pending.length + ' comment' + (pending.length > 1 ? 's are waiting for a reply' : ' is waiting for a reply');

  body.innerHTML = '<div class="op-status-shell '+(urgent.length > 0 ? 'alert' : 'calm')+'"><div class="op-status-kicker">'+(urgent.length > 0 ? 'Action Required' : 'ORBIT')+'</div><h2 class="op-status-title">'+statusTitle+'</h2><p class="op-status-copy">'+statusCopy+'</p></div><div class="op-action-shell"><div class="op-section-label">Current Action</div><div class="op-action-card '+(focus.risk >= 50 ? 'risk' : '')+'" id="op-focus-card"><div class="op-action-top"><div><div class="op-action-author">'+esc(focus.author)+'</div><div class="op-action-meta">'+(focus.type === 'NEGATIVE' ? 'Potential refund risk' : focus.type.replace('_',' '))+' • Score '+focus.risk+'/100</div></div><span class="op-risk-chip '+(focus.risk >= 50 ? 'alert' : 'safe')+'">'+riskLabel+'</span></div><p class="op-action-quote">"'+esc(focus.text.substring(0, 180))+(focus.text.length > 180 ? '...' : '')+'"</p><div class="op-action-row"><div><div style="font-size:12px;color:#1B5E20;font-weight:600;margin-bottom:4px">Reply ready</div><div class="op-action-note">'+(focus.risk >= 50 ? 'This is the one comment to fix first.' : 'This comment is waiting for your response.')+'</div></div><button class="op-fix-btn" id="op-fix-now">Fix This Now</button></div>'+(queue.length ? '<div class="op-queue"><div class="op-section-label" style="margin-bottom:8px">Next In Queue</div>'+queue.map(item => '<div class="op-queue-item"><div class="op-queue-line"><span class="op-queue-author">'+esc(item.author)+'</span><span style="font-size:11px;color:'+(item.risk >= 50 ? '#4A5568' : '#4A5568')+'">'+item.risk+'/100</span></div><div class="op-queue-text">'+esc(item.text.substring(0, 88))+(item.text.length > 88 ? '...' : '')+'</div></div>').join('')+'</div>' : '')+'</div></div>'+(pending.length > 1 && pending.filter(c => c.type !== 'NON_ENGLISH').length > 1 ? '<div style="margin-top:14px"><button class="op-btn ghost" id="op-autofill" style="width:100%;justify-content:center">Auto-Fill Remaining '+(pending.length - 1)+'</button></div>' : '');

  body.querySelector('#op-fix-now')?.addEventListener('click', () => {
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-focus-card')?.addEventListener('click', (e) => {
    if (e.target.closest('#op-fix-now')) return;
    orbitState.selectedIdx = focusIndex;
    orbitState.view = 'layer1';
    renderView();
  });
  body.querySelector('#op-autofill')?.addEventListener('click', () => bulkFill());
}

*/
// Layer 1: Comment Detail
function renderLayer1(body) {
  const c=orbitComments[orbitState.selectedIdx]; if(!c){orbitState.view='layer0';renderView();return;}
  const riskBreakdown=[]; const l=c.text.toLowerCase();
  if(l.includes('refund'))riskBreakdown.push({kw:'refund',pts:40}); if(l.includes('cancel'))riskBreakdown.push({kw:'cancel',pts:30}); if(l.includes('disappointed'))riskBreakdown.push({kw:'disappointed',pts:20}); if(l.includes('not working'))riskBreakdown.push({kw:'not working',pts:25});
  body.innerHTML='<div style="margin-bottom:16px"><button class="op-btn ghost" id="op-back" style="padding:4px 10px;font-size:12px">Back</button></div><div class="op-status-shell '+(c.risk >= 50 ? 'alert' : 'calm')+'" style="padding-top:0"><div class="op-status-kicker">'+(c.risk >= 50 ? 'Action Required' : 'Reply Opportunity')+'</div><h2 class="op-status-title" style="font-size:24px;margin-bottom:6px">'+esc(c.author)+'</h2><p class="op-status-copy">'+(c.risk >= 50 ? 'This customer needs immediate attention before the issue escalates.' : 'A clear, calm response is ready for this comment.')+'</p></div>'+(c.risk>0?'<div class="op-card" style="border-left:3px solid '+(c.risk>=50?'#ef4444':'#f59e0b')+'"><div style="font-size:12px;font-weight:700;color:'+(c.risk>=50?'#4A5568':'#4A5568')+';margin-bottom:6px">REFUND RISK SCORE</div><div class="op-risk-bar"><div class="fill" style="width:'+c.risk+'%;background:'+(c.risk>=50?'#ef4444':'#f59e0b')+'"></div></div><div style="font-size:20px;font-weight:800;color:'+(c.risk>=50?'#ef4444':'#f59e0b')+'">'+c.risk+'/100</div>'+riskBreakdown.map(r=>'<span style="color:'+(c.risk>=50?'#4A5568':'#4A5568')+';font-size:11px;margin-right:8px">"'+r.kw+'" +'+r.pts+'</span>').join('')+'</div>':'')+'<div class="op-card"><div style="font-size:11px;color:#4A5568;margin-bottom:6px">COMMENT</div><p style="color:#1B5E20;font-size:14px;margin:0;line-height:1.6">'+esc(c.text)+'</p></div><div class="op-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:11px;color:#4A5568">FREE REPLY</span><div class="op-tabs" style="margin:0" id="op-tone-tabs"><button data-tone="professional" class="'+((cachedSettings.defaultTone||'professional')==='professional'?'active':'')+'">Professional</button><button data-tone="friendly" class="'+(cachedSettings.defaultTone==='friendly'?'active':'')+'">Friendly</button><button data-tone="empathetic" class="'+(cachedSettings.defaultTone==='empathetic'?'active':'')+'">Empathetic</button></div></div><textarea id="op-reply-text" class="op-input" rows="5" style="resize:vertical;font-family:inherit">'+esc(c.replyText||'')+'</textarea><div style="display:flex;gap:6px;margin-top:10px"><button class="op-btn ghost" id="op-regen">Regenerate</button><button class="op-btn primary" id="op-approve" style="flex:1;justify-content:center">Fix This Now</button></div></div><div class="op-lock"><div style="font-size:13px;font-weight:700;color:#a78bfa">AI REPLY - Pro Only</div><p>Context-aware reply using your product knowledge base</p><button class="op-btn ghost" id="op-unlock" style="margin-top:8px">Unlock AI Reply</button></div><div style="display:flex;gap:8px;margin-top:12px;justify-content:center"><span style="color:#4A5568;font-size:12px">Good reply?</span><button class="op-btn ghost" id="op-fb-yes" style="padding:4px 10px;font-size:11px">Yes</button><button class="op-btn ghost" id="op-fb-no" style="padding:4px 10px;font-size:11px">No</button></div>';
  body.querySelector('#op-back').addEventListener('click',()=>{orbitState.view='layer0';renderView();});
  body.querySelector('#op-unlock')?.addEventListener('click',()=>{orbitState.view='layer4';renderView();});
  if(!c.replyText) generateFreeReply(c).then(r=>{c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta) ta.value=r;});
  body.querySelector('#op-tone-tabs')?.addEventListener('click',e=>{const tone=e.target.dataset?.tone;if(!tone)return;cachedSettings.defaultTone=tone;body.querySelectorAll('#op-tone-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tone===tone));generateFreeReply(c,tone).then(r=>{c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta) ta.value=r;});});
  body.querySelector('#op-regen')?.addEventListener('click',async()=>{const btn=body.querySelector('#op-regen');btn.textContent='...';btn.disabled=true;const r=await generateFreeReply(c,cachedSettings.defaultTone);c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta)ta.value=r;btn.textContent='Regenerate';btn.disabled=false;});
  body.querySelector('#op-approve')?.addEventListener('click',async()=>{const ta=document.getElementById('op-reply-text');const reply=ta?.value||c.replyText;if(!reply)return;if(c.element){const field=c.element.querySelector(getAdapter().sel.text);if(field)setTextareaValue(field,reply);}c.replied=true;c.replyText=reply;await incrementReplyStats(c.hash);await persistOrbitCommentFeed();orbitState.view='layer0';renderView();updateWidgetBadge();});
  body.querySelector('#op-fb-yes')?.addEventListener('click',function(){this.parentElement.innerHTML='<span style="color:#10b981;font-size:12px">Thanks!</span>';});
  body.querySelector('#op-fb-no')?.addEventListener('click',async function(){const reason=prompt('Why? (Wrong Tone, Hallucination, Missed Context, Other)');if(reason){await saveFailure(c.text,c.replyText,reason);this.parentElement.innerHTML='<span style="color:#f59e0b;font-size:12px">Feedback saved</span>';}});
}


// SECTION 3 cont: Layers 2-4
function renderLayer2(body) {
  // Get high-risk comments for the report
  const scopedComments = getScopedOrbitComments();
  const highRiskComments = scopedComments.filter(c => c.risk >= 50);
  const refundRiskComments = highRiskComments.filter(c => c.text.toLowerCase().includes('refund'));
  
  // Find the "Angry Customer" comment (highest risk negative comment)
  const angryCustomerComment = scopedComments
    .filter(c => c.type === 'NEGATIVE' && c.risk >= 70)
    .sort((a, b) => b.risk - a.risk)[0] || null;
  
  chrome.storage.local.get(['orbitStats','orbitFAQs'],(r)=>{
    const st=r.orbitStats||{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0};
    const faqs=r.orbitFAQs||[];
    const rate=st.commentsAnalyzed>0?Math.round((st.repliesGenerated/st.commentsAnalyzed)*100):0;
    
    // Calculate refund risk score (using the highest refund-related risk or default to 90 as specified)
    const refundRiskScore = refundRiskComments.length > 0 
      ? Math.max(...refundRiskComments.map(c => c.risk)) 
      : 90; // Default to 90/100 as specified in requirements
    
    body.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 14px; color: #4A5568; margin-bottom: 8px">Refund Risk Score</div>
        <div style="font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #ef4444, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          ${refundRiskScore}/100
        </div>
        <div style="margin-top: 12px; padding: 0 16px;">
          ${refundRiskScore >= 90 
            ? '<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px;"><div style="color: #ff006e; font-weight: 600;">Action Required</div><div style="color: #4A5568; font-size: 13px; margin-top: 4px;">High probability of refund requests detected</div></div>'
            : '<div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 12px;"><div style="color: #10b981; font-weight: 600;">Low Risk</div><div style="color: #4A5568; font-size: 13px; margin-top: 4px;">Minimal refund risk detected</div></div>'
          }
        </div>
      </div>
      
      ${angryCustomerComment 
        ? `<div class="op-card" style="border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #1B5E20;">Angry Customer</div>
                <div style="font-size: 11px; color: #4A5568; margin-top: 2px;">${angryCustomerComment.product || 'Product'}</div>
              </div>
              <div style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px;">
                ${angryCustomerComment.risk}/100 Risk
              </div>
            </div>
            <p style="color: #1B5E20; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
              "${angryCustomerComment.text.length > 200 ? angryCustomerComment.text.substring(0, 200) + '...' : angryCustomerComment.text}"
            </p>
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <span style="background: rgba(239, 68, 68, 0.1); color: #4A5568; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                Refund Risk
              </span>
              <span style="background: rgba(239, 68, 68, 0.1); color: #4A5568; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                Negative Sentiment
              </span>
              <button class="op-btn ghost" style="font-size: 12px; padding: 6px 12px;" onclick="orbitState.selectedIdx = orbitComments.findIndex(c => c.hash === '${angryCustomerComment.hash}'); orbitState.view = 'layer1'; renderView();">
                Analyze
              </button>
            </div>
          </div>`
        : ''
      }
      
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button class="op-btn ghost" id="op-export-faq" style="flex: 1;">Export FAQ Page</button>
        <button class="op-btn ghost" id="op-share" style="flex: 1;">Share Report</button>
      </div>
    `;
    
    body.querySelector('#op-export-faq')?.addEventListener('click', () => exportFAQPage(faqs));
    body.querySelector('#op-share')?.addEventListener('click', () => shareReport(st));
  });
}
function renderLayer3(body) {
  chrome.storage.local.get(['orbitSettings','orbitCredits','orbitProducts','orbitCommentFeed'],(r)=>{
    const s=r.orbitSettings||cachedSettings, cr=r.orbitCredits||{used:0,freeLimit:20,isPro:false,plan:'free'};
    const savedProducts=r.orbitProducts||[];
    const commentFeed=r.orbitCommentFeed||[];
    const detectedMeta=getAdapter().meta();
    const adapterInfo=getAdapter();
    const previewName=detectedMeta.name||s.productName||'Unknown Product';
    const previewDesc=(detectedMeta.desc||s.productDescription||'Product details will be imported from this page.').substring(0,160);
    const currentComments=orbitComments.length;
    const currentRisks=orbitComments.filter(c=>c.risk>=50).length;
    const currentReplied=orbitComments.filter(c=>c.replied).length;
    const isAlreadySaved=savedProducts.some(p=>p.url===location.href||p.name===previewName);
    const platformColors={appsumo:'#4f46e5',gumroad:'#f472b6',lemonsqueezy:'#fbbf24',universal:'#4A5568'};
    const platformColor=platformColors[adapterInfo.id]||'#4A5568';

    // --- PRODUCT CONTEXT CARD ---
    let html='<h3 style="color:#fff;margin:0 0 16px;font-size:16px">Settings</h3>';
    html+='<div class="op-card" style="border:1px solid '+(isAlreadySaved?'rgba(45,212,191,.2)':'rgba(124,58,237,.15)')+';overflow:hidden">';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:#4A5568;letter-spacing:.1em">PRODUCT CONTEXT</div><span style="padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.05em;background:'+platformColor+';color:#fff;text-transform:uppercase">'+esc(adapterInfo.id)+'</span></div>';
    html+='<div style="padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.06);margin-bottom:14px">';
    html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,'+platformColor+',rgba(124,58,237,.6));display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4M4 7l8 4M4 7v10l8 4m0-10v10"/></svg></div><div style="min-width:0"><div style="color:#1B5E20;font-size:15px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(previewName)+'</div><div style="color:#00f5d4;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">'+esc(location.hostname)+'</div></div></div>';
    html+='<div style="color:#8b92a8;font-size:12px;line-height:1.65;margin-bottom:10px">'+esc(previewDesc)+'</div>';
    html+='<div style="display:flex;gap:8px"><div style="flex:1;text-align:center;padding:8px 4px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid rgba(255,255,255,.04)"><div style="font-size:16px;font-weight:800;color:#a78bfa">'+currentComments+'</div><div style="font-size:9px;color:#4A5568;text-transform:uppercase;letter-spacing:.08em;margin-top:2px">Comments</div></div><div style="flex:1;text-align:center;padding:8px 4px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid rgba(255,255,255,.04)"><div style="font-size:16px;font-weight:800;color:'+(currentRisks>0?'#ef4444':'#10b981')+'">'+currentRisks+'</div><div style="font-size:9px;color:#4A5568;text-transform:uppercase;letter-spacing:.08em;margin-top:2px">Risks</div></div><div style="flex:1;text-align:center;padding:8px 4px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid rgba(255,255,255,.04)"><div style="font-size:16px;font-weight:800;color:#10b981">'+currentReplied+'</div><div style="font-size:9px;color:#4A5568;text-transform:uppercase;letter-spacing:.08em;margin-top:2px">Replied</div></div></div></div>';
    html+='<button class="op-btn primary" id="op-save-current-product" style="width:100%;justify-content:center;padding:12px;font-size:14px;border-radius:12px">'+(isAlreadySaved?'Update Product':'Add This Product')+'</button>';
    html+='<div id="op-product-status" style="margin-top:8px;color:#4A5568;font-size:11px;text-align:center">'+(isAlreadySaved?'This product is already saved. Click to update its data.':'Saves product name, description, URL, and '+currentComments+' comments to All Products.')+'</div></div>';

    // --- SAVED PRODUCTS LIST ---
    html+='<div class="op-card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:#4A5568;letter-spacing:.1em">SAVED PRODUCTS</div><span style="color:#4A5568;font-size:11px">'+savedProducts.length+' product'+(savedProducts.length!==1?'s':'')+'</span></div>';
    if(savedProducts.length===0){
      html+='<div style="text-align:center;padding:20px 10px"><div style="color:#4b5563;font-size:12px;line-height:1.6">No products saved yet.<br>Visit a product page and click Add This Product.</div></div>';
    } else {
      savedProducts.forEach((prod,idx)=>{
        const prodComments=commentFeed.filter(c=>c.product===prod.name);
        const prodRisks=prodComments.filter(c=>c.flagged||c.risk>=50).length;
        const prodReplied=prodComments.filter(c=>c.resolved).length;
        const pendingCount=prodComments.length-prodReplied;
        const pColor=platformColors[prod.source]||'#4A5568';
        html+='<div style="padding:12px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:8px;transition:all .2s" class="op-saved-product" data-idx="'+idx+'">';
        html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">';
        html+='<div style="display:flex;align-items:center;gap:8px;min-width:0"><div style="width:8px;height:8px;border-radius:50%;background:'+pColor+';flex-shrink:0"></div><div style="color:#1B5E20;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(prod.name.length>24?prod.name.substring(0,24)+'...':prod.name)+'</div></div>';
        html+='<button class="op-remove-product" data-idx="'+idx+'" style="background:none;border:none;color:#4b5563;font-size:16px;cursor:pointer;padding:0 4px;transition:color .2s" title="Remove product">x</button></div>';
        html+='<div style="display:flex;gap:12px;margin-top:4px"><span style="font-size:10px;color:#4A5568">'+prodComments.length+' comments</span><span style="font-size:10px;color:'+(prodRisks>0?'#4A5568':'#4A5568')+'">'+prodRisks+' risk'+(prodRisks!==1?'s':'')+'</span><span style="font-size:10px;color:'+(pendingCount>0?'#4A5568':'#4A5568')+'">'+pendingCount+' pending</span><span style="font-size:10px;color:#00f5d4">'+prodReplied+' replied</span></div>';
        if(prod.url){html+='<div style="font-size:10px;color:#4b5563;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(prod.url)+'</div>';}
        html+='</div>';
      });
    }
    html+='</div>';

    // --- ALERTS ---
    html+='<div class="op-card"><div style="font-size:12px;font-weight:700;color:#4A5568;margin-bottom:10px;letter-spacing:.1em">ALERTS - Free</div><label style="display:flex;justify-content:space-between;align-items:center;color:#4A5568;font-size:13px;margin-bottom:10px"><span>Email on Refund Risk</span><input type="checkbox" id="op-s-email-notif" '+(s.emailNotifications?'checked':'')+' style="accent-color:#7c3aed"></label><label style="display:flex;justify-content:space-between;align-items:center;color:#4A5568;font-size:13px"><span>Slack Webhook</span><input type="checkbox" id="op-s-webhook" '+(s.webhookEnabled?'checked':'')+' style="accent-color:#7c3aed"></label><input class="op-input" id="op-s-webhook-url" placeholder="Webhook URL" value="'+esc(s.webhookUrl||'')+'" style="margin-top:8px;display:'+(s.webhookEnabled?'block':'none')+'"></div>';

    // --- REPLY STYLE ---
    html+='<div class="op-card"><div style="font-size:12px;font-weight:700;color:#4A5568;margin-bottom:10px;letter-spacing:.1em">REPLY STYLE - Free</div><div style="display:flex;gap:6px;margin-bottom:10px">'+['professional','friendly','empathetic'].map(t=>'<button class="op-btn '+((s.defaultTone||'professional')===t?'primary':'ghost')+'" data-tone="'+t+'" style="flex:1;font-size:11px;padding:6px">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>').join('')+'</div><div style="display:flex;align-items:center;gap:8px"><span style="color:#4A5568;font-size:12px">Signature:</span><span style="color:#4A5568;font-size:12px">Powered by ORBIT</span></div></div>';

    // --- PRIVACY ---
    html+='<div class="op-card"><div style="font-size:12px;font-weight:700;color:#4A5568;margin-bottom:10px;letter-spacing:.1em">PRIVACY - Free</div><label style="display:flex;justify-content:space-between;align-items:center;color:#4A5568;font-size:13px;margin-bottom:10px"><span>Privacy Mode</span><input type="checkbox" id="op-s-privacy" '+(s.privacyMode?'checked':'')+' style="accent-color:#7c3aed"></label><button class="op-btn danger" id="op-s-clear" style="width:100%;font-size:12px">Clear All Data</button></div>';

    // --- PRO FEATURES ---
    html+='<div class="op-card"><div style="font-size:12px;font-weight:700;color:#4A5568;margin-bottom:10px;letter-spacing:.1em">PRO FEATURES</div>'+['AI Replies (multilingual)','Smart Context (product-aware)','Brand Voice (your style)','Auto-Post without confirm'].map(f=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#4A5568;font-size:13px">Locked: '+f+'</span><button class="op-btn ghost" style="padding:3px 8px;font-size:11px" onclick="orbitState.view=\'layer4\';renderView()">Upgrade</button></div>').join('')+'</div>';

    // --- PLAN ---
    html+='<div class="op-card" style="text-align:center"><div style="color:#4A5568;font-size:12px;margin-bottom:8px">'+cr.plan+' Plan - '+cr.used+'/'+cr.freeLimit+' AI credits used</div><button class="op-btn primary" style="width:100%" onclick="orbitState.view=\'layer4\';renderView()">Upgrade to Pro - $19/mo</button></div>';

    body.innerHTML=html;

    // --- EVENT LISTENERS ---
    const save=()=>{const ns={...s,productName:cachedSettings.productName||s.productName||'',supportEmail:cachedSettings.supportEmail||s.supportEmail||'',productDescription:cachedSettings.productDescription||s.productDescription||'',emailNotifications:document.getElementById('op-s-email-notif')?.checked||false,webhookEnabled:document.getElementById('op-s-webhook')?.checked||false,webhookUrl:document.getElementById('op-s-webhook-url')?.value||'',privacyMode:document.getElementById('op-s-privacy')?.checked||false,defaultTone:cachedSettings.defaultTone};chrome.storage.local.set({orbitSettings:ns});cachedSettings={...cachedSettings,...ns};refreshPanelProductLabel();};
    body.querySelectorAll('input').forEach(el=>el.addEventListener('change',save));
    body.querySelector('#op-s-webhook')?.addEventListener('change',(e)=>{const u=document.getElementById('op-s-webhook-url');if(u)u.style.display=e.target.checked?'block':'none';save();});
    body.querySelectorAll('[data-tone]').forEach(b=>b.addEventListener('click',(e)=>{cachedSettings.defaultTone=e.target.dataset.tone;body.querySelectorAll('[data-tone]').forEach(x=>x.className='op-btn '+(x.dataset.tone===cachedSettings.defaultTone?'primary':'ghost'));save();}));

    // Add This Product button
    body.querySelector('#op-save-current-product')?.addEventListener('click',async function(){
      const btn=this;
      const status=document.getElementById('op-product-status');
      btn.disabled=true;btn.textContent='Saving...';
      save();
      const result=await saveCurrentProductContext();
      if(result.ok){
        btn.textContent='Saved';btn.style.background='#10b981';
        if(status){status.textContent=result.message + ' ('+currentComments+' comments, '+currentRisks+' risks)';status.style.color='#00f5d4';}
        setTimeout(()=>renderLayer3(body),1500);
      } else {
        btn.textContent='Error';btn.style.background='#ef4444';
        if(status){status.textContent=result.message;status.style.color='#4A5568';}
        setTimeout(()=>{btn.disabled=false;btn.textContent=isAlreadySaved?'Update Product':'Add This Product';btn.style.background='';},2000);
      }
    });

    // Remove product buttons
    body.querySelectorAll('.op-remove-product').forEach(btn=>{
      btn.addEventListener('click',async function(e){
        e.stopPropagation();
        const idx=parseInt(this.dataset.idx);
        if(!confirm('Remove "'+savedProducts[idx]?.name+'" from All Products?'))return;
        const updated=[...savedProducts];
        const removedName=updated[idx]?.name;
        updated.splice(idx,1);
        const updatedFeed=commentFeed.filter(c=>c.product!==removedName);
        await new Promise(res=>chrome.storage.local.set({orbitProducts:updated,orbitCommentFeed:updatedFeed},res));
        renderProductSwitcher();
        renderLayer3(body);
      });
      btn.addEventListener('mouseenter',function(){this.style.color='#ef4444';});
      btn.addEventListener('mouseleave',function(){this.style.color='#4b5563';});
    });

    // Saved product click to switch
    body.querySelectorAll('.op-saved-product').forEach(el=>{
      el.addEventListener('click',function(e){
        if(e.target.closest('.op-remove-product'))return;
        const idx=parseInt(this.dataset.idx);
        const prod=savedProducts[idx];
        if(!prod)return;
        orbitState.activeProduct=prod.name;
        renderProductSwitcher();
        refreshPanelProductLabel();
        updateWidgetBadge();
        orbitState.view='layer0';
        const navBtns=document.querySelectorAll('.op-nav button');
        navBtns.forEach(b=>b.classList.toggle('active',b.dataset.view==='layer0'));
        renderView();
      });
      el.style.cursor='pointer';
      el.addEventListener('mouseenter',function(){this.style.borderColor='rgba(124,58,237,.2)';});
      el.addEventListener('mouseleave',function(){this.style.borderColor='rgba(255,255,255,.05)';});
    });

    body.querySelector('#op-s-clear')?.addEventListener('click',()=>{if(confirm('Clear all ORBIT data?')){chrome.storage.local.set({orbitStats:{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0},orbitFAQs:[],orbitScannedHashes:[],orbitRepliedHashes:[],orbitProducts:[],orbitCommentFeed:[]});renderLayer3(body);}});
  });
}
function renderLayer4(body) {
  chrome.storage.local.get('orbitCredits',(r)=>{
    const cr=r.orbitCredits||{used:0,freeLimit:20,isPro:false};
    const scopedComments = getScopedOrbitComments();
    const missed=scopedComments.filter(c=>c.type==='NON_ENGLISH').length, manual=scopedComments.filter(c=>c.replied).length;
    body.innerHTML='<div style="text-align:center;padding:20px 0"><h2 style="color:#fff;margin:0 0 6px;font-size:20px">ORBIT Pro</h2><p style="color:#4A5568;font-size:13px;margin:0 0 20px">What you missed this week:</p></div>'+(missed>0?'<div class="op-card" style="border-left:3px solid #ec4899"><span style="color:#ec4899;font-size:13px">'+missed+' non-English comment'+(missed>1?'s':'')+' waiting without reply</span></div>':'')+(manual>0?'<div class="op-card" style="border-left:3px solid #3b82f6"><span style="color:#4A5568;font-size:13px">'+manual+' replies sent manually - could have been automated</span></div>':'')+'<div class="op-card"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="border-bottom:1px solid rgba(255,255,255,.06)"><td style="padding:8px 0;color:#4A5568"></td><td style="padding:8px 0;color:#4A5568;font-weight:600">Free</td><td style="padding:8px 0;color:#a78bfa;font-weight:600">Pro</td></tr>'+[['Replies','Templates','AI writes your voice'],['Languages','English','All languages'],['Mode','Suggest','Auto-post'],['Report','Basic','Deep insights']].map(([label,free,pro])=>'<tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:8px 0;color:#4A5568;font-size:12px">'+label+'</td><td style="padding:8px 0;color:#4A5568">'+free+'</td><td style="padding:8px 0;color:#4A5568">'+pro+'</td></tr>').join('')+'</table></div><div style="display:flex;flex-direction:column;gap:8px;margin-top:16px"><button class="op-btn primary" style="width:100%;padding:14px;font-size:15px" id="op-buy-pro">$19/month - 500 AI replies</button><button class="op-btn ghost" style="width:100%;padding:12px" id="op-buy-ltd">$59 once - 200 AI replies/month (LTD)</button></div><p style="text-align:center;color:#4A5568;font-size:11px;margin-top:12px">Pays for itself in the first launch week</p><div style="text-align:center;margin-top:16px"><button class="op-btn ghost" onclick="orbitState.view=\'layer0\';renderView()">Back to Dashboard</button></div>';
    body.querySelector('#op-buy-pro')?.addEventListener('click',()=>alert('Pro purchase flow coming soon! Connect LemonSqueezy to activate.'));
    body.querySelector('#op-buy-ltd')?.addEventListener('click',()=>alert('LTD purchase flow coming soon! One-time payment via LemonSqueezy.'));
  });
}

// SECTION 4-5: Credits, AI, Helpers
async function getCredits(){return new Promise(r=>chrome.storage.local.get('orbitCredits',res=>r(res.orbitCredits||{used:0,freeLimit:20,isPro:false})));}
async function canUseAI(){const c=await getCredits();return c.used<c.freeLimit||c.isPro;}
async function consumeCredit(){const c=await getCredits();c.used+=1;return new Promise(r=>chrome.storage.local.set({orbitCredits:c},()=>r(c)));}
async function getSettings(){return new Promise(r=>chrome.storage.local.get('orbitSettings',res=>r(res.orbitSettings||cachedSettings)));}
async function generateFreeReply(c,tone){
  tone=tone||cachedSettings.defaultTone||'professional';const n=c.author||'there';const topic=extractTopic(c.text);const tp=topic?' regarding '+topic:'';
  const tones={professional:{NEGATIVE:'Hi '+n+', I sincerely apologize for the experience. Could you please email us the specific details so our team can investigate and resolve this for you immediately?',QUESTION:'Hi '+n+', great question'+tp+'! Could you share more about your specific use case so I can give you the most accurate answer?',FEATURE:'Hi '+n+', excellent suggestion'+tp+'! I have noted this and added it to our priority roadmap. Thanks for helping us improve!',POSITIVE_FEATURE:'Hi '+n+', thrilled you love the product! Your suggestion'+tp+' is already on our roadmap. Stay tuned!',POSITIVE:'Hi '+n+', thank you so much for the wonderful feedback! It truly means the world to our team.',NEUTRAL:'Hi '+n+', thanks for reaching out! Let us know if there is anything specific we can help with.'},friendly:{NEGATIVE:'Hey '+n+'! I am really sorry about this - that is not the experience we want for you. Can you shoot us an email with the details? We will get this sorted ASAP!',QUESTION:'Hey '+n+'! Great question'+tp+'! Tell me a bit more about how you are using it and I will get you the best answer.',FEATURE:'Hey '+n+'! Love this idea'+tp+'! Added it to our list - we are always looking for ways to make things better!',POSITIVE_FEATURE:'Hey '+n+'! So glad you are loving it! That suggestion'+tp+' is totally on our radar. Exciting things coming!',POSITIVE:'Hey '+n+'! You just made our day! Thank you so much for the kind words!',NEUTRAL:'Hey '+n+'! Thanks for dropping by! Let me know if there is anything I can help with.'},empathetic:{NEGATIVE:'Hi '+n+', I completely understand your frustration and I am truly sorry. Your experience matters to us. Please reach out directly so we can make this right.',QUESTION:'Hi '+n+', I appreciate you taking the time to ask'+tp+'. Let me look into this carefully for you. Could you share a few more details?',FEATURE:'Hi '+n+', I hear you and this is a thoughtful suggestion'+tp+'. We value feedback like this because it helps us build exactly what our users need. Added to roadmap!',POSITIVE_FEATURE:'Hi '+n+', it warms my heart to hear you are enjoying the product! Your suggestion'+tp+' resonates with our vision.',POSITIVE:'Hi '+n+', reading this genuinely made my day. Building this product has been a labor of love, and knowing it is making a difference means everything. Thank you!',NEUTRAL:'Hi '+n+', thank you for reaching out. I want to make sure you get the best possible experience. Is there anything specific I can help with?'}};
  const templates=tones[tone]||tones.professional;return (templates[c.type]||templates.NEUTRAL)+'\n\n-- Powered by ORBIT';
}
function setTextareaValue(ta,val){if(ta.contentEditable==='true'){ta.textContent=val;ta.dispatchEvent(new Event('input',{bubbles:true}));return;}const ns=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value')?.set;if(ns)ns.call(ta,val);else ta.value=val;ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));}
async function incrementReplyStats(hash){if(!isStorageReady)return;const stored=await new Promise(r=>chrome.storage.local.get(['orbitStats','orbitRepliedHashes'],r));let hashes=stored.orbitRepliedHashes||[];if(hash&&hashes.includes(hash))return;const st=stored.orbitStats||{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0};st.repliesGenerated=(st.repliesGenerated||0)+1;st.timeSavedMinutes=(st.timeSavedMinutes||0)+3;if(hash){hashes.push(hash);if(hashes.length>500)hashes=hashes.slice(-500);}await new Promise(r=>chrome.storage.local.set({orbitStats:st,orbitRepliedHashes:hashes},r));}
async function saveFailure(comment,reply,reason){return new Promise(r=>chrome.storage.local.get('orbitFailures',res=>{const f=res.orbitFailures||[];f.push({comment,reply,reason,ts:Date.now()});chrome.storage.local.set({orbitFailures:f},r);}));}
function triggerWebhook(text,author,risk,platform){if(!cachedSettings.webhookEnabled||!cachedSettings.webhookUrl)return;const h=hashStr(text);if(webhookSent.has(h))return;webhookSent.add(h);chrome.runtime.sendMessage({action:'sendWebhook',url:cachedSettings.webhookUrl,payload:{text:'REFUND RISK! Platform: '+platform+' | Customer: '+author+' | Score: '+risk+'/100 | "'+text.substring(0,200)+'"'}});}
const webhookSent=new Set();
function updateFooter(){const scopedComments=getScopedOrbitComments();const replied=scopedComments.filter(c=>c.replied).length;const risks=scopedComments.filter(c=>c.risk>=50).length;const rate=scopedComments.length>0?Math.round((replied/scopedComments.length)*100):0;const e1=document.getElementById('op-time');if(e1)e1.textContent=fmtTime(replied*3);const e2=document.getElementById('op-risks');if(e2)e2.textContent=risks;const e3=document.getElementById('op-rate');if(e3)e3.textContent=rate;const statusEl=document.getElementById('orbit-status');if(statusEl){if(risks>0){statusEl.classList.add('alert');statusEl.innerHTML='<span class="status-icon">🚨</span><span class="status-text">'+risks+' Risk'+(risks>1?'s':'')+'</span>';}else{statusEl.classList.remove('alert');statusEl.innerHTML='<span class="status-icon">✅</span><span class="status-text">Protected</span>';}}refreshPanelProductLabel();}
function exportFAQPage(faqs){const html='<!DOCTYPE html><html><head><title>FAQ</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;background:#0f0f1e;color:#1B5E20}h1{color:#7c3aed}.q{background:#161625;padding:16px;border-radius:8px;margin-bottom:12px;border-left:3px solid #3b82f6}</style></head><body><h1>Frequently Asked Questions</h1>'+faqs.map(q=>'<div class="q"><strong>Q:</strong> '+esc(q.text||'')+'<br><small>- '+esc(q.author||'Customer')+'</small></div>').join('')+'<p style="color:#4A5568;text-align:center;margin-top:40px">Generated by ORBIT</p></body></html>';const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='orbit-faq.html';a.click();}
function shareReport(st){const text='My ORBIT Launch Report:\n- '+st.repliesGenerated+' replies automated\n- '+st.risksCaught+' refund risks caught\n- '+fmtTime(st.timeSavedMinutes||0)+' saved\n\n-- Powered by ORBIT';navigator.clipboard?.writeText(text).then(()=>alert('Report copied to clipboard!')).catch(()=>alert(text));}

// SECTION 6: ONBOARDING
async function checkOnboarding(){return false;}
function showOnboarding(){return;}

// SECTION 7: CORE EXECUTION
const injectedElements=new WeakSet();let orbitObserver=null,scanTimeout,routerInterval=null;
async function bulkFill(){const btn=document.getElementById('op-autofill');if(btn){btn.textContent='Processing...';btn.disabled=true;}const unreplied=orbitComments.filter(c=>!c.replied&&c.type!=='NON_ENGLISH');for(const c of unreplied){if(!c.replyText)c.replyText=await generateFreeReply(c);if(c.element){const field=c.element.querySelector(getAdapter().sel.text);if(field)setTextareaValue(field,c.replyText);}c.replied=true;await incrementReplyStats(c.hash);await sleep(100);}await persistOrbitCommentFeed();if(btn){btn.textContent='Done!';btn.disabled=false;setTimeout(()=>{btn.textContent='Auto-Fill All 0';},2000);}updateWidgetBadge();if(orbitState.panelOpen)renderView();}
function scanComments(){if(!isStorageReady||!cachedSettings.orbitAIEnabled)return;const containers=getContainers();let changed=false;containers.forEach(el=>{if(el.dataset.orbitCommentInjected==='true')return;const existingBadges=el.querySelectorAll('.orbit-bar-mini');if(existingBadges.length>1){existingBadges.forEach((badge,index)=>{if(index>0)badge.remove();});}const field=el.querySelector(getAdapter().sel.text);if(field){if(field.dataset.orbitInjected==='true')return;if(field.parentElement?.querySelector('.orbit-reply-assistant'))return;}if(injectedElements.has(el)||el.querySelector('.orbit-bar-mini'))return;const commentContentEl=el.querySelector('.comment-content');const commentText=(commentContentEl?.textContent||'').trim();const text=commentText||getCommentText(el);if(!text||text.length<5)return;injectedElements.add(el);el.dataset.orbitCommentInjected='true';if(field)field.dataset.orbitInjected='true';const author=getAuthor(el);const product=normalizeProductName(el.dataset.product||getActiveProduct()||cachedSettings.productName)||'All Products';const{type}=classify(text);const risk=riskScore(text);const hash=hashStr(product+author+text.substring(0,100));const priority=type==='NEGATIVE'?(risk>=50?100:90):type==='QUESTION'?60:type==='FEATURE'?40:type==='POSITIVE'?20:10;if(orbitComments.some(c=>c.hash===hash))return;orbitComments.push({text,author,product,type,risk,hash,priority,replied:false,replyText:'',element:el});const scopedCount=(product==='All Products'?orbitComments:orbitComments.filter(c=>c.product===product)).length;const mini=document.createElement('div');mini.className='orbit-bar-mini orbit-reply-assistant';mini.innerHTML='<span style="color:#00f5d4;font-size:10px;font-weight:600">●</span><span style="color:#4A5568;font-size:10px">'+esc(product)+' • '+scopedCount+' comments</span><span style="background:'+(COLORS[type]||'#4A5568')+';color:#fff;padding:1px 6px;border-radius:3px;font-size:10px">'+type+'</span>'+(risk>0?'<span style="color:'+(risk>=50?'#ef4444':'#f59e0b')+';font-weight:700;font-size:10px">'+risk+'</span>':'');if(field&&field.parentElement)field.parentElement.insertBefore(mini,field);else el.appendChild(mini);if(risk>=50){el.style.borderLeft='3px solid #ef4444';el.style.boxShadow='0 0 12px rgba(239,68,68,.15)';triggerWebhook(text,author,risk,getAdapter().id);}else if(risk>0){el.style.borderLeft='3px solid #f59e0b';}if(type==='QUESTION'){chrome.storage.local.get('orbitFAQs',res=>{let faqs=res.orbitFAQs||[];if(!faqs.some(f=>f.text===text)){faqs.unshift({text,author,ts:Date.now()});faqs=faqs.slice(0,20);chrome.storage.local.set({orbitFAQs:faqs});}});}changed=true;});if(changed){orbitComments.sort((a,b)=>b.priority-a.priority);refreshPanelProductLabel();updateWidgetBadge();if(orbitState.panelOpen&&orbitState.view==='layer0')renderView();saveScanStats();persistOrbitCommentFeed();}}
function saveScanStats(){chrome.storage.local.get(['orbitStats','orbitScannedHashes'],(r)=>{const st=r.orbitStats||{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0};let hashes=r.orbitScannedHashes||[];let nc=0,nr=0;orbitComments.forEach(c=>{if(!hashes.includes(c.hash)){nc++;if(c.risk>=50)nr++;hashes.push(c.hash);}});if(nc===0)return;if(hashes.length>500)hashes=hashes.slice(-500);st.commentsAnalyzed=(st.commentsAnalyzed||0)+nc;st.risksCaught=(st.risksCaught||0)+nr;chrome.storage.local.set({orbitStats:st,orbitScannedHashes:hashes});});}
function setupObserver(){orbitObserver=new MutationObserver(mutations=>{if(!isStorageReady||!cachedSettings.orbitAIEnabled)return;let hasNew=false;for(const m of mutations){if(m.type==='childList'){for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.classList?.contains('orbit-bar-mini')||n.closest?.('.orbit-panel')||n.id==='orbit-panel'||n.id==='orbit-widget'||n.id==='orbit-onboarding')continue;hasNew=true;break;}}if(hasNew)break;}if(!hasNew)return;clearTimeout(scanTimeout);scanTimeout=setTimeout(scanComments,600);});if(document.body)orbitObserver.observe(document.body,{childList:true,subtree:true,attributes:false});}
function startSPARouter(){routerInterval=setInterval(()=>{try{if(!isStorageReady)return;if(!chrome.runtime?.id){clearInterval(routerInterval);return;}scanComments();}catch(e){if(e.message?.includes('Extension context invalidated'))clearInterval(routerInterval);}},4000);document.addEventListener('click',e=>{const t=e.target.closest('a,button,[role="button"]');if(!t)return;const txt=(t.textContent||'').toLowerCase();if(txt.includes('comment')||txt.includes('review')||(t.href||'').includes('comment'))setTimeout(()=>{if(isStorageReady)scanComments();},1200);});}
function postOnboardingInit(){createWidget();createPanel();setTimeout(scanComments,800);setupObserver();startSPARouter();}
async function initExtension(){
  // Hide widget completely on localhost:3000 dashboard
  if (location.href === 'http://localhost:3000/' || 
      location.href === 'http://localhost:3000' ||
      location.href.startsWith('http://localhost:3000/#')) {
    console.log('[ORBIT] Detected localhost dashboard - hiding widget');
    return;
  }
  
  console.log('[ORBIT] Initializing V9...');
  initTheme();
  const s = await getSettings();
  cachedSettings = {...cachedSettings, ...s};
  if (!s.orbitAIEnabled) {
    console.log('[ORBIT] Disabled');
    return;
  }
  injectPanelCSS();
  const a = getAdapter();
  const meta = a.meta();
  if (meta.name && (!cachedSettings.productName || cachedSettings.productName.trim() === '')) {
    chrome.storage.local.get('orbitSettings', (res) => {
      const ss = res.orbitSettings || {};
      ss.productName = meta.name;
      ss.productDescription = meta.desc;
      chrome.storage.local.set({orbitSettings: ss});
      cachedSettings.productName = meta.name;
      cachedSettings.productDescription = meta.desc;
    });
  }
  const blocked = await checkOnboarding();
  if (blocked) return;
  createWidget();
  createPanel();
  document.addEventListener('orbit:product-change', () => {
    refreshPanelProductLabel();
    updateWidgetBadge();
    if (orbitState.panelOpen) renderView();
  });
  setTimeout(scanComments, 1000);
  setupObserver();
  startSPARouter();
  console.log('[ORBIT] V9 - Premium Panel Active');
}
console.log('[ORBIT] V9 - Script Loaded');
