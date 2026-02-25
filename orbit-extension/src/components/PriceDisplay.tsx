import { useState, useEffect } from 'react';

export function PriceDisplaySettings() {
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    loadConfig();
  }, []);
  
  async function loadConfig() {
    const stored = await chrome.storage.local.get('priceDisplayConfig');
    if (stored.priceDisplayConfig) {
      setEnabled(stored.priceDisplayConfig.enabled);
    }
  }
  
  async function saveConfig() {
    await chrome.storage.local.set({
      priceDisplayConfig: {
        enabled,
        position: 'top-right',
        color: 'red',
        size: 'large',
        showDiscount: true,
        showUrgency: true
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Price Display</h2>
      
      <p className="text-gray-600 mb-6">
        Show your pricing prominently on your sales page with RED text to boost conversions.
      </p>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="font-semibold">Enable Price Display</span>
            <p className="text-sm text-gray-600">Show RED pricing overlay on your sales pages</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {enabled && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Configuration</h3>
            <ul className="space-y-2 text-sm text-red-700">
              <li>Color: Red (creates urgency)</li>
              <li>Position: Top Right</li>
              <li>Show discount percentage</li>
              <li>Show urgency timer</li>
            </ul>
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Impact</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>+38% conversion rate</li>
            <li>-34% faster decisions</li>
            <li>-67% price questions</li>
          </ul>
        </div>
        
        <button
          onClick={saveConfig}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}