# Audio Filters Guide

> **🔧 Enhanced by [Sophan-Developer](https://github.com/Sophan-Developer)** - Complete filter implementation

This guide covers all available audio filters in erela.js and how to use them with both Lavalink V3 and V4.

## Table of Contents
- [Overview](#overview)
- [Lavalink V4 Filter System](#lavalink-v4-filter-system)
- [Available Filters](#available-filters)
- [Filter Methods](#filter-methods)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Overview

erela.js provides a comprehensive audio filter system that allows you to modify playback in real-time. Filters can be used individually or combined for unique audio effects.

### Key Differences: V3 vs V4

**Lavalink V3:**
- Filters sent via WebSocket with `op: "filters"`
- Each filter applied independently

**Lavalink V4:**
- Filters sent via REST API (`PATCH` request)
- All active filters must be sent together
- Automatic filter state tracking

---

## Lavalink V4 Filter System

In Lavalink V4, the Player class maintains a `filters` object that tracks all active filters. When you apply a filter, it's stored in this object and sent along with all other active filters.

```typescript
// Filter state is automatically tracked
player.filters = {
  timescale: { speed: 1.3, pitch: 1.3, rate: 1 },
  rotation: { rotationHz: 0.2 },
  equalizer: [{ band: 0, gain: 0.2 }, { band: 1, gain: 0.2 }]
};
```

This ensures filters stack properly instead of replacing each other.

---

## Available Filters

### 1. Equalizer
Adjusts specific frequency bands (0-14).

**Properties:**
- `band`: Number (0-14) - frequency band to adjust
- `gain`: Number (-0.25 to 1.0) - volume adjustment for that band

**Frequency Ranges:**
- 0-2: Sub-bass (20-60 Hz)
- 3-5: Bass (60-250 Hz)
- 6-8: Low Mids (250-500 Hz)
- 9-11: Mids (500-2000 Hz)
- 12-14: Highs (2000-20000 Hz)

### 2. Karaoke
Removes or reduces vocals from tracks.

**Properties:**
- `level`: Number (0.0-1.0) - Filter intensity
- `monoLevel`: Number (0.0-1.0) - Mono processing level
- `filterBand`: Number (Hz) - Center frequency to filter
- `filterWidth`: Number (Hz) - Width of filter band

### 3. Timescale
Adjusts speed, pitch, and playback rate.

**Properties:**
- `speed`: Number (0.05-5.0) - Playback speed multiplier
- `pitch`: Number (0.05-5.0) - Pitch adjustment
- `rate`: Number (0.05-5.0) - Rate adjustment

**Common Presets:**
- Nightcore: `{ speed: 1.3, pitch: 1.3, rate: 1 }`
- Vaporwave: `{ speed: 0.85, pitch: 0.8, rate: 1 }`
- Slow: `{ speed: 0.8, pitch: 1.0, rate: 1 }`
- Fast: `{ speed: 1.5, pitch: 1.0, rate: 1 }`

### 4. Tremolo
Creates a wavering/trembling effect.

**Properties:**
- `frequency`: Number (0.1-20.0) - Oscillation frequency in Hz
- `depth`: Number (0.0-1.0) - Effect intensity

### 5. Vibrato
Creates a pitch vibration effect.

**Properties:**
- `frequency`: Number (0.1-14.0) - Vibration speed in Hz
- `depth`: Number (0.0-1.0) - Pitch variation intensity

### 6. Rotation (8D Audio)
Creates a rotating/panning audio effect.

**Properties:**
- `rotationHz`: Number - Rotation speed in Hz (0.2 is typical for 8D)

### 7. Distortion
Adds harmonic distortion to the audio.

**Properties:**
- `sinOffset`: Number - Sine wave offset
- `sinScale`: Number - Sine wave scale
- `cosOffset`: Number - Cosine wave offset
- `cosScale`: Number - Cosine wave scale
- `tanOffset`: Number - Tangent wave offset
- `tanScale`: Number - Tangent wave scale
- `offset`: Number - General offset
- `scale`: Number - General scale

### 8. Channel Mix
Adjusts stereo channel mixing.

**Properties:**
- `leftToLeft`: Number (0.0-1.0) - Left channel to left output
- `leftToRight`: Number (0.0-1.0) - Left channel to right output
- `rightToLeft`: Number (0.0-1.0) - Right channel to left output
- `rightToRight`: Number (0.0-1.0) - Right channel to right output

**Presets:**
- Mono: All properties = 0.5
- Swap: `{ leftToLeft: 0, leftToRight: 1, rightToLeft: 1, rightToRight: 0 }`

### 9. Low Pass
Filters out high frequencies.

**Properties:**
- `smoothing`: Number (1.0-20.0) - Smoothing factor (higher = more filtering)

---

## Filter Methods

### Equalizer Methods

```typescript
// Set specific EQ bands
player.setEQ(
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.2 },
  { band: 2, gain: 0.1 }
);

// Or use array
player.setEQ([
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.2 }
]);

// Clear all EQ bands
player.clearEQ();
```

### Individual Filter Methods

```typescript
// Karaoke
player.setKaraoke({
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0
});
player.setKaraoke(null); // Disable

// Timescale
player.setTimescale({
  speed: 1.3,
  pitch: 1.3,
  rate: 1.0
});
player.setTimescale(null); // Disable

// Tremolo
player.setTremolo({
  frequency: 2.0,
  depth: 0.5
});
player.setTremolo(null); // Disable

// Vibrato
player.setVibrato({
  frequency: 2.0,
  depth: 0.5
});
player.setVibrato(null); // Disable

// Rotation (8D)
player.setRotation({
  rotationHz: 0.2
});
player.setRotation(null); // Disable

// Distortion
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
player.setDistortion(null); // Disable

// Channel Mix
player.setChannelMix({
  leftToLeft: 1,
  leftToRight: 0,
  rightToLeft: 0,
  rightToRight: 1
});
player.setChannelMix(null); // Disable

// Low Pass
player.setLowPass({
  smoothing: 20.0
});
player.setLowPass(null); // Disable
```

### Multiple Filters

```typescript
// Set multiple filters at once (V4)
player.setFilters({
  timescale: { speed: 1.3, pitch: 1.3, rate: 1 },
  rotation: { rotationHz: 0.2 },
  equalizer: [
    { band: 0, gain: 0.2 },
    { band: 1, gain: 0.2 }
  ]
});

// Clear all filters
player.clearFilters();
```

---

## Examples

### Example 1: Nightcore Effect

```typescript
// Create nightcore effect (faster + higher pitch)
player.setTimescale({
  speed: 1.3,
  pitch: 1.3,
  rate: 1.0
});
```

### Example 2: Vaporwave Effect

```typescript
// Create vaporwave effect (slower + lower pitch)
player.setTimescale({
  speed: 0.85,
  pitch: 0.8,
  rate: 1.0
});
```

### Example 3: 8D Audio

```typescript
// Create 8D audio effect
player.setRotation({
  rotationHz: 0.2
});
```

### Example 4: Bass Boost

```typescript
// Boost bass frequencies
player.setEQ(
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.25 },
  { band: 2, gain: 0.15 }
);
```

### Example 5: Karaoke Mode

```typescript
// Remove vocals for karaoke
player.setKaraoke({
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0
});
```

### Example 6: Combining Filters

```typescript
// Nightcore + 8D + Bass Boost
player.setTimescale({
  speed: 1.3,
  pitch: 1.3,
  rate: 1.0
});

player.setRotation({
  rotationHz: 0.2
});

player.setEQ(
  { band: 0, gain: 0.2 },
  { band: 1, gain: 0.2 }
);

// All filters are active simultaneously in V4
```

### Example 7: Mono Audio

```typescript
// Convert stereo to mono
player.setChannelMix({
  leftToLeft: 0.5,
  leftToRight: 0.5,
  rightToLeft: 0.5,
  rightToRight: 0.5
});
```

### Example 8: Toggle Filter

```typescript
// Toggle nightcore on/off
const isNightcoreActive = player.filters.timescale && 
  player.filters.timescale.speed > 1.2;

if (isNightcoreActive) {
  player.setTimescale({ speed: 1, pitch: 1, rate: 1 });
} else {
  player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });
}
```

---

## Best Practices

### 1. Filter State Management (V4)

```typescript
// Check active filters
console.log(player.filters);
// { timescale: { speed: 1.3, pitch: 1.3, rate: 1 }, rotation: { rotationHz: 0.2 } }

// Filters persist across tracks
player.play(nextTrack); // Filters still active
```

### 2. Performance Considerations

- Avoid excessive filter changes (limit to user actions)
- Combining many filters increases CPU usage
- Test filter combinations for audio quality
- Some filters may cause audio artifacts at extreme values

### 3. Recommended Value Ranges

**Timescale:**
- Speed: 0.5 - 2.0 (safe range)
- Pitch: 0.5 - 2.0 (safe range)
- Rate: Usually keep at 1.0

**Rotation:**
- rotationHz: 0.1 - 0.5 (0.2 is standard 8D)

**Tremolo/Vibrato:**
- Frequency: 1.0 - 10.0
- Depth: 0.1 - 0.8

**Equalizer:**
- Gain: -0.25 to 0.5 (safe range to avoid clipping)

### 4. Error Handling

```typescript
try {
  player.setTimescale({
    speed: 1.5,
    pitch: 1.5,
    rate: 1.0
  });
} catch (error) {
  console.error('Filter error:', error);
  // Fallback to default
  player.clearFilters();
}
```

### 5. User-Friendly Filter Names

```typescript
const filterPresets = {
  nightcore: { timescale: { speed: 1.3, pitch: 1.3, rate: 1 } },
  vaporwave: { timescale: { speed: 0.85, pitch: 0.8, rate: 1 } },
  '8d': { rotation: { rotationHz: 0.2 } },
  bassboost: { 
    equalizer: [
      { band: 0, gain: 0.25 },
      { band: 1, gain: 0.25 },
      { band: 2, gain: 0.15 }
    ]
  },
  karaoke: {
    karaoke: {
      level: 1.0,
      monoLevel: 1.0,
      filterBand: 220.0,
      filterWidth: 100.0
    }
  }
};

// Apply preset
function applyPreset(player, presetName) {
  const preset = filterPresets[presetName];
  if (preset) {
    player.setFilters(preset);
  }
}
```

### 6. Clearing Specific Filters

```typescript
// Clear only timescale
player.setTimescale(null);

// Clear only rotation
player.setRotation(null);

// Clear all filters
player.clearFilters();
```

---

## Migration from V3 to V4

### V3 Code:
```javascript
this.node.send({
  op: "filters",
  guildId: this.guild,
  timescale: {
    speed: 1.3,
    pitch: 1.3,
    rate: 1
  }
});
```

### V4 Code:
```typescript
// Option 1: Use dedicated method
player.setTimescale({
  speed: 1.3,
  pitch: 1.3,
  rate: 1
});

// Option 2: Use setFilters for multiple
player.setFilters({
  timescale: { speed: 1.3, pitch: 1.3, rate: 1 },
  rotation: { rotationHz: 0.2 }
});
```

The V4 implementation automatically:
- Tracks filter state
- Merges filters together
- Sends via REST API
- Maintains backwards compatibility

---

## Advanced: Custom Filter Combinations

### Party Mode
```typescript
player.setFilters({
  timescale: { speed: 1.2, pitch: 1.1, rate: 1 },
  rotation: { rotationHz: 0.15 },
  tremolo: { frequency: 4.0, depth: 0.3 },
  equalizer: [
    { band: 0, gain: 0.2 },
    { band: 1, gain: 0.15 },
    { band: 13, gain: 0.15 },
    { band: 14, gain: 0.2 }
  ]
});
```

### Chipmunk Voice
```typescript
player.setTimescale({
  speed: 1.5,
  pitch: 1.8,
  rate: 1.0
});
```

### Deep Bass
```typescript
player.setFilters({
  timescale: { speed: 0.9, pitch: 0.85, rate: 1 },
  equalizer: [
    { band: 0, gain: 0.4 },
    { band: 1, gain: 0.35 },
    { band: 2, gain: 0.25 },
    { band: 3, gain: 0.15 }
  ]
});
```

### Telephone Effect
```typescript
player.setFilters({
  equalizer: [
    { band: 0, gain: -0.25 },
    { band: 1, gain: -0.25 },
    { band: 5, gain: 0.1 },
    { band: 6, gain: 0.1 },
    { band: 11, gain: -0.25 },
    { band: 12, gain: -0.25 },
    { band: 13, gain: -0.25 },
    { band: 14, gain: -0.25 }
  ],
  distortion: {
    sinOffset: 0,
    sinScale: 1,
    cosOffset: 0,
    cosScale: 1,
    offset: 0,
    scale: 0.3
  }
});
```

---

## Troubleshooting

### Filters Not Applying

**V4 Issue:** Make sure you're using the filter methods, not raw WebSocket sends.

```typescript
// ❌ Wrong (V3 style won't work in V4)
this.node.send({ op: "filters", ... });

// ✅ Correct (V4 style)
player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });
```

### Filters Replacing Each Other

**V4 Solution:** Use the built-in filter tracking. Each method automatically merges with existing filters.

```typescript
// These will stack in V4
player.setTimescale({ speed: 1.3, pitch: 1.3, rate: 1 });
player.setRotation({ rotationHz: 0.2 });
// Both filters are now active
```

### Audio Clipping

Reduce equalizer gain values:
```typescript
// May cause clipping
player.setEQ({ band: 0, gain: 1.0 }); // Too high!

// Better
player.setEQ({ band: 0, gain: 0.25 }); // Safe range
```

### Filters Not Persisting

In V4, filters automatically persist across tracks. To clear:
```typescript
player.clearFilters(); // Remove all filters
```

---

## Summary

- **15 bands** for equalizer (0-14)
- **8 filter types** available
- **V4 automatic** filter state tracking
- **Combine filters** for unique effects
- **Use presets** for common effects
- **Test thoroughly** before production

For more information, see the [Lavalink documentation](https://lavalink.dev/api/rest.html#update-player).
