// ORBIT Demo Dashboard - Application Logic

const commentsData = [
  { id: 0, product: 'Productivity Pro', author: 'Angry Customer', email: 'angry@customer.com', time: 'Just now', avatar: 9, tier: 1, content: "I am extremely disappointed. This product does not work at all and is a complete waste of money. Please cancel my subscription and issue a full refund immediately!", type: 'issue', resolved: false, flagged: true },
  { id: 1, product: 'Productivity Pro', author: 'Sarah Mitchell', email: 'sarah@company.com', time: '2 hours ago', avatar: 1, tier: 2, content: "Does this integrate with Notion? I didn't see it mentioned in the description but it's crucial for my workflow. I'd love to know if this is on the roadmap!", type: 'question', resolved: false, flagged: false },
  { id: 2, product: 'Productivity Pro', author: 'James Thompson', email: 'james@startup.io', time: '5 hours ago', avatar: 2, tier: 3, content: "Love the product! Exactly what I was looking for. The setup was a bit tricky though - had to watch the tutorial twice. Maybe add more detailed onboarding for Tier 3 features? Otherwise, fantastic tool!", type: 'positive', resolved: false, flagged: false },
  { id: 3, product: 'Productivity Pro', author: 'Anita Patel', email: 'anita@design.co', time: '1 day ago', avatar: 3, tier: 1, content: "When is the mobile app coming out? I saw it's 'in development' but any timeline? Would love to use this on my iPad during commutes. Also, dark mode please!", type: 'question', resolved: false, flagged: false },
  { id: 4, product: 'Task Master', author: 'Michael Kim', email: 'mike@techfirm.com', time: '2 days ago', avatar: 4, tier: 2, content: "Has anyone tried comparing this with ProductX? I'm deciding between the two. This seems to have better UI but I heard ProductX has more integrations. Any thoughts from the founder?", type: 'question', resolved: false, flagged: false },
  { id: 5, product: 'Task Master', author: 'Rebecca Liu', email: 'rebecca@freelance.net', time: '2 days ago', avatar: 5, tier: 1, content: "I'm getting an error when trying to export my data. It says 'Connection timeout' - is the server down? I've tried 3 times today. Help would be appreciated!", type: 'issue', resolved: false, flagged: false },
  { id: 6, product: 'Task Master', author: 'David Chen', email: 'david@studio.app', time: '3 days ago', avatar: 6, tier: 3, content: "This tool has completely transformed how our team works. We've seen a 40% increase in productivity since switching. Highly recommend the Tier 3 plan - worth every penny!", type: 'review', resolved: false, flagged: false },
  { id: 7, product: 'Email Helper', author: 'Emma Watson', email: 'emma@creative.io', time: '4 days ago', avatar: 7, tier: 2, content: "Would love to see Airtable integration added! Also, the ability to create custom workflows would be amazing. This is already great but these features would make it perfect.", type: 'review', resolved: false, flagged: false },
  { id: 8, product: 'Email Helper', author: 'Robert Taylor', email: 'robert@dev.co', time: '5 days ago', avatar: 8, tier: 1, content: "App keeps crashing when I try to upload files larger than 10MB. Tried clearing cache, reinstalling, nothing works. This is blocking my entire workflow. Please fix ASAP!", type: 'issue', resolved: false, flagged: false },
  { id: 9, product: 'Email Helper', author: 'Sophie Durand', email: 'sophie@paris.fr', time: '6 days ago', avatar: 1, tier: 2, content: "Bonjour! Je suis tres interessee par votre produit mais je ne comprends pas comment configurer l'integration avec Notion. Est-ce que vous avez une documentation en francais? Merci beaucoup!", type: 'question', resolved: false, flagged: false }
];

let currentFilter = 'all';
let activeProduct = null;
let configuredProducts = [];
let liveCommentsData = [];
let configuredProductRecords = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initFilters();
  initToggles();
  await loadConfiguredProducts();
  renderSidebarProducts();
  initComments();
  setupStorageSync();
  console.log('ORBIT Demo Dashboard Loaded');
});

function setupStorageSync() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (changes.orbitProducts || changes.orbitCommentFeed || changes.orbitSettings) {
          console.log('[ORBIT Dashboard] Storage changed, refreshing products...');
          loadConfiguredProducts().then(() => {
            renderSidebarProducts();
            applyCurrentFilter();
          });
        }
      });
    }
  } catch (e) {
    console.warn('[ORBIT Dashboard] Storage sync not available:', e);
  }
}

function renderSidebarProducts() {
  const sidebarSection = document.querySelectorAll('.sidebar-section')[1];
  if (!sidebarSection) return;
  const menu = sidebarSection.querySelector('.sidebar-menu');
  if (!menu) return;
  const sourceIcons = ['📦','🛒','🚀','💎','🎯','📧','✨','🔧'];
  menu.innerHTML = '';
  if (!configuredProductRecords.length && !configuredProducts.length) {
    menu.innerHTML = '<li style="padding:12px 10px;color:#4b5563;font-size:11px;text-align:center">No products saved yet.<br>Visit a product page and click Add This Product.</li>';
    return;
  }
  const productsToShow = configuredProductRecords.length ? configuredProductRecords : configuredProducts.map((name, i) => ({ name, source: 'unknown' }));
  productsToShow.forEach((prod, idx) => {
    const name = typeof prod === 'string' ? prod : prod.name;
    const icon = sourceIcons[idx % sourceIcons.length];
    const li = document.createElement('li');
    li.className = 'sidebar-item';
    li.dataset.product = name;
    li.innerHTML = '<span class="sidebar-item-icon">' + icon + '</span><span class="sidebar-item-label">' + (name.length > 12 ? name.substring(0, 12) + '...' : name) + '</span>';
    li.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
      document.getElementById('comments').classList.add('active');
      activeProduct = name;
      renderProductTabs();
      applyCurrentFilter();
    });
    menu.appendChild(li);
  });
}

function readStorage(keys) {
  return new Promise(resolve => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(keys, resolve);
        return;
      }
    } catch (error) {
      console.warn('Storage read fallback:', error);
    }
    resolve({});
  });
}

async function loadConfiguredProducts() {
  const stored = await readStorage(['orbitProducts', 'orbitSettings', 'orbitCommentFeed']);
  configuredProductRecords = Array.isArray(stored.orbitProducts) ? stored.orbitProducts.filter(product => product?.name) : [];
  liveCommentsData = normalizeStoredComments(stored.orbitCommentFeed || []);
  const fallbackProducts = [...new Set(commentsData.map(comment => comment.product))];
  const demoPageTitle = document.title || '';
  const blocklist = [demoPageTitle, 'All Products', 'Untitled Product', 'Unknown Product'].map(s => s.toLowerCase());
  const realImportedProducts = configuredProductRecords
    .filter(p => !blocklist.includes(p.name.toLowerCase()) && !(p.url && p.url.includes('localhost')))
    .map(p => p.name);
  const realFeedProducts = [...new Set(liveCommentsData.map(c => c.product).filter(Boolean))]
    .filter(name => !blocklist.includes(name.toLowerCase()));
  configuredProducts = [...new Set([
    ...fallbackProducts,
    ...realImportedProducts,
    ...realFeedProducts
  ])];
  activeProduct = null;
  renderProductTabs();
}

function normalizeStoredComments(feed) {
  return (Array.isArray(feed) ? feed : []).map((comment, index) => ({
    id: comment.id || comment.hash || `stored-${index}`,
    product: comment.product || 'Untitled Product',
    author: comment.author || 'Customer',
    email: comment.email || '',
    time: comment.time || 'Just now',
    avatar: comment.avatar || ((index % 8) + 1),
    tier: comment.tier || (comment.risk >= 50 ? 1 : 2),
    content: comment.content || '',
    type: comment.type || (comment.risk >= 50 ? 'issue' : 'review'),
    resolved: Boolean(comment.resolved),
    flagged: Boolean(comment.flagged || comment.risk >= 50),
    risk: comment.risk || 0
  })).filter(comment => comment.content);
}

function getCommentsSource() {
  const merged = [...commentsData];
  const existingContent = new Set(merged.map(c => c.content.substring(0, 60).toLowerCase()));
  liveCommentsData.forEach(lc => {
    if (!configuredProducts.includes(lc.product)) return;
    const contentKey = (lc.content || '').substring(0, 60).toLowerCase();
    if (existingContent.has(contentKey)) return;
    existingContent.add(contentKey);
    merged.push(lc);
  });
  return merged;
}

function getActiveProductRecord() {
  if (activeProduct) {
    return configuredProductRecords.find(product => product.name === activeProduct) || null;
  }
  return configuredProductRecords[0] || null;
}

function persistLiveComments() {
  if (!liveCommentsData.length) return;
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({
        orbitCommentFeed: liveCommentsData.map(comment => ({
          id: comment.id,
          hash: comment.hash || comment.id,
          product: comment.product,
          author: comment.author,
          email: comment.email,
          time: comment.time,
          avatar: comment.avatar,
          tier: comment.tier,
          content: comment.content,
          type: comment.type,
          resolved: Boolean(comment.resolved),
          flagged: Boolean(comment.flagged),
          risk: comment.risk || 0
        }))
      });
    }
  } catch (error) {
    console.warn('Storage write fallback:', error);
  }
}

// Navigation
function initNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
      document.getElementById(pageId).classList.add('active');
      if (pageId !== 'comments') {
        activeProduct = configuredProducts.length === 1 ? configuredProducts[0] : null;
        applyCurrentFilter();
      }
    });
  });
}

// Comments
function initComments() {
  initReplyAllPending();
  applyCurrentFilter('all');
}

function renderProductTabs() {
  const selector = document.getElementById('product-selector');
  if (!selector) return;
  const tabs = ['all', ...configuredProducts];
  selector.innerHTML = tabs.map(product => {
    const isAll = product === 'all';
    const label = isAll ? 'All Products' : product;
    const isActive = isAll ? !activeProduct : activeProduct === product;
    return `<button class="product-tab ${isActive ? 'active' : ''}" data-product="${label}">${label}</button>`;
  }).join('');

  selector.querySelectorAll('.product-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      selector.querySelectorAll('.product-tab').forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      activeProduct = tab.dataset.product === 'All Products' ? null : tab.dataset.product;
      applyCurrentFilter();
      document.dispatchEvent(new CustomEvent('orbit:product-change', {
        detail: { product: activeProduct || 'All Products' }
      }));
    });
  });
}

function renderComments(comments) {
  const container = document.getElementById('comments-container');
  container.innerHTML = comments.map(comment => createCommentCard(comment)).join('');
  container.querySelectorAll('.reply-btn').forEach(btn => btn.addEventListener('click', e => toggleReply(e.target)));
  container.querySelectorAll('.resolve-btn').forEach(btn => btn.addEventListener('click', e => markResolved(e.target)));
  container.querySelectorAll('.flag-btn').forEach(btn => btn.addEventListener('click', e => toggleFlag(e.target)));
  container.querySelectorAll('.btn-post').forEach(btn => btn.addEventListener('click', e => postReply(e.target)));
  container.querySelectorAll('.btn-cancel').forEach(btn => btn.addEventListener('click', e => cancelReply(e.target)));
}

function createCommentCard(comment) {
  const tierClass = `tier-${comment.tier}`;
  const avatarClass = `avatar-${comment.avatar}`;
  const resolvedClass = comment.resolved ? 'resolved' : '';
  const flaggedClass = comment.flagged ? 'flagged' : '';

  return `
    <div class="comment-card ${resolvedClass} ${flaggedClass}" data-type="${comment.type}" data-id="${comment.id}" data-product="${comment.product}">
      <div class="comment-header">
        <div class="comment-author">
          <div class="avatar ${avatarClass}">${comment.author.split(' ').map(name => name[0]).join('')}</div>
          <div class="author-info">
            <h4>${comment.author}</h4>
            <span>${comment.product} • ${comment.email} • ${comment.time}</span>
          </div>
        </div>
        <div class="comment-meta">
          ${comment.flagged ? '<span class="flag-badge">Flagged</span>' : ''}
          <span class="tier-badge ${tierClass}">Tier ${comment.tier}</span>
        </div>
      </div>
      <div class="comment-content">${comment.content}</div>
      <div class="comment-actions">
        <button class="action-btn reply-btn">Reply</button>
        <button class="action-btn resolve-btn">Mark as Resolved</button>
        <button class="action-btn flagged-btn ${flaggedClass ? 'active' : ''}">Flag</button>
      </div>
      <div class="reply-form">
        <textarea placeholder="Write your reply..." id="orbit-reply-field-${comment.id}" name="orbit-reply"></textarea>
        <div class="reply-form-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-post">Post Reply</button>
        </div>
        <div class="reply-confirmation">Reply posted successfully!</div>
      </div>
    </div>
  `;
}

function toggleReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  replyForm.classList.toggle('active');
  if (replyForm.classList.contains('active')) replyForm.querySelector('textarea').focus();
}

function cancelReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  replyForm.classList.remove('active');
  replyForm.querySelector('textarea').value = '';
  replyForm.querySelector('.reply-confirmation').classList.remove('show');
}

function postReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  const textarea = replyForm.querySelector('textarea');
  const confirmation = replyForm.querySelector('.reply-confirmation');
  const commentId = commentCard.dataset.id;
  const comment = getCommentsSource().find(item => String(item.id) === String(commentId));
  const replyText = textarea.value.trim();
  if (!replyText) {
    textarea.style.borderColor = '#ff6b6b';
    setTimeout(() => { textarea.style.borderColor = '#2d3748'; }, 1000);
    return;
  }
  if (comment) comment.resolved = true;
  persistLiveComments();
  confirmation.classList.add('show');
  setTimeout(() => {
    textarea.value = '';
    replyForm.classList.remove('active');
    confirmation.classList.remove('show');
    applyCurrentFilter();
  }, 2000);
}

function markResolved(btn) {
  const commentCard = btn.closest('.comment-card');
  const commentId = commentCard.dataset.id;
  const comment = getCommentsSource().find(item => String(item.id) === String(commentId));
  if (comment) {
    comment.resolved = !comment.resolved;
    persistLiveComments();
    applyCurrentFilter();
  }
}

function toggleFlag(btn) {
  const commentCard = btn.closest('.comment-card');
  const commentId = commentCard.dataset.id;
  const comment = getCommentsSource().find(item => String(item.id) === String(commentId));
  if (comment) {
    comment.flagged = !comment.flagged;
    persistLiveComments();
    applyCurrentFilter();
  }
}

// Filters
function initFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(item => item.classList.remove('active'));
      tab.classList.add('active');
      applyCurrentFilter(tab.dataset.filter);
    });
  });
}

function initReplyAllPending() {
  const btn = document.getElementById('reply-all-pending');
  if (!btn) return;
  btn.addEventListener('click', () => {
    getProductFilteredComments().filter(comment => !comment.resolved).forEach(comment => {
      comment.resolved = true;
    });
    persistLiveComments();
    applyCurrentFilter();
  });
}

function getProductFilteredComments() {
  const sourceComments = getCommentsSource();
  const allowedProducts = configuredProducts.length ? configuredProducts : [...new Set(sourceComments.map(comment => comment.product))];
  const baseComments = sourceComments.filter(comment => allowedProducts.includes(comment.product));
  return activeProduct
    ? baseComments.filter(comment => comment.product === activeProduct)
    : baseComments;
}

function applyCurrentFilter(filter) {
  currentFilter = filter || currentFilter;
  const productFiltered = getProductFilteredComments();
  const filteredComments = currentFilter === 'all'
    ? productFiltered
    : productFiltered.filter(comment => comment.type === currentFilter);
  renderComments(filteredComments);
  renderProductContext(productFiltered);
  renderProductStats(productFiltered);
  updateProductLabel(productFiltered);
  updateReplyAllButton(productFiltered);
}

function renderProductContext(comments) {
  const card = document.getElementById('product-context-card');
  if (!card) return;
  const product = getActiveProductRecord();
  const productName = activeProduct || product?.name || 'All Products';
  const productDescription = product?.description || 'Imported product details from the sales page will appear here.';
  const productUrl = product?.url || '';
  const totalComments = comments.length;
  card.innerHTML = `
    <div class="product-context-kicker">Imported Product</div>
    <div class="product-context-title">${productName}</div>
    <div class="product-context-description">${productDescription}</div>
    <div class="product-context-meta">${totalComments} comments loaded${productUrl ? ` • ${productUrl}` : ''}</div>
  `;
}

function renderProductStats(comments) {
  const statsEl = document.getElementById('product-stats');
  if (!statsEl) return;
  const total = comments.length;
  const risks = comments.filter(comment => comment.flagged || comment.type === 'issue').length;
  const replied = comments.filter(comment => comment.resolved).length;
  const pending = comments.filter(comment => !comment.resolved).length;
  statsEl.innerHTML = `
    <div class="product-stat"><div class="product-stat-value">${total}</div><div class="product-stat-label">Total</div></div>
    <div class="product-stat"><div class="product-stat-value">${risks}</div><div class="product-stat-label">Risks</div></div>
    <div class="product-stat"><div class="product-stat-value">${replied}</div><div class="product-stat-label">Replied</div></div>
    <div class="product-stat"><div class="product-stat-value">${pending}</div><div class="product-stat-label">Pending</div></div>
  `;
}

function updateProductLabel(comments) {
  const label = document.getElementById('comments-product-label');
  if (!label) return;
  const productName = activeProduct || (configuredProducts.length === 1 ? configuredProducts[0] : 'All Products');
  label.textContent = `Showing ${comments.length} comments for ${productName}`;
}

function updateReplyAllButton(comments) {
  const btn = document.getElementById('reply-all-pending');
  if (!btn) return;
  const pending = comments.filter(comment => !comment.resolved).length;
  btn.textContent = `⚡ Reply All Pending (${pending})`;
  btn.disabled = pending === 0;
}

// Toggle switches
function initToggles() {
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });
}
