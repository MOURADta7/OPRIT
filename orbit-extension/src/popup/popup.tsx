import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UsageMonitor } from '../components/UsageMonitor';
import { Settings } from '../components/Settings';
import { PriceDisplaySettings } from '../components/PriceDisplay';
import { PlatformDetector } from '../utils/platformDetector';
import './popup.css';

function Popup() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'usage' | 'settings' | 'price'>('dashboard');
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState({
    responses: 0,
    timeSaved: 0,
    comments: 0
  });
  
  useEffect(() => {
    checkActiveState();
    loadStats();
  }, []);
  
  async function checkActiveState() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const isSupported = PlatformDetector.isSupported();
      setIsActive(isSupported);
    }
  }
  
  async function loadStats() {
    const stored = await chrome.storage.local.get(['stats', 'responsesGenerated', 'timeSaved', 'commentsAnalyzed']);
    setStats({
      responses: stored.responsesGenerated || 0,
      timeSaved: Math.floor((stored.timeSaved || 0) / 60),
      comments: stored.commentsAnalyzed || 0
    });
  }
  
  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">O</span>
          </div>
          <span className="font-bold text-xl text-gray-800">ORBIT</span>
        </div>
        <span className="text-sm text-gray-500">v1.0.0</span>
      </div>
      
      {/* Status */}
      <div className={`p-4 rounded-lg ${isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <div>
            <p className="font-semibold text-gray-800">
              {isActive ? 'Active on Sales Dashboard' : 'Not Active'}
            </p>
            <p className="text-sm text-gray-600">
              {isActive 
                ? 'ORBIT is ready to help' 
                : 'Navigate to your marketplace dashboard'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.responses}</div>
          <div className="text-xs text-gray-600">Responses</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.timeSaved}h</div>
          <div className="text-xs text-gray-600">Time Saved</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.comments}</div>
          <div className="text-xs text-gray-600">Comments</div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={() => setActiveTab('usage')}
          className="w-full p-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <span>📊 View API Usage</span>
        </button>
        
        <button
          onClick={() => setActiveTab('price')}
          className="w-full p-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
        >
          <span>🔴 Configure Price Display</span>
        </button>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t">
        <p>Privacy-first AI assistant</p>
        <p>Your data never leaves your device</p>
      </div>
    </div>
  );
  
  const renderNavigation = () => (
    <div className="flex border-b">
      {[
        { id: 'dashboard', label: 'Home', icon: '🏠' },
        { id: 'usage', label: 'Usage', icon: '📊' },
        { id: 'price', label: 'Price', icon: '💰' },
        { id: 'settings', label: 'Settings', icon: '⚙️' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span className="block text-lg mb-1">{tab.icon}</span>
          <span className="text-xs">{tab.label}</span>
        </button>
      ))}
    </div>
  );
  
  return (
    <div className="w-96 bg-white min-h-[500px]">
      {renderNavigation()}
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'usage' && <UsageMonitor />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'price' && <PriceDisplaySettings />}
    </div>
  );
}

// Mount React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}