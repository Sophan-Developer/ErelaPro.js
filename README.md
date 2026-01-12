<div align = "center">
    <img src = "https://solaris-site.netlify.app/projects/erelajs/images/transparent_logo.png">
    <hr>
    <br>
    <a href="https://discord.gg/menudocs">
        <img src="https://img.shields.io/discord/416512197590777857?color=7289DA&label=Support&logo=discord&style=for-the-badge" alt="Discord">
    </a>
    <a href="https://www.npmjs.com/package/erela.js">
        <img src="https://img.shields.io/npm/dw/erela.js?color=CC3534&logo=npm&style=for-the-badge" alt="Downloads">
    </a>
    <a href="https://www.npmjs.com/package/erela.js">
        <img src="https://img.shields.io/npm/v/erela.js?color=red&label=Version&logo=npm&style=for-the-badge" alt="Npm version">
    </a>
    <br>
    <a href="https://github.com/MenuDocs/erela.js">
        <img src="https://img.shields.io/github/stars/MenuDocs/erela.js?color=333&logo=github&style=for-the-badge" alt="Github stars">
    </a>
    <a href="https://github.com/MenuDocs/erela.js/blob/master/LICENSE">
        <img src="https://img.shields.io/github/license/MenuDocs/erela.js?color=6e5494&logo=github&style=for-the-badge" alt="License">
    </a>
    <hr>
</div>

# Erela.js v3.0 - Lavalink V3 & V4 Support 🎵

A powerful and easy-to-use Lavalink client for Node.js with **full support for both Lavalink V3 and V4**.

> **🔧 Enhanced and Maintained by [Sophan-Developer](https://github.com/Sophan-Developer)**  
> This version includes comprehensive Lavalink V4 support, all 9 audio filters, and extensive improvements.

## ✨ Features

- 🎵 **Dual Version Support** - Seamlessly works with Lavalink V3 and V4
- 🔄 **Automatic Detection** - Intelligently switches between V3/V4 APIs
- 🎛️ **9 Audio Filters** - Professional effects including Nightcore, Bass Boost, 8D, Karaoke
- 📦 **TypeScript Native** - Full type definitions included
- 🔌 **Plugin System** - Extend with Spotify, Deezer, Apple Music
- ⚡ **High Performance** - Optimized for speed and reliability

## 🆕 What's New in v3.0.0

- ✅ **Full Lavalink V4 Support** - REST API, session management, enhanced filters
- ✅ **Enhanced Filter System** - All 9 filters with state tracking for V4
- ✅ **Backward Compatible** - Full Lavalink V3 support maintained
- ✅ **Automatic Version Detection** - Seamlessly handles V3/V4 differences
- ✅ **Improved Type Definitions** - Better TypeScript support
- ✅ **Comprehensive Documentation** - Complete guides and examples

## 📦 Installation

```bash
npm install erela.js
```

## ⚡ Quick Start

```javascript
const { Client } = require("discord.js");
const { Manager } = require("erela.js");

const client = new Client({ intents: ["Guilds", "GuildVoiceStates", "GuildMessages"] });

const manager = new Manager({
  nodes: [{
    host: "localhost",
    port: 2333,
    password: "youshallnotpass",
    version: 4 // 3 for V3, 4 for V4
  }],
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

manager.on("trackStart", (player, track) => {
  client.channels.cache.get(player.textChannel)
    .send(`Now playing: ${track.title}`);
});

client.on("ready", () => manager.init(client.user.id));
client.on("raw", d => manager.updateVoiceState(d));

client.login("YOUR_BOT_TOKEN");
```

## 🎛️ Audio Filters

```javascript
// Nightcore
player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });

// Bass Boost
player.setEQ(
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.25 }
);

// 8D Audio
player.setRotation({ rotationHz: 0.2 });

// Karaoke
player.setKaraoke({ level: 1.0, monoLevel: 1.0, filterBand: 220, filterWidth: 100 });
```

See [Filter Guide](guides/filters.md) for all 9 filters.

## 📚 Documentation & Guides

- **[Complete Documentation](DOCUMENTATION.md)** - Full API reference and examples
- **[Filter Guide](guides/filters.md)** - Detailed filter documentation
- **[V3-V4 Update Summary](guides/V3-V4-UPDATE-SUMMARY.md)** - Migration guide
- **[Quick Start](guides/QUICK-START.md)** - Get started quickly
- **[Advanced Usage](guides/advanced.md)** - Advanced features

## 🔧 Prerequisites

- **Node.js v16+** (Required)
- **Lavalink Server** - V3 or V4
  - [Lavalink V4](https://github.com/lavalink-devs/Lavalink/releases) (Recommended)
  - [Lavalink V3](https://github.com/freyacodes/Lavalink/releases)
- **Java 17+** for Lavalink V4, or Java 11+ for V3

## 💡 Usage Examples

### Play Command

```javascript
client.on("messageCreate", async message => {
  if (message.content.startsWith("!play")) {
    const query = message.content.slice(6);
    
    const player = manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });
    
    player.connect();
    
    const res = await manager.search(query, message.author);
    player.queue.add(res.tracks[0]);
    
    if (!player.playing) player.play();
  }
});
```

### With Plugins (Spotify, Deezer, etc.)

```javascript
const Spotify = require("erela.js-spotify");
const Deezer = require("erela.js-deezer");

const manager = new Manager({
  plugins: [
    new Spotify({ clientID: "id", clientSecret: "secret" }),
    new Deezer()
  ],
  nodes: [{ /* ... */ }],
  send: (id, payload) => { /* ... */ }
});
```

### Multiple Nodes (Load Balancing)

```javascript
const manager = new Manager({
  nodes: [
    { identifier: "US", host: "us.example.com", port: 2333, password: "pass", version: 4 },
    { identifier: "EU", host: "eu.example.com", port: 2333, password: "pass", version: 4 }
  ],
  send: (id, payload) => { /* ... */ }
});
```

## 🔄 Migration from V3 to V4

Just add `version: 4` to your node configuration:

```javascript
// Before
nodes: [{ host: "localhost", port: 2333, password: "pass" }]

// After  
nodes: [{ host: "localhost", port: 2333, password: "pass", version: 4 }]
```

Everything else works automatically!

## 📖 API Overview

### Manager
- `manager.init(clientId)` - Initialize manager
- `manager.search(query, requester)` - Search tracks
- `manager.create(options)` - Create player
- `manager.get(guildId)` - Get player
- `manager.destroy(guildId)` - Destroy player

### Player
- `player.play(track?, options?)` - Play track
- `player.pause(state)` - Pause/resume
- `player.stop(amount?)` - Stop playback
- `player.seek(position)` - Seek to position
- `player.setVolume(volume)` - Set volume (0-1000)
- `player.setEQ(...bands)` - Set equalizer
- `player.setTimescale(settings)` - Nightcore/Vaporwave
- `player.setRotation(settings)` - 8D audio
- `player.setKaraoke(settings)` - Remove vocals
- `player.clearFilters()` - Clear all filters

### Events
- `nodeConnect`, `nodeDisconnect`, `nodeError`
- `playerCreate`, `playerDestroy`
- `trackStart`, `trackEnd`, `trackError`, `trackStuck`
- `queueEnd`, `socketClosed`

## 🤝 Support & Community

- **Discord:** [Join MenuDocs Discord](https://discord.gg/menudocs)
- **Issues:** [GitHub Issues](https://github.com/MenuDocs/erela.js/issues)
- **Documentation:** [Full Docs](DOCUMENTATION.md)

## 📄 License

Apache-2.0 - see [LICENSE](LICENSE) file for details

## 👥 Contributors

👤 **Sophan-Developer** - Enhanced Version Maintainer  
- **Enhancements:** Lavalink V4 support, 9 audio filters, comprehensive documentation
- GitHub: [@Sophan-Developer](https://github.com/Sophan-Developer)
- Repository: [Sophan-Developer/Khlangbot](https://github.com/Sophan-Developer/Sophan-developer)

---

👤 **Solaris** - Original Author  
- Website: <https://solaris.codes/>
- GitHub: [@Solaris9](https://github.com/Solaris9)

👤 **Anish Shobith** - Contributor  
- GitHub: [@Anish-Shobith](https://github.com/Anish-Shobith)

👤 **melike2d** - Contributor  
- Website: <https://2d.gay>
- GitHub: [@melike2d](https://github.com/melike2d)

And all other [contributors](https://github.com/MenuDocs/erela.js/graphs/contributors)!

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**Original:** Made with ❤️ by [MenuDocs](https://github.com/MenuDocs)  
**Enhanced:** Built and updated with 🔧 by [Sophan-Developer](https://github.com/Sophan-Developer)

## Contributors

👤 **Solaris**

- Author
- Website: <https://solaris.codes/>
- Github: [@Solaris9](https://github.com/Solaris9)

👤 **Anish Shobith**

- Contributor
- Github: [@Anish-Shobith](https://github.com/Anish-Shobith)

👤 **melike2d**

- Contributor
- Github: [@melike2d](https://github.com/melike2d)

👤 **ayntee**

- Contributor
- Github: [@ayntee](https://github.com/ayntee)
--!>
