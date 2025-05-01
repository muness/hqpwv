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
            } else {
                this.clientKeys = new Map();
                this.saveMetadata();
            }
        } catch (error) {
            console.error('Error loading auth metadata:', error);
            this.clientKeys = new Map();
            this.saveMetadata();
        }
    }

    saveMetadata() {
        try {
            const metadata = {
                clientKeys: Array.from(this.clientKeys.entries())
            };
            fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
        } catch (error) {
            console.error('Error saving auth metadata:', error);
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'ready':
                return { type: 'ready' };
            case 'CheckConnection':
                // Authenticate with HQPlayer directly
                try {
                    // Get or generate client keys
                    const clientId = 'hqpwv-server';
                    let clientKeys = this.clientKeys.get(clientId);
                    
                    if (!clientKeys) {
                        // Generate new client keys if they don't exist
                        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
                        clientKeys = {
                            publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
                            privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64')
                        };
                        this.clientKeys.set(clientId, clientKeys);
                        this.saveMetadata();
                    }

                    // Generate signature of ECDH public key
                    const privateKeyObj = crypto.createPrivateKey({
                        key: Buffer.from(clientKeys.privateKey, 'base64'),
                        type: 'pkcs8',
                        format: 'der'
                    });
                    const signature = crypto.sign(null, this.ecdh.getPublicKey(), privateKeyObj);

                    // Send authentication request
                    const authResponse = this.handleSessionAuthentication({
                        clientId,
                        publicKey: this.ecdh.getPublicKey().toString('base64'),
                        signature: signature.toString('base64')
                    });

                    if (authResponse.error) {
                        return { type: 'disconnected', error: authResponse.error };
                    }

                    return { 
                        type: 'connected',
                        sessionId: authResponse.sessionId,
                        hqpVersion: '1.0.0'
                    };
                } catch (error) {
                    console.error('Error authenticating with HQPlayer:', error);
                    return { type: 'disconnected', error: error.message };
                }
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
            const sharedSecret = this.ecdh.computeSecret(Buffer.from(publicKey, 'base64'));

            // 3. Create session key (32 bytes) directly from shared secret
            const sessionKey = sharedSecret.slice(0, 32);

            // 4. Encrypt version info using ChaCha20Poly1305
            const nonce = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('chacha20-poly1305', sessionKey, nonce, {
                authTagLength: 16
            });
            
            const versionInfo = '1.0.0';
            
            const encryptedVersion = Buffer.concat([
                cipher.update(versionInfo, 'utf8'),
                cipher.final(),
                cipher.getAuthTag()
            ]);

            // 5. Store session
            const sessionId = crypto.randomBytes(32).toString('hex');
            this.sessions.set(sessionId, {
                clientId,
                sessionKey,
                timestamp: Date.now(),
                lastActivity: Date.now(),
                hqpVersion: '1.0.0'
            });

            // Save metadata immediately
            this.saveMetadata();

            // 6. Return response
            const response = {
                sessionId,
                publicKey: this.ecdh.getPublicKey().toString('base64'),
                signature: this.signResponse(this.ecdh.getPublicKey()),
                nonce: nonce.toString('base64'),
                version: encryptedVersion.toString('base64')
            };

            // Notify parent of successful connection
            parentPort.postMessage({
                type: 'connected',
                sessionId,
                hqpVersion: '1.0.0'
            });

            return response;
        } catch (error) {
            console.error('Error in session authentication:', error);
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
            const clientKeys = this.clientKeys.get(clientId);
            if (!clientKeys) {
                return false;
            }

            const publicKeyObj = crypto.createPublicKey({
                key: Buffer.from(clientKeys.publicKey, 'base64'),
                type: 'spki',
                format: 'der'
            });

            return crypto.verify(
                null,
                Buffer.from(publicKey, 'base64'),
                publicKeyObj,
                Buffer.from(signature, 'base64')
            );
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    signResponse(data) {
        try {
            const clientKeys = this.clientKeys.get('hqpwv-server');
            if (!clientKeys) {
                throw new Error('No client keys found');
            }

            const privateKey = crypto.createPrivateKey({
                key: Buffer.from(clientKeys.privateKey, 'base64'),
                type: 'pkcs8',
                format: 'der'
            });

            return crypto.sign(null, Buffer.from(data, 'base64'), privateKey).toString('base64');
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

// Send ready message when initialized
parentPort.postMessage({ type: 'ready' }); 