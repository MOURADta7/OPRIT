/**
 * IndexedDB Storage Module
 * Local storage for usage data, customer profiles, and analytics
 * All data stays on user's device
 */

import type { UsageData, CustomerProfile, Comment } from '../types';

const DB_NAME = 'orbit_db';
const DB_VERSION = 1;

export class LocalStorage {
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Usage data store
        if (!db.objectStoreNames.contains('usage')) {
          db.createObjectStore('usage', { keyPath: 'month' });
        }
        
        // Customer profiles store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'email' });
          customerStore.createIndex('churnRisk', 'churnRisk', { unique: false });
          customerStore.createIndex('tier', 'tier', { unique: false });
        }
        
        // Comments store
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('author', 'author', { unique: false });
          commentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'date' });
        }
      };
    });
  }
  
  // Usage Data Methods
  async saveUsage(month: string, usage: Record<string, UsageData>): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['usage'], 'readwrite');
      const store = transaction.objectStore('usage');
      const request = store.put({ month, data: usage });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getUsage(month: string): Promise<Record<string, UsageData> | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['usage'], 'readonly');
      const store = transaction.objectStore('usage');
      const request = store.get(month);
      
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Customer Profile Methods
  async saveCustomer(profile: CustomerProfile): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readwrite');
      const store = transaction.objectStore('customers');
      const request = store.put(profile);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getCustomer(email: string): Promise<CustomerProfile | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.get(email);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getHighRiskCustomers(): Promise<CustomerProfile[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const index = store.index('churnRisk');
      const request = index.openCursor(IDBKeyRange.lowerBound(70));
      
      const results: CustomerProfile[] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Comment Methods
  async saveComment(comment: Comment): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['comments'], 'readwrite');
      const store = transaction.objectStore('comments');
      const request = store.put(comment);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getCommentsByAuthor(author: string): Promise<Comment[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['comments'], 'readonly');
      const store = transaction.objectStore('comments');
      const index = store.index('author');
      const request = index.getAll(author);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  
  async getRecentComments(limit: number = 100): Promise<Comment[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['comments'], 'readonly');
      const store = transaction.objectStore('comments');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const results: Comment[] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Analytics Methods
  async saveAnalytics(date: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      const request = store.put({ date, data });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Cleanup Methods
  async clearOldData(olderThanDays: number = 90): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Clear old comments
    const commentTransaction = this.db!.transaction(['comments'], 'readwrite');
    const commentStore = commentTransaction.objectStore('comments');
    const commentIndex = commentStore.index('timestamp');
    const commentRequest = commentIndex.openCursor(IDBKeyRange.upperBound(cutoff));
    
    commentRequest.onsuccess = () => {
      const cursor = commentRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    // Clear old analytics
    const analyticsTransaction = this.db!.transaction(['analytics'], 'readwrite');
    const analyticsStore = analyticsTransaction.objectStore('analytics');
    const analyticsRequest = analyticsStore.openCursor();
    
    analyticsRequest.onsuccess = () => {
      const cursor = analyticsRequest.result;
      if (cursor) {
        const date = new Date(cursor.value.date);
        if (date.getTime() < cutoff) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }
  
  async exportAllData(): Promise<Blob> {
    if (!this.db) await this.init();
    
    const data = {
      usage: await this.getAllFromStore('usage'),
      customers: await this.getAllFromStore('customers'),
      comments: await this.getAllFromStore('comments'),
      analytics: await this.getAllFromStore('analytics'),
      exportDate: new Date().toISOString()
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }
  
  private async getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

export const localStorage = new LocalStorage();