/**
 * Platform Detector Module
 * Detects current platform using generic terms only
 * No company names in user-facing code
 */

import type { Platform, PlatformSelectors } from '../types';

// Platform configurations with generic names
const PLATFORMS: Map<string, Platform> = new Map([
  ['appsumo.com', {
    name: 'Marketplace Dashboard',
    type: 'marketplace',
    selectors: {
      comments: '.comment-item, .review-item, [data-testid="comment"]',
      salesTable: 'table[data-sales], .sales-table, .revenue-table',
      priceContainer: '.pricing-section, .tier-container, .pricing-card',
      dashboardContainer: '.partner-dashboard, .seller-dashboard'
    },
    detected: false
  }],
  ['trustpilot.com', {
    name: 'Review Platform',
    type: 'review',
    selectors: {
      comments: '.review-content, .review-card, [data-review-body]',
      salesTable: '',
      priceContainer: '',
      dashboardContainer: '.dashboard, .business-profile'
    },
    detected: false
  }],
  ['g2.com', {
    name: 'Software Reviews',
    type: 'review',
    selectors: {
      comments: '.review-content, .review-body, [data-track-product-review]',
      salesTable: '',
      priceContainer: '.pricing-card, .price-attribute',
      dashboardContainer: '.dashboard, .admin-panel'
    },
    detected: false
  }],
  ['gumroad.com', {
    name: 'Sales Platform',
    type: 'store',
    selectors: {
      comments: '.comment, .customer-message, .review-item',
      salesTable: '.sales-data-table, .revenue-table',
      priceContainer: '.product-price, .pricing-container',
      dashboardContainer: '.dashboard-container'
    },
    detected: false
  }],
  ['lemonsqueezy.com', {
    name: 'Digital Store',
    type: 'store',
    selectors: {
      comments: '.comment, .review-card',
      salesTable: '.sales-table, .orders-table',
      priceContainer: '.price-container, .variant-price',
      dashboardContainer: '.store-dashboard'
    },
    detected: false
  }],
  ['shopify.com', {
    name: 'E-commerce Platform',
    type: 'platform',
    selectors: {
      comments: '.review-item, .comment',
      salesTable: '.sales-table, .orders-table',
      priceContainer: '.price, .product-price',
      dashboardContainer: '.shopify-dashboard'
    },
    detected: false
  }]
]);

export class PlatformDetector {
  /**
   * Detect current platform
   * Returns generic name for display
   */
  static detect(): Platform | null {
    const hostname = window.location.hostname.toLowerCase();
    
    for (const [domain, config] of PLATFORMS) {
      if (hostname.includes(domain)) {
        return {
          ...config,
          detected: true
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check if current page is a supported platform
   */
  static isSupported(): boolean {
    return this.detect() !== null;
  }
  
  /**
   * Get platform name (always generic)
   */
  static getDisplayName(): string {
    const platform = this.detect();
    return platform?.name || 'Sales Dashboard';
  }
  
  /**
   * Get platform type
   */
  static getType(): string {
    const platform = this.detect();
    return platform?.type || 'unknown';
  }
  
  /**
   * Get DOM selectors for current platform
   */
  static getSelectors(): PlatformSelectors | null {
    const platform = this.detect();
    return platform?.selectors || null;
  }
  
  /**
   * Extract comments from page
   */
  static extractComments(): Element[] {
    const selectors = this.getSelectors();
    if (!selectors) return [];
    
    const comments: Element[] = [];
    const selectorList = selectors.comments.split(', ');
    
    for (const selector of selectorList) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!comments.includes(el)) {
          comments.push(el);
        }
      });
    }
    
    return comments;
  }
  
  /**
   * Extract sales data from page
   */
  static extractSalesData(): any[] {
    const selectors = this.getSelectors();
    if (!selectors) return [];
    
    const data: any[] = [];
    const table = document.querySelector(selectors.salesTable);
    
    if (table) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          data.push({
            date: cells[0]?.textContent?.trim(),
            item: cells[1]?.textContent?.trim(),
            amount: cells[2]?.textContent?.trim()
          });
        }
      });
    }
    
    return data;
  }
  
  /**
   * Extract pricing tiers
   */
  static extractPricing(): any[] {
    const selectors = this.getSelectors();
    if (!selectors) return [];
    
    const pricing: any[] = [];
    const containers = document.querySelectorAll(selectors.priceContainer);
    
    containers.forEach((container, index) => {
      const priceText = container.textContent || '';
      const priceMatch = priceText.match(/\$([\d,]+\.?\d*)/);
      const tierMatch = priceText.match(/(tier|plan)\s*(\d+)/i);
      
      if (priceMatch) {
        pricing.push({
          tier: tierMatch ? parseInt(tierMatch[2]) : index + 1,
          price: parseFloat(priceMatch[1].replace(',', '')),
          name: `Tier ${index + 1}`,
          element: container
        });
      }
    });
    
    return pricing;
  }
  
  /**
   * Get all supported platform domains
   * For internal use only (host_permissions)
   */
  static getSupportedDomains(): string[] {
    return Array.from(PLATFORMS.keys());
  }
}