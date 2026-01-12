"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
/* eslint-disable no-async-promise-executor */
const collection_1 = require("@discordjs/collection");
const events_1 = require("events");
const Utils_1 = require("./Utils");
const REQUIRED_KEYS = ["event", "guildId", "op", "sessionId"];
function check(options) {
    if (!options)
        throw new TypeError("ManagerOptions must not be empty.");
    if (typeof options.send !== "function")
        throw new TypeError('Manager option "send" must be present and a function.');
    if (typeof options.clientId !== "undefined" &&
        !/^\d+$/.test(options.clientId))
        throw new TypeError('Manager option "clientId" must be a non-empty string.');
    if (typeof options.nodes !== "undefined" &&
        !Array.isArray(options.nodes))
        throw new TypeError('Manager option "nodes" must be a array.');
    if (typeof options.shards !== "undefined" &&
        typeof options.shards !== "number")
        throw new TypeError('Manager option "shards" must be a number.');
    if (typeof options.plugins !== "undefined" &&
        !Array.isArray(options.plugins))
        throw new TypeError('Manager option "plugins" must be a Plugin array.');
    if (typeof options.autoPlay !== "undefined" &&
        typeof options.autoPlay !== "boolean")
        throw new TypeError('Manager option "autoPlay" must be a boolean.');
    if (typeof options.trackPartial !== "undefined" &&
        !Array.isArray(options.trackPartial))
        throw new TypeError('Manager option "trackPartial" must be a string array.');
    if (typeof options.clientName !== "undefined" &&
        typeof options.clientName !== "string")
        throw new TypeError('Manager option "clientName" must be a string.');
    if (typeof options.defaultSearchPlatform !== "undefined" &&
        typeof options.defaultSearchPlatform !== "string")
        throw new TypeError('Manager option "defaultSearchPlatform" must be a string.');
}
/**
 * The main hub for interacting with Lavalink and using Erela.JS,
 * @noInheritDoc
 */
class Manager extends events_1.EventEmitter {
    static DEFAULT_SOURCES = {
        "youtube music": "ytmsearch",
        "youtube": "ytsearch",
        "soundcloud": "scsearch"
    };
    /** The map of players. */
    players = new collection_1.Collection();
    /** The map of nodes. */
    nodes = new collection_1.Collection();
    /** The options that were set. */
    options;
    initiated = false;
    /** Returns the least used Nodes. */
    get leastUsedNodes() {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => b.calls - a.calls);
    }
    /** Returns the least system load Nodes. */
    get leastLoadNodes() {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => {
            const aload = a.stats.cpu
                ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
                : 0;
            const bload = b.stats.cpu
                ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
                : 0;
            return aload - bload;
        });
    }
    /**
     * Initiates the Manager class.
     * @param options
     */
    constructor(options) {
        super();
        check(options);
        Utils_1.Structure.get("Player").init(this);
        Utils_1.Structure.get("Node").init(this);
        Utils_1.TrackUtils.init(this);
        if (options.trackPartial) {
            Utils_1.TrackUtils.setTrackPartial(options.trackPartial);
            delete options.trackPartial;
        }
        this.options = {
            plugins: [],
            nodes: [{ identifier: "default", host: "localhost" }],
            shards: 1,
            autoPlay: true,
            clientName: "erela.js",
            defaultSearchPlatform: "youtube",
            ...options,
        };
        if (this.options.plugins) {
            for (const [index, plugin] of this.options.plugins.entries()) {
                if (!(plugin instanceof Utils_1.Plugin))
                    throw new RangeError(`Plugin at index ${index} does not extend Plugin.`);
                plugin.load(this);
            }
        }
        if (this.options.nodes) {
            for (const nodeOptions of this.options.nodes)
                new (Utils_1.Structure.get("Node"))(nodeOptions);
        }
    }
    /**
     * Initiates the Manager.
     * @param clientId
     */
    init(clientId) {
        if (this.initiated)
            return this;
        if (typeof clientId !== "undefined")
            this.options.clientId = clientId;
        if (typeof this.options.clientId !== "string")
            throw new Error('"clientId" set is not type of "string"');
        if (!this.options.clientId)
            throw new Error('"clientId" is not set. Pass it in Manager#init() or as a option in the constructor.');
        for (const node of this.nodes.values()) {
            try {
                node.connect();
            }
            catch (err) {
                this.emit("nodeError", node, err);
            }
        }
        this.initiated = true;
        return this;
    }
    /**
     * Searches the enabled sources based off the URL or the `source` property.
     * @param query
     * @param requester
     * @returns The search result.
     */
    search(query, requester) {
        return new Promise(async (resolve, reject) => {
            const node = this.leastUsedNodes.first();
            if (!node) {
                console.error('[Erela.js] No available nodes for search');
                throw new Error("No available nodes.");
            }
            const _query = typeof query === "string" ? { query } : query;
            const _source = Manager.DEFAULT_SOURCES[_query.source ?? this.options.defaultSearchPlatform] ?? _query.source;
            let search = _query.query;
            if (!/^https?:\/\//.test(search)) {
                search = `${_source}:${search}`;
            }
            const endpoint = node.options.version === 4
                ? `/v4/loadtracks?identifier=${encodeURIComponent(search)}`
                : `/loadtracks?identifier=${encodeURIComponent(search)}`;
            const res = await node
                .makeRequest(endpoint)
                .catch(err => {
                console.error('[Erela.js] Search request failed:', err);
                reject(err);
            });
            if (!res) {
                console.error('[Erela.js] No response from Lavalink');
                return reject(new Error("Query not found."));
            }
            // Handle V4 response format
            let tracks = [];
            if (node.options.version === 4) {
                // V4 format varies by loadType
                if (res.loadType === 'track' && res.data) {
                    // Single track: data is the track object
                    tracks = [res.data];
                }
                else if (res.loadType === 'playlist' && res.data && typeof res.data === 'object' && 'tracks' in res.data) {
                    // Playlist: data.tracks is the array
                    tracks = res.data.tracks;
                }
                else if (res.loadType === 'search' && res.data && Array.isArray(res.data)) {
                    // Search results: data is the array
                    tracks = res.data;
                }
                else if (res.data && Array.isArray(res.data)) {
                    // Fallback: data is array
                    tracks = res.data;
                }
            }
            else {
                // V3 format: always uses "tracks" array
                tracks = res.tracks || [];
            }
            // Normalize loadType for V4
            let normalizedLoadType = res.loadType;
            if (node.options.version === 4) {
                if (res.loadType === 'track')
                    normalizedLoadType = 'TRACK_LOADED';
                else if (res.loadType === 'playlist')
                    normalizedLoadType = 'PLAYLIST_LOADED';
                else if (res.loadType === 'search')
                    normalizedLoadType = 'SEARCH_RESULT';
                else if (res.loadType === 'empty')
                    normalizedLoadType = 'NO_MATCHES';
                else if (res.loadType === 'error')
                    normalizedLoadType = 'LOAD_FAILED';
            }
            const result = {
                loadType: normalizedLoadType,
                exception: res.exception ?? null,
                tracks: tracks.map((track) => Utils_1.TrackUtils.build(track, requester)),
            };
            if (result.loadType === "PLAYLIST_LOADED") {
                let playlistInfo;
                if (node.options.version === 4 && res.data && typeof res.data === 'object' && 'info' in res.data) {
                    playlistInfo = res.data.info;
                }
                else {
                    playlistInfo = res.playlistInfo;
                }
                result.playlist = {
                    name: playlistInfo?.name || 'Unknown Playlist',
                    selectedTrack: !playlistInfo?.selectedTrack || playlistInfo.selectedTrack === -1 ? null :
                        Utils_1.TrackUtils.build(tracks[playlistInfo.selectedTrack], requester),
                    duration: result.tracks
                        .reduce((acc, cur) => acc + (cur.duration || 0), 0),
                };
            }
            return resolve(result);
        });
    }
    /**
     * Decodes the base64 encoded tracks and returns a TrackData array.
     * @param tracks
     */
    decodeTracks(tracks) {
        return new Promise(async (resolve, reject) => {
            const node = this.nodes.first();
            if (!node)
                throw new Error("No available nodes.");
            const endpoint = node.options.version === 4 ? `/v4/decodetracks` : `/decodetracks`;
            const res = await node.makeRequest(endpoint, r => {
                r.method = "POST";
                r.body = JSON.stringify(tracks);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                r.headers["Content-Type"] = "application/json";
            })
                .catch(err => reject(err));
            if (!res) {
                return reject(new Error("No data returned from query."));
            }
            return resolve(res);
        });
    }
    /**
     * Decodes the base64 encoded track and returns a TrackData.
     * @param track
     */
    async decodeTrack(track) {
        const res = await this.decodeTracks([track]);
        return res[0];
    }
    /**
     * Creates a player or returns one if it already exists.
     * @param options
     */
    create(options) {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }
        return new (Utils_1.Structure.get("Player"))(options);
    }
    /**
     * Returns a player or undefined if it does not exist.
     * @param guild
     */
    get(guild) {
        return this.players.get(guild);
    }
    /**
     * Destroys a player if it exists.
     * @param guild
     */
    destroy(guild) {
        this.players.delete(guild);
    }
    /**
     * Creates a node or returns one if it already exists.
     * @param options
     */
    createNode(options) {
        if (this.nodes.has(options.identifier || options.host)) {
            return this.nodes.get(options.identifier || options.host);
        }
        return new (Utils_1.Structure.get("Node"))(options);
    }
    /**
     * Destroys a node if it exists.
     * @param identifier
     */
    destroyNode(identifier) {
        const node = this.nodes.get(identifier);
        if (!node)
            return;
        node.destroy();
        this.nodes.delete(identifier);
    }
    /**
     * Sends voice data to the Lavalink server.
     * @param data
     */
    updateVoiceState(data) {
        if ("t" in data && !["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(data.t))
            return;
        const update = "d" in data ? data.d : data;
        if (!update || !("token" in update) && !("session_id" in update))
            return;
        const player = this.players.get(update.guild_id);
        if (!player)
            return;
        if ("token" in update) {
            /* voice server update */
            player.voiceState.event = update;
        }
        else {
            /* voice state update */
            if (update.user_id !== this.options.clientId) {
                return;
            }
            if (update.channel_id) {
                if (player.voiceChannel !== update.channel_id) {
                    /* we moved voice channels. */
                    this.emit("playerMove", player, player.voiceChannel, update.channel_id);
                }
                player.voiceState.sessionId = update.session_id;
                player.voiceChannel = update.channel_id;
            }
            else {
                /* player got disconnected. */
                this.emit("playerDisconnect", player, player.voiceChannel);
                player.voiceChannel = null;
                player.voiceState = Object.assign({});
                player.pause(true);
            }
        }
        if (REQUIRED_KEYS.every(key => key in player.voiceState)) {
            // For Lavalink V4, send voice state via REST API
            if (player.node.options.version === 4) {
                const sessionId = player.node.sessionId;
                if (!sessionId) {
                    console.error('[Erela.js] No session ID available for voice state update');
                    return;
                }
                // Send voice update via REST API for V4
                player.node.makeRequest(`/v4/sessions/${encodeURIComponent(sessionId)}/players/${player.guild}`, (r) => {
                    r.method = "PATCH";
                    // Merge with existing headers (including Authorization)
                    r.headers = { ...r.headers, "Content-Type": "application/json" };
                    const voiceUpdate = {
                        voice: {
                            token: player.voiceState.event.token,
                            endpoint: player.voiceState.event.endpoint,
                            sessionId: player.voiceState.sessionId
                        }
                    };
                    r.body = JSON.stringify(voiceUpdate);
                }).catch((error) => {
                    console.error('[Erela.js] Failed to send voice state to Lavalink V4:', error);
                });
            }
            else {
                // For V3, send via WebSocket
                player.node.send(player.voiceState);
            }
        }
    }
}
exports.Manager = Manager;
