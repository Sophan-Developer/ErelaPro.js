# Erela.js v3.0 - Complete Documentation

## 📋 Table of Contents

| Section | Description |
|---------|-------------|
| [Introduction](#introduction) | Overview and key features |
| [Installation](#installation) | Setup and prerequisites |
| [Quick Start](#quick-start) | Get started in 5 minutes |
| [Configuration](#configuration) | Node and manager setup |
| [Core Concepts](#core-concepts) | Understanding the architecture |
| [API Reference](#api-reference) | Complete method documentation |
| [Filter Guide](#filter-guide) | Audio filters and effects |
| [Event Reference](#event-reference) | All available events |
| [Examples](#examples) | Real-world code examples |
| [Migration Guide](#migration-guide) | Upgrading from V2 to V3 |
| [Troubleshooting](#troubleshooting) | Common issues and solutions |

---

## Introduction

Erela.js is a powerful, easy-to-use Lavalink client for Node.js with **full support for both Lavalink V3 and V4**. Whether you're building a Discord music bot or integrating music playback into any application, erela.js provides a clean, intuitive API that handles all the complexity for you.

> **Enhanced and Maintained by [Sophan-Developer](https://github.com/Sophan-Developer)**  
> This version includes Lavalink V4 support, comprehensive filter implementations, and extensive documentation updates.

### Key Features

- 🎵 **Dual Version Support** - Works seamlessly with both Lavalink V3 and V4
- 🔄 **Automatic Detection** - Intelligently switches between V3 and V4 APIs based on configuration
- 🎛️ **Advanced Audio Filters** - 9 professional audio filters with state tracking
- 🎯 **Simple API** - Clean, intuitive methods that make sense
- 📦 **TypeScript Native** - Full TypeScript support with comprehensive type definitions
- 🔌 **Extensible** - Plugin system allows custom functionality
- ⚡ **High Performance** - Optimized for speed and reliability
- 🛡️ **Robust** - Comprehensive error handling and validation

### What's New in v3.0

**Lavalink V4 Integration:**
- REST API support for all player operations
- Session management with automatic recovery
- Enhanced track format handling
- Modern WebSocket paths (`/v4/websocket`)

**Enhanced Filter System:**
- All 9 audio filters fully implemented
- Multi-filter support (stack multiple filters)
- Filter state tracking for V4
- Seamless V3/V4 compatibility

**Developer Experience:**
- Improved error messages
- Better type definitions
- Comprehensive documentation
- Real-world examples

---

## Installation

### Prerequisites

- Node.js v16.0.0 or higher
- A Lavalink server (V3 or V4)
- Discord.js v14+ (or your preferred Discord library)

### Install via NPM

```bash
npm install erela.js
```

### Install via Yarn

```bash
yarn add erela.js
```

### From Source (Development)

```bash
git clone https://github.com/MenuDocs/erela.js.git
cd erela.js
npm install
npm run build
npm link
```

---

## Quick Start

### Step 1: Setup Lavalink

Download and run a Lavalink server. See [Lavalink documentation](https://lavalink.dev/) for details.

**For Lavalink V4:**
```yaml
server:
  port: 2333
  address: 0.0.0.0
lavalink:
  server:
    password: "youshallnotpass"
```

**For Lavalink V3:**
```yaml
server:
  port: 2333
  address: 0.0.0.0
lavalink:
  server:
    password: "youshallnotpass"
```

### Step 2: Basic Bot Setup

```javascript
const { Client } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates", "GuildMessages"]
});

// Create the manager
const manager = new Manager({
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
      version: 4 // Use 3 for Lavalink V3, 4 for Lavalink V4
    }
  ],
  // Send data to Discord
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

// Listen to manager events
manager.on("nodeConnect", node => {
  console.log(`Node "${node.options.identifier}" connected.`);
});

manager.on("nodeError", (node, error) => {
  console.log(`Node "${node.options.identifier}" error: ${error.message}`);
});

manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`Now playing: ${track.title}`);
});

manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("Queue has ended.");
  player.destroy();
});

// Discord client ready event
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  manager.init(client.user.id);
});

// Handle voice state updates
client.on("raw", d => manager.updateVoiceState(d));

// Login
client.login("YOUR_BOT_TOKEN");
```

### Step 3: Play Command

```javascript
client.on("messageCreate", async message => {
  if (message.content.startsWith("!play")) {
    const args = message.content.split(" ");
    const query = args.slice(1).join(" ");

    // Create player
    const player = manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });

    // Connect to voice channel
    player.connect();

    // Search for tracks
    const res = await manager.search(query, message.author);

    // Add to queue
    if (res.loadType === "SEARCH_RESULT" || res.loadType === "TRACK_LOADED") {
      player.queue.add(res.tracks[0]);
      message.channel.send(`Added: ${res.tracks[0].title}`);
    } else if (res.loadType === "PLAYLIST_LOADED") {
      player.queue.add(res.tracks);
      message.channel.send(`Added playlist: ${res.playlist.name}`);
    }

    // Play if not already playing
    if (!player.playing && !player.paused) player.play();
  }
});
```

---

## Configuration

### Lavalink Version Comparison

| Feature | Lavalink V3 | Lavalink V4 |
|---------|-------------|-------------|
| **WebSocket Path** | `/` | `/v4/websocket` |
| **REST API** | Limited | Full REST API |
| **Session Management** | Basic | Advanced with recovery |
| **Track Format** | `track.track` | `track.encoded` |
| **Filters** | WebSocket only | REST + WebSocket |
| **Voice Updates** | WebSocket | REST API |
| **Version Detection** | `version: 3` | `version: 4` |

### Manager Options

```typescript
interface ManagerOptions {
  /** The nodes to connect to */
  nodes: NodeOptions[];
  
  /** The client ID for Lavalink */
  clientId?: string;
  
  /** The client name for Lavalink */
  clientName?: string;
  
  /** Number of shards */
  shards?: number;
  
  /** Auto-play next track when current ends */
  autoPlay?: boolean;
  
  /** Array of plugins to use */
  plugins?: Plugin[];
  
  /** Default search platform (youtube, soundcloud, etc.) */
  defaultSearchPlatform?: string;
  
  /** Function to send data to Discord */
  send(id: string, payload: any): void;
}
```

### Node Options (Lavalink V4)

```javascript
{
  host: "localhost",        // Lavalink server host
  port: 2333,               // Lavalink server port
  password: "youshallnotpass", // Lavalink password
  secure: false,            // Use SSL/TLS
  identifier: "Main",       // Unique node identifier
  retryAmount: 5,           // Connection retry attempts
  retryDelay: 30000,        // Delay between retries (ms)
  requestTimeout: 10000,    // Request timeout (ms)
  version: 4,               // Lavalink version (3 or 4)
  region: "us"              // Server region (optional)
}
```

### Node Options (Lavalink V3)

```javascript
{
  host: "localhost",
  port: 2333,
  password: "youshallnotpass",
  secure: false,
  identifier: "Main",
  retryAmount: 5,
  retryDelay: 30000,
  version: 3,  // Important: Set to 3 for V3
  region: "us"
}
```

### Player Options

```javascript
{
  guild: "123456789",       // Guild ID (required)
  voiceChannel: "987654321", // Voice channel ID (required)
  textChannel: "456789123",  // Text channel ID (optional)
  selfMute: false,          // Self mute
  selfDeafen: false,        // Self deafen
  volume: 100,              // Initial volume (0-1000)
  node: "Main"              // Specific node to use (optional)
}
```

---

## Core Concepts

### Manager

The `Manager` class is the main entry point. It manages nodes, players, and handles communication with Lavalink.

```javascript
const manager = new Manager({
  nodes: [{ /* node options */ }],
  send: (id, payload) => { /* send to Discord */ }
});

manager.init(clientId);
```

### Node

Represents a Lavalink server connection. Handles WebSocket communication (V3/V4) and REST API calls (V4).

```javascript
// Access nodes
manager.nodes.get("Main");

// Least used node
manager.leastUsedNodes.first();
```

### Player

Represents a music player for a specific guild. Handles playback, queue, and filters.

```javascript
// Create player
const player = manager.create({
  guild: guildId,
  voiceChannel: voiceChannelId,
  textChannel: textChannelId
});

// Control playback
player.play();
player.pause(true);
player.setVolume(80);
player.seek(30000); // Seek to 30 seconds
player.stop();
```

### Queue

Manages the track queue for a player.

```javascript
// Add tracks
player.queue.add(track);
player.queue.add([track1, track2, track3]);

// Access tracks
player.queue.current;   // Currently playing
player.queue.previous;  // Previously played
player.queue[0];        // Next track
player.queue.length;    // Queue length

// Remove tracks
player.queue.remove(0);  // Remove by index
player.queue.clear();    // Clear all
```

### Track

Represents a music track.

```javascript
{
  track: "base64string",    // Encoded track data
  title: "Song Title",
  identifier: "dQw4w9WgXcQ",
  author: "Artist Name",
  duration: 180000,         // Duration in ms
  isSeekable: true,
  isStream: false,
  uri: "https://...",
  thumbnail: "https://...",
  requester: userObject
}
```

---

## API Reference

### Manager Methods

#### `manager.init(clientId)`
Initializes the manager and connects to all nodes.

```javascript
client.on("ready", () => {
  manager.init(client.user.id);
});
```

#### `manager.search(query, requester)`
Searches for tracks.

**Parameters:**
- `query` - String or SearchQuery object
- `requester` - User object or any requester data

**Returns:** Promise<SearchResult>

```javascript
// Search YouTube
const res = await manager.search("Never Gonna Give You Up", message.author);

// Search specific platform
const res = await manager.search({
  query: "Despacito",
  source: "youtube"
}, message.author);

// Direct URL
const res = await manager.search("https://youtu.be/dQw4w9WgXcQ", message.author);
```

**SearchResult:**
```javascript
{
  loadType: "SEARCH_RESULT", // or TRACK_LOADED, PLAYLIST_LOADED, NO_MATCHES, LOAD_FAILED
  tracks: [Track],
  playlist: {
    name: "Playlist Name",
    selectedTrack: Track,
    duration: 3600000
  },
  exception: null
}
```

#### `manager.create(options)`
Creates a new player or returns existing one.

```javascript
const player = manager.create({
  guild: "123456789",
  voiceChannel: "987654321",
  textChannel: "456789123",
  volume: 80
});
```

#### `manager.destroy(guildId)`
Destroys a player and disconnects from voice.

```javascript
manager.destroy("123456789");
```

#### `manager.get(guildId)`
Gets an existing player.

```javascript
const player = manager.get("123456789");
```

### Player Methods

#### `player.connect()`
Connects to the voice channel.

```javascript
player.connect();
```

#### `player.disconnect()`
Disconnects from the voice channel.

```javascript
player.disconnect();
```

#### `player.play(track?, options?)`
Plays a track or the next track in queue.

```javascript
// Play next in queue
player.play();

// Play specific track
player.play(track);

// Play with options
player.play(track, {
  startTime: 30000,  // Start at 30 seconds
  endTime: 180000,   // End at 3 minutes
  noReplace: false
});
```

#### `player.pause(state)`
Pauses or resumes playback.

```javascript
player.pause(true);  // Pause
player.pause(false); // Resume
```

#### `player.stop(amount?)`
Stops current track.

```javascript
player.stop();     // Stop current
player.stop(3);    // Skip 3 tracks
```

#### `player.seek(position)`
Seeks to a position in milliseconds.

```javascript
player.seek(60000); // Seek to 1 minute
```

#### `player.setVolume(volume)`
Sets the player volume (0-1000).

```javascript
player.setVolume(100); // 100%
player.setVolume(50);  // 50%
```

#### `player.setTrackRepeat(state)`
Enables/disables track repeat.

```javascript
player.setTrackRepeat(true);  // Repeat current track
player.setTrackRepeat(false); // Disable
```

#### `player.setQueueRepeat(state)`
Enables/disables queue repeat.

```javascript
player.setQueueRepeat(true);  // Repeat entire queue
player.setQueueRepeat(false); // Disable
```

### Filter Methods

#### `player.setEQ(...bands)`
Sets equalizer bands (0-14).

```javascript
// Bass boost
player.setEQ(
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.25 },
  { band: 2, gain: 0.15 }
);

// Or use array
player.setEQ([
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.2 }
]);
```

#### `player.clearEQ()`
Clears all equalizer bands.

```javascript
player.clearEQ();
```

#### `player.setKaraoke(settings)`
Applies karaoke filter (removes vocals).

```javascript
player.setKaraoke({
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0
});

// Disable
player.setKaraoke(null);
```

#### `player.setTimescale(settings)`
Adjusts speed, pitch, and rate.

```javascript
// Nightcore effect
player.setTimescale({
  speed: 1.3,
  pitch: 1.3,
  rate: 1.0
});

// Disable
player.setTimescale(null);
```

#### `player.setTremolo(settings)`
Applies tremolo effect.

```javascript
player.setTremolo({
  frequency: 2.0,
  depth: 0.5
});

// Disable
player.setTremolo(null);
```

#### `player.setVibrato(settings)`
Applies vibrato effect.

```javascript
player.setVibrato({
  frequency: 2.0,
  depth: 0.5
});

// Disable
player.setVibrato(null);
```

#### `player.setRotation(settings)`
Applies 8D audio effect.

```javascript
player.setRotation({
  rotationHz: 0.2
});

// Disable
player.setRotation(null);
```

#### `player.setDistortion(settings)`
Applies distortion effect.

```javascript
player.setDistortion({
  sinOffset: 0,
  sinScale: 1,
  cosOffset: 0,
  cosScale: 1,
  tanOffset: 0,
  tanScale: 1,
  offset: 0,
  scale: 1
});

// Disable
player.setDistortion(null);
```

#### `player.setChannelMix(settings)`
Adjusts stereo channel mixing.

```javascript
// Mono
player.setChannelMix({
  leftToLeft: 0.5,
  leftToRight: 0.5,
  rightToLeft: 0.5,
  rightToRight: 0.5
});

// Disable
player.setChannelMix(null);
```

#### `player.setLowPass(settings)`
Applies low-pass filter.

```javascript
player.setLowPass({
  smoothing: 20.0
});

// Disable
player.setLowPass(null);
```

#### `player.setFilters(filters)` (V4 only)
Sets multiple filters at once.

```javascript
player.setFilters({
  timescale: { speed: 1.3, pitch: 1.3, rate: 1 },
  rotation: { rotationHz: 0.2 },
  equalizer: [
    { band: 0, gain: 0.2 },
    { band: 1, gain: 0.2 }
  ]
});
```

#### `player.clearFilters()`
Clears all active filters.

```javascript
player.clearFilters();
```

---

## Filter Guide

### Available Filters Reference

| Filter | Description | Key Parameters | Use Case |
|--------|-------------|----------------|----------|
| **Equalizer** | 15-band EQ (0-14) | `band`, `gain` (-0.25 to 1.0) | Bass boost, treble enhance |
| **Karaoke** | Vocal removal | `level`, `monoLevel`, `filterBand`, `filterWidth` | Remove vocals for karaoke |
| **Timescale** | Speed/pitch control | `speed`, `pitch`, `rate` (0.05-5.0) | Nightcore, vaporwave |
| **Tremolo** | Volume oscillation | `frequency` (>0), `depth` (0-1) | Tremolo effect |
| **Vibrato** | Pitch oscillation | `frequency` (>0), `depth` (0-1) | Vibrato effect |
| **Rotation** | 8D audio | `rotationHz` (Hz) | Surround sound effect |
| **Distortion** | Audio distortion | `sinOffset`, `cosOffset`, `tanOffset`, etc. | Rock/metal sound |
| **ChannelMix** | Stereo mixing | `leftToLeft`, `leftToRight`, etc. (0-1) | Mono, stereo swap |
| **LowPass** | High frequency cut | `smoothing` (>=1.0) | Muffled/underwater |

### Filter Examples

#### Bass Boost with Equalizer

```javascript
player.setEqualizer([
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.20 },
  { band: 2, gain: 0.15 }
]);
```

#### Nightcore Effect

```javascript
player.setTimescale({
  speed: 1.15,
  pitch: 1.15,
  rate: 1.0
});
```

#### 8D Audio

```javascript
player.setRotation({
  rotationHz: 0.2
});
```

#### Karaoke (Vocal Removal)

```javascript
player.setKaraoke({
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0
});
```

#### Combining Multiple Filters (V4)

```javascript
// Nightcore + Bass Boost
player.setTimescale({ speed: 1.15, pitch: 1.15, rate: 1 });
player.setEqualizer([
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.20 }
]);

// Or use setFilters() for V4
player.setFilters({
  timescale: { speed: 1.15, pitch: 1.15, rate: 1 },
  equalizer: [
    { band: 0, gain: 0.25 },
    { band: 1, gain: 0.20 }
  ]
});
```

---

## Event Reference

### Manager Events

| Event | Parameters | Description | When to Use |
|-------|-----------|-------------|-------------|
| `nodeConnect` | `node` | Node connected successfully | Log connection status |
| `nodeReconnect` | `node` | Node reconnecting | Handle reconnection |
| `nodeDisconnect` | `node`, `reason` | Node disconnected | Handle disconnection |
| `nodeError` | `node`, `error` | Node encountered error | Error logging |
| `nodeRaw` | `payload` | Raw payload from node | Debugging |
| `playerCreate` | `player` | Player created | Initialize player data |
| `playerDestroy` | `player` | Player destroyed | Cleanup resources |
| `queueEnd` | `player` | Queue finished | Auto-disconnect |
| `trackStart` | `player`, `track` | Track started playing | Now playing message |
| `trackEnd` | `player`, `track`, `payload` | Track ended | Handle next track |
| `trackStuck` | `player`, `track`, `payload` | Track stuck | Skip or retry |
| `trackError` | `player`, `track`, `payload` | Track error | Error handling |
| `socketClosed` | `player`, `payload` | Voice socket closed | Handle disconnect |

### Event Examples

```javascript
// Node connection events
manager.on("nodeConnect", node => {
  console.log(`✅ Node ${node.options.identifier} connected`);
});

manager.on("nodeError", (node, error) => {
  console.error(`❌ Node ${node.options.identifier} error:`, error.message);
});

// Track events
manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`🎵 Now playing: **${track.title}** by ${track.author}`);
});

manager.on("trackEnd", (player, track, payload) => {
  console.log(`Track ended: ${payload.reason}`);
});

manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("Queue finished! Disconnecting...");
  player.destroy();
});

// Error handling
manager.on("trackError", (player, track, payload) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`❌ Error playing track: ${track.title}`);
  player.stop();
});

manager.on("trackStuck", (player, track, payload) => {
  console.log(`Track stuck for ${payload.thresholdMs}ms, skipping...`);
  player.stop();
});
```

---

## Quick Reference Tables

### Player Methods Quick Reference

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | `void` | Connect to voice channel |
| `disconnect()` | - | `void` | Disconnect from voice |
| `play(track?, options?)` | `track`, `options` | `void` | Play track or next in queue |
| `pause(state)` | `boolean` | `this` | Pause/resume playback |
| `stop(amount?)` | `number` | `this` | Stop and skip tracks |
| `seek(position)` | `number` (ms) | `this` | Seek to position |
| `setVolume(volume)` | `number` (0-1000) | `this` | Set volume |
| `setTrackRepeat(state)` | `boolean` | `this` | Repeat current track |
| `setQueueRepeat(state)` | `boolean` | `this` | Repeat entire queue |
| `setTextChannel(channel)` | `string` | `this` | Set text channel |
| `setVoiceChannel(channel)` | `string` | `this` | Set voice channel |
| `destroy()` | - | `void` | Destroy player |

### Search Result Types

| Load Type | Description | tracks | playlist |
|-----------|-------------|--------|----------|
| `TRACK_LOADED` | Single track found | Array with 1 track | `null` |
| `PLAYLIST_LOADED` | Playlist found | Array of tracks | Playlist info |
| `SEARCH_RESULT` | Search results | Array of tracks | `null` |
| `NO_MATCHES` | No results | Empty array | `null` |
| `LOAD_FAILED` | Error occurred | Empty array | `null` |

### Common Use Cases

| Task | Code Example |
|------|-------------|
| **Play from URL** | `const res = await manager.search("https://youtu.be/...", user);`<br>`player.queue.add(res.tracks[0]);`<br>`player.play();` |
| **Search YouTube** | `const res = await manager.search("song name", user);`<br>`player.queue.add(res.tracks[0]);` |
| **Skip song** | `player.stop();` |
| **Pause** | `player.pause(true);` |
| **Resume** | `player.pause(false);` |
| **Volume 50%** | `player.setVolume(50);` |
| **Bass boost** | `player.setEqualizer([{band:0,gain:0.25},{band:1,gain:0.2}]);` |
| **Clear queue** | `player.queue.clear();` |
| **Get queue size** | `player.queue.size` or `player.queue.length` |

---

---

## Troubleshooting

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **WebSocket 404 Error** | Using V4 with wrong path | Set `version: 4` in node options |
| **Track not playing** | Wrong track format | Use `track.encoded` for V4, `track.track` for V3 |
| **Authorization failed** | Missing password | Add `password` to node options |
| **Voice not connecting** | Discord payload not sent | Implement `send()` function correctly |
| **Filters not working** | Wrong Lavalink version | Ensure node supports filters (V3.3+ or V4+) |
| **Queue not advancing** | Missing `trackEnd` handler | Listen to `trackEnd` event |
| **Player destroyed immediately** | No tracks in queue | Add tracks before calling `play()` |
| **Search returns no results** | Invalid query or source | Check query format and source availability |

### Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
// Set DEBUG environment variable
process.env.DEBUG = "erela.js";

// Or check node WebSocket messages
manager.on("nodeRaw", payload => {
  console.log("Raw payload:", payload);
});
```

### Version Detection

```javascript
// Check node version
const node = manager.nodes.first();
console.log("Lavalink version:", node.options.version);

// Force specific version
const manager = new Manager({
  nodes: [{
    host: "localhost",
    port: 2333,
    password: "youshallnotpass",
    version: 4, // Force V4
  }]
});
```

---

## Examples

### Complete Music Bot Example

```javascript
const { Client, GatewayIntentBits } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const manager = new Manager({
  nodes: [{
    host: "localhost",
    port: 2333,
    password: "youshallnotpass",
    version: 4,
  }],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

// Manager events
manager.on("nodeConnect", node => {
  console.log(`✅ Node ${node.options.identifier} connected`);
});

manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`🎵 Now playing: **${track.title}**`);
});

manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("Queue finished!");
  player.destroy();
});

// Discord events
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  manager.init(client.user.id);
});

client.on("raw", d => manager.updateVoiceState(d));

// Commands
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // Play command
  if (message.content.startsWith("!play")) {
    const query = message.content.slice(6);
    if (!query) return message.reply("Please provide a song name or URL");

    const player = manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });

    if (player.state !== "CONNECTED") player.connect();

    const res = await manager.search(query, message.author);

    if (res.loadType === "LOAD_FAILED") {
      return message.reply("❌ Failed to load track");
    }

    if (res.loadType === "NO_MATCHES") {
      return message.reply("❌ No results found");
    }

    if (res.loadType === "PLAYLIST_LOADED") {
      player.queue.add(res.tracks);
      message.reply(`✅ Added playlist: **${res.playlist.name}** (${res.tracks.length} tracks)`);
    } else {
      player.queue.add(res.tracks[0]);
      message.reply(`✅ Added: **${res.tracks[0].title}**`);
    }

    if (!player.playing && !player.paused && !player.queue.size) {
      player.play();
    }
  }

  // Pause command
  if (message.content === "!pause") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    player.pause(!player.paused);
    message.reply(player.paused ? "⏸️ Paused" : "▶️ Resumed");
  }

  // Skip command
  if (message.content === "!skip") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    player.stop();
    message.reply("⏭️ Skipped");
  }

  // Volume command
  if (message.content.startsWith("!volume")) {
    const volume = parseInt(message.content.slice(8));
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply("❌ Volume must be between 0-100");
    }
    
    player.setVolume(volume);
    message.reply(`🔊 Volume set to ${volume}%`);
  }

  // Nightcore command
  if (message.content === "!nightcore") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    player.setTimescale({ speed: 1.15, pitch: 1.15, rate: 1 });
    message.reply("🌙 Nightcore effect applied");
  }

  // Clear filters command
  if (message.content === "!clearfilters") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    player.clearFilters();
    message.reply("🔧 Filters cleared");
  }

  // Queue command
  if (message.content === "!queue") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player active");
    
    const queue = player.queue;
    const current = queue.current;
    const upcoming = queue.slice(0, 10);
    
    let description = `**Now Playing:**\n${current.title}\n\n`;
    
    if (upcoming.length) {
      description += `**Up Next:**\n`;
      upcoming.forEach((track, i) => {
        description += `${i + 1}. ${track.title}\n`;
      });
    }
    
    if (queue.length > 10) {
      description += `\n...and ${queue.length - 10} more`;
    }
    
    message.reply(description);
  }
});

client.login("YOUR_BOT_TOKEN");
```

---

## Migration Guide

### Upgrading from V2 to V3

#### Breaking Changes

1. **Node Configuration** - V4 nodes require `version: 4`
2. **Track Format** - Use `track.encoded` instead of `track.track` for V4
3. **Filter Methods** - Some filter methods have updated parameters

#### Migration Steps

**Step 1: Update node configuration**

```javascript
// Before (V2)
nodes: [{
  host: "localhost",
  port: 2333,
  password: "youshallnotpass"
}]

// After (V3 with V4 support)
nodes: [{
  host: "localhost",
  port: 2333,
  password: "youshallnotpass",
  version: 4  // Add this for V4 nodes
}]
```

**Step 2: No code changes needed!**

The library handles V3/V4 differences automatically. Your existing code will work with both versions.

**Step 3: Test filters**

```javascript
// All filter methods work with both V3 and V4
player.setTimescale({ speed: 1.15, pitch: 1.15, rate: 1 });
player.setEqualizer([{ band: 0, gain: 0.25 }]);
player.setRotation({ rotationHz: 0.2 });
```

#### Recommended Updates

- Update TypeScript definitions: `npm install @types/node@latest`
- Review filter usage (all 9 filters now fully supported)
- Add error handling for `trackError` event

---

## Support and Resources

### Links

- **GitHub Repository**: [MenuDocs/erela.js](https://github.com/MenuDocs/erela.js) (Original)
- **Enhanced Version**: [Sophan-Developer](https://github.com/Sophan-Developer/Sophan-developer)
- **Developer Profile**: [@Sophan-Developer](https://github.com/Sophan-Developer)
- **NPM Package**: [erela.js](https://www.npmjs.com/package/erela.js)
- **Lavalink Documentation**: [lavalink.dev](https://lavalink.dev/)
- **Discord.js Guide**: [discordjs.guide](https://discordjs.guide/)

### Getting Help

1. Check this documentation
2. Read the [troubleshooting section](#troubleshooting)
3. Check [GitHub Issues](https://github.com/MenuDocs/erela.js/issues)
4. Ask in the [Discord support server](https://discord.gg/menudocs)

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## Credits and Attribution

### Maintainer and Developer

**Built and Updated by:** [Sophan-Developer](https://github.com/Sophan-Developer)  
**Repository:** [Sophan-Developer/Khlangbot](https://github.com/Sophan-Developer/Sophan-developer)  
**Profile:** [github.com/Sophan-Developer](https://github.com/Sophan-Developer)

### Original Project

**Original Library:** [MenuDocs/erela.js](https://github.com/MenuDocs/erela.js)  
**Enhanced Version:** Updated with Lavalink V4 support, comprehensive filters, and improved documentation

---

**Documentation Version:** 3.0.0  
**Last Updated:** January 12, 2026  
**Updated By:** Sophan-Developer  
**Status:** ✅ Production Ready
Emitted when a node connects.

```javascript
manager.on("nodeConnect", node => {
  console.log(`${node.options.identifier} connected`);
});
```

#### `nodeReconnect`
Emitted when a node reconnects.

```javascript
manager.on("nodeReconnect", node => {
  console.log(`${node.options.identifier} reconnecting`);
});
```

#### `nodeDisconnect`
Emitted when a node disconnects.

```javascript
manager.on("nodeDisconnect", (node, reason) => {
  console.log(`${node.options.identifier} disconnected: ${reason.reason}`);
});
```

#### `nodeError`
Emitted when a node encounters an error.

```javascript
manager.on("nodeError", (node, error) => {
  console.error(`${node.options.identifier} error:`, error);
});
```

#### `playerCreate`
Emitted when a player is created.

```javascript
manager.on("playerCreate", player => {
  console.log(`Player created in guild ${player.guild}`);
});
```

#### `playerDestroy`
Emitted when a player is destroyed.

```javascript
manager.on("playerDestroy", player => {
  console.log(`Player destroyed in guild ${player.guild}`);
});
```

#### `queueEnd`
Emitted when the queue ends.

```javascript
manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("Queue has ended!");
  player.destroy();
});
```

#### `trackStart`
Emitted when a track starts playing.

```javascript
manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`Now playing: **${track.title}**`);
});
```

#### `trackEnd`
Emitted when a track ends.

```javascript
manager.on("trackEnd", (player, track, reason) => {
  console.log(`Track ended: ${track.title} (${reason})`);
});
```

#### `trackStuck`
Emitted when a track gets stuck.

```javascript
manager.on("trackStuck", (player, track, threshold) => {
  console.log(`Track stuck: ${track.title} (${threshold}ms)`);
});
```

#### `trackError`
Emitted when a track encounters an error.

```javascript
manager.on("trackError", (player, track, error) => {
  console.error(`Track error: ${track.title}`, error);
});
```

#### `socketClosed`
Emitted when the WebSocket connection closes.

```javascript
manager.on("socketClosed", (player, payload) => {
  console.log(`Socket closed: ${payload.reason} (${payload.code})`);
});
```

---

## Examples

### Complete Music Bot

```javascript
const { Client, GatewayIntentBits } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const manager = new Manager({
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
      version: 4
    }
  ],
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

manager.on("nodeConnect", node => {
  console.log(`✅ Node "${node.options.identifier}" connected.`);
});

manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send(`🎵 Now playing: **${track.title}** by **${track.author}**`);
});

manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  channel.send("📭 Queue has ended.");
  player.destroy();
});

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  manager.init(client.user.id);
});

client.on("raw", d => manager.updateVoiceState(d));

client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith("!")) return;

  const args = message.content.slice(1).split(" ");
  const command = args.shift().toLowerCase();

  if (command === "play") {
    if (!message.member.voice.channel)
      return message.reply("❌ Join a voice channel first!");

    const query = args.join(" ");
    if (!query) return message.reply("❌ Provide a song name or URL!");

    let player = manager.get(message.guild.id);
    if (!player) {
      player = manager.create({
        guild: message.guild.id,
        voiceChannel: message.member.voice.channel.id,
        textChannel: message.channel.id,
      });
      player.connect();
    }

    const res = await manager.search(query, message.author);

    switch (res.loadType) {
      case "SEARCH_RESULT":
      case "TRACK_LOADED":
        player.queue.add(res.tracks[0]);
        message.channel.send(`✅ Added: **${res.tracks[0].title}**`);
        break;
      case "PLAYLIST_LOADED":
        player.queue.add(res.tracks);
        message.channel.send(
          `✅ Added playlist: **${res.playlist.name}** (${res.tracks.length} tracks)`
        );
        break;
      case "NO_MATCHES":
        return message.reply("❌ No results found!");
      case "LOAD_FAILED":
        return message.reply("❌ Failed to load track!");
    }

    if (!player.playing && !player.paused) player.play();
  }

  if (command === "pause") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    player.pause(!player.paused);
    message.channel.send(player.paused ? "⏸️ Paused" : "▶️ Resumed");
  }

  if (command === "stop") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    player.destroy();
    message.channel.send("⏹️ Stopped and disconnected");
  }

  if (command === "skip") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    player.stop();
    message.channel.send("⏭️ Skipped");
  }

  if (command === "volume") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 0 || volume > 100)
      return message.reply("❌ Provide a volume between 0-100!");
    
    player.setVolume(volume);
    message.channel.send(`🔊 Volume set to ${volume}%`);
  }

  if (command === "nightcore") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    const isActive = player.filters.timescale && player.filters.timescale.speed > 1;
    
    if (isActive) {
      player.setTimescale(null);
      message.channel.send("❌ Nightcore disabled");
    } else {
      player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });
      message.channel.send("✅ Nightcore enabled");
    }
  }

  if (command === "bassboost") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    const isActive = player.filters.equalizer;
    
    if (isActive) {
      player.clearEQ();
      message.channel.send("❌ Bass boost disabled");
    } else {
      player.setEQ(
        { band: 0, gain: 0.25 },
        { band: 1, gain: 0.25 },
        { band: 2, gain: 0.15 }
      );
      message.channel.send("✅ Bass boost enabled");
    }
  }

  if (command === "8d") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    const isActive = player.filters.rotation;
    
    if (isActive) {
      player.setRotation(null);
      message.channel.send("❌ 8D audio disabled");
    } else {
      player.setRotation({ rotationHz: 0.2 });
      message.channel.send("✅ 8D audio enabled");
    }
  }

  if (command === "queue") {
    const player = manager.get(message.guild.id);
    if (!player) return message.reply("❌ No player found!");
    
    if (!player.queue.current)
      return message.reply("❌ Nothing is playing!");
    
    const queue = player.queue;
    const current = `**Now Playing:**\n${queue.current.title}\n\n`;
    const upcoming = queue.length
      ? `**Up Next:**\n${queue.slice(0, 10).map((track, i) => `${i + 1}. ${track.title}`).join("\n")}`
      : "**Up Next:**\nNothing";
    
    message.channel.send(current + upcoming);
  }
});

client.login("YOUR_BOT_TOKEN");
```

### Using Plugins

```javascript
const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");
const Deezer = require("erela.js-deezer");
const Apple = require("erela.js-apple");

const manager = new Manager({
  nodes: [{ /* ... */ }],
  plugins: [
    new Spotify({
      clientID: "your-spotify-client-id",
      clientSecret: "your-spotify-client-secret"
    }),
    new Deezer(),
    new Apple()
  ],
  send: (id, payload) => { /* ... */ }
});
```

### Multiple Nodes (Load Balancing)

```javascript
const manager = new Manager({
  nodes: [
    {
      host: "node1.example.com",
      port: 2333,
      password: "password1",
      identifier: "Node 1",
      version: 4,
      region: "us"
    },
    {
      host: "node2.example.com",
      port: 2333,
      password: "password2",
      identifier: "Node 2",
      version: 4,
      region: "eu"
    }
  ],
  send: (id, payload) => { /* ... */ }
});

// erela.js will automatically distribute players across nodes
```

---

## Migration Guide

### From V3 to V4 (Lavalink Version)

**Step 1: Update Node Configuration**

```javascript
// Old (V3)
nodes: [{ host: "localhost", port: 2333, password: "pass" }]

// New (V4)
nodes: [{ 
  host: "localhost", 
  port: 2333, 
  password: "pass",
  version: 4  // Add this line
}]
```

**Step 2: No Code Changes Needed!**

erela.js automatically handles all V3/V4 differences internally. Your existing code continues to work unchanged.

**Step 3: Test**

Run your bot and verify everything works. The library will use V4 APIs automatically.

### From erela.js v2.x to v3.x

**Breaking Changes:**
- None! v3.0 is fully backwards compatible

**New Features:**
- Lavalink V4 support
- Enhanced filter system
- Better error handling

**Migration Steps:**
1. Update package: `npm install erela.js@latest`
2. Add `version: 4` to node options if using Lavalink V4
3. Enjoy new features!

---

## Troubleshooting

### Connection Issues

**Problem:** Node won't connect  
**Solution:** Check Lavalink is running, host/port are correct, and password matches

### No Audio

**Problem:** Bot connects but no sound  
**Solution:** 
1. Check bot has "Connect" and "Speak" permissions
2. Verify Lavalink can reach audio sources
3. Check if track loaded successfully

### Filters Not Working

**Problem:** Filters set but sound doesn't change  
**Solution:**
- For V4: Use erela.js v3.0+ with `version: 4` in node config
- For V3: Ensure Lavalink V3 supports filters (some builds don't)

### TypeScript Errors

**Problem:** Type errors in TypeScript project  
**Solution:** Install `@types/node` and `@types/ws`

```bash
npm install --save-dev @types/node @types/ws
```

---

## Support

- **Documentation:** [GitHub Wiki](https://github.com/MenuDocs/erela.js/wiki)
- **Discord:** [MenuDocs Discord](https://discord.gg/menudocs)
- **Issues:** [GitHub Issues](https://github.com/MenuDocs/erela.js/issues)
- **Lavalink:** [Lavalink Discord](https://discord.gg/lavalink)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

Apache-2.0 License - see [LICENSE](../LICENSE) for details.

---

## Credits

- **Author:** [MenuDocs](https://github.com/MenuDocs)
- **Contributors:** See [Contributors](https://github.com/MenuDocs/erela.js/graphs/contributors)
- **Lavalink:** [Lavalink Team](https://github.com/lavalink-devs/Lavalink)
