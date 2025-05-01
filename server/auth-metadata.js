const fs = require('fs');
const path = require('path');

const AUTH_METADATA_PATH = path.join(process.cwd(), 'hqpwv-auth-metadata.json');

class AuthMetadata {
  constructor() {
    this.data = {
      isConnected: false,
      lastCheck: null,
      sessionId: null,
      hqpVersion: null
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(AUTH_METADATA_PATH)) {
        const fileData = fs.readFileSync(AUTH_METADATA_PATH, 'utf8');
        this.data = JSON.parse(fileData);
      }
    } catch (err) {
      console.error('Error loading auth metadata:', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(AUTH_METADATA_PATH, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Error saving auth metadata:', err);
    }
  }

  setConnected(isConnected) {
    this.data.isConnected = isConnected;
    this.data.lastCheck = new Date().toISOString();
    this.save();
  }

  setSession(sessionId) {
    this.data.sessionId = sessionId;
    this.save();
  }

  setHQPVersion(version) {
    this.data.hqpVersion = version;
    this.save();
  }

  getState() {
    return this.data;
  }
}

module.exports = new AuthMetadata(); 