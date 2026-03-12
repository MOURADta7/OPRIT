/**
 * Background Service Worker
 * Handles API calls, message passing, and background tasks
 */

import { AIRouter } from '../lib/aiRouter';
import { logger } from '../utils/logger';

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('ORBIT installed:', details.reason);
  
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
  logger.info('Background received message:', request.action);
  
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
async function handleGenerateReply(data: any) {
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

    const result = await AIRouter.generateReply(prompt, systemContext, {
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
  } catch (error: any) {
    logger.error('Generate reply error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate reply'
    };
  }
}

/**
 * Analyze sales data
 */
async function handleAnalyzeSales(data: any[]) {
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

    const result = await AIRouter.generateReply(
      'Provide a brief analysis of these sales metrics.',
      context,
      { taskComplexity: 'low' }
    );
    
    return {
      success: true,
      analysis: {
        summary: result.reply,
        totalRevenue,
        totalSales,
        avgOrderValue: totalRevenue / totalSales
      }
    };
  } catch (error: any) {
    logger.error('Analyze sales error:', error);
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test API key
 */
async function handleTestApiKey(data: { provider: string; key: string }) {
  try {
    // Simple test request
    let endpoint: string;
    let headers: Record<string, string>;
    
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
  } catch (error: any) {
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
      Object.values(usageData[`usage_${month}`]).forEach((p: any) => {
        totalCost += p.cost || 0;
      });
    }
    
    const percentage = (totalCost / budget) * 100;
    let status = 'healthy';
    if (percentage >= 95) status = 'critical';
    else if (percentage >= 80) status = 'warning';
    
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
  } catch (error: any) {
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
    } else {
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
  
  const keysToDelete: string[] = [];
  
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
    logger.info(`Cleaned up ${keysToDelete.length} old data entries`);
  }
}