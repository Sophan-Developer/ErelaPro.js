# Quick Start Guide - Erela.js V3.0.0

> **🔧 Enhanced by [Sophan-Developer](https://github.com/Sophan-Developer)** - Full V3 & V4 Support

## What's New?

Erela.js now supports **both Lavalink V3 and V4** in a single package!

## Installation

```bash
npm install erela.js
```

## Basic Setup

### For Lavalink V4 (Recommended)

```javascript
const { Manager } = require("erela.js");

const manager = new Manager({
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
      version: 4  // Lavalink V4 (default)
    }
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

// Initialize the manager when your bot is ready
client.on("ready", () => {
  manager.init(client.user.id);
});

// Handle voice state updates
client.on("raw", (d) => {
  manager.updateVoiceState(d);
});
```

### For Lavalink V3

```javascript
const manager = new Manager({
  nodes: [
    {
      host: "localhost",
      port: 2333,
      password: "youshallnotpass",
      version: 3  // Lavalink V3
    }
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});
```

## Using Both V3 and V4 Nodes

```javascript
const manager = new Manager({
  nodes: [
    {
      identifier: "main-v4",
      host: "lavalink1.example.com",
      port: 2333,
      password: "password1",
      version: 4
    },
    {
      identifier: "backup-v3",
      host: "lavalink2.example.com",
      port: 2333,
      password: "password2",
      version: 3
    }
  ],
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});
```

## Playing Music

```javascript
// Create a player
const player = manager.create({
  guild: interaction.guildId,
  voiceChannel: interaction.member.voice.channelId,
  textChannel: interaction.channelId,
});

// Connect to voice channel
player.connect();

// Search for a track
const res = await manager.search("Never Gonna Give You Up", interaction.user);

// Add track to queue
player.queue.add(res.tracks[0]);

// Play the track
if (!player.playing && !player.paused && !player.queue.size) {
  player.play();
}
```

## Common Player Operations

All operations work the same regardless of Lavalink version:

```javascript
// Pause/Resume
player.pause(true);   // Pause
player.pause(false);  // Resume

// Volume (0-1000)
player.setVolume(50);

// Seek (in milliseconds)
player.seek(30000);  // Seek to 30 seconds

// Skip track
player.stop();

// Destroy player
player.destroy();

// Set equalizer
player.setEQ([
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.15 }
]);

// Clear equalizer
player.clearEQ();
```

## Events

```javascript
manager
  .on("nodeConnect", (node) => {
    console.log(`Node ${node.options.identifier} connected`);
  })
  .on("nodeError", (node, error) => {
    console.log(`Node ${node.options.identifier} error: ${error.message}`);
  })
  .on("trackStart", (player, track) => {
    console.log(`Now playing: ${track.title}`);
  })
  .on("queueEnd", (player) => {
    console.log("Queue ended");
    player.destroy();
  });
```

## Migrating from V2.x

No code changes needed! Just:

1. Update to erela.js@3.0.0
2. Add `version: 4` to your node config if using Lavalink V4
3. That's it!

```javascript
// Old (v2.x)
nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass" }]

// New (v3.0.0 with Lavalink V4)
nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass", version: 4 }]

// Or keep using V3
nodes: [{ host: "localhost", port: 2333, password: "youshallnotpass", version: 3 }]
```

## Version Requirements

- **Node.js**: v16 or higher
- **Lavalink V4**: Java 17+
- **Lavalink V3**: Java 11+

## Getting Lavalink

### Lavalink V4 (Recommended)
Download from: https://github.com/lavalink-devs/Lavalink/releases

### Lavalink V3
Download from: https://github.com/freyacodes/Lavalink/releases

## Support

- Discord: https://discord.gg/menudocs
- GitHub: https://github.com/MenuDocs/erela.js
- Documentation: https://erelajs-docs.netlify.app/

## Key Differences

| Feature | V3 | V4 |
|---------|----|----|
| WebSocket Path | `/` | `/v4/websocket` |
| Player Control | WebSocket | REST API |
| Track Field | `track` | `encoded` |
| Duration Field | `length` | `duration` |

## Tips

1. **Performance**: V4 generally offers better performance with REST-based player control
2. **Compatibility**: V3 nodes work perfectly if you have existing infrastructure
3. **Mixed Setup**: You can use both versions simultaneously for gradual migration
4. **Default**: If you don't specify a version, V4 is used by default

Happy coding! 🎵
