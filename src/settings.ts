import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'relay.settings.json');

const DEFAULT_SETTINGS = {
  heartbeatIntervalMs: 30000,
  connectionTimeoutMs: 45000,
  requestTimeoutMs: 180000,
  maxQueueSize: 1000,
  queueBehavior: 'queue' as 'queue' | 'drop'
};

export default {
  readSettings() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } catch (e) {
      console.error('Failed to read settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  writeSettings(newSettings: any) {
    const merged = { ...this.readSettings(), ...newSettings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
    return merged;
  }
};
