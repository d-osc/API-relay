import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_KEYS_FILE = path.join(process.cwd(), 'api.keys.json');

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: number;
  lastUsed?: number;
  expiresAt?: number;
}

class ApiKeyManager {
  private apiKeys: ApiKey[] = [];

  constructor() {
    this.loadApiKeys();
  }

  private loadApiKeys() {
    try {
      if (fs.existsSync(API_KEYS_FILE)) {
        const data = JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf-8'));
        this.apiKeys = data.apiKeys || [];
      }
    } catch (e) {
      console.error('Failed to load API keys:', e);
      this.apiKeys = [];
    }
  }

  private saveApiKeys() {
    try {
      const data = {
        apiKeys: this.apiKeys,
        updatedAt: Date.now()
      };
      fs.writeFileSync(API_KEYS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Failed to save API keys:', e);
    }
  }

  public generateApiKey(name: string, expiresInDays?: number): ApiKey {
    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      key: 'ak-' + crypto.randomBytes(32).toString('hex'),
      name,
      createdAt: Date.now()
    };

    if (expiresInDays) {
      apiKey.expiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
    }

    this.apiKeys.push(apiKey);
    this.saveApiKeys();
    return apiKey;
  }

  public validateApiKey(key: string): ApiKey | null {
    const apiKey = this.apiKeys.find(k => k.key === key);
    
    if (!apiKey) {
      return null;
    }

    // Check if key is expired
    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      return null;
    }

    // Update last used timestamp
    apiKey.lastUsed = Date.now();
    this.saveApiKeys();
    
    return apiKey;
  }

  public listApiKeys(): Omit<ApiKey, 'key'>[] {
    return this.apiKeys.map(({ key, ...apiKey }) => apiKey);
  }

  public revokeApiKey(id: string): boolean {
    const initialLength = this.apiKeys.length;
    this.apiKeys = this.apiKeys.filter(k => k.id !== id);
    
    if (this.apiKeys.length < initialLength) {
      this.saveApiKeys();
      return true;
    }
    
    return false;
  }

  public updateApiKey(id: string, updates: Partial<Pick<ApiKey, 'name' | 'expiresAt'>>): ApiKey | null {
    const apiKey = this.apiKeys.find(k => k.id === id);
    
    if (!apiKey) {
      return null;
    }

    Object.assign(apiKey, updates);
    this.saveApiKeys();
    return apiKey;
  }
}

export default new ApiKeyManager();