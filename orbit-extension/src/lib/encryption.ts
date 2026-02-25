/**
 * Secure Storage Module
 * AES-256 encryption for API keys and sensitive data
 * All encryption/decryption happens locally in the browser
 */

const SALT = 'orbit_secure_salt_v1_2026';

export class SecureStorage {
  /**
   * Encrypt API key before storing
   */
  static async encryptKey(plaintext: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Generate key from device-specific data + salt
      const keyMaterial = await this.getKeyMaterial();
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(SALT),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt API key');
    }
  }
  
  /**
   * Decrypt API key when needed
   */
  static async decryptKey(encrypted: string): Promise<string> {
    try {
      const decoder = new TextDecoder();
      
      // Decode from base64
      const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      
      // Extract IV (first 12 bytes)
      const iv = data.slice(0, 12);
      const ciphertext = data.slice(12);
      
      // Generate same key
      const keyMaterial = await this.getKeyMaterial();
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(SALT),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );
      
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt API key');
    }
  }
  
  /**
   * Save encrypted API key to storage
   */
  static async saveApiKey(provider: string, key: string): Promise<void> {
    const encrypted = await this.encryptKey(key);
    await chrome.storage.local.set({ [`api_${provider}`]: encrypted });
  }
  
  /**
   * Retrieve and decrypt API key
   */
  static async getApiKey(provider: string): Promise<string | null> {
    const stored = await chrome.storage.local.get(`api_${provider}`);
    if (!stored[`api_${provider}`]) return null;
    
    try {
      return await this.decryptKey(stored[`api_${provider}`]);
    } catch {
      return null;
    }
  }
  
  /**
   * Delete API key from storage
   */
  static async deleteApiKey(provider: string): Promise<void> {
    await chrome.storage.local.remove(`api_${provider}`);
  }
  
  /**
   * Generate device-specific key material
   */
  private static async getKeyMaterial(): Promise<CryptoKey> {
    // Use device-specific identifier
    const identifier = navigator.userAgent + (await this.getInstallTime());
    const encoder = new TextEncoder();
    
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(identifier),
      'PBKDF2',
      false,
      ['deriveKey']
    );
  }
  
  /**
   * Get or set install time for device fingerprinting
   */
  private static async getInstallTime(): Promise<string> {
    const stored = await chrome.storage.local.get('installTime');
    if (stored.installTime) return stored.installTime;
    
    const now = Date.now().toString();
    await chrome.storage.local.set({ installTime: now });
    return now;
  }
}