# Configuration Selector Feature

## Overview
Add a configuration selector dropdown to the HQPlayer settings view that allows users to switch between different HQPlayer configurations.

## Requirements
- [x] Authentication is working
- [x] HQPlayer settings view exists
- [x] Configuration commands are defined in Commands.js

## Implementation Steps

1. Add configuration selector to HQPlayer settings view
   - Add dropdown element to settings view HTML
   - Style to match existing controls
   - Position alongside other settings

2. Load configurations on initialization
   - Use `Service.queueCommandFront(Commands.configurationList())`
   - Parse response and populate dropdown
   - Handle empty/error cases

3. Get current configuration
   - Use `Service.queueCommandFront(Commands.configurationGet())`
   - Set dropdown to current configuration
   - Handle empty/error cases

4. Handle configuration changes
   - Listen for dropdown change events
   - Use `Service.queueCommandFront(Commands.configurationLoad(name))`
   - Show loading state during change
   - Handle success/error cases

## Testing
- Verify configurations load on startup
- Verify current configuration is shown
- Verify configuration changes work
- Verify error handling works
- Verify UI matches existing controls

## Notes
- Keep UI simple and consistent with existing controls
- Handle all error cases gracefully
- Use existing service methods for commands
- No need to modify server code