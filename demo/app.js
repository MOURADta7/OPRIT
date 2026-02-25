// ORBIT Demo Dashboard - Application Logic

// Comment Data
const commentsData = [
  {
    id: 1,
    author: 'Sarah Mitchell',
    email: 'sarah@company.com',
    time: '2 hours ago',
    avatar: 1,
    tier: 2,
    content: "Does this integrate with Notion? I didn't see it mentioned in the description but it's crucial for my workflow. I'd love to know if this is on the roadmap!",
    type: 'question',
    resolved: false,
    flagged: false
  },
  {
    id: 2,
    author: 'James Thompson',
    email: 'james@startup.io',
    time: '5 hours ago',
    avatar: 2,
    tier: 3,
    content: "Love the product! Exactly what I was looking for. The setup was a bit tricky though - had to watch the tutorial twice. Maybe add more detailed onboarding for Tier 3 features? Otherwise, fantastic tool!",
    type: 'positive',
    resolved: false,
    flagged: false
  },
  {
    id: 3,
    author: 'Anita Patel',
    email: 'anita@design.co',
    time: '1 day ago',
    avatar: 3,
    tier: 1,
    content: "When is the mobile app coming out? I saw it's 'in development' but any timeline? Would love to use this on my iPad during commutes. Also, dark mode please! 🙏",
    type: 'question',
    resolved: false,
    flagged: false
  },
  {
    id: 4,
    author: 'Michael Kim',
    email: 'mike@techfirm.com',
    time: '2 days ago',
    avatar: 4,
    tier: 2,
    content: "Has anyone tried comparing this with ProductX? I'm deciding between the two. This seems to have better UI but I heard ProductX has more integrations. Any thoughts from the founder?",
    type: 'question',
    resolved: false,
    flagged: false
  },
  {
    id: 5,
    author: 'Rebecca Liu',
    email: 'rebecca@freelance.net',
    time: '2 days ago',
    avatar: 5,
    tier: 1,
    content: "I'm getting an error when trying to export my data. It says 'Connection timeout' - is the server down? I've tried 3 times today. Help would be appreciated!",
    type: 'issue',
    resolved: false,
    flagged: false
  },
  {
    id: 6,
    author: 'David Chen',
    email: 'david@studio.app',
    time: '3 days ago',
    avatar: 6,
    tier: 3,
    content: "This tool has completely transformed how our team works. We've seen a 40% increase in productivity since switching. Highly recommend the Tier 3 plan - worth every penny!",
    type: 'review',
    resolved: false,
    flagged: false
  },
  {
    id: 7,
    author: 'Emma Watson',
    email: 'emma@creative.io',
    time: '4 days ago',
    avatar: 7,
    tier: 2,
    content: "Would love to see Airtable integration added! Also, the ability to create custom workflows would be amazing. This is already great but these features would make it perfect.",
    type: 'review',
    resolved: false,
    flagged: false
  },
  {
    id: 8,
    author: 'Robert Taylor',
    email: 'robert@dev.co',
    time: '5 days ago',
    avatar: 8,
    tier: 1,
    content: "App keeps crashing when I try to upload files larger than 10MB. Tried clearing cache, reinstalling, nothing works. This is blocking my entire workflow. Please fix ASAP!",
    type: 'issue',
    resolved: false,
    flagged: false
  }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initComments();
  initFilters();
  initToggles();
  console.log('🎯 ORBIT Demo Dashboard Loaded');
  console.log('💡 Install ORBIT extension and click "Reply" to test AI assistant');
});

// Navigation
function initNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-page]');
  
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;
      
      // Update active state
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Show correct section
      document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(pageId).classList.add('active');
    });
  });
}

// Comments
function initComments() {
  renderComments(commentsData);
}

function renderComments(comments) {
  const container = document.getElementById('comments-container');
  container.innerHTML = comments.map(comment => createCommentCard(comment)).join('');
  
  // Attach event listeners
  container.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => toggleReply(e.target));
  });
  
  container.querySelectorAll('.resolve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => markResolved(e.target));
  });
  
  container.querySelectorAll('.flag-btn').forEach(btn => {
    btn.addEventListener('click', (e) => toggleFlag(e.target));
  });
  
  container.querySelectorAll('.btn-post').forEach(btn => {
    btn.addEventListener('click', (e) => postReply(e.target));
  });
  
  container.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => cancelReply(e.target));
  });
}

function createCommentCard(comment) {
  const tierClass = `tier-${comment.tier}`;
  const avatarClass = `avatar-${comment.avatar}`;
  const resolvedClass = comment.resolved ? 'resolved' : '';
  const flaggedClass = comment.flagged ? 'flagged' : '';
  
  return `
    <div class="comment-card ${resolvedClass} ${flaggedClass}" data-type="${comment.type}" data-id="${comment.id}">
      <div class="comment-header">
        <div class="comment-author">
          <div class="avatar ${avatarClass}">${comment.author.split(' ').map(n => n[0]).join('')}</div>
          <div class="author-info">
            <h4>${comment.author}</h4>
            <span>${comment.email} • ${comment.time}</span>
          </div>
        </div>
        <div class="comment-meta">
          ${comment.flagged ? '<span class="flag-badge">🚩 Flagged</span>' : ''}
          <span class="tier-badge ${tierClass}">Tier ${comment.tier}</span>
        </div>
      </div>
      <div class="comment-content">${comment.content}</div>
      <div class="comment-actions">
        <button class="action-btn reply-btn">💬 Reply</button>
        <button class="action-btn resolve-btn">✓ Mark as Resolved</button>
        <button class="action-btn flagged-btn ${flaggedClass ? 'active' : ''}">🚩 Flag</button>
      </div>
      <div class="reply-form">
        <textarea placeholder="Write your reply..."></textarea>
        <div class="reply-form-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-post">Post Reply</button>
        </div>
        <div class="reply-confirmation">✓ Reply posted successfully!</div>
      </div>
    </div>
  `;
}

function toggleReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  replyForm.classList.toggle('active');
  
  if (replyForm.classList.contains('active')) {
    replyForm.querySelector('textarea').focus();
  }
}

function cancelReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  const textarea = replyForm.querySelector('textarea');
  const confirmation = replyForm.querySelector('.reply-confirmation');
  
  replyForm.classList.remove('active');
  textarea.value = '';
  confirmation.classList.remove('show');
}

function postReply(btn) {
  const commentCard = btn.closest('.comment-card');
  const replyForm = commentCard.querySelector('.reply-form');
  const textarea = replyForm.querySelector('textarea');
  const confirmation = replyForm.querySelector('.reply-confirmation');
  
  const replyText = textarea.value.trim();
  
  if (!replyText) {
    textarea.style.borderColor = '#ff6b6b';
    setTimeout(() => {
      textarea.style.borderColor = '#2d3748';
    }, 1000);
    return;
  }
  
  // Show confirmation
  confirmation.classList.add('show');
  
  // Clear textarea and hide form after delay
  setTimeout(() => {
    textarea.value = '';
    replyForm.classList.remove('active');
    confirmation.classList.remove('show');
  }, 2000);
}

function markResolved(btn) {
  const commentCard = btn.closest('.comment-card');
  const commentId = parseInt(commentCard.dataset.id);
  
  const comment = commentsData.find(c => c.id === commentId);
  if (comment) {
    comment.resolved = !comment.resolved;
    renderComments(commentsData);
    applyCurrentFilter();
  }
}

function toggleFlag(btn) {
  const commentCard = btn.closest('.comment-card');
  const commentId = parseInt(commentCard.dataset.id);
  
  const comment = commentsData.find(c => c.id === commentId);
  if (comment) {
    comment.flagged = !comment.flagged;
    renderComments(commentsData);
    applyCurrentFilter();
  }
}

// Filters
function initFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const filter = tab.dataset.filter;
      applyCurrentFilter(filter);
    });
  });
}

let currentFilter = 'all';

function applyCurrentFilter(filter) {
  currentFilter = filter || currentFilter;
  
  const filteredComments = currentFilter === 'all' 
    ? commentsData 
    : commentsData.filter(c => c.type === currentFilter);
  
  renderComments(filteredComments);
}

// Toggle switches
function initToggles() {
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });
}
