/**
 * AI Router Module
 * Handles multi-provider AI requests with smart routing and cost optimization
 */

import type { AIProvider, AIResponse, ProviderConfig } from '../types';
import { SecureStorage } from './encryption';

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI GPT-4 Turbo',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    costPerToken: { input: 0.01 / 1000, output: 0.03 / 1000 }
  },
  claude: {
    name: 'Anthropic Claude Sonnet 4',
    endpoint: 'https://api.anthropic.com/v1/messages',
    costPerToken: { input: 0.003 / 1000, output: 0.015 / 1000 }
  },
  gemini: {
    name: 'Google Gemini Pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    costPerToken: { input: 0, output: 0 },
    rateLimit: { requests: 100000, period: 'month' }
  },
  groq: {
    name: 'Groq Llama 70B',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    costPerToken: { input: 0, output: 0 },
    rateLimit: { requests: 1000, period: 'day' }
  }
};

export class AIRouter {
  /**
   * Generate AI reply with smart routing
   */
  static async generateReply(
    prompt: string,
    context: string,
    options: {
      preferredProvider?: AIProvider;
      taskComplexity?: 'low' | 'medium' | 'high';
      urgency?: boolean;
    } = {}
  ): Promise<AIResponse> {
    const { preferredProvider, taskComplexity = 'medium', urgency = false } = options;
    
    // Check available providers and budget
    const availableProviders = await this.getAvailableProviders();
    const remainingBudget = await this.getRemainingBudget();
    
    if (availableProviders.length === 0) {
      throw new Error('No API keys configured. Please add an API key in settings.');
    }
    
    // Select optimal provider
    const provider = preferredProvider || await this.selectOptimalProvider(
      taskComplexity,
      availableProviders,
      remainingBudget,
      urgency
    );
    
    // Get API key
    const apiKey = await SecureStorage.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`API key for ${provider} not found`);
    }
    
    // Make API call
    const result = await this.callProvider(provider, apiKey, prompt, context);
    
    // Track usage
    await this.trackUsage(provider, result.tokens, result.cost);
    
    // Check if approaching budget limit
    await this.checkBudgetWarnings(provider);
    
    return result;
  }
  
  /**
   * Select best provider based on task and constraints
   */
  private static async selectOptimalProvider(
    complexity: 'low' | 'medium' | 'high',
    available: AIProvider[],
    budget: number,
    urgency: boolean
  ): Promise<AIProvider> {
    // If budget exhausted, use free only
    if (budget <= 0) {
      if (available.includes('gemini')) return 'gemini';
      if (available.includes('groq')) return 'groq';
      throw new Error('Budget exhausted. Please add budget or use free models.');
    }
    
    // Check rate limits
    const withinLimit = await this.checkRateLimits(available);
    
    // Urgent request? Use fastest (Groq if available)
    if (urgency && withinLimit.includes('groq')) {
      return 'groq';
    }
    
    // Route based on complexity
    switch (complexity) {
      case 'low':
        // Simple tasks - use free models
        if (withinLimit.includes('groq')) return 'groq';
        if (withinLimit.includes('gemini')) return 'gemini';
        break;
        
      case 'medium':
        // Medium tasks - use Gemini if available (free but better quality)
        if (withinLimit.includes('gemini')) return 'gemini';
        if (withinLimit.includes('groq')) return 'groq';
        if (withinLimit.includes('claude')) return 'claude';
        break;
        
      case 'high':
        // Complex tasks - use best quality
        if (withinLimit.includes('claude')) return 'claude';
        if (withinLimit.includes('openai')) return 'openai';
        if (withinLimit.includes('gemini')) return 'gemini';
        break;
    }
    
    // Fallback to first available
    return available[0];
  }
  
  /**
   * Make API call to specific provider
   */
  private static async callProvider(
    provider: AIProvider,
    apiKey: string,
    prompt: string,
    context: string
  ): Promise<AIResponse> {
    const config = PROVIDERS[provider];
    let requestBody: any;
    let headers: Record<string, string>;
    let url = config.endpoint;
    
    switch (provider) {
      case 'openai':
      case 'groq':
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };
        requestBody = {
          model: provider === 'openai' ? 'gpt-4-turbo-preview' : 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: context },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        };
        break;
        
      case 'claude':
        headers = {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        };
        requestBody = {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: `${context}\n\n${prompt}` }
          ]
        };
        break;
        
      case 'gemini':
        headers = { 'Content-Type': 'application/json' };
        url = `${config.endpoint}?key=${apiKey}`;
        requestBody = {
          contents: [{
            parts: [{ text: `${context}\n\n${prompt}` }]
          }]
        };
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    
    // Parse response based on provider
    let reply: string;
    let tokens: number;
    
    switch (provider) {
      case 'openai':
      case 'groq':
        reply = data.choices[0].message.content;
        tokens = data.usage?.total_tokens || Math.ceil((prompt.length + reply.length) / 4);
        break;
        
      case 'claude':
        reply = data.content[0].text;
        tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
        break;
        
      case 'gemini':
        reply = data.candidates[0].content.parts[0].text;
        tokens = Math.ceil((prompt.length + reply.length) / 4);
        break;
        
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    // Calculate cost
    const cost = tokens * (config.costPerToken.input + config.costPerToken.output);
    
    return { reply, cost, provider, tokens };
  }
  
  /**
   * Track API usage in storage
   */
  private static async trackUsage(
    provider: AIProvider,
    tokens: number,
    cost: number
  ): Promise<void> {
    const month = new Date().toISOString().slice(0, 7);
    const usageKey = `usage_${month}`;
    
    const stored = await chrome.storage.local.get(usageKey);
    const usage = stored[usageKey] || {};
    
    if (!usage[provider]) {
      usage[provider] = { tokens: 0, cost: 0, requests: 0, history: [] };
    }
    
    usage[provider].tokens += tokens;
    usage[provider].cost += cost;
    usage[provider].requests += 1;
    usage[provider].history.push({
      timestamp: Date.now(),
      tokens,
      cost
    });
    
    // Keep only last 1000 requests per provider
    if (usage[provider].history.length > 1000) {
      usage[provider].history = usage[provider].history.slice(-1000);
    }
    
    await chrome.storage.local.set({ [usageKey]: usage });
  }
  
  /**
   * Check if approaching budget limits and alert
   */
  private static async checkBudgetWarnings(_provider: AIProvider): Promise<void> {
    const settings = await chrome.storage.local.get(['monthlyBudget', 'warningThreshold']);
    const budget = settings.monthlyBudget || 10;
    const threshold = settings.warningThreshold || 80;
    
    const month = new Date().toISOString().slice(0, 7);
    const usageData = await chrome.storage.local.get(`usage_${month}`);
    
    if (!usageData[`usage_${month}`]) return;
    
    let totalCost = 0;
    Object.values(usageData[`usage_${month}`]).forEach((p: any) => {
      totalCost += p.cost || 0;
    });
    
    const percentage = (totalCost / budget) * 100;
    
    if (percentage >= threshold && percentage < threshold + 5) {
      // Show warning notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ORBIT Budget Warning',
        message: `You've used ${percentage.toFixed(0)}% of your monthly budget ($${totalCost.toFixed(2)} / $${budget})`
      });
    }
    
    if (percentage >= 100) {
      // Budget exceeded
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ORBIT Budget Exceeded',
        message: 'Your monthly budget has been exceeded. Switching to free models only.'
      });
    }
  }
  
  /**
   * Get available providers (those with API keys)
   */
  private static async getAvailableProviders(): Promise<AIProvider[]> {
    const keys = await chrome.storage.local.get([
      'api_openai', 'api_claude', 'api_gemini', 'api_groq'
    ]);
    
    const providers: AIProvider[] = [];
    if (keys.api_openai) providers.push('openai');
    if (keys.api_claude) providers.push('claude');
    if (keys.api_gemini) providers.push('gemini');
    if (keys.api_groq) providers.push('groq');
    
    return providers;
  }
  
  /**
   * Get remaining budget for the month
   */
  private static async getRemainingBudget(): Promise<number> {
    const settings = await chrome.storage.local.get('monthlyBudget');
    const budget = settings.monthlyBudget || 10;
    
    const month = new Date().toISOString().slice(0, 7);
    const usageData = await chrome.storage.local.get(`usage_${month}`);
    
    let totalSpent = 0;
    if (usageData[`usage_${month}`]) {
      Object.values(usageData[`usage_${month}`]).forEach((p: any) => {
        totalSpent += p.cost || 0;
      });
    }
    
    return budget - totalSpent;
  }
  
  /**
   * Check which providers are within rate limits
   */
  private static async checkRateLimits(providers: AIProvider[]): Promise<AIProvider[]> {
    const withinLimit: AIProvider[] = [];
    
    for (const provider of providers) {
      const config = PROVIDERS[provider];
      if (!config.rateLimit) {
        withinLimit.push(provider);
        continue;
      }
      
      const usage = await this.getProviderUsageForPeriod(provider, config.rateLimit.period);
      if (usage < config.rateLimit.requests) {
        withinLimit.push(provider);
      }
    }
    
    return withinLimit;
  }
  
  /**
   * Get provider usage for specific time period
   */
  static async getProviderUsageForPeriod(
    provider: AIProvider,
    period: 'hour' | 'day' | 'month'
  ): Promise<number> {
    const month = new Date().toISOString().slice(0, 7);
    const usageData = await chrome.storage.local.get(`usage_${month}`);
    
    if (!usageData[`usage_${month}`]?.[provider]) return 0;
    
    const history = usageData[`usage_${month}`][provider].history || [];
    const now = Date.now();
    
    let cutoff: number;
    switch (period) {
      case 'hour':
        cutoff = now - 60 * 60 * 1000;
        break;
      case 'day':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case 'month':
        cutoff = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        break;
    }
    
    return history.filter((h: any) => h.timestamp > cutoff).length;
  }
  
  /**
   * Get provider configuration
   */
  static getProviderConfig(provider: AIProvider): ProviderConfig {
    return PROVIDERS[provider];
  }
  
  /**
   * Get all provider configs
   */
  static getAllProviders(): Record<AIProvider, ProviderConfig> {
    return PROVIDERS;
  }
}