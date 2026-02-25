import { useState, useEffect } from 'react';
import { SecureStorage } from '../lib/encryption';
import { AIRouter } from '../lib/aiRouter';
import type { AIProvider, UserSettings } from '../types';

interface APIKeyStatus {
  provider: AIProvider;
  name: string;
  hasKey: boolean;
  isValid: boolean | null;
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    monthlyBudget: 10,
    warningThreshold: 80,
    autoOptimize: true,
    preferredTone: 'friendly',
    enablePriceDisplay: false
  });
  
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    claude: '',
    gemini: '',
    groq: ''
  });
  
  const [apiStatus, setApiStatus] = useState<APIKeyStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'budget'>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    loadSettings();
    loadApiStatus();
  }, []);
  
  async function loadSettings() {
    const stored = await chrome.storage.local.get(['settings', 'monthlyBudget', 'warningThreshold']);
    if (stored.settings) {
      setSettings(stored.settings);
    }
  }
  
  async function loadApiStatus() {
    const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'groq'];
    const status: APIKeyStatus[] = [];
    
    for (const provider of providers) {
      const key = await SecureStorage.getApiKey(provider);
      const config = AIRouter.getProviderConfig(provider);
      
      status.push({
        provider,
        name: config.name,
        hasKey: !!key,
        isValid: null
      });
    }
    
    setApiStatus(status);
  }
  
  async function saveApiKey(provider: AIProvider) {
    const key = apiKeys[provider];
    if (!key.trim()) return;
    
    try {
      setSaving(true);
      
      // Test the API key first
      const isValid = await testApiKey(provider, key);
      
      if (isValid) {
        await SecureStorage.saveApiKey(provider, key);
        setMessage(`${provider} API key saved and verified!`);
        
        // Clear the input
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
        
        // Update status
        await loadApiStatus();
      } else {
        setMessage(`Invalid ${provider} API key. Please check and try again.`);
      }
    } catch (error) {
      setMessage(`Error saving ${provider} API key: ${error}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }
  
  async function testApiKey(provider: AIProvider, key: string): Promise<boolean> {
    try {
      const config = AIRouter.getProviderConfig(provider);
      
      // Make a simple test request
      const testResponse = await fetch(config.endpoint, {
        method: 'POST',
        headers: provider === 'claude' 
          ? { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
          : { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: provider === 'openai' ? 'gpt-3.5-turbo' : 'gpt-4',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      });
      
      return testResponse.ok;
    } catch {
      return false;
    }
  }
  
  async function deleteApiKey(provider: AIProvider) {
    if (confirm(`Are you sure you want to remove the ${provider} API key?`)) {
      await SecureStorage.deleteApiKey(provider);
      await loadApiStatus();
      setMessage(`${provider} API key removed`);
      setTimeout(() => setMessage(''), 3000);
    }
  }
  
  async function saveSettings() {
    try {
      setSaving(true);
      await chrome.storage.local.set({ 
        settings,
        monthlyBudget: settings.monthlyBudget,
        warningThreshold: settings.warningThreshold
      });
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }
  
  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={settings.name}
          onChange={e => setSettings({...settings, name: e.target.value})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={settings.email}
          onChange={e => setSettings({...settings, email: e.target.value})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone (for security alerts)
        </label>
        <input
          type="tel"
          value={settings.phone}
          onChange={e => setSettings({...settings, phone: e.target.value})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+1 (555) 123-4567"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Reply Tone
        </label>
        <select
          value={settings.preferredTone}
          onChange={e => setSettings({...settings, preferredTone: e.target.value as any})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="technical">Technical</option>
          <option value="apologetic">Apologetic</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoOptimize"
          checked={settings.autoOptimize}
          onChange={e => setSettings({...settings, autoOptimize: e.target.checked})}
          className="mr-2"
        />
        <label htmlFor="autoOptimize" className="text-sm text-gray-700">
          Auto-optimize for cost (recommended)
        </label>
      </div>
    </div>
  );
  
  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>🔒 Security Note:</strong> Your API keys are encrypted with AES-256 and stored locally on your device. 
          They are never sent to ORBIT servers.
        </p>
      </div>
      
      {apiStatus.map(status => (
        <div key={status.provider} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-semibold">{status.name}</h4>
              <p className="text-sm text-gray-600">
                {status.hasKey ? (
                  <span className="text-green-600">✓ Connected</span>
                ) : (
                  <span className="text-gray-500">Not configured</span>
                )}
              </p>
            </div>
            {status.hasKey && (
              <button
                onClick={() => deleteApiKey(status.provider)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          
          {!status.hasKey && (
            <div className="space-y-2">
              <input
                type="password"
                value={apiKeys[status.provider]}
                onChange={e => setApiKeys({...apiKeys, [status.provider]: e.target.value})}
                placeholder={`Enter ${status.provider} API key`}
                className="w-full p-2 border rounded text-sm"
              />
              <button
                onClick={() => saveApiKey(status.provider)}
                disabled={!apiKeys[status.provider] || saving}
                className="w-full py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
              >
                {saving ? 'Verifying...' : 'Save & Test'}
              </button>
            </div>
          )}
        </div>
      ))}
      
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <p className="font-semibold mb-2">How to get API keys:</p>
        <ul className="space-y-1">
          <li>• <strong>OpenAI:</strong> platform.openai.com/api-keys</li>
          <li>• <strong>Claude:</strong> console.anthropic.com/settings/keys</li>
          <li>• <strong>Gemini:</strong> makersuite.google.com/app/apikey (free)</li>
          <li>• <strong>Groq:</strong> console.groq.com/keys (free)</li>
        </ul>
      </div>
    </div>
  );
  
  const renderBudgetSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Budget ($)
        </label>
        <input
          type="number"
          min="0"
          step="5"
          value={settings.monthlyBudget}
          onChange={e => setSettings({...settings, monthlyBudget: parseFloat(e.target.value) || 0})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          ORBIT will stop all AI calls when this budget is reached
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Warning Threshold (%)
        </label>
        <input
          type="number"
          min="50"
          max="95"
          value={settings.warningThreshold}
          onChange={e => setSettings({...settings, warningThreshold: parseInt(e.target.value) || 80})}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          You'll be notified when you reach this percentage of your budget
        </p>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>💡 Tip:</strong> Start with a $10/month budget. Most users spend $2-5/month with ORBIT's smart routing.
        </p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>✅ Smart Routing:</strong> ORBIT automatically routes simple tasks to free models (Gemini/Groq) 
          and only uses paid models for complex tasks.
        </p>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['general', 'api', 'budget'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('Error') || message.includes('Invalid')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'general' && renderGeneralSettings()}
      {activeTab === 'api' && renderApiSettings()}
      {activeTab === 'budget' && renderBudgetSettings()}
      
      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}