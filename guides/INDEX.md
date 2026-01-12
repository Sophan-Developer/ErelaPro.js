# Erela.js Documentation Index

Welcome to the comprehensive documentation for erela.js v3.0 with Lavalink V3 & V4 support!

## 📚 Documentation Structure

### Core Documentation
1. **[README.md](../README.md)** - Quick overview and installation
2. **[DOCUMENTATION.md](../DOCUMENTATION.md)** - Complete API reference
3. **[STATUS-REPORT.md](../STATUS-REPORT.md)** - Current implementation status

### Guides

#### Getting Started
- **[QUICK-START.md](QUICK-START.md)** - Get up and running quickly
- **[introduction.md](introduction.md)** - What is erela.js?
- **[basics.md](basics.md)** - Basic concepts and usage

#### Features
- **[filters.md](filters.md)** - Complete audio filters guide (NEW!)
- **[advanced.md](advanced.md)** - Advanced features and techniques
- **[moreCommands.md](moreCommands.md)** - Additional command examples

#### Migration & Updates
- **[V3-V4-UPDATE-SUMMARY.md](V3-V4-UPDATE-SUMMARY.md)** - Lavalink V3 to V4 migration
- **[updating.md](updating.md)** - Updating from previous versions
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 🎯 Quick Navigation

### By Use Case

**"I'm completely new to erela.js"**
1. Start with [introduction.md](introduction.md)
2. Read [QUICK-START.md](QUICK-START.md)
3. Follow [basics.md](basics.md)
4. Try examples from [README.md](../README.md)

**"I want to add filters (Nightcore, Bass Boost, etc.)"**
- Read [filters.md](filters.md)
- See filter examples in [DOCUMENTATION.md](../DOCUMENTATION.md)

**"I'm migrating from Lavalink V3 to V4"**
- Read [V3-V4-UPDATE-SUMMARY.md](V3-V4-UPDATE-SUMMARY.md)
- Update node config with `version: 4`
- Test your bot

**"I need API reference"**
- See [DOCUMENTATION.md](../DOCUMENTATION.md)

**"I want advanced features"**
- Read [advanced.md](advanced.md)
- Check [moreCommands.md](moreCommands.md)

### By Topic

#### Setup & Configuration
- [Quick Start](QUICK-START.md) - Basic setup
- [Introduction](introduction.md) - Overview
- [Node Configuration](../DOCUMENTATION.md#configuration) - Detailed options

#### Core Features
- [Manager](../DOCUMENTATION.md#manager-methods) - Manager methods
- [Player](../DOCUMENTATION.md#player-methods) - Player controls
- [Queue](../DOCUMENTATION.md#queue) - Queue management
- [Events](../DOCUMENTATION.md#manager-events) - Event handling

#### Audio Features
- [Filters](filters.md) - All 9 audio filters
- [Equalizer](filters.md#1-equalizer) - Frequency control
- [Effects](filters.md#available-filters) - Audio effects

#### Advanced Topics
- [Plugins](../DOCUMENTATION.md#using-plugins) - Extend functionality
- [Multiple Nodes](../DOCUMENTATION.md#multiple-nodes-load-balancing) - Load balancing
- [Error Handling](../DOCUMENTATION.md#troubleshooting) - Debugging

## 🎵 Feature Matrix

| Feature | Lavalink V3 | Lavalink V4 | Notes |
|---------|-------------|-------------|-------|
| Basic Playback | ✅ | ✅ | Fully supported |
| Queue Management | ✅ | ✅ | Fully supported |
| Volume Control | ✅ | ✅ | Fully supported |
| Seek/Position | ✅ | ✅ | Fully supported |
| Equalizer | ✅ | ✅ | 15 bands |
| Karaoke | ✅ | ✅ | Vocal removal |
| Timescale | ✅ | ✅ | Speed/pitch/rate |
| Tremolo | ✅ | ✅ | Wavering effect |
| Vibrato | ✅ | ✅ | Pitch vibration |
| Rotation | ✅ | ✅ | 8D audio |
| Distortion | ✅ | ✅ | Harmonic distortion |
| Channel Mix | ✅ | ✅ | Stereo mixing |
| Low Pass | ✅ | ✅ | High freq filter |
| Multi-Filter | ⚠️ | ✅ | V4 has state tracking |
| REST API | ❌ | ✅ | V4 only |
| WebSocket | ✅ | ✅ | Both versions |
| Session Management | ❌ | ✅ | V4 only |

## 📖 Code Examples

### Minimum Working Example

```javascript
const { Client } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({ intents: ["Guilds", "GuildVoiceStates"] });

const manager = new Manager({
  nodes: [{ host: "localhost", port: 2333, password: "pass", version: 4 }],
  send: (id, payload) => client.guilds.cache.get(id)?.shard.send(payload)
});

manager.on("trackStart", (player, track) => {
  client.channels.cache.get(player.textChannel)?.send(`Playing: ${track.title}`);
});

client.on("ready", () => manager.init(client.user.id));
client.on("raw", d => manager.updateVoiceState(d));

client.login("TOKEN");
```

### Play Command

```javascript
// See DOCUMENTATION.md for complete example
const res = await manager.search(query, message.author);
const player = manager.create({ guild, voiceChannel, textChannel });
player.connect();
player.queue.add(res.tracks[0]);
if (!player.playing) player.play();
```

### Apply Filter

```javascript
// Nightcore
player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });

// 8D Audio
player.setRotation({ rotationHz: 0.2 });

// Clear all
player.clearFilters();
```

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Node won't connect | Check Lavalink is running, verify host/port/password | [Troubleshooting](../DOCUMENTATION.md#troubleshooting) |
| No audio | Verify bot permissions (Connect, Speak) | [Troubleshooting](../DOCUMENTATION.md#no-audio) |
| Filters not working | Use erela.js v3.0+ with `version: 4` | [Filter Guide](filters.md) |
| TypeScript errors | Install `@types/node` and `@types/ws` | [Troubleshooting](../DOCUMENTATION.md#typescript-errors) |

## 📦 What's Included

```
erela.js/
├── dist/                    # Compiled JavaScript
│   ├── index.js
│   ├── index.d.ts
│   └── structures/
├── src/                     # TypeScript source
│   ├── index.ts
│   └── structures/
│       ├── Manager.ts       # Manager class
│       ├── Node.ts          # Node connection
│       ├── Player.ts        # Player controls
│       ├── Queue.ts         # Queue management
│       └── Utils.ts         # Utilities
├── guides/                  # Documentation
│   ├── filters.md           # Filter guide
│   ├── QUICK-START.md       # Quick start
│   ├── V3-V4-UPDATE-SUMMARY.md
│   └── ...
├── DOCUMENTATION.md         # Complete API docs
├── README.md                # Package overview
└── package.json
```

## 🆘 Getting Help

1. **Check Documentation**: Read [DOCUMENTATION.md](../DOCUMENTATION.md)
2. **Search Issues**: Look for similar [GitHub Issues](https://github.com/MenuDocs/erela.js/issues)
3. **Join Discord**: Ask in [MenuDocs Discord](https://discord.gg/menudocs)
4. **Open Issue**: Create a [new issue](https://github.com/MenuDocs/erela.js/issues/new) with details

## 📜 Version Information

- **Current Version**: 3.0.0
- **Node.js**: v16.0.0+ required
- **Lavalink V3**: Supported
- **Lavalink V4**: Supported (Recommended)
- **TypeScript**: Included
- **Discord.js**: v14+ recommended

## 🔗 External Resources

- [Lavalink Documentation](https://lavalink.dev/)
- [Lavalink GitHub](https://github.com/lavalink-devs/Lavalink)
- [Discord.js Guide](https://discordjs.guide/)
- [MenuDocs Discord](https://discord.gg/menudocs)

---

**Last Updated**: January 12, 2026  
**Documentation Version**: 3.0.0

Need more help? Join our [Discord server](https://discord.gg/menudocs)!
