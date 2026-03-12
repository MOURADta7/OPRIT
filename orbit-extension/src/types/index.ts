/**
 * ORBIT TypeScript Definitions
 * All type definitions for the extension
 */

// API Providers
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'groq';

export interface ProviderConfig {
  name: string;
  endpoint: string;
  costPerToken: {
    input: number;
    output: number;
  };
  rateLimit?: {
    requests: number;
    period: 'hour' | 'day' | 'month';
  };
}

// User Settings
export interface UserSettings {
  name: string;
  email: string;
  phone: string;
  monthlyBudget: number;
  warningThreshold: number;
  autoOptimize: boolean;
  preferredTone: 'professional' | 'friendly' | 'technical' | 'apologetic';
  enablePriceDisplay: boolean;
  priceDisplayConfig?: PriceDisplayConfig;
}

export interface PriceDisplayConfig {
  enabled: boolean;
  position: 'top-right' | 'floating-bottom' | 'inline';
  color: 'red' | 'orange' | 'blue' | 'green';
  size: 'medium' | 'large' | 'extra-large';
  animation: 'none' | 'pulse' | 'fade-in';
  showDiscount: boolean;
  showUrgency: boolean;
  showSalesCount: boolean;
}

// Usage Tracking
export interface UsageData {
  tokens: number;
  cost: number;
  requests: number;
  history: UsageEvent[];
}

export interface UsageEvent {
  timestamp: number;
  tokens: number;
  cost: number;
  provider: AIProvider;
}

// API Response
export interface AIResponse {
  reply: string;
  cost: number;
  provider: AIProvider;
  tokens: number;
}

// Comment Data
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  tier?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Customer Profile
export interface CustomerProfile {
  email: string;
  name: string;
  tier: string;
  purchaseDate: number;
  totalValue: number;
  interactions: Interaction[];
  sentimentHistory: SentimentPoint[];
  churnRisk: number;
  notes: string[];
}

export interface Interaction {
  timestamp: number;
  type: 'comment' | 'reply' | 'support';
  content: string;
  sentiment: number;
}

export interface SentimentPoint {
  timestamp: number;
  score: number;
}

// Platform Detection
export interface Platform {
  name: string;
  type: 'marketplace' | 'store' | 'platform' | 'review';
  selectors: PlatformSelectors;
  detected: boolean;
}

export interface PlatformSelectors {
  comments: string;
  salesTable: string;
  priceContainer: string;
  dashboardContainer?: string;
}

// Feature Request
export interface FeatureRequest {
  feature: string;
  mentions: number;
  urgency: number;
  customerTiers: string[];
  roi: {
    value: number;
    confidence: number;
  };
}

// Analytics
export interface SalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  refundRate: number;
  avgOrderValue: number;
  conversionRate: number;
  period: {
    start: number;
    end: number;
  };
}

export interface ChurnPrediction {
  customerEmail: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  recommendedActions: string[];
}

export interface ChurnFactor {
  type: 'behavior' | 'sentiment' | 'support' | 'lifecycle';
  description: string;
  weight: number;
}

// Writing Style Profile
export interface WritingStyleProfile {
  formalityLevel: number;
  enthusiasm: number;
  empathy: number;
  technicalDepth: number;
  avgLength: number;
  greetingStyle: string;
  signOffStyle: string;
  preferredTerms: string[];
  patterns: EditPattern[];
}

export interface EditPattern {
  original: string;
  edited: string;
  frequency: number;
  confidence: number;
}