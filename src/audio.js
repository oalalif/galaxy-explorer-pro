import { Howl } from 'howler';

export const audioManager = {
  sounds: {
    ambient: null,
    effects: null
  },
  
  // Collection of ambient tracks for sequential playback
  ambientTracks: [
    {
      name: 'ambient1',
      // Using Pixabay URLs as requested by user
      url: 'https://cdn.pixabay.com/audio/2025/02/19/audio_aed6ff9510.mp3',
      // Local fallback URL if Pixabay is unavailable
      fallbackUrl: './assets/audio/ambient1.mp3',
      volume: 0.3,
      loop: true
    },
    {
      name: 'ambient2',
      url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3',
      fallbackUrl: './assets/audio/ambient2.mp3',
      volume: 0.3,
      loop: true
    }
  ],
  
  // Local fallback URLs if remote sources fail
  fallbackUrls: {
    ambient1: './assets/audio/ambient1.mp3',
    ambient2: './assets/audio/ambient2.mp3',
    effects: './assets/audio/click.mp3'
  },
  
  // Track if audio was playing before mute
  wasPlayingBeforeMute: false,
  currentTrackIndex: 0,

  isMuted: false,
  isInitialized: false,
  isPlaying: false,

  init() {
    // Don't initialize multiple times
    if (this.isInitialized) return;
    
    try {
      console.log('Initializing audio system...');
      
      // Initialize with the first ambient track
      this.loadAmbientTrack(this.currentTrackIndex);
      
      // Create effects sound with Pixabay URL as requested by user
      this.sounds.effects = new Howl({
        src: ['https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3', this.fallbackUrls.effects], // Using both remote and local fallback
        volume: 0.7,
        html5: true,
        onload: () => {
          console.log('Effects audio loaded successfully');
        },
        onloaderror: (_, err) => {
          console.error('Effects audio load error:', err);
          this.createSilentFallback('effects');
        }
      });
      
      this.isInitialized = true;
      
      // Update any sound toggle buttons in the UI
      this.updateSoundToggleUI();
      
      console.log('Audio system initialized');
    } catch (err) {
      console.error('Fatal error initializing audio:', err);
      this.createSilentFallback('ambient');
      this.createSilentFallback('effects');
    }
  },
  
  // Load a specific ambient track by index
  loadAmbientTrack(index) {
    // Dispose of previous track if it exists
    if (this.sounds.ambient) {
      const wasPlaying = this.sounds.ambient.playing();
      this.sounds.ambient.unload();
      
      // Create new ambient track with both primary URL and fallback URL
      this.sounds.ambient = new Howl({
        src: [this.ambientTracks[index].url, this.fallbackUrls[`ambient${index+1}`]],
        loop: this.ambientTracks[index].loop,
        volume: this.ambientTracks[index].volume,
        html5: true,
        onload: () => {
          console.log(`Ambient track ${index + 1} loaded successfully`);
          // If we were playing before and not muted, start the new track
          if (wasPlaying && !this.isMuted) {
            this.sounds.ambient.play();
            this.isPlaying = true;
          }
        },
        onend: () => {
          // When track ends (even though looping is enabled), we still advance to next track
          this.nextTrack();
        },
        onloaderror: (_, err) => {
          console.error(`Ambient track ${index + 1} load error:`, err);
          this.createSilentFallback('ambient');
        }
      });
    } else {
      // First initialization with primary and fallback URLs
      this.sounds.ambient = new Howl({
        src: [this.ambientTracks[index].url, this.fallbackUrls[`ambient${index+1}`]],
        loop: this.ambientTracks[index].loop,
        volume: this.ambientTracks[index].volume,
        html5: true,
        onload: () => {
          console.log(`Ambient track ${index + 1} loaded successfully`);
        },
        onloaderror: (_, err) => {
          console.error(`Ambient track ${index + 1} load error:`, err);
          this.createSilentFallback('ambient');
        }
      });
    }
  },
  
  // Create silent placeholder when audio fails to load
  createSilentFallback(type) {
    console.log(`Creating silent fallback for ${type} audio`);
    
    // Enhanced fallback with proper error reporting and diagnostic info
    this.sounds[type] = {
      _isFallback: true,
      _lastError: null,
      play: () => { console.log(`[Audio Fallback] ${type}.play() called`); return 1; },
      pause: () => { console.log(`[Audio Fallback] ${type}.pause() called`); },
      stop: () => { console.log(`[Audio Fallback] ${type}.stop() called`); },
      playing: () => false,
      once: (event, callback) => { console.log(`[Audio Fallback] ${type}.once(${event}) called`); },
      on: (event, callback) => { console.log(`[Audio Fallback] ${type}.on(${event}) called`); },
      state: () => 'unloaded',
      unload: () => { console.log(`[Audio Fallback] ${type}.unload() called`); },
      volume: (vol) => { console.log(`[Audio Fallback] ${type}.volume(${vol}) called`); return vol !== undefined ? vol : 0; },
      errorInfo: (err) => {
        this._lastError = err;
        console.error(`[Audio Fallback] ${type} error:`, err);
      },
      getStatus: () => ({
        isFallback: true,
        originalType: type,
        lastError: this._lastError
      })
    };
    
    // Log diagnostic info for debugging
    console.warn(`Audio fallback created for '${type}'. Browser audio support may be limited or audio files may be missing.`);
  },
  
  // Switch to the next ambient track
  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.ambientTracks.length;
    console.log(`Switching to ambient track ${this.currentTrackIndex + 1}`);
    this.loadAmbientTrack(this.currentTrackIndex);
  },
  
  // Update sound toggle button UI based on mute state
  updateSoundToggleUI() {
    const soundToggleButton = document.querySelector('.sound-toggle');
    if (soundToggleButton) {
      soundToggleButton.textContent = this.isMuted ? '🔇' : '🔊';
      console.log(`Sound toggle button updated: ${this.isMuted ? 'muted' : 'unmuted'}`);
    }
  },
  
  // Start playing ambient audio
  startAmbient() {
    if (!this.sounds.ambient) return;
    if (!this.isMuted && !this.sounds.ambient.playing()) {
      this.sounds.ambient.play();
      this.isPlaying = true;
      console.log('Ambient audio started');
    }
  },
  
  // Stop ambient audio
  stopAmbient() {
    if (!this.sounds.ambient) return;
    if (this.sounds.ambient.playing()) {
      this.sounds.ambient.pause();
      this.isPlaying = false;
      console.log('Ambient audio stopped');
    }
  },
  

  toggleAmbient() {
    if (!this.sounds.ambient) return false;
    
    if (this.sounds.ambient.playing()) {
      this.sounds.ambient.pause();
      this.isPlaying = false;
      return false;
    } else {
      this.sounds.ambient.play();
      this.isPlaying = true;
      return true;
    }
  },

  playEffect(name) {
    if (this.isMuted) return; // Don't play effects when muted
    
    if (name === 'click' && this.sounds.effects) {
      this.sounds.effects.play();
    }
  },

  mute() {
    this.isMuted = true;
    
    // Store current playing state to restore it when unmuted
    if (this.sounds.ambient) {
      this.wasPlayingBeforeMute = this.sounds.ambient.playing();
      // Pause the audio completely when muted (more efficient than just setting volume to 0)
      if (this.sounds.ambient.playing()) {
        this.sounds.ambient.pause();
      }
      this.sounds.ambient.volume(0);
    }
    
    if (this.sounds.effects) {
      this.sounds.effects.volume(0);
    }
    
    // Unlock any audio that might be waiting to play
    Howler.mute(true);
    
    console.log('Audio muted');
  },

  unmute() {
    this.isMuted = false;
    
    // Unmute global Howler
    Howler.mute(false);
    
    if (this.sounds.ambient) {
      this.sounds.ambient.volume(0.3); // Set volume back to normal
      
      // Resume playing if it was playing before being muted
      if (this.wasPlayingBeforeMute && !this.sounds.ambient.playing()) {
        this.sounds.ambient.play();
      }
    }
    
    if (this.sounds.effects) {
      this.sounds.effects.volume(0.5); // Adjust volume as needed
    }
    
    console.log('Audio unmuted');
    if (!this.isPlaying && this.wasPlayingBeforeMute) {
      this.startAmbient();
    }
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(`Audio muted: ${this.isMuted}`);
    
    if (this.isMuted) {
      // Stop all sounds when muting
      if (this.sounds.ambient && this.sounds.ambient.playing()) {
        this.sounds.ambient.pause();
      }
    } else {
      // Resume ambient sound when unmuting if it was playing before
      if (this.sounds.ambient && this.isPlaying && !this.sounds.ambient.playing()) {
        this.sounds.ambient.play();
      }
    }
    
    // Update UI
    this.updateSoundToggleUI();
    
    return this.isMuted;
  },

  playSound(name) {
    if (this.isMuted) return; // Don't play sounds when muted
    
    if (name === 'click') {
      this.playEffect(name);
    }
  }
};

// Initialize audio on page load and ensure proper button state
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize audio system
    audioManager.init();
    console.log('Audio manager initialized on page load');
  } catch (err) {
    console.error('Error during audio initialization:', err);
  }
}, { once: true });

// Try to unlock audio on first user interaction (required by many browsers)
document.addEventListener('click', () => {
  try {
    console.log('First user interaction detected - unlocking audio');
    if (!audioManager.isInitialized) {
      audioManager.init();
    }
    
    if (audioManager.sounds.ambient) {
      // Play then immediately pause to unlock audio if muted
      if (audioManager.isMuted) {
        audioManager.sounds.ambient.once('play', () => {
          audioManager.sounds.ambient.pause();
        });
        audioManager.sounds.ambient.play();
      } else {
        // Otherwise just start playing
        audioManager.startAmbient();
      }
    }
    
    // Play a silent sound to unlock audio context
    const silentSound = new Howl({
      src: ['data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwPj4+Pj4+TExMTExZWVlZWVlnZ2dnZ2d1dXV1dXWEhISEhISShISEhISEkpKSkpKSnJycnJycqqqqqqqqvr6+vr6+zMzMzMzM2tra2tra6urq6urq+vr6+vr6/v7+/v7+AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAJAUg4AAAAAAAAAAAAAAA//tQZAAAA9QdjqVZEeJDqzlX0mgIQAAABP4WBFhmfrgABASAAAAA7TWmkJVXrd39pjCdAGA4cMAZliSKhDo9Lx8QABoGXIiKiIiIsNI/M0qMjlrS7crb0vcFK2999DjP//8+988p///79uZOuuz0qpqaULFnHH2rQxJrGk6SKifIo0npwsS3jsikqgoiYWK3LWqZlVJC1IiYdKJH8p5ZKklJJUyrkJrPlnDREbbuauTomtEy0tLZGgb+dCIm5a3vaFvqpkiIiIiIiIqIiIiIvIiIiQEA7Hu6SzP/S/X//71vq///9IZU+NXLi//1JeXXTb//0vSmZm226wRdQQFCXopSKLKmlWmb/UaJWmUYlapFP////+mtpgwY4iEiz//84Vya2IiIiIiIn9IiIiIiIiIiIiB8Jfp////////iIiIiIh+/6/6f///+pF4iIiIiDYRdTIiIiIi//s8RH8BMTwCM71kACIgAAP8AAAAQAAAf4AAAABMAAP8AAAASXFIiIiIiIin///9SUiIiIiIib/////rSIiIiIiJh9KREREf/0iIiP////ERERERERERETDREREPUIiIiIiIeIiIiPERERERH//ucZJ4BJQQq8H2XgIhIAAP8AAAAEA1Tz3soARAAAP8AAAASERERCAiIiIiERERERfREREP////REREREQiIiIiIe/6WcREf/0RMf///0iIiIiHiIiIiIiIiIiIiIj4iIiPiIiI+IiIiPiRERERERERERERH//+REVERERERERI/////9EREREREREREREREREREREREFEREREREREREREREREREREQ'],
      format: 'mp3',
      volume: 0.001,
      onend: () => console.log('Audio system unlocked')
    }).play();
    
  } catch (err) {
    console.error('Error unlocking audio:', err);
  }
}, { once: true });

// Add keyboard shortcut for toggling audio (M key)
document.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    audioManager.toggleMute();
    console.log(`Audio muted via keyboard: ${audioManager.isMuted}`);
  }
  
  // N key to switch to next track
  if (event.key === 'n' || event.key === 'N') {
    audioManager.nextTrack();
  }
});
