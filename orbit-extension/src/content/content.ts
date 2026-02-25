/**
 * Content Script - Injects ORBIT overlay into sales dashboards
 * Runs on supported platforms only
 */

import { PlatformDetector } from '../utils/platformDetector';
import { logger } from '../utils/logger';

// Check if we're on a supported platform
if (PlatformDetector.isSupported()) {
  logger.info('ORBIT content script loaded on supported platform');
  
  // Initialize ORBIT
  initializeOrbit();
} else {
  logger.info('Platform not supported, ORBIT inactive');
}

function initializeOrbit() {
  // Inject floating widget
  injectWidget();
  
  // Watch for dynamic content
  observePageChanges();
  
  // Set up message listener
  setupMessageListener();
}

function injectWidget() {
  // Create widget container
  const widget = document.createElement('div');
  widget.id = 'orbit-widget';
  widget.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: linear-gradient(135deg, #1a1f36 0%, #252b47 100%);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      min-width: 200px;
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#00d4ff" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#00d4ff"/>
        </svg>
        <span style="font-weight: 700; font-size: 16px;">ORBIT</span>
        <span style="
          width: 8px;
          height: 8px;
          background: #51cf66;
          border-radius: 50%;
          margin-left: auto;
        "></span>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="orbit-analytics" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">📊 Analytics</button>
        
        <button id="orbit-replies" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">💬 Replies</button>
        
        <button id="orbit-keywords" style="
          padding: 10px 16px;
          background: #252b47;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        ">🔍 Keywords</button>
      </div>
      
      <div style="
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-around;
        font-size: 11px;
        color: #8b92a8;
      ">
        <div style="text-align: center;">
          <div id="orbit-stat-responses" style="font-size: 18px; font-weight: 700; color: #00d4ff;">0</div>
          <div>Responses</div>
        </div>
        <div style="text-align: center;">
          <div id="orbit-stat-time" style="font-size: 18px; font-weight: 700; color: #00d4ff;">0h</div>
          <div>Saved</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(widget);
  
  // Add event listeners
  widget.querySelector('#orbit-analytics')?.addEventListener('click', () => {
    showAnalyticsPanel();
  });
  
  widget.querySelector('#orbit-replies')?.addEventListener('click', () => {
    scanForComments();
  });
  
  widget.querySelector('#orbit-keywords')?.addEventListener('click', () => {
    analyzeKeywords();
  });
  
  // Update stats periodically
  updateStats();
  setInterval(updateStats, 5000);
}

async function updateStats() {
  const responses = document.getElementById('orbit-stat-responses');
  const time = document.getElementById('orbit-stat-time');
  
  if (responses && time) {
    const stored = await chrome.storage.local.get(['responsesGenerated', 'timeSaved']);
    responses.textContent = (stored.responsesGenerated || 0).toString();
    time.textContent = Math.floor((stored.timeSaved || 0) / 60) + 'h';
  }
}

function showAnalyticsPanel() {
  // Create analytics panel
  const panel = document.createElement('div');
  panel.id = 'orbit-analytics-panel';
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 260px;
      width: 350px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    ">
      <div style="
        padding: 16px;
        background: #1a1f36;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 16px;">📊 Sales Analytics</h3>
        <button id="orbit-close-analytics" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>
      <div style="padding: 16px; overflow-y: auto;">
        <p style="color: #666;">Analytics will appear here...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  panel.querySelector('#orbit-close-analytics')?.addEventListener('click', () => {
    panel.remove();
  });
}

function scanForComments() {
  const comments = PlatformDetector.extractComments();
  logger.info(`Found ${comments.length} comments`);
  
  comments.forEach((comment: Element, _index) => {
    // Add reply button to each comment
    if (!comment.querySelector('.orbit-reply-btn')) {
      const replyBtn = document.createElement('button');
      replyBtn.className = 'orbit-reply-btn';
      replyBtn.textContent = '🤖 AI Reply';
      replyBtn.style.cssText = `
        margin-left: 8px;
        padding: 6px 12px;
        background: #00d4ff;
        color: #1a1f36;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      `;
      
      replyBtn.addEventListener('click', () => {
        generateReplyForComment(comment);
      });
      
      comment.appendChild(replyBtn);
    }
  });
}

async function generateReplyForComment(comment: Element) {
  // Send message to background script
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
      // Show reply modal
      showReplyModal(comment, response.reply);
    }
  } catch (error) {
    logger.error('Failed to generate reply:', error);
  }
}

function showReplyModal(_comment: Element, reply: string) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 9999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: auto;
    ">
      <h3 style="margin: 0 0 16px 0;">AI-Generated Reply</h3>
      <textarea style="
        width: 100%;
        min-height: 120px;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        margin-bottom: 16px;
      ">${reply}</textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="orbit-modal-cancel" style="
          padding: 10px 20px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">Cancel</button>
        <button id="orbit-modal-copy" style="
          padding: 10px 20px;
          background: #00d4ff;
          color: #1a1f36;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        ">Copy</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#orbit-modal-cancel')?.addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('#orbit-modal-copy')?.addEventListener('click', () => {
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      navigator.clipboard.writeText(textarea.value);
    }
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function analyzeKeywords() {
  logger.info('Analyzing keywords...');
  // Implementation for keyword analysis
}

function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check if new comments were added
    const hasNewComments = mutations.some(mutation => 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          (node as Element).matches?.('.comment, .review') ||
          (node as Element).querySelector?.('.comment, .review')
        )
      )
    );
    
    if (hasNewComments) {
      setTimeout(scanForComments, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'refreshUI') {
      updateStats();
      sendResponse({ success: true });
    }
    return true;
  });
}