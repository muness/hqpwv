const crypto = require('crypto');
const { Worker, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

class AuthThread {
    constructor() {
        // Load or initialize auth metadata
        this.metadataPath = path.join(process.cwd(), 'hqpwv-auth-metadata.json');
        this.loadMetadata();
        
        // Initialize ECDH with secp256r1 curve (same as P-256)
        this.ecdh = crypto.createECDH('prime256v1');
        this.ecdh.generateKeys();
        
        // Store authenticated sessions
        this.sessions = new Map();

        // Save metadata periodically (every 5 minutes)
        setInterval(() => this.saveMetadata(), 5 * 60 * 1000);
    }

    loadMetadata() {
        try {
            if (fs.existsSync(this.metadataPath)) {
                const data = fs.readFileSync(this.metadataPath, 'utf8');
                const metadata = JSON.parse(data);
                this.clientKeys = new Map(metadata.clientKeys || []);
                this.serverKeys = metadata.serverKeys || this.generateServerKeys();
            } else {
                this.clientKeys = new Map();
                this.serverKeys = this.generateServerKeys();
                this.saveMetadata();
            }
        } catch (error) {
            console.error('Error loading auth metadata:', error);
            this.clientKeys = new Map();
            this.serverKeys = this.generateServerKeys();
            this.saveMetadata();
        }
    }

    generateServerKeys() {
        // Generate Ed25519 keypair for server
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'der' },
            privateKeyEncoding: { type: 'pkcs8', format: 'der' }
        });
        return {
            publicKey: publicKey.toString('base64'),
            privateKey: privateKey.toString('base64')
        };
    }

    saveMetadata() {
        try {
            const metadata = {
                clientKeys: Array.from(this.clientKeys.entries()),
                serverKeys: this.serverKeys
            };
            fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error('Error saving auth metadata:', error);
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'SessionAuthentication':
                return this.handleSessionAuthentication(message);
            case 'VerifySession':
                return this.verifySession(message);
            case 'RegisterClient':
                return this.registerClient(message);
            default:
                return { error: 'Unknown message type' };
        }
    }

    registerClient(message) {
        const { clientId, publicKey } = message;
        this.clientKeys.set(clientId, publicKey);
        this.saveMetadata();
        return { success: true };
    }

    handleSessionAuthentication(message) {
        try {
            const { clientId, publicKey, signature } = message;
            
            // 1. Verify the signature using Ed25519
            const isValid = this.verifySignature(clientId, publicKey, signature);
            if (!isValid) {
                return { error: 'Invalid signature' };
            }

            // 2. Generate shared secret using ECDH
            const sharedSecret = this.ecdh.computeSecret(publicKey);

            // 3. Create session key using ChaCha20Poly1305
            const sessionKey = crypto.createHash('sha256').update(sharedSecret).digest();

            // 4. Encrypt metadata (version info)
            const nonce = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('chacha20-poly1305', sessionKey, nonce, {
                authTagLength: 16
            });
            
            const metadata = JSON.stringify({
                version: '1.0.0', // Replace with actual HQPlayer version
                timestamp: Date.now()
            });

            const encryptedMetadata = Buffer.concat([
                cipher.update(metadata, 'utf8'),
                cipher.final(),
                cipher.getAuthTag()
            ]);

            // 5. Store session
            const sessionId = crypto.randomBytes(32).toString('hex');
            this.sessions.set(sessionId, {
                clientId,
                sessionKey,
                timestamp: Date.now()
            });

            // 6. Return response
            return {
                sessionId,
                publicKey: this.ecdh.getPublicKey(),
                signature: this.signResponse(this.ecdh.getPublicKey()),
                metadata: encryptedMetadata.toString('base64'),
                nonce: nonce.toString('base64')
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    verifySession(message) {
        const { sessionId, command } = message;
        const session = this.sessions.get(sessionId);

        if (!session) {
            return { error: 'Invalid session' };
        }

        // Check if session is expired (24 hours)
        if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
            this.sessions.delete(sessionId);
            return { error: 'Session expired' };
        }

        // Check if command requires authentication
        const requiresAuth = this.commandRequiresAuth(command);
        if (requiresAuth) {
            return { authenticated: true };
        }

        return { authenticated: false };
    }

    commandRequiresAuth(command) {
        // List of commands that require authentication
        const authCommands = [
            'ConfigurationLoad'
        ];

        return authCommands.some(cmd => command.includes(cmd));
    }

    verifySignature(clientId, publicKey, signature) {
        try {
            const storedKey = this.clientKeys.get(clientId);
            if (!storedKey) {
                return false;
            }

            const verify = crypto.createVerify('SHA256');
            verify.update(publicKey);
            return verify.verify(
                { key: Buffer.from(storedKey, 'base64'), type: 'spki', format: 'der' },
                Buffer.from(signature, 'base64')
            );
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    signResponse(data) {
        try {
            const sign = crypto.createSign('SHA256');
            sign.update(data);
            return sign.sign(
                { key: Buffer.from(this.serverKeys.privateKey, 'base64'), type: 'pkcs8', format: 'der' },
                'base64'
            );
        } catch (error) {
            console.error('Error signing response:', error);
            return Buffer.from('error-signing').toString('base64');
        }
    }
}

// Start the worker thread
const authThread = new AuthThread();
parentPort.on('message', async (message) => {
    const response = await authThread.handleMessage(message);
    parentPort.postMessage(response);
}); 