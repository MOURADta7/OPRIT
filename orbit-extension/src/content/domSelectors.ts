/**
 * DOM Selectors for different platforms
 * These are platform-specific selectors for extracting data
 * Used internally - not exposed in UI
 */

export const DOM_SELECTORS = {
  'appsumo.com': {
    comments: ['.comment-item', '.review-item', '[data-testid="comment"]'],
    salesTable: ['table[data-sales]', '.sales-table', '.revenue-table'],
    priceContainer: ['.pricing-section', '.tier-container', '.pricing-card'],
    customerName: ['.author-name', '.user-name', '.reviewer-name']
  },
  'gumroad.com': {
    comments: ['.comment', '.customer-message', '.review-item'],
    salesTable: ['.sales-data-table', '.analytics-table'],
    priceContainer: ['.product-price', '.pricing-container', '.variant-price'],
    customerName: ['.customer-name', '.buyer-name']
  },
  'lemonsqueezy.com': {
    comments: ['.comment', '.review-card'],
    salesTable: ['.sales-table', '.orders-table'],
    priceContainer: ['.price-container', '.variant-price'],
    customerName: ['.customer-name']
  },
  'shopify.com': {
    comments: ['.review-item', '.comment'],
    salesTable: ['.sales-table', '.orders-table'],
    priceContainer: ['.price', '.product-price'],
    customerName: ['.customer-name']
  }
};

export function getSelectorsForDomain(domain: string): typeof DOM_SELECTORS['appsumo.com'] | null {
  for (const [key, selectors] of Object.entries(DOM_SELECTORS)) {
    if (domain.includes(key)) {
      return selectors;
    }
  }
  return null;
}