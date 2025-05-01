# HQPlayer Configuration Selection Feature

## Overview
The HQPlayer configuration selection feature needs to be implemented as a completely separate view from the existing settings view. This will allow users to select and switch between different HQPlayer configurations.

## Authentication Requirements

### Session Authentication Flow
1. Client generates an ephemeral ECDH keypair (secp256r1)
2. Signs the public key using its Ed25519 private key
3. Sends the signed key and client ID in a SessionAuthentication message
4. Server responds with:
   - ECDH public key
   - Signature
   - Encrypted metadata (e.g. HQPlayer version)

Once the client verifies the server's signature and decrypts the payload using ChaCha20Poly1305 with the derived shared secret, the session is authenticated and a sessionKey is available.

### Authentication Required Commands
The following commands require authentication:
- `<ConfigurationLoad>name</ConfigurationLoad>` - Load a configuration

### Authentication Optional Commands
The following commands do not require authentication:
- `<ConfigurationList/>` - List available configurations
- `<ConfigurationGet/>` - Get current configuration

## Implementation Steps

1. Create a new view class:
   - Create `www/hqp-settings-view.js`
   - Extend from `Subview` base class
   - Use existing HTML structure from `index.html` (already has `#hqpSettingsView` div)
   - Do NOT modify existing settings view

2. Required functionality:
   - List available configurations
   - Show current configuration
   - Allow switching configurations
   - Handle authentication status
   - Show authentication required notice

3. UI Elements to implement:
   - Configuration dropdown
   - Authentication status indicator
   - Authentication required notice

4. Required commands:
   - `<ConfigurationList/>` - List available configurations
   - `<ConfigurationGet/>` - Get current configuration
   - `<ConfigurationLoad>name</ConfigurationLoad>` - Load a configuration (requires auth)

5. Integration points:
   - Add to `app.js` imports
   - Initialize in `App` constructor
   - Add to `subviews` array
   - Handle show/hide events
   - Add button click handler in top bar
   - Listen for auth status changes

6. Testing requirements:
   - Verify configuration list loads
   - Test configuration switching
   - Verify current configuration is shown
   - Check error handling
   - Test with HQPlayer running
   - Verify authentication flow
   - Test commands with/without authentication
   - Verify proper error messages for auth failures

## Important Notes
- Keep this feature completely separate from main settings
- Use existing HTML structure
- Maintain current styling
- Handle all error cases
- Provide user feedback via toast messages
- Implement proper authentication handling
- Show clear feedback when authentication is required
- Handle session expiration gracefully
- Maintain security best practices for key exchange and encryption 