/**
 * Cost Calculator Module
 * Real-time cost tracking and estimation
 */

import type { AIProvider } from '../types';
import { AIRouter } from '../lib/aiRouter';

export class CostCalculator {
  /**
   * Estimate cost for a request
   */
  static estimateCost(
    provider: AIProvider,
    estimatedTokens: number
  ): { cost: number; formatted: string } {
    const config = AIRouter.getProviderConfig(provider);
    const cost = estimatedTokens * (config.costPerToken.input + config.costPerToken.output);
    
    return {
      cost,
      formatted: cost === 0 ? 'FREE' : `~$${cost.toFixed(3)}`
    };
  }
  
  /**
   * Estimate tokens from text length
   * Rough estimate: 1 token ≈ 4 characters
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Get current month usage
   */
  static async getCurrentMonthUsage(): Promise<{
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    byProvider: Record<string, { cost: number; tokens: number; requests: number }>;
  }> {
    const month = new Date().toISOString().slice(0, 7);
    const stored = await chrome.storage.local.get(`usage_${month}`);
    
    const usage = stored[`usage_${month}`] || {};
    
    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    const byProvider: Record<string, any> = {};
    
    for (const [provider, data] of Object.entries(usage)) {
      const p = data as any;
      totalCost += p.cost || 0;
      totalTokens += p.tokens || 0;
      totalRequests += p.requests || 0;
      
      byProvider[provider] = {
        cost: p.cost || 0,
        tokens: p.tokens || 0,
        requests: p.requests || 0
      };
    }
    
    return { totalCost, totalTokens, totalRequests, byProvider };
  }
  
  /**
   * Get budget status
   */
  static async getBudgetStatus(): Promise<{
    budget: number;
    used: number;
    remaining: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const settings = await chrome.storage.local.get('monthlyBudget');
    const budget = settings.monthlyBudget || 10;
    
    const { totalCost } = await this.getCurrentMonthUsage();
    const remaining = budget - totalCost;
    const percentage = (totalCost / budget) * 100;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentage >= 95) status = 'critical';
    else if (percentage >= 80) status = 'warning';
    
    return { budget, used: totalCost, remaining, percentage, status };
  }
  
  /**
   * Get cost savings from smart routing
   */
  static async calculateSavings(): Promise<{
    potentialCost: number;
    actualCost: number;
    savings: number;
    savingsPercentage: number;
  }> {
    const { byProvider } = await this.getCurrentMonthUsage();
    
    // Assume GPT-4 would have been used for everything (most expensive)
    const gpt4Config = AIRouter.getProviderConfig('openai');
    let potentialCost = 0;
    let actualCost = 0;
    
    for (const [_provider, data] of Object.entries(byProvider)) {
      const p = data as any;
      actualCost += p.cost || 0;
      
      // Calculate what it would have cost with GPT-4
      const tokens = p.tokens || 0;
      potentialCost += tokens * (gpt4Config.costPerToken.input + gpt4Config.costPerToken.output);
    }
    
    const savings = potentialCost - actualCost;
    const savingsPercentage = potentialCost > 0 ? (savings / potentialCost) * 100 : 0;
    
    return { potentialCost, actualCost, savings, savingsPercentage };
  }
  
  /**
   * Format cost for display
   */
  static formatCost(cost: number): string {
    if (cost === 0) return 'FREE';
    if (cost < 0.01) return '< $0.01';
    return `$${cost.toFixed(2)}`;
  }
  
  /**
   * Format large numbers
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
}