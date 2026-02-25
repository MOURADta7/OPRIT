import { useState, useEffect } from 'react';
import { AIRouter } from '../lib/aiRouter';
import { CostCalculator } from '../utils/costCalculator';
import type { AIProvider } from '../types';

interface ProviderUsage {
  provider: AIProvider;
  displayName: string;
  tokens: number;
  cost: number;
  requests: number;
  limit: { current: number; max: number; type: string } | null;
  percentage: number;
}

export function UsageMonitor() {
  const [usage, setUsage] = useState<ProviderUsage[]>([]);
  const [budget, setBudget] = useState<{ budget: number; used: number; remaining: number; percentage: number; status: 'healthy' | 'warning' | 'critical' }>({ budget: 10, used: 0, remaining: 0, percentage: 0, status: 'healthy' });
  const [savings, setSavings] = useState({ potentialCost: 0, actualCost: 0, savings: 0, savingsPercentage: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      setLoading(true);
      
      // Load usage data
      const month = new Date().toISOString().slice(0, 7);
      const stored = await chrome.storage.local.get(`usage_${month}`);
      const budgetStatus = await CostCalculator.getBudgetStatus();
      const savingsData = await CostCalculator.calculateSavings();
      
      const usageData: ProviderUsage[] = [];
      
      if (stored[`usage_${month}`]) {
        for (const [provider, data] of Object.entries(stored[`usage_${month}`])) {
          const p = data as any;
          const config = AIRouter.getProviderConfig(provider as AIProvider);
          
          // Check rate limits
          let limit = null;
          if (config.rateLimit) {
            const current = await AIRouter['getProviderUsageForPeriod'](
              provider as AIProvider, 
              config.rateLimit.period
            );
            limit = {
              current,
              max: config.rateLimit.requests,
              type: config.rateLimit.period
            };
          }
          
          usageData.push({
            provider: provider as AIProvider,
            displayName: config.name,
            tokens: p.tokens || 0,
            cost: p.cost || 0,
            requests: p.requests || 0,
            limit,
            percentage: limit ? (limit.current / limit.max) * 100 : 0
          });
        }
      }
      
      setUsage(usageData);
      setBudget(budgetStatus);
      setSavings(savingsData);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const getBudgetColor = () => {
    switch (budget.status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading usage data...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">API Usage Monitor</h2>
      
      {/* Monthly Budget */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700">Monthly Budget</span>
          <span className="text-sm text-gray-600">
            {CostCalculator.formatCost(budget.used)} / {CostCalculator.formatCost(budget.budget)}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getBudgetColor()}`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-600">{budget.percentage.toFixed(0)}% used</span>
          <span className="text-gray-600">Remaining: {CostCalculator.formatCost(budget.remaining)}</span>
        </div>
        
        {budget.status === 'warning' && (
          <p className="text-yellow-600 text-sm mt-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Approaching budget limit. Consider using free models.
          </p>
        )}
        
        {budget.status === 'critical' && (
          <p className="text-red-600 text-sm mt-2 flex items-center">
            <span className="mr-2">🚨</span>
            Budget nearly exhausted. Switching to free models only.
          </p>
        )}
      </div>
      
      {/* Savings Summary */}
      {savings.savings > 0 && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">💰 Your Savings</h3>
          <p className="text-green-700">
            ORBIT's smart routing has saved you{' '}
            <span className="font-bold">{CostCalculator.formatCost(savings.savings)}</span>
            {' '}this month ({savings.savingsPercentage.toFixed(0)}% savings)
          </p>
          <p className="text-sm text-green-600 mt-1">
            vs using premium models for everything
          </p>
        </div>
      )}
      
      {/* Provider Usage */}
      {usage.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Usage by Provider</h3>
          
          {usage.map(provider => (
            <div key={provider.provider} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{provider.displayName}</h4>
                  <p className="text-sm text-gray-600">
                    {provider.requests.toLocaleString()} requests
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">
                    {CostCalculator.formatCost(provider.cost)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {CostCalculator.formatNumber(provider.tokens)} tokens
                  </p>
                </div>
              </div>
              
              {provider.limit && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      Rate Limit ({provider.limit.type})
                    </span>
                    <span className="text-gray-600">
                      {provider.limit.current.toLocaleString()} / {provider.limit.max.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        provider.percentage > 90 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(provider.percentage, 100)}%` }}
                    />
                  </div>
                  {provider.percentage > 80 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Approaching {provider.limit.type} limit
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No usage data yet.</p>
          <p className="text-sm mt-1">Start using ORBIT to see your API usage here.</p>
        </div>
      )}
      
      {/* Smart Recommendations */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3">💡 Optimization Tips</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          {budget.percentage > 80 && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Consider using Gemini or Groq for simple tasks - they're free!
            </li>
          )}
          
          {usage.some(p => p.provider === 'openai' && p.cost > 2) && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              You're spending ${usage.find(p => p.provider === 'openai')?.cost.toFixed(2)} on OpenAI. 
              Claude Sonnet offers similar quality at 60% lower cost.
            </li>
          )}
          
          {!usage.some(p => p.provider === 'gemini') && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Try Gemini Pro - it's free for up to 100K requests/month with excellent quality.
            </li>
          )}
          
          {usage.length === 0 && (
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Add your API keys to start using ORBIT's smart routing and save on AI costs.
            </li>
          )}
        </ul>
      </div>
      
      <button 
        onClick={loadData}
        className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
      >
        Refresh Data
      </button>
    </div>
  );
}