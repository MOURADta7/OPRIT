import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { UsageMonitor } from '../components/UsageMonitor';
import { Settings } from '../components/Settings';
import { PriceDisplaySettings } from '../components/PriceDisplay';
import { PlatformDetector } from '../utils/platformDetector';
import './popup.css';

interface OrbitStats {
  repliesGenerated: number;
  timeSavedMinutes: number;
  risksCaught: number;
  commentsAnalyzed: number;
}

function formatTimeSaved(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function Popup() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'usage' | 'settings' | 'price'>('dashboard');
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState<OrbitStats>({
    repliesGenerated: 0,
    timeSavedMinutes: 0,
    risksCaught: 0,
    commentsAnalyzed: 0
  });
  
  useEffect(() => {
    checkActiveState();
    loadStats();
    
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const relevantKeys = ['repliesGenerated', 'timeSavedMinutes', 'risksCaught', 'commentsAnalyzed'];
      const hasRelevantChange = relevantKeys.some(key => key in changes);
      
      if (hasRelevantChange) {
        loadStats();
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);
  
  async function checkActiveState() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const isSupported = PlatformDetector.isSupported();
      setIsActive(isSupported);
    }
  }
  
  async function loadStats() {
    const stored = await chrome.storage.local.get([
      'repliesGenerated', 
      'timeSavedMinutes', 
      'risksCaught', 
      'commentsAnalyzed'
    ]);
    setStats({
      repliesGenerated: stored.repliesGenerated || 0,
      timeSavedMinutes: stored.timeSavedMinutes || 0,
      risksCaught: stored.risksCaught || 0,
      commentsAnalyzed: stored.commentsAnalyzed || 0
    });
  }
  
  const renderDashboard = () => (
    <div className="p-5 space-y-5 bg-slate-900 min-h-[460px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">O</span>
          </div>
          <span className="font-bold text-xl text-white">ORBIT</span>
        </div>
        <span className="text-sm text-slate-400">v1.0.0</span>
      </div>
      
      {/* Status */}
      <div className={`p-4 rounded-lg ${isActive ? 'bg-green-900/30 border border-green-700' : 'bg-slate-800 border border-slate-700'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
          <div>
            <p className="font-semibold text-white">
              {isActive ? 'Active on Sales Dashboard' : 'Not Active'}
            </p>
            <p className="text-sm text-slate-400">
              {isActive 
                ? 'ORBIT is ready to help' 
                : 'Navigate to your marketplace dashboard'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Analytics Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Your Impact</h3>
        
        {/* Refund Risks Prevented - Highlighted in Orange/Red */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium">Refund Risks Prevented</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.risksCaught}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
          </div>
        </div>
        
        {/* Time Saved */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Time Saved</p>
              <p className="text-3xl font-bold text-white mt-1">{formatTimeSaved(stats.timeSavedMinutes)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
        
        {/* Replies Generated */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Replies Generated</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.repliesGenerated}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
        </div>
        
        {/* Comments Analyzed */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Comments Analyzed</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.commentsAnalyzed}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => setActiveTab('usage')}
          className="w-full p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
        >
          <span>📊 View API Usage</span>
        </button>
        
        <button
          onClick={() => setActiveTab('price')}
          className="w-full p-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition-colors flex items-center justify-center space-x-2"
        >
          <span>🔴 Configure Price Display</span>
        </button>
      </div>
      
      {/* Footer */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
        <p>Privacy-first AI assistant</p>
        <p>Your data never leaves your device</p>
      </div>
    </div>
  );
  
  const renderNavigation = () => (
    <div className="flex border-b border-slate-700 bg-slate-800">
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
              ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <span className="block text-lg mb-1">{tab.icon}</span>
          <span className="text-xs">{tab.label}</span>
        </button>
      ))}
    </div>
  );
  
  return (
    <div className="w-96 bg-slate-900 min-h-[500px]">
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