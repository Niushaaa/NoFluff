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
              console.log('YouTube player ready', { videoId });
              resolve();
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
    if (!this.player) return false;
    
    try {
      // Check if essential YouTube player methods are available
      return (
        typeof this.player.seekTo === 'function' &&
        typeof this.player.playVideo === 'function' &&
        typeof this.player.pauseVideo === 'function' &&
        typeof this.player.getPlayerState === 'function'
      );
    } catch (error) {
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
    if (!this.player || !this.isPlayingIntervals) return;
    
    const currentInterval = this.intervals[this.currentIntervalIndex];
    if (!currentInterval) {
      this.isPlayingIntervals = false;
      console.log('Finished playing all highlights');
      // Clear current highlight when finished
      if (this.onIntervalChangeCallback) {
        this.onIntervalChangeCallback(null);
      }
      return;
    }
    
    console.log(`Playing highlight ${this.currentIntervalIndex + 1}/${this.intervals.length}:`, 
                `${currentInterval.startTime}s - ${currentInterval.endTime}s`);
    
    // Notify about interval change
    if (this.onIntervalChangeCallback) {
      this.onIntervalChangeCallback(currentInterval.id);
    }
    
    // Seek to interval start time and play
    if (typeof this.player.seekTo === 'function' && typeof this.player.playVideo === 'function') {
      this.player.seekTo(currentInterval.startTime, true);
      this.player.playVideo();
      
      // Wait for seek operation to complete before starting timer
      setTimeout(() => {
        // Calculate duration and set timer to stop at end
        const duration = (currentInterval.endTime - currentInterval.startTime) * 1000;
        console.log(`Playing for ${duration}ms (after ${this.currentIntervalIndex === 0 ? 'initial' : 'seek'} delay)`);
        
        this.intervalTimer = setTimeout(() => {
          console.log(`Finished playing highlight ${this.currentIntervalIndex + 1}, moving to next immediately`);
          
          // Move to next interval immediately without pause
          this.currentIntervalIndex++;
          this.playCurrentInterval();
        }, duration);
      }, this.currentIntervalIndex === 0 ? 500 : 200); // Longer delay for first segment, shorter for subsequent
    } else {
      console.error('YouTube player methods not available');
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
    console.log('Starting/resuming sequential highlight playback from current position');
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
    // TODO: Get currently playing interval
    return this.intervals[this.currentIntervalIndex] || null;
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