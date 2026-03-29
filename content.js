// ============================================================
// ORBIT V9 - Premium SaaS Panel (Early Warning System)
// content.js - Full 5-Layer Panel Implementation
// ============================================================
console.log('[ORBIT] V9 - Premium Panel Loading...');

// SECTION 0: SAFE INITIALIZATION
let isStorageReady = false;
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
    chrome.storage.local.get(['orbitStats','orbitSettings','orbitCredits','orbitFAQs'], (r) => {
      try {
        const u = {};
        if (!r.orbitStats) u.orbitStats = { repliesGenerated:0, timeSavedMinutes:0, risksCaught:0, commentsAnalyzed:0 };
        if (!r.orbitSettings) u.orbitSettings = { analyticsTracking:true, emailNotifications:false, privacyMode:false, orbitAIEnabled:true, webhookUrl:'', webhookEnabled:false, productName:'', productDescription:'', defaultTone:'professional' };
        if (!r.orbitCredits) u.orbitCredits = { used:0, freeLimit:20, isPro:false, plan:'free' };
        if (!r.orbitFAQs) u.orbitFAQs = [];
        if (Object.keys(u).length > 0) chrome.storage.local.set(u);
        isStorageReady = true;
        onStorageReady();
      } catch(e) { console.warn('ORBIT init error', e); }
    });
  } catch(e) { console.warn('ORBIT storage error', e); }
}
function onStorageReady() { initExtension(); }
safeInitialize();

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
function isEnglish(t) { if(!t||t.length<4) return true; return /\b(the|is|to|and|a|in|it|you|for|on|with|this|that|of|how|what|when|why|can|will|my|does|any|has|have|but|not|are|be|so|if|we|was|or|do|at|from|by|your|all|there|up|out|about|who|get|like|no|yes|hi|thanks|please|good|bad|love)\b/i.test(t); }
function classify(text) {
  if (!text||text.length<3) return {type:'NEUTRAL',score:0};
  if (!isEnglish(text)) return {type:'NON_ENGLISH',score:1};
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
const COLORS = {NEGATIVE:'#ef4444',QUESTION:'#3b82f6',FEATURE:'#8b5cf6',POSITIVE_FEATURE:'#f59e0b',POSITIVE:'#10b981',NEUTRAL:'#6b7280',NON_ENGLISH:'#ec4899',CRITICAL:'#dc2626'};

// SECTION 3: UI SYSTEM
function injectPanelCSS() {
  if (document.getElementById('orbit-panel-css')) return;
  const s = document.createElement('style'); s.id = 'orbit-panel-css';
  s.textContent = `
@keyframes orbitSlideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes orbitFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
#orbit-widget{position:fixed;bottom:24px;right:24px;z-index:2147483646;cursor:pointer;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(79,70,229,.4);transition:transform .2s,box-shadow .2s;font-family:system-ui,-apple-system,sans-serif}
#orbit-widget:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(79,70,229,.6)}
#orbit-widget .badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid #0f0f1e}
#orbit-panel{position:fixed;top:0;right:0;width:400px;height:100vh;background:#0f0f1e;border-left:1px solid rgba(79,70,229,.2);z-index:2147483647;display:none;flex-direction:column;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;animation:orbitSlideIn .3s ease;box-shadow:-8px 0 40px rgba(0,0,0,.5)}
#orbit-panel.open{display:flex}
.op-header{padding:16px 20px;background:#161625;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between}
.op-header .title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;color:#fff}
.op-header .live{background:#10b981;width:8px;height:8px;border-radius:50%;box-shadow:0 0 8px #10b981}
.op-header .close{background:none;border:none;color:#6b7280;font-size:22px;cursor:pointer;padding:0 4px}
.op-header .close:hover{color:#fff}
.op-nav{display:flex;border-bottom:1px solid rgba(255,255,255,.06);background:#12121f}
.op-nav button{flex:1;padding:10px 0;background:none;border:none;border-bottom:2px solid transparent;color:#6b7280;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.op-nav button.active{color:#7c3aed;border-bottom-color:#7c3aed}
.op-nav button:hover{color:#a78bfa}
.op-body{flex:1;overflow-y:auto;padding:16px 20px;scrollbar-width:thin;scrollbar-color:#2d2d4e #0f0f1e}
.op-body::-webkit-scrollbar{width:6px}.op-body::-webkit-scrollbar-thumb{background:#2d2d4e;border-radius:3px}
.op-footer{padding:12px 20px;border-top:1px solid rgba(255,255,255,.06);background:#12121f;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#6b7280}
.op-card{background:#161625;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:14px;margin-bottom:10px;animation:orbitFade .3s ease;transition:border-color .2s}
.op-card:hover{border-color:rgba(79,70,229,.3)}
.op-card.urgent{border-left:3px solid #ef4444}.op-card.question{border-left:3px solid #3b82f6}.op-card.feature{border-left:3px solid #8b5cf6}.op-card.positive{border-left:3px solid #10b981}
.op-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.op-btn{padding:8px 16px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.op-btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.op-btn.primary{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff}
.op-btn.success{background:#10b981;color:#fff}.op-btn.danger{background:#ef4444;color:#fff}
.op-btn.ghost{background:rgba(255,255,255,.05);color:#9ca3af;border:1px solid rgba(255,255,255,.1)}
.op-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.op-input{width:100%;padding:10px 12px;background:#1e1e30;border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;font-family:inherit}
.op-input:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15)}
.op-metric{text-align:center;padding:16px;background:#161625;border-radius:10px;border:1px solid rgba(255,255,255,.06)}
.op-metric .val{font-size:28px;font-weight:800;color:#7c3aed}.op-metric .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;margin-top:4px}
.op-risk-bar{height:6px;border-radius:3px;background:#1e1e30;overflow:hidden;margin:6px 0}
.op-risk-bar .fill{height:100%;border-radius:3px;transition:width .4s ease}
.op-tabs{display:flex;gap:4px;margin-bottom:14px}
.op-tabs button{padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:transparent;color:#9ca3af;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.op-tabs button.active{background:#7c3aed;color:#fff;border-color:#7c3aed}
.op-lock{background:rgba(124,58,237,.08);border:1px dashed rgba(124,58,237,.3);border-radius:10px;padding:16px;text-align:center;margin:10px 0}
.op-lock p{color:#9ca3af;font-size:12px;margin:4px 0}
.orbit-bar-mini{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:#161625;border-radius:6px;border:1px solid rgba(255,255,255,.08);font-size:11px;font-family:system-ui,sans-serif;margin:4px 0}
`;
  document.head.appendChild(s);
}

// 3B: State
const orbitState = {view:'layer0',tab:'all',selectedIdx:-1,panelOpen:false};
let orbitComments = [];
let cachedSettings = {orbitAIEnabled:true,productName:'',productDescription:'',privacyMode:false,analyticsTracking:true,webhookUrl:'',webhookEnabled:false,defaultTone:'professional'};

// 3C: Widget & Panel
function createWidget() {
  if (document.getElementById('orbit-widget')) return;
  const w = document.createElement('div'); w.id = 'orbit-widget';
  w.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20" stroke-dasharray="4 3"/></svg><div class="badge" style="display:none">0</div>';
  w.addEventListener('click', togglePanel); document.body.appendChild(w);
}
function updateWidgetBadge() {
  const b=document.querySelector('#orbit-widget .badge'); if(!b) return;
  const urgent=orbitComments.filter(c=>c.risk>=50).length, unread=orbitComments.filter(c=>!c.replied).length, count=urgent||unread;
  b.textContent=count; b.style.display=count>0?'flex':'none'; b.style.background=urgent>0?'#ef4444':'#3b82f6';
}
function createPanel() {
  if (document.getElementById('orbit-panel')) return;
  const p = document.createElement('div'); p.id = 'orbit-panel';
  p.innerHTML = '<div class="op-header"><div class="title"><div class="live"></div><span>ORBIT</span><span style="color:#6b7280;font-size:12px;font-weight:400" id="op-product-name">'+esc(cachedSettings.productName||'')+'</span></div><button class="close" id="orbit-close">x</button></div><div class="op-nav"><button data-view="layer0" class="active">Dashboard</button><button data-view="layer2">Report</button><button data-view="layer3">Settings</button></div><div class="op-body" id="orbit-body"></div><div class="op-footer"><span>Time: <span id="op-time">0m</span> saved</span><span>Risks: <span id="op-risks">0</span></span><span>Rate: <span id="op-rate">0</span>%</span></div>';
  document.body.appendChild(p);
  p.querySelector('#orbit-close').addEventListener('click', togglePanel);
  p.querySelector('.op-nav').addEventListener('click', (e) => {
    const v=e.target.dataset?.view; if(!v) return;
    orbitState.view=v; orbitState.selectedIdx=-1;
    p.querySelectorAll('.op-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
    renderView();
  });
}
function togglePanel() { const p=document.getElementById('orbit-panel'); if(!p) return; orbitState.panelOpen=!orbitState.panelOpen; p.classList.toggle('open',orbitState.panelOpen); if(orbitState.panelOpen) renderView(); }
function renderView() { const body=document.getElementById('orbit-body'); if(!body) return; switch(orbitState.view){case 'layer0':renderLayer0(body);break;case 'layer1':renderLayer1(body);break;case 'layer2':renderLayer2(body);break;case 'layer3':renderLayer3(body);break;case 'layer4':renderLayer4(body);break;} updateFooter(); }

// Layer 0: Dashboard
function renderLayer0(body) {
  const urgent=orbitComments.filter(c=>c.risk>=50), inbox=orbitComments.filter(c=>!c.replied&&c.risk<50), done=orbitComments.filter(c=>c.replied);
  if (urgent.length===0 && inbox.length===0) {
    body.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:16px;color:#6ee7b7">OK</div><h2 style="color:#6ee7b7;margin:0 0 8px;font-size:20px">You are Safe</h2><p style="color:#6b7280;font-size:13px;margin:0 0 20px">No urgent comments. All replies complete.</p><div style="color:#4b5563;font-size:12px;margin-bottom:24px">Last scan: just now - Replies: '+done.length+'/'+orbitComments.length+' complete</div><button class="op-btn ghost" onclick="document.querySelector(\'[data-view=layer2]\').click()">View Weekly Report</button></div>';
    return;
  }
  let tabFilter=orbitState.tab, list=tabFilter==='urgent'?urgent:tabFilter==='done'?done:[...urgent,...inbox];
  body.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:14px">'+(urgent.length>0?'<div style="flex:1;background:rgba(239,68,68,.1);padding:10px;border-radius:8px;text-align:center;border:1px solid rgba(239,68,68,.2)"><div style="font-size:20px;font-weight:800;color:#ef4444">'+urgent.length+'</div><div style="font-size:10px;color:#fca5a5">URGENT</div></div>':'')+'<div style="flex:1;background:rgba(59,130,246,.1);padding:10px;border-radius:8px;text-align:center;border:1px solid rgba(59,130,246,.2)"><div style="font-size:20px;font-weight:800;color:#3b82f6">'+inbox.length+'</div><div style="font-size:10px;color:#93c5fd">INBOX</div></div><div style="flex:1;background:rgba(16,185,129,.1);padding:10px;border-radius:8px;text-align:center;border:1px solid rgba(16,185,129,.2)"><div style="font-size:20px;font-weight:800;color:#10b981">'+done.length+'</div><div style="font-size:10px;color:#6ee7b7">DONE</div></div></div><div class="op-tabs" id="op-tabs"><button data-tab="all" class="'+(tabFilter==='all'?'active':'')+'">All '+(urgent.length+inbox.length)+'</button>'+(urgent.length?'<button data-tab="urgent" class="'+(tabFilter==='urgent'?'active':'')+'">Urgent '+urgent.length+'</button>':'')+'<button data-tab="done" class="'+(tabFilter==='done'?'active':'')+'">Done '+done.length+'</button></div><div id="op-comment-list"></div><div style="margin-top:12px;display:flex;gap:8px"><button class="op-btn primary" id="op-autofill" style="flex:1">Auto-Fill All '+inbox.length+'</button><button class="op-btn ghost" onclick="document.querySelector(\'[data-view=layer2]\').click()">Report</button></div>';
  body.querySelector('#op-tabs')?.addEventListener('click',e=>{const tab=e.target.dataset?.tab;if(!tab)return;orbitState.tab=tab;renderLayer0(body);});
  const listEl=body.querySelector('#op-comment-list');
  list.forEach(c=>{
    const ri=orbitComments.indexOf(c), tc=c.risk>=50?'urgent':c.type==='QUESTION'?'question':c.type==='FEATURE'?'feature':c.type==='POSITIVE'?'positive':'';
    const card=document.createElement('div'); card.className='op-card '+tc; card.style.cursor='pointer';
    card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><span class="op-badge" style="background:'+(COLORS[c.type]||'#6b7280')+';color:#fff">'+(c.risk>=50?'REFUND RISK':c.type)+'</span>'+(c.risk>0?'<span style="color:'+(c.risk>=50?'#ef4444':'#f59e0b')+';font-size:11px;font-weight:700;margin-left:6px">Score '+c.risk+'</span>':'')+'</div><span style="color:#4b5563;font-size:11px">'+esc(c.author)+'</span></div><p style="color:#d1d5db;font-size:13px;margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+esc(c.text.substring(0,120))+'</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="color:#4b5563;font-size:11px">P'+c.priority+'</span>'+(c.replied?'<span style="color:#10b981;font-size:11px">Replied</span>':'<span class="op-btn success" style="padding:4px 10px;font-size:11px">Reply</span>')+'</div>';
    card.addEventListener('click',()=>{orbitState.selectedIdx=ri;orbitState.view='layer1';renderView();});
    listEl.appendChild(card);
  });
  body.querySelector('#op-autofill')?.addEventListener('click',()=>bulkFill());
}

// Layer 1: Comment Detail
function renderLayer1(body) {
  const c=orbitComments[orbitState.selectedIdx]; if(!c){orbitState.view='layer0';renderView();return;}
  const riskBreakdown=[]; const l=c.text.toLowerCase();
  if(l.includes('refund'))riskBreakdown.push({kw:'refund',pts:40}); if(l.includes('cancel'))riskBreakdown.push({kw:'cancel',pts:30}); if(l.includes('disappointed'))riskBreakdown.push({kw:'disappointed',pts:20}); if(l.includes('not working'))riskBreakdown.push({kw:'not working',pts:25});
  body.innerHTML='<div style="margin-bottom:16px"><button class="op-btn ghost" id="op-back" style="padding:4px 10px;font-size:12px">Back</button></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="op-badge" style="background:'+(COLORS[c.type]||'#6b7280')+';color:#fff">'+c.type+'</span><span style="color:#9ca3af;font-size:13px">'+esc(c.author)+'</span></div>'+(c.risk>0?'<div class="op-card" style="border-left:3px solid #ef4444"><div style="font-size:12px;font-weight:700;color:#fca5a5;margin-bottom:6px">REFUND RISK SCORE</div><div class="op-risk-bar"><div class="fill" style="width:'+c.risk+'%;background:'+(c.risk>=50?'#ef4444':'#f59e0b')+'"></div></div><div style="font-size:20px;font-weight:800;color:#ef4444">'+c.risk+'/100</div>'+riskBreakdown.map(r=>'<span style="color:#fca5a5;font-size:11px;margin-right:8px">"'+r.kw+'" +'+r.pts+'</span>').join('')+'</div>':'')+'<div class="op-card"><div style="font-size:11px;color:#6b7280;margin-bottom:6px">COMMENT</div><p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6">'+esc(c.text)+'</p></div><div class="op-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:11px;color:#6b7280">FREE REPLY</span><div class="op-tabs" style="margin:0" id="op-tone-tabs"><button data-tone="professional" class="'+((cachedSettings.defaultTone||'professional')==='professional'?'active':'')+'">Professional</button><button data-tone="friendly" class="'+(cachedSettings.defaultTone==='friendly'?'active':'')+'">Friendly</button><button data-tone="empathetic" class="'+(cachedSettings.defaultTone==='empathetic'?'active':'')+'">Empathetic</button></div></div><textarea id="op-reply-text" class="op-input" rows="5" style="resize:vertical;font-family:inherit">'+esc(c.replyText||'')+'</textarea><div style="display:flex;gap:6px;margin-top:10px"><button class="op-btn ghost" id="op-regen">Regenerate</button><button class="op-btn success" id="op-approve" style="flex:1">Approve and Post</button></div></div><div class="op-lock"><div style="font-size:13px;font-weight:700;color:#a78bfa">AI REPLY - Pro Only</div><p>Context-aware reply using your product knowledge base</p><button class="op-btn primary" id="op-unlock" style="margin-top:8px">Unlock AI Reply</button></div><div style="display:flex;gap:8px;margin-top:12px;justify-content:center"><span style="color:#6b7280;font-size:12px">Good reply?</span><button class="op-btn ghost" id="op-fb-yes" style="padding:4px 10px;font-size:11px">Yes</button><button class="op-btn ghost" id="op-fb-no" style="padding:4px 10px;font-size:11px">No</button></div>';
  body.querySelector('#op-back').addEventListener('click',()=>{orbitState.view='layer0';renderView();});
  body.querySelector('#op-unlock')?.addEventListener('click',()=>{orbitState.view='layer4';renderView();});
  if(!c.replyText) generateFreeReply(c).then(r=>{c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta) ta.value=r;});
  body.querySelector('#op-tone-tabs')?.addEventListener('click',e=>{const tone=e.target.dataset?.tone;if(!tone)return;cachedSettings.defaultTone=tone;body.querySelectorAll('#op-tone-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tone===tone));generateFreeReply(c,tone).then(r=>{c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta) ta.value=r;});});
  body.querySelector('#op-regen')?.addEventListener('click',async()=>{const btn=body.querySelector('#op-regen');btn.textContent='...';btn.disabled=true;const r=await generateFreeReply(c,cachedSettings.defaultTone);c.replyText=r;const ta=document.getElementById('op-reply-text');if(ta)ta.value=r;btn.textContent='Regenerate';btn.disabled=false;});
  body.querySelector('#op-approve')?.addEventListener('click',async()=>{const ta=document.getElementById('op-reply-text');const reply=ta?.value||c.replyText;if(!reply)return;if(c.element){const field=c.element.querySelector(getAdapter().sel.text);if(field)setTextareaValue(field,reply);}c.replied=true;c.replyText=reply;await incrementReplyStats(c.hash);orbitState.view='layer0';renderView();updateWidgetBadge();});
  body.querySelector('#op-fb-yes')?.addEventListener('click',function(){this.parentElement.innerHTML='<span style="color:#10b981;font-size:12px">Thanks!</span>';});
  body.querySelector('#op-fb-no')?.addEventListener('click',async function(){const reason=prompt('Why? (Wrong Tone, Hallucination, Missed Context, Other)');if(reason){await saveFailure(c.text,c.replyText,reason);this.parentElement.innerHTML='<span style="color:#f59e0b;font-size:12px">Feedback saved</span>';}});
}


// SECTION 3 cont: Layers 2-4
function renderLayer2(body) {
  chrome.storage.local.get(['orbitStats','orbitFAQs'],(r)=>{
    const st=r.orbitStats||{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0};
    const faqs=r.orbitFAQs||[];
    const rate=st.commentsAnalyzed>0?Math.round((st.repliesGenerated/st.commentsAnalyzed)*100):0;
    const types={}; orbitComments.forEach(c=>{types[c.type]=(types[c.type]||0)+1;});
    body.innerHTML='<h3 style="color:#fff;margin:0 0 16px;font-size:16px">Launch Report</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px"><div class="op-metric"><div class="val">'+fmtTime(st.timeSavedMinutes)+'</div><div class="lbl">Time Saved</div></div><div class="op-metric"><div class="val">'+st.repliesGenerated+'</div><div class="lbl">Replies ('+rate+'%)</div></div><div class="op-metric"><div class="val">'+st.risksCaught+'</div><div class="lbl">Risks Caught</div></div><div class="op-metric"><div class="val">'+st.commentsAnalyzed+'</div><div class="lbl">Comments</div></div></div><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">COMMENT BREAKDOWN</div>'+Object.entries(types).map(([t,n])=>{const pct=st.commentsAnalyzed>0?Math.round((n/st.commentsAnalyzed)*100):0;return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:#9ca3af;font-size:11px;width:75px">'+t+'</span><div style="flex:1;height:6px;background:#1e1e30;border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(COLORS[t]||'#6b7280')+';border-radius:3px"></div></div><span style="color:#6b7280;font-size:11px;width:24px;text-align:right">'+n+'</span></div>';}).join('')+'</div>'+(faqs.length>0?'<div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">TOP QUESTIONS</div>'+faqs.slice(0,5).map((q,i)=>'<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;color:#d1d5db">'+(i+1)+'. "'+esc((q.text||'').substring(0,80))+'"</div>').join('')+'</div>':'')+'<div style="display:flex;gap:8px;margin-top:12px"><button class="op-btn ghost" id="op-export-faq" style="flex:1">Export FAQ Page</button><button class="op-btn ghost" id="op-share" style="flex:1">Share Report</button></div><div class="op-lock" style="margin-top:16px"><div style="font-size:13px;font-weight:700;color:#a78bfa">DEEP INSIGHTS - Pro Only</div><p>Churn Probability / Competitor Mentions / Trend Analysis</p><button class="op-btn primary" onclick="orbitState.view=\'layer4\';renderView()">Unlock Deep Insights</button></div>';
    body.querySelector('#op-export-faq')?.addEventListener('click',()=>exportFAQPage(faqs));
    body.querySelector('#op-share')?.addEventListener('click',()=>shareReport(st));
  });
}
function renderLayer3(body) {
  chrome.storage.local.get(['orbitSettings','orbitCredits'],(r)=>{
    const s=r.orbitSettings||cachedSettings, cr=r.orbitCredits||{used:0,freeLimit:20,isPro:false,plan:'free'};
    body.innerHTML='<h3 style="color:#fff;margin:0 0 16px;font-size:16px">Settings</h3><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">PRODUCT CONTEXT</div><input class="op-input" id="op-s-name" placeholder="Product Name" value="'+esc(s.productName||'')+'" style="margin-bottom:8px"><input class="op-input" id="op-s-email" placeholder="Support Email" value="'+esc(s.supportEmail||'')+'" style="margin-bottom:8px"><textarea class="op-input" id="op-s-desc" rows="2" placeholder="Product Description">'+esc(s.productDescription||'')+'</textarea></div><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">ALERTS - Free</div><label style="display:flex;justify-content:space-between;align-items:center;color:#d1d5db;font-size:13px;margin-bottom:10px"><span>Email on Refund Risk</span><input type="checkbox" id="op-s-email-notif" '+(s.emailNotifications?'checked':'')+' style="accent-color:#7c3aed"></label><label style="display:flex;justify-content:space-between;align-items:center;color:#d1d5db;font-size:13px"><span>Slack Webhook</span><input type="checkbox" id="op-s-webhook" '+(s.webhookEnabled?'checked':'')+' style="accent-color:#7c3aed"></label><input class="op-input" id="op-s-webhook-url" placeholder="Webhook URL" value="'+esc(s.webhookUrl||'')+'" style="margin-top:8px;display:'+(s.webhookEnabled?'block':'none')+'"></div><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">REPLY STYLE - Free</div><div style="display:flex;gap:6px;margin-bottom:10px">'+['professional','friendly','empathetic'].map(t=>'<button class="op-btn '+((s.defaultTone||'professional')===t?'primary':'ghost')+'" data-tone="'+t+'" style="flex:1;font-size:11px;padding:6px">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>').join('')+'</div><div style="display:flex;align-items:center;gap:8px"><span style="color:#6b7280;font-size:12px">Signature:</span><span style="color:#9ca3af;font-size:12px">Powered by ORBIT</span></div></div><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">PRIVACY - Free</div><label style="display:flex;justify-content:space-between;align-items:center;color:#d1d5db;font-size:13px;margin-bottom:10px"><span>Privacy Mode</span><input type="checkbox" id="op-s-privacy" '+(s.privacyMode?'checked':'')+' style="accent-color:#7c3aed"></label><button class="op-btn danger" id="op-s-clear" style="width:100%;font-size:12px">Clear All Data</button></div><div class="op-card"><div style="font-size:12px;font-weight:700;color:#9ca3af;margin-bottom:10px">PRO FEATURES</div>'+['AI Replies (multilingual)','Smart Context (product-aware)','Brand Voice (your style)','Auto-Post without confirm'].map(f=>'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)"><span style="color:#6b7280;font-size:13px">Locked: '+f+'</span><button class="op-btn ghost" style="padding:3px 8px;font-size:11px" onclick="orbitState.view=\'layer4\';renderView()">Upgrade</button></div>').join('')+'</div><div class="op-card" style="text-align:center"><div style="color:#9ca3af;font-size:12px;margin-bottom:8px">'+cr.plan+' Plan - '+cr.used+'/'+cr.freeLimit+' AI credits used</div><button class="op-btn primary" style="width:100%" onclick="orbitState.view=\'layer4\';renderView()">Upgrade to Pro - $19/mo</button></div>';
    const save=()=>{const ns={...s,productName:document.getElementById('op-s-name')?.value||'',supportEmail:document.getElementById('op-s-email')?.value||'',productDescription:document.getElementById('op-s-desc')?.value||'',emailNotifications:document.getElementById('op-s-email-notif')?.checked||false,webhookEnabled:document.getElementById('op-s-webhook')?.checked||false,webhookUrl:document.getElementById('op-s-webhook-url')?.value||'',privacyMode:document.getElementById('op-s-privacy')?.checked||false,defaultTone:cachedSettings.defaultTone};chrome.storage.local.set({orbitSettings:ns});cachedSettings={...cachedSettings,...ns};const pn=document.getElementById('op-product-name');if(pn)pn.textContent=ns.productName;};
    body.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('change',save));
    body.querySelector('#op-s-webhook')?.addEventListener('change',(e)=>{const u=document.getElementById('op-s-webhook-url');if(u)u.style.display=e.target.checked?'block':'none';save();});
    body.querySelectorAll('[data-tone]').forEach(b=>b.addEventListener('click',(e)=>{cachedSettings.defaultTone=e.target.dataset.tone;body.querySelectorAll('[data-tone]').forEach(x=>x.className='op-btn '+(x.dataset.tone===cachedSettings.defaultTone?'primary':'ghost'));save();}));
    body.querySelector('#op-s-clear')?.addEventListener('click',()=>{if(confirm('Clear all ORBIT data?')){chrome.storage.local.set({orbitStats:{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0},orbitFAQs:[],orbitScannedHashes:[],orbitRepliedHashes:[]});alert('Data cleared.');}});
  });
}
function renderLayer4(body) {
  chrome.storage.local.get('orbitCredits',(r)=>{
    const cr=r.orbitCredits||{used:0,freeLimit:20,isPro:false};
    const missed=orbitComments.filter(c=>c.type==='NON_ENGLISH').length, manual=orbitComments.filter(c=>c.replied).length;
    body.innerHTML='<div style="text-align:center;padding:20px 0"><h2 style="color:#fff;margin:0 0 6px;font-size:20px">ORBIT Pro</h2><p style="color:#9ca3af;font-size:13px;margin:0 0 20px">What you missed this week:</p></div>'+(missed>0?'<div class="op-card" style="border-left:3px solid #ec4899"><span style="color:#ec4899;font-size:13px">'+missed+' non-English comment'+(missed>1?'s':'')+' waiting without reply</span></div>':'')+(manual>0?'<div class="op-card" style="border-left:3px solid #3b82f6"><span style="color:#93c5fd;font-size:13px">'+manual+' replies sent manually - could have been automated</span></div>':'')+'<div class="op-card"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="border-bottom:1px solid rgba(255,255,255,.06)"><td style="padding:8px 0;color:#6b7280"></td><td style="padding:8px 0;color:#9ca3af;font-weight:600">Free</td><td style="padding:8px 0;color:#a78bfa;font-weight:600">Pro</td></tr>'+[['Replies','Templates','AI writes your voice'],['Languages','English','All languages'],['Mode','Suggest','Auto-post'],['Report','Basic','Deep insights']].map(([label,free,pro])=>'<tr style="border-bottom:1px solid rgba(255,255,255,.04)"><td style="padding:8px 0;color:#6b7280;font-size:12px">'+label+'</td><td style="padding:8px 0;color:#9ca3af">'+free+'</td><td style="padding:8px 0;color:#d1d5db">'+pro+'</td></tr>').join('')+'</table></div><div style="display:flex;flex-direction:column;gap:8px;margin-top:16px"><button class="op-btn primary" style="width:100%;padding:14px;font-size:15px" id="op-buy-pro">$19/month - 500 AI replies</button><button class="op-btn ghost" style="width:100%;padding:12px" id="op-buy-ltd">$59 once - 200 AI replies/month (LTD)</button></div><p style="text-align:center;color:#6b7280;font-size:11px;margin-top:12px">Pays for itself in the first launch week</p><div style="text-align:center;margin-top:16px"><button class="op-btn ghost" onclick="orbitState.view=\'layer0\';renderView()">Back to Dashboard</button></div>';
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
function updateFooter(){chrome.storage.local.get('orbitStats',(r)=>{const st=r.orbitStats||{};const e1=document.getElementById('op-time');if(e1)e1.textContent=fmtTime(st.timeSavedMinutes||0);const e2=document.getElementById('op-risks');if(e2)e2.textContent=st.risksCaught||0;const rate=st.commentsAnalyzed>0?Math.round((st.repliesGenerated/st.commentsAnalyzed)*100):0;const e3=document.getElementById('op-rate');if(e3)e3.textContent=rate;});}
function exportFAQPage(faqs){const html='<!DOCTYPE html><html><head><title>FAQ</title><style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;background:#0f0f1e;color:#e2e8f0}h1{color:#7c3aed}.q{background:#161625;padding:16px;border-radius:8px;margin-bottom:12px;border-left:3px solid #3b82f6}</style></head><body><h1>Frequently Asked Questions</h1>'+faqs.map(q=>'<div class="q"><strong>Q:</strong> '+esc(q.text||'')+'<br><small>- '+esc(q.author||'Customer')+'</small></div>').join('')+'<p style="color:#6b7280;text-align:center;margin-top:40px">Generated by ORBIT</p></body></html>';const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='orbit-faq.html';a.click();}
function shareReport(st){const text='My ORBIT Launch Report:\n- '+st.repliesGenerated+' replies automated\n- '+st.risksCaught+' refund risks caught\n- '+fmtTime(st.timeSavedMinutes||0)+' saved\n\n-- Powered by ORBIT';navigator.clipboard?.writeText(text).then(()=>alert('Report copied to clipboard!')).catch(()=>alert(text));}

// SECTION 6: ONBOARDING
async function checkOnboarding(){const s=await getSettings();if(!s.productName||s.productName.trim()===''){showOnboarding();return true;}return false;}
function showOnboarding(){if(document.getElementById('orbit-onboarding'))return;const ov=document.createElement('div');ov.id='orbit-onboarding';ov.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(10,10,20,.92);backdrop-filter:blur(8px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';ov.innerHTML='<div style="background:#161625;border-radius:16px;padding:40px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.6);border:1px solid rgba(79,70,229,.3);text-align:center"><h2 style="color:#fff;margin:0 0 6px;font-size:22px">Welcome to ORBIT</h2><p style="color:#9ca3af;font-size:14px;margin:0 0 24px">What are you launching today?</p><input id="ob-name" class="op-input" placeholder="Product Name" style="margin-bottom:10px"><textarea id="ob-desc" class="op-input" rows="2" placeholder="Brief description (1-2 sentences)" style="margin-bottom:16px;font-family:inherit;resize:none"></textarea><button class="op-btn primary" id="ob-save" style="width:100%;padding:14px;font-size:16px">Start Monitoring</button><p id="ob-err" style="color:#ef4444;font-size:12px;margin-top:8px;display:none"></p></div>';document.body.appendChild(ov);ov.querySelector('#ob-save').addEventListener('click',()=>{const name=document.getElementById('ob-name')?.value.trim();const desc=document.getElementById('ob-desc')?.value.trim();if(!name){const e=document.getElementById('ob-err');if(e){e.textContent='Product name required.';e.style.display='block';}return;}chrome.storage.local.get('orbitSettings',res=>{const s=res.orbitSettings||{};s.productName=name;s.productDescription=desc;chrome.storage.local.set({orbitSettings:s},()=>{cachedSettings.productName=name;cachedSettings.productDescription=desc;ov.remove();postOnboardingInit();});});});}

// SECTION 7: CORE EXECUTION
const injectedElements=new WeakSet();let orbitObserver=null,scanTimeout,routerInterval=null;
async function bulkFill(){const btn=document.getElementById('op-autofill');if(btn){btn.textContent='Processing...';btn.disabled=true;}const unreplied=orbitComments.filter(c=>!c.replied&&c.type!=='NON_ENGLISH');for(const c of unreplied){if(!c.replyText)c.replyText=await generateFreeReply(c);if(c.element){const field=c.element.querySelector(getAdapter().sel.text);if(field)setTextareaValue(field,c.replyText);}c.replied=true;await incrementReplyStats(c.hash);await sleep(100);}if(btn){btn.textContent='Done!';btn.disabled=false;setTimeout(()=>{btn.textContent='Auto-Fill All 0';},2000);}updateWidgetBadge();if(orbitState.panelOpen)renderView();}
function scanComments(){if(!isStorageReady||!cachedSettings.orbitAIEnabled)return;const containers=getContainers();let changed=false;containers.forEach(el=>{if(injectedElements.has(el)||el.querySelector('.orbit-bar-mini'))return;injectedElements.add(el);const text=getCommentText(el);if(!text||text.length<5)return;const author=getAuthor(el);const{type}=classify(text);const risk=riskScore(text);const hash=hashStr(author+text.substring(0,100));const priority=type==='NEGATIVE'?(risk>=50?100:90):type==='QUESTION'?60:type==='FEATURE'?40:type==='POSITIVE'?20:10;if(orbitComments.some(c=>c.hash===hash))return;orbitComments.push({text,author,type,risk,hash,priority,replied:false,replyText:'',element:el});const mini=document.createElement('div');mini.className='orbit-bar-mini';mini.innerHTML='<span style="background:#4f46e5;color:#fff;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700">ORBIT</span><span style="background:'+(COLORS[type]||'#6b7280')+';color:#fff;padding:1px 6px;border-radius:3px;font-size:10px">'+type+'</span>'+(risk>0?'<span style="color:'+(risk>=50?'#ef4444':'#f59e0b')+';font-weight:700;font-size:10px">'+risk+'</span>':'');const field=el.querySelector(getAdapter().sel.text);if(field&&field.parentElement)field.parentElement.insertBefore(mini,field);else el.appendChild(mini);if(risk>=50){el.style.borderLeft='3px solid #ef4444';el.style.boxShadow='0 0 12px rgba(239,68,68,.15)';triggerWebhook(text,author,risk,getAdapter().id);}else if(risk>0){el.style.borderLeft='3px solid #f59e0b';}if(type==='QUESTION'){chrome.storage.local.get('orbitFAQs',res=>{let faqs=res.orbitFAQs||[];if(!faqs.some(f=>f.text===text)){faqs.unshift({text,author,ts:Date.now()});faqs=faqs.slice(0,20);chrome.storage.local.set({orbitFAQs:faqs});}});}changed=true;});if(changed){orbitComments.sort((a,b)=>b.priority-a.priority);updateWidgetBadge();if(orbitState.panelOpen&&orbitState.view==='layer0')renderView();saveScanStats();}}
function saveScanStats(){chrome.storage.local.get(['orbitStats','orbitScannedHashes'],(r)=>{const st=r.orbitStats||{repliesGenerated:0,timeSavedMinutes:0,risksCaught:0,commentsAnalyzed:0};let hashes=r.orbitScannedHashes||[];let nc=0,nr=0;orbitComments.forEach(c=>{if(!hashes.includes(c.hash)){nc++;if(c.risk>=50)nr++;hashes.push(c.hash);}});if(nc===0)return;if(hashes.length>500)hashes=hashes.slice(-500);st.commentsAnalyzed=(st.commentsAnalyzed||0)+nc;st.risksCaught=(st.risksCaught||0)+nr;chrome.storage.local.set({orbitStats:st,orbitScannedHashes:hashes});});}
function setupObserver(){orbitObserver=new MutationObserver(mutations=>{if(!isStorageReady||!cachedSettings.orbitAIEnabled)return;let hasNew=false;for(const m of mutations){if(m.type==='childList'){for(const n of m.addedNodes){if(n.nodeType!==1)continue;if(n.classList?.contains('orbit-bar-mini')||n.closest?.('.orbit-panel')||n.id==='orbit-panel'||n.id==='orbit-widget'||n.id==='orbit-onboarding')continue;hasNew=true;break;}}if(hasNew)break;}if(!hasNew)return;clearTimeout(scanTimeout);scanTimeout=setTimeout(scanComments,600);});if(document.body)orbitObserver.observe(document.body,{childList:true,subtree:true,attributes:false});}
function startSPARouter(){routerInterval=setInterval(()=>{try{if(!isStorageReady)return;if(!chrome.runtime?.id){clearInterval(routerInterval);return;}scanComments();}catch(e){if(e.message?.includes('Extension context invalidated'))clearInterval(routerInterval);}},4000);document.addEventListener('click',e=>{const t=e.target.closest('a,button,[role="button"]');if(!t)return;const txt=(t.textContent||'').toLowerCase();if(txt.includes('comment')||txt.includes('review')||(t.href||'').includes('comment'))setTimeout(()=>{if(isStorageReady)scanComments();},1200);});}
function postOnboardingInit(){createWidget();createPanel();setTimeout(scanComments,800);setupObserver();startSPARouter();}
async function initExtension(){console.log('[ORBIT] Initializing V9...');const s=await getSettings();cachedSettings={...cachedSettings,...s};if(!s.orbitAIEnabled){console.log('[ORBIT] Disabled');return;}injectPanelCSS();const a=getAdapter();const meta=a.meta();if(meta.name&&(!cachedSettings.productName||cachedSettings.productName.trim()==='')){chrome.storage.local.get('orbitSettings',res=>{const ss=res.orbitSettings||{};ss.productName=meta.name;ss.productDescription=meta.desc;chrome.storage.local.set({orbitSettings:ss});cachedSettings.productName=meta.name;cachedSettings.productDescription=meta.desc;});}const blocked=await checkOnboarding();if(blocked)return;createWidget();createPanel();setTimeout(scanComments,1000);setupObserver();startSPARouter();console.log('[ORBIT] V9 - Premium Panel Active');}
console.log('[ORBIT] V9 - Script Loaded');
