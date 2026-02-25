import { useState } from 'react';
import { AIRouter } from '../lib/aiRouter';
import { CostCalculator } from '../utils/costCalculator';
import type { AIProvider } from '../types';

interface ReplyGeneratorProps {
  commentText: string;
  customerName: string;
  context?: string;
  onReplyGenerated?: (reply: string) => void;
}

export function CommentManager({ commentText, customerName, context = '', onReplyGenerated }: ReplyGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [reply, setReply] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [error, setError] = useState('');
  
  const providers: { id: AIProvider; name: string; description: string }[] = [
    { id: 'groq', name: 'Groq (Free)', description: 'Fastest, free tier available' },
    { id: 'gemini', name: 'Gemini Pro (Free)', description: 'High quality, free tier' },
    { id: 'claude', name: 'Claude Sonnet', description: 'Best accuracy, $0.003/1K tokens' },
    { id: 'openai', name: 'GPT-4 Turbo', description: 'Premium quality, $0.01/1K tokens' }
  ];
  
  async function generateReply(preferredProvider?: AIProvider) {
    setGenerating(true);
    setError('');
    
    try {
      const systemContext = `You are a helpful customer support assistant. 
The customer's name is ${customerName}.
${context ? `Additional context: ${context}` : ''}

Generate a friendly, professional reply to the customer's comment.`;
      
      const result = await AIRouter.generateReply(
        commentText,
        systemContext,
        { preferredProvider, taskComplexity: 'medium' }
      );
      
      setReply(result.reply);
      setSelectedProvider(result.provider);
      setEstimatedCost(result.cost);
      
      if (onReplyGenerated) {
        onReplyGenerated(result.reply);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate reply');
    } finally {
      setGenerating(false);
    }
  }
  
  function copyToClipboard() {
    navigator.clipboard.writeText(reply);
  }
  
  function useReply() {
    // This would insert the reply into the page
    // Implementation depends on the specific platform
    if (onReplyGenerated) {
      onReplyGenerated(reply);
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Generate AI Reply</h3>
      
      {/* Original Comment */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">Customer Comment:</p>
        <p className="text-gray-800">{commentText}</p>
        <p className="text-sm text-gray-500 mt-2">- {customerName}</p>
      </div>
      
      {/* Provider Selection */}
      {!reply && !generating && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Choose AI Model:</p>
          <div className="grid grid-cols-2 gap-2">
            {providers.map(provider => {
              const estimate = CostCalculator.estimateCost(
                provider.id,
                CostCalculator.estimateTokens(commentText + context) + 200
              );
              
              return (
                <button
                  key={provider.id}
                  onClick={() => generateReply(provider.id)}
                  className="p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{provider.name}</div>
                  <div className="text-xs text-gray-600">{provider.description}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Est. cost: {estimate.formatted}
                  </div>
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => generateReply()}
            className="w-full mt-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ✨ Smart Select (Recommended)
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            ORBIT will choose the best model for this task
          </p>
        </div>
      )}
      
      {/* Generating State */}
      {generating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Generating reply...</p>
        </div>
      )}
      
      {/* Generated Reply */}
      {reply && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">AI-Generated Reply:</p>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white min-h-[100px] resize-y"
            />
            
            <div className="flex items-center justify-between mt-3 text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Model:</span> {selectedProvider}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Cost:</span> {estimatedCost === 0 ? 'FREE' : `$${estimatedCost.toFixed(3)}`}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Copy
            </button>
            <button
              onClick={useReply}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Use Reply
            </button>
          </div>
          
          <button
            onClick={() => {
              setReply('');
              setSelectedProvider(null);
            }}
            className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Generate Different Reply
          </button>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}