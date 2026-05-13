/**
 * Global music manager — persists across scene changes.
 * Keeps the same track playing when navigating between scenes that share music.
 * Silently skips if the audio file hasn't been loaded.
 */

let currentKey: string | null = null;
let currentSound: Phaser.Sound.BaseSound | null = null;

export const MusicManager = {
  play(scene: Phaser.Scene, key: string, volume = 0.35): void {
    // Same track already playing — don't restart it (seamless between scenes)
    if (currentKey === key && currentSound && currentSound.isPlaying) return;

    // Stop previous track
    if (currentSound) {
      currentSound.stop();
      currentSound.destroy();
      currentSound = null;
    }

    // Skip gracefully if file wasn't loaded
    if (!scene.cache.audio.has(key)) return;

    currentSound = scene.sound.add(key, { loop: true, volume });
    currentSound.play();
    currentKey = key;
  },

  stop(): void {
    currentSound?.stop();
    currentSound?.destroy();
    currentSound = null;
    currentKey   = null;
  },
};
