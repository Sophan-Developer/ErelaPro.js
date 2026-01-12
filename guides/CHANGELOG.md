# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-01-12

### Added

- **Lavalink V4 Support**: Full support for Lavalink V4 API with new REST endpoints
- **Lavalink V3 Support**: Maintained backward compatibility with Lavalink V3
- **Version Configuration**: Added `version` option to `NodeOptions` to specify Lavalink version (3 or 4)
- **Mixed Version Support**: Ability to use both V3 and V4 nodes in the same manager instance
- **Updated WebSocket Handling**: Proper WebSocket path handling for V4 (`/v4/websocket`)
- **Modern REST API**: Updated all REST endpoints to support both V3 and V4 formats
- **Enhanced Track Data**: Support for both V3 and V4 track data structures

### Changed

- **Breaking**: Updated package version to 3.0.0
- **Player Operations**: All player operations (play, pause, seek, volume, stop) now support both V3 and V4 API formats
- **Search Method**: Updated to use version-specific endpoints (`/v4/loadtracks` for V4, `/loadtracks` for V3)
- **Decode Tracks**: Updated to use version-specific endpoints (`/v4/decodetracks` for V4, `/decodetracks` for V3)
- **Equalizer**: Updated EQ operations to use V4 filters API when using V4 nodes
- **Track Building**: Enhanced `TrackUtils.build()` to handle both V3 (`info.length`) and V4 (`duration`) formats
- **Node Connection**: Updated connection headers and WebSocket path for V4 compatibility
- **Message Handling**: Enhanced to process both V3 and V4 WebSocket message formats

### Technical Details

#### Node.ts Changes
- Added `version` property to `NodeOptions` (defaults to 4)
- Updated WebSocket connection path for V4 nodes
- Enhanced message handler to support V4 `ready` op code
- Updated player update handling for version compatibility

#### Player.ts Changes
- `destroy()`: Uses REST API (`DELETE /v4/sessions/{sessionId}/players/{guildId}`) for V4
- `play()`: Uses `PATCH /v4/sessions/{sessionId}/players/{guildId}` with `encodedTrack` for V4
- `setVolume()`: Uses REST API with volume parameter for V4
- `pause()`: Uses REST API with paused parameter for V4
- `seek()`: Uses REST API with position parameter for V4
- `stop()`: Uses REST API with `encodedTrack: null` for V4
- `setEQ()`: Uses filters API (`filters: { equalizer: [...] }`) for V4
- `clearEQ()`: Uses filters API to clear equalizer for V4

#### Manager.ts Changes
- `search()`: Dynamically selects endpoint based on node version
- `decodeTracks()`: Dynamically selects endpoint based on node version

#### Utils.ts Changes
- `TrackData`: Updated interface to support both V3 and V4 formats
- `TrackDataInfo`: Added optional `duration` field (V4) alongside `length` (V3)
- `TrackUtils.build()`: Enhanced to parse both `data.info` (V3) and direct properties (V4)
- Track encoding field: Supports both `track` (V3) and `encoded` (V4)

### Migration Guide

#### For users upgrading from v2.x:

1. **Default behavior**: If you don't specify a version, V4 is used by default
2. **Explicit V3**: Add `version: 3` to your node options if using Lavalink V3
3. **Explicit V4**: Add `version: 4` to your node options if using Lavalink V4 (optional, as it's default)
4. **No code changes needed**: Your existing code will work if you're upgrading your Lavalink server to V4

```javascript
// Before (worked with V2 or older Lavalink)
const manager = new Manager({
  nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass" }]
});

// After - V4 (default)
const manager = new Manager({
  nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass", version: 4 }]
});

// After - V3 (if still using Lavalink V3)
const manager = new Manager({
  nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass", version: 3 }]
});
```

### Compatibility

- **Node.js**: v16 or higher required
- **Lavalink V4**: Fully supported
- **Lavalink V3**: Fully supported
- **Discord.js**: v14+ recommended
- **Eris**: Compatible with latest versions

### Known Issues

- None at this time

### Notes

- This update maintains full backward compatibility with existing code
- The version detection is automatic based on the `version` option in `NodeOptions`
- All examples and documentation have been updated to reflect V3/V4 support

## [2.4.0] - Previous Release

Previous stable release with Lavalink V2 support.
