import { HighlightInterval } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export class IntervalPlayer {
  private player: any = null;
  private intervals: HighlightInterval[] = [];
  private currentIntervalIndex = 0;
  private isPlayingIntervals = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private videoId: string = '';
  private onIntervalChangeCallback: ((intervalId: string | null) => void) | null = null;
  
  constructor() {
    this.loadYouTubeAPI();
  }
  
  private loadYouTubeAPI() {
    if (window.YT) return;
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }
  
  initializePlayer(containerId: string, videoId: string): Promise<void> {
    this.videoId = videoId;
    
    return new Promise((resolve, reject) => {
      const initPlayer = () => {
        this.player = new window.YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            playsinline: 1
          },
          events: {
            onReady: () => {
              console.log('YouTube player ready event fired', { videoId });
              console.log('Player instance at ready:', this.player);
              console.log('Player methods available at ready:', {
                seekTo: typeof this.player?.seekTo,
                playVideo: typeof this.player?.playVideo,
                pauseVideo: typeof this.player?.pauseVideo,
                getPlayerState: typeof this.player?.getPlayerState
              });
              
              // Add a small delay to ensure player is fully initialized
              setTimeout(() => {
                console.log('Player methods after delay:', {
                  seekTo: typeof this.player?.seekTo,
                  playVideo: typeof this.player?.playVideo,
                  pauseVideo: typeof this.player?.pauseVideo,
                  getPlayerState: typeof this.player?.getPlayerState
                });
                resolve();
              }, 100);
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              reject(new Error(`YouTube player error: ${event.data}`));
            }
          }
        });
      };
      
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        window.onYouTubeIframeAPIReady = initPlayer;
      }
    });
  }
  
  setIntervals(intervals: HighlightInterval[]) {
    // Sort intervals by start time for sequential playback
    this.intervals = intervals.sort((a, b) => a.startTime - b.startTime);
    this.currentIntervalIndex = 0;
  }
  
  setOnIntervalChangeCallback(callback: (intervalId: string | null) => void) {
    this.onIntervalChangeCallback = callback;
  }
  
  private isPlayerReady(): boolean {
    if (!this.player) {
      console.log('isPlayerReady: no player instance');
      return false;
    }
    
    try {
      // Check if essential YouTube player methods are available
      const hasSeekTo = typeof this.player.seekTo === 'function';
      const hasPlayVideo = typeof this.player.playVideo === 'function';
      const hasPauseVideo = typeof this.player.pauseVideo === 'function';
      const hasGetPlayerState = typeof this.player.getPlayerState === 'function';
      
      console.log('isPlayerReady method checks:', {
        hasSeekTo,
        hasPlayVideo,
        hasPauseVideo,
        hasGetPlayerState,
        playerType: typeof this.player,
        playerConstructor: this.player?.constructor?.name
      });
      
      return hasSeekTo && hasPlayVideo && hasPauseVideo && hasGetPlayerState;
    } catch (error) {
      console.error('isPlayerReady error:', error);
      return false;
    }
  }
  
  async playHighlightReel(): Promise<void> {
    if (!this.player || this.intervals.length === 0) {
      throw new Error('YouTube player or intervals not set');
    }
    
    // Check if YouTube player is fully loaded and ready
    if (!this.isPlayerReady()) {
      throw new Error('YouTube player is not ready yet');
    }
    
    // Stop any existing playback first
    this.pauseIntervals();
    
    this.isPlayingIntervals = true;
    this.currentIntervalIndex = 0;
    
    await this.playCurrentInterval();
  }
  
  private async playCurrentInterval(): Promise<void> {
    
    if (!this.player || !this.isPlayingIntervals) {
      console.error('playCurrentInterval: Player not available or not playing intervals', {
        hasPlayer: !!this.player,
        isPlayingIntervals: this.isPlayingIntervals
      });
      return;
    }
    
    // Check if player is ready before attempting to play
    if (!this.isPlayerReady()) {
      console.error('playCurrentInterval: YouTube player is not ready yet');
      // Could retry after a delay, but for now just return
      return;
    }
    
    const currentInterval = this.intervals[this.currentIntervalIndex];
    if (!currentInterval) {
      console.log('No more intervals available - stopping playback');
      this.isPlayingIntervals = false;
      return;
    }
    
    console.log(`Playing highlight ${this.currentIntervalIndex + 1}/${this.intervals.length}:`, 
                `${currentInterval.startTime}s - ${currentInterval.endTime}s`);
    
    // Notify about interval change
    if (this.onIntervalChangeCallback) {
      this.onIntervalChangeCallback(currentInterval.id);
    }
    
    try {
      // Seek to interval start time and play
      this.player.seekTo(currentInterval.startTime, true);
      this.player.playVideo();
      
      // Wait for seek operation to complete before starting timer
      setTimeout(() => {
        // Calculate duration and set timer to stop at end
        const duration = (currentInterval.endTime - currentInterval.startTime) * 1000;
        console.log(`Playing for ${duration}ms (after ${this.currentIntervalIndex === 0 ? 'initial' : 'seek'} delay)`);
        
        this.intervalTimer = setTimeout(() => {
          console.log(`Finished playing highlight ${this.currentIntervalIndex + 1}/${this.intervals.length}`);
          
          // Check if this was the last interval BEFORE incrementing
          const isLastInterval = this.currentIntervalIndex >= this.intervals.length - 1;
          
          if (isLastInterval) {
            console.log('This was the last highlight - stopping playback completely');
            this.isPlayingIntervals = false;
            
            // Pause the video player
            if (this.player && typeof this.player.pauseVideo === 'function') {
              try {
                this.player.pauseVideo();
                console.log('Successfully paused video after last highlight');
              } catch (error) {
                console.warn('Failed to pause video after last highlight:', error);
              }
            }
            
            // Clear current highlight when finished
            if (this.onIntervalChangeCallback) {
              this.onIntervalChangeCallback(null);
            }
            
            // DO NOT increment index or call playCurrentInterval
            return;
          }
          
          // Only move to next interval if not the last one
          this.currentIntervalIndex++;
          console.log(`Moving to next highlight: ${this.currentIntervalIndex + 1}/${this.intervals.length}`);
          this.playCurrentInterval();
        }, duration);
      }, this.currentIntervalIndex === 0 ? 500 : 200); // Longer delay for first segment, shorter for subsequent
    } catch (error) {
      console.error('Error calling YouTube player methods:', error);
      return;
    }
  }
  
  async playSpecificInterval(intervalId: string): Promise<void> {
    const intervalIndex = this.intervals.findIndex(interval => interval.id === intervalId);
    
    if (intervalIndex === -1 || !this.player) {
      throw new Error('Interval not found or YouTube player not set');
    }
    
    this.currentIntervalIndex = intervalIndex;
    this.isPlayingIntervals = false;
    
    const interval = this.intervals[intervalIndex];
    
    if (typeof this.player.seekTo === 'function' && typeof this.player.playVideo === 'function') {
      this.player.seekTo(interval.startTime, true);
      this.player.playVideo();
      
      // Set timer to pause at end of interval
      const duration = (interval.endTime - interval.startTime) * 1000;
      this.intervalTimer = setTimeout(() => {
        if (this.player && typeof this.player.pauseVideo === 'function') {
          try {
            this.player.pauseVideo();
          } catch (error) {
            console.warn('Failed to pause video after specific interval:', error);
          }
        }
      }, duration);
    } else {
      console.error('YouTube player methods not available for specific interval');
    }
  }
  
  pauseIntervals(): void {
    console.log('Pausing highlight reel');
    this.isPlayingIntervals = false;
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (error) {
        console.warn('Failed to pause video:', error);
      }
    }
  }
  
  resumeIntervals(): void {
    console.log('Resuming highlight reel');
    if (!this.isPlayingIntervals) {
      this.isPlayingIntervals = true;
      this.playCurrentInterval();
    } else if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
      } catch (error) {
        console.warn('Failed to resume video:', error);
      }
    }
  }

  resumeOrStartFromCurrent(): void {
    console.log('Player ready check:', this.isPlayerReady());
    console.log('Has player:', !!this.player);
    console.log('Intervals length:', this.intervals.length);
    
    if (!this.isPlayerReady()) {
      console.error('Cannot start playback - YouTube player not ready');
      return;
    }
    
    if (this.intervals.length === 0) {
      console.error('Cannot start playback - no intervals available');
      return;
    }
    
    // Start sequential playback from the current interval index
    this.isPlayingIntervals = true;
    this.playCurrentInterval();
  }
  
  skipToNextInterval(): void {
    // Clear current timer first
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }
    
    // Skip to next interval
    if (this.currentIntervalIndex < this.intervals.length - 1) {
      this.currentIntervalIndex++;
      console.log(`Skipped to next highlight: ${this.currentIntervalIndex + 1}/${this.intervals.length}`);
      
      if (this.isPlayingIntervals) {
        this.playCurrentInterval();
      } else {
        // Notify even if not playing
        const currentInterval = this.intervals[this.currentIntervalIndex];
        if (this.onIntervalChangeCallback && currentInterval) {
          this.onIntervalChangeCallback(currentInterval.id);
        }
      }
    } else {
      console.log('Already at last highlight');
    }
  }
  
  skipToPreviousInterval(): void {
    // Clear current timer first
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }
    
    // Skip to previous interval
    if (this.currentIntervalIndex > 0) {
      this.currentIntervalIndex--;
      console.log(`Skipped to previous highlight: ${this.currentIntervalIndex + 1}/${this.intervals.length}`);
      
      if (this.isPlayingIntervals) {
        this.playCurrentInterval();
      } else {
        // Notify even if not playing
        const currentInterval = this.intervals[this.currentIntervalIndex];
        if (this.onIntervalChangeCallback && currentInterval) {
          this.onIntervalChangeCallback(currentInterval.id);
        }
      }
    } else {
      console.log('Already at first highlight');
    }
  }

  seekToInterval(intervalIndex: number): void {
    if (intervalIndex < 0 || intervalIndex >= this.intervals.length) {
      console.error('Invalid interval index:', intervalIndex);
      return;
    }

    // Stop current playback and clear timers
    this.pauseIntervals();
    
    // Set the current interval index
    this.currentIntervalIndex = intervalIndex;
    const interval = this.intervals[intervalIndex];
    
    console.log(`Seeking to highlight ${intervalIndex + 1}/${this.intervals.length}:`, 
                `${interval.startTime}s - ${interval.endTime}s`);
    
    // Seek to the start of the interval but don't play
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(interval.startTime, true);
      // Notify about interval change
      if (this.onIntervalChangeCallback) {
        this.onIntervalChangeCallback(interval.id);
      }
    }
  }

  seekToIntervalAndPlay(intervalIndex: number): void {
    
    if (intervalIndex < 0 || intervalIndex >= this.intervals.length) {
      console.error('Invalid interval index:', intervalIndex);
      return;
    }

    // Stop current playback and clear timers
    this.pauseIntervals();
    
    // Set the current interval index
    this.currentIntervalIndex = intervalIndex;
    const interval = this.intervals[intervalIndex];
    
    console.log(`Seeking to and playing highlight ${intervalIndex + 1}/${this.intervals.length}:`, 
                `${interval.startTime}s - ${interval.endTime}s`);
    
    // Seek to the start and start sequential playback from there
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(interval.startTime, true);
      
      // Start sequential playback from this point
      this.isPlayingIntervals = true;
      
      // Wait for seek to complete then start playing
      setTimeout(() => {
        this.playCurrentInterval();
      }, 200);
    }
  }
  
  getCurrentInterval(): HighlightInterval | null {
    return this.intervals[this.currentIntervalIndex] || null;
  }

  getPlayer(): any {
    return this.player;
  }
  
  getProgress(): { current: number; total: number; percentage: number } {
    // TODO: Get progress through all intervals
    const current = this.currentIntervalIndex + 1;
    const total = this.intervals.length;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return { current, total, percentage };
  }
  
  isPlaying(): boolean {
    if (!this.player || typeof this.player.getPlayerState !== 'function') {
      return false;
    }
    try {
      return this.isPlayingIntervals && this.player.getPlayerState() === 1; // 1 = playing
    } catch (error) {
      console.warn('Failed to get player state:', error);
      return false;
    }
  }
  
  destroy(): void {
    this.pauseIntervals();
    if (this.player && typeof this.player.destroy === 'function') {
      try {
        this.player.destroy();
      } catch (error) {
        console.warn('Failed to destroy player:', error);
      }
    }
    this.player = null;
    this.intervals = [];
    this.currentIntervalIndex = 0;
  }
}