import { Manager, SearchQuery, SearchResult } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { Sizes, State, Structure, TrackUtils, VoiceState } from "./Utils";

function check(options: PlayerOptions) {
  if (!options) throw new TypeError("PlayerOptions must not be empty.");

  if (!/^\d+$/.test(options.guild))
    throw new TypeError(
      'Player option "guild" must be present and be a non-empty string.'
    );

  if (options.textChannel && !/^\d+$/.test(options.textChannel))
    throw new TypeError(
      'Player option "textChannel" must be a non-empty string.'
    );

  if (options.voiceChannel && !/^\d+$/.test(options.voiceChannel))
    throw new TypeError(
      'Player option "voiceChannel" must be a non-empty string.'
    );

  if (options.node && typeof options.node !== "string")
    throw new TypeError('Player option "node" must be a non-empty string.');

  if (
    typeof options.volume !== "undefined" &&
    typeof options.volume !== "number"
  )
    throw new TypeError('Player option "volume" must be a number.');

  if (
    typeof options.selfMute !== "undefined" &&
    typeof options.selfMute !== "boolean"
  )
    throw new TypeError('Player option "selfMute" must be a boolean.');

  if (
    typeof options.selfDeafen !== "undefined" &&
    typeof options.selfDeafen !== "boolean"
  )
    throw new TypeError('Player option "selfDeafen" must be a boolean.');
}

export class Player {
  /** The Queue for the Player. */
  public readonly queue = new (Structure.get("Queue"))() as Queue;
  /** Whether the queue repeats the track. */
  public trackRepeat = false;
  /** Whether the queue repeats the queue. */
  public queueRepeat = false;
  /** The time the player is in the track. */
  public position = 0;
  /** Whether the player is playing. */
  public playing = false;
  /** Whether the player is paused. */
  public paused = false;
  /** The volume for the player */
  public volume: number;
  /** The Node for the Player. */
  public node: Node;
  /** The guild for the player. */
  public guild: string;
  /** The voice channel for the player. */
  public voiceChannel: string | null = null;
  /** The text channel for the player. */
  public textChannel: string | null = null;
  /** The current state of the player. */
  public state: State = "DISCONNECTED";
  /** The equalizer bands array. */
  public bands = new Array<number>(15).fill(0.0);
  /** The current filters applied to the player. */
  public filters: Record<string, any> = {};
  /** The voice state object from Discord. */
  public voiceState: VoiceState;
  /** The Manager. */
  public manager: Manager;
  private static _manager: Manager;
  private readonly data: Record<string, unknown> = {};

  /**
   * Set custom data.
   * @param key
   * @param value
   */
  public set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  /**
   * Get custom data.
   * @param key
   */
  public get<T>(key: string): T {
    return this.data[key] as T;
  }

  /** @hidden */
  public static init(manager: Manager): void {
    this._manager = manager;
  }

  /**
   * Creates a new player, returns one if it already exists.
   * @param options
   */
  constructor(public options: PlayerOptions) {
    if (!this.manager) this.manager = Structure.get("Player")._manager;
    if (!this.manager) throw new RangeError("Manager has not been initiated.");

    if (this.manager.players.has(options.guild)) {
      return this.manager.players.get(options.guild);
    }

    check(options);

    this.guild = options.guild;
    this.voiceState = Object.assign({ op: "voiceUpdate", guildId: options.guild });

    if (options.voiceChannel) this.voiceChannel = options.voiceChannel;
    if (options.textChannel) this.textChannel = options.textChannel;

    const node = this.manager.nodes.get(options.node);
    this.node = node || this.manager.leastLoadNodes.first();

    if (!this.node) throw new RangeError("No available nodes.");

    this.manager.players.set(options.guild, this);
    this.manager.emit("playerCreate", this);
    this.setVolume(options.volume ?? 100);
  }

  /**
   * Gets the correct V4 session path or returns null for V3
   * @private
   */
  private getV4SessionPath(): string | null {
    if (this.node.options.version !== 4) return null;
    const sessionId = this.node.sessionId || this.node.options.identifier;
    return `/v4/sessions/${encodeURIComponent(sessionId)}/players/${this.guild}`;
  }

  /**
   * Same as Manager#search() but a shortcut on the player itself.
   * @param query
   * @param requester
   */
  public search(
    query: string | SearchQuery,
    requester?: unknown
  ): Promise<SearchResult> {
    return this.manager.search(query, requester);
  }

  /**
   * Sets the players equalizer band on-top of the existing ones.
   * @param bands
   */
  public setEQ(...bands: EqualizerBand[]): this {
    // Hacky support for providing an array
    if (Array.isArray(bands[0])) bands = bands[0] as unknown as EqualizerBand[]

    if (!bands.length || !bands.every(
        (band) => JSON.stringify(Object.keys(band).sort()) === '["band","gain"]'
      )
    )
      throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");

    for (const { band, gain } of bands) this.bands[band] = gain;

    const eqBands = this.bands.map((gain, band) => ({ band, gain }));

    if (this.node.options.version === 4) {
      this.filters.equalizer = eqBands;
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "equalizer",
        guildId: this.guild,
        bands: eqBands,
      });
    }

    return this;
  }

  /** Clears the equalizer bands. */
  public clearEQ(): this {
    this.bands = new Array(15).fill(0.0);

    const eqBands = this.bands.map((gain, band) => ({ band, gain }));

    if (this.node.options.version === 4) {
      this.filters.equalizer = eqBands;
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "equalizer",
        guildId: this.guild,
        bands: eqBands,
      });
    }

    return this;
  }

  /** Connect to the voice channel. */
  public connect(): this {
    if (!this.voiceChannel)
      throw new RangeError("No voice channel has been set.");
    this.state = "CONNECTING";

    this.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: this.voiceChannel,
        self_mute: this.options.selfMute || false,
        self_deaf: this.options.selfDeafen || false,
      },
    });

    this.state = "CONNECTED";
    return this;
  }

  /** Disconnect from the voice channel. */
  public disconnect(): this {
    if (this.voiceChannel === null) return this;
    this.state = "DISCONNECTING";

    this.pause(true);
    this.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: null,
        self_mute: false,
        self_deaf: false,
      },
    });

    this.voiceChannel = null;
    this.state = "DISCONNECTED";
    return this;
  }

  /** Destroys the player. */
  public destroy(disconnect = true): void {
    this.state = "DESTROYING";
    if (disconnect) {
      this.disconnect();
    }

    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "DELETE";
      }).catch(() => null);
    } else {
      this.node.send({
        op: "destroy",
        guildId: this.guild,
      });
    }

    this.manager.emit("playerDestroy", this);
    this.manager.players.delete(this.guild);
  }

  /**
   * Sets the player voice channel.
   * @param channel
   */
  public setVoiceChannel(channel: string): this {
    if (typeof channel !== "string")
      throw new TypeError("Channel must be a non-empty string.");

    this.voiceChannel = channel;
    this.connect();
    return this;
  }

  /**
   * Sets the player text channel.
   * @param channel
   */
  public setTextChannel(channel: string): this {
    if (typeof channel !== "string")
      throw new TypeError("Channel must be a non-empty string.");

    this.textChannel = channel;
    return this;
  }

  /** Plays the next track. */
  public async play(): Promise<void>;

  /**
   * Plays the specified track.
   * @param track
   */
  public async play(track: Track | UnresolvedTrack): Promise<void>;

  /**
   * Plays the next track with some options.
   * @param options
   */
  public async play(options: PlayOptions): Promise<void>;

  /**
   * Plays the specified track with some options.
   * @param track
   * @param options
   */
  public async play(track: Track | UnresolvedTrack, options: PlayOptions): Promise<void>;
  public async play(
    optionsOrTrack?: PlayOptions | Track | UnresolvedTrack,
    playOptions?: PlayOptions
  ): Promise<void> {
    if (
      typeof optionsOrTrack !== "undefined" &&
      TrackUtils.validate(optionsOrTrack)
    ) {
      if (this.queue.current) this.queue.previous = this.queue.current;
      this.queue.current = optionsOrTrack as Track;
    }

    if (!this.queue.current) throw new RangeError("No current track.");

    const finalOptions = playOptions
      ? playOptions
      : ["startTime", "endTime", "noReplace"].every((v) =>
          Object.keys(optionsOrTrack || {}).includes(v)
        )
      ? (optionsOrTrack as PlayOptions)
      : {};

    if (TrackUtils.isUnresolvedTrack(this.queue.current)) {
      try {
        this.queue.current = await TrackUtils.getClosestTrack(this.queue.current as UnresolvedTrack);
      } catch (error) {
        this.manager.emit("trackError", this, this.queue.current, error);
        if (this.queue[0]) return this.play(this.queue[0]);
        return;
      }
    }

    if (this.node.options.version === 4) {
      const payload = {
        track: {
          encoded: this.queue.current.track
        },
        position: finalOptions.startTime,
        endTime: finalOptions.endTime,
        noReplace: finalOptions.noReplace ?? false,
      };
      
      await this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify(payload);
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      });
    } else {
      const options = {
        op: "play",
        guildId: this.guild,
        track: this.queue.current.track,
        ...finalOptions,
      };

      if (typeof options.track !== "string") {
        options.track = (options.track as Track).track;
      }

      await this.node.send(options);
    }
  }

  /**
   * Sets the player volume.
   * @param volume
   */
  public setVolume(volume: number): this {
    volume = Number(volume);

    if (isNaN(volume)) throw new TypeError("Volume must be a number.");
    this.volume = Math.max(Math.min(volume, 1000), 0);

    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ volume: this.volume });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "volume",
        guildId: this.guild,
        volume: this.volume,
      });
    }

    return this;
  }

  /**
   * Sets the track repeat.
   * @param repeat
   */
  public setTrackRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new TypeError('Repeat can only be "true" or "false".');

    if (repeat) {
      this.trackRepeat = true;
      this.queueRepeat = false;
    } else {
      this.trackRepeat = false;
      this.queueRepeat = false;
    }

    return this;
  }

  /**
   * Sets the queue repeat.
   * @param repeat
   */
  public setQueueRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new TypeError('Repeat can only be "true" or "false".');

    if (repeat) {
      this.trackRepeat = false;
      this.queueRepeat = true;
    } else {
      this.trackRepeat = false;
      this.queueRepeat = false;
    }

    return this;
  }

  /** Stops the current track, optionally give an amount to skip to, e.g 5 would play the 5th song. */
  public stop(amount?: number): this {
    if (typeof amount === "number" && amount > 1) {
      if (amount > this.queue.length) throw new RangeError("Cannot skip more than the queue length.");
      this.queue.splice(0, amount - 1);
    }

    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ encodedTrack: null });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "stop",
        guildId: this.guild,
      });
    }

    return this;
  }

  /**
   * Pauses the current track.
   * @param pause
   */
  public pause(pause: boolean): this {
    if (typeof pause !== "boolean")
      throw new RangeError('Pause can only be "true" or "false".');

    // If already paused or the queue is empty do nothing https://github.com/MenuDocs/erela.js/issues/58
    if (this.paused === pause || !this.queue.totalSize) return this;

    this.playing = !pause;
    this.paused = pause;

    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ paused: pause });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "pause",
        guildId: this.guild,
        pause,
      });
    }

    return this;
  }

  /**
   * Seeks to the position in the current track.
   * @param position
   */
  public seek(position: number): this {
    if (!this.queue.current) return undefined;
    position = Number(position);

    if (isNaN(position)) {
      throw new RangeError("Position must be a number.");
    }
    if (position < 0 || position > this.queue.current.duration)
      position = Math.max(Math.min(position, this.queue.current.duration), 0);

    this.position = position;
    
    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ position });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      this.node.send({
        op: "seek",
        guildId: this.guild,
        position,
      });
    }

    return this;
  }

  /**
   * Sets the Karaoke filter.
   * @param karaoke The karaoke settings or null to disable
   */
  public setKaraoke(karaoke: { level?: number; monoLevel?: number; filterBand?: number; filterWidth?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (karaoke === null) {
        delete this.filters.karaoke;
      } else {
        this.filters.karaoke = karaoke;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        karaoke: karaoke || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Timescale filter.
   * @param timescale The timescale settings or null to disable
   */
  public setTimescale(timescale: { speed?: number; pitch?: number; rate?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (timescale === null) {
        delete this.filters.timescale;
      } else {
        this.filters.timescale = timescale;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        timescale: timescale || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Tremolo filter.
   * @param tremolo The tremolo settings or null to disable
   */
  public setTremolo(tremolo: { frequency?: number; depth?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (tremolo === null) {
        delete this.filters.tremolo;
      } else {
        this.filters.tremolo = tremolo;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        tremolo: tremolo || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Vibrato filter.
   * @param vibrato The vibrato settings or null to disable
   */
  public setVibrato(vibrato: { frequency?: number; depth?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (vibrato === null) {
        delete this.filters.vibrato;
      } else {
        this.filters.vibrato = vibrato;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        vibrato: vibrato || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Rotation filter.
   * @param rotation The rotation settings or null to disable
   */
  public setRotation(rotation: { rotationHz?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (rotation === null) {
        delete this.filters.rotation;
      } else {
        this.filters.rotation = rotation;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        rotation: rotation || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Distortion filter.
   * @param distortion The distortion settings or null to disable
   */
  public setDistortion(distortion: { sinOffset?: number; sinScale?: number; cosOffset?: number; cosScale?: number; tanOffset?: number; tanScale?: number; offset?: number; scale?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (distortion === null) {
        delete this.filters.distortion;
      } else {
        this.filters.distortion = distortion;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        distortion: distortion || undefined
      });
    }
    return this;
  }

  /**
   * Sets the ChannelMix filter.
   * @param channelMix The channel mix settings or null to disable
   */
  public setChannelMix(channelMix: { leftToLeft?: number; leftToRight?: number; rightToLeft?: number; rightToRight?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (channelMix === null) {
        delete this.filters.channelMix;
      } else {
        this.filters.channelMix = channelMix;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        channelMix: channelMix || undefined
      });
    }
    return this;
  }

  /**
   * Sets the LowPass filter.
   * @param lowPass The low pass settings or null to disable
   */
  public setLowPass(lowPass: { smoothing?: number } | null = null): this {
    if (this.node.options.version === 4) {
      if (lowPass === null) {
        delete this.filters.lowPass;
      } else {
        this.filters.lowPass = lowPass;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        lowPass: lowPass || undefined
      });
    }
    return this;
  }

  /**
   * Sets the Equalizer filter.
   * @param bands Array of equalizer bands or boolean to enable/disable
   */
  public setEqualizer(bands: EqualizerBand[] | boolean): this {
    const eqBands = typeof bands === 'boolean' 
      ? (bands ? Array.from({ length: 15 }, (_, i) => ({ band: i, gain: 0 })) : [])
      : bands;

    if (this.node.options.version === 4) {
      if (!eqBands || eqBands.length === 0) {
        delete this.filters.equalizer;
      } else {
        this.filters.equalizer = eqBands;
      }
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: this.filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "equalizer",
        guildId: this.guild,
        bands: eqBands
      });
    }
    return this;
  }

  /**
   * Clears all filters.
   */
  public clearFilters(): this {
    if (this.node.options.version === 4) {
      this.filters = {};
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters: {} });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support - send empty filters
      this.node.send({
        op: "filters",
        guildId: this.guild,
        equalizer: [],
        karaoke: null,
        timescale: null,
        tremolo: null,
        vibrato: null,
        rotation: null,
        distortion: null,
        channelMix: null,
        lowPass: null
      });
    }
    return this;
  }

  /**
   * Sets multiple filters at once.
   * @param filters Object containing filter settings
   */
  public setFilters(filters: Record<string, any>): this {
    if (this.node.options.version === 4) {
      this.node.makeRequest(this.getV4SessionPath(), r => {
        r.method = "PATCH";
        r.body = JSON.stringify({ filters });
        r.headers = { ...r.headers, "Content-Type": "application/json" };
      }).catch(() => null);
    } else {
      // V3 support
      this.node.send({
        op: "filters",
        guildId: this.guild,
        ...filters
      });
    }
    return this;
  }
}

export interface PlayerOptions {
  /** The guild the Player belongs to. */
  guild: string;
  /** The text channel the Player belongs to. */
  textChannel: string;
  /** The voice channel the Player belongs to. */ 
  voiceChannel?: string;
  /** The node the Player uses. */
  node?: string;
  /** The initial volume the Player will use. */
  volume?: number;
  /** If the player should mute itself. */
  selfMute?: boolean;
  /** If the player should deaf itself. */
  selfDeafen?: boolean;
}

/** If track partials are set some of these will be `undefined` as they were removed. */
export interface Track {
  /** The base64 encoded track. */
  readonly track: string;
  /** The title of the track. */
  readonly title: string;
  /** The identifier of the track. */
  readonly identifier: string;
  /** The author of the track. */
  readonly author: string;
  /** The duration of the track. */
  readonly duration: number;
  /** If the track is seekable. */
  readonly isSeekable: boolean;
  /** If the track is a stream.. */
  readonly isStream: boolean;
  /** The uri of the track. */
  readonly uri: string;
  /** The thumbnail of the track or null if it's a unsupported source. */
  readonly thumbnail: string | null;
  /** The user that requested the track. */
  readonly requester: unknown | null;
  /** Displays the track thumbnail with optional size or null if it's a unsupported source. */
  displayThumbnail(size?: Sizes): string;
}

/** Unresolved tracks can't be played normally, they will resolve before playing into a Track. */
export interface UnresolvedTrack extends Partial<Track> {
  /** The title to search against. */
  title: string;
  /** The author to search against. */
  author?: string;
  /** The duration to search within 1500 milliseconds of the results from YouTube. */
  duration?: number;
  /** Resolves into a Track. */
  resolve(): Promise<void>;
}

export interface PlayOptions {
  /** The position to start the track. */
  readonly startTime?: number;
  /** The position to end the track. */
  readonly endTime?: number;
  /** Whether to not replace the track if a play payload is sent. */
  readonly noReplace?: boolean;
}

export interface EqualizerBand {
  /** The band number being 0 to 14. */
  band: number;
  /** The gain amount being -0.25 to 1.00, 0.25 being double. */
  gain: number;
}
