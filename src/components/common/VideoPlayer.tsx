import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { VideoData, HighlightInterval } from '../../types';
import { formatTime } from '../../utils/urlUtils';
import { Logo } from './Logo';
import { IntervalPlayer } from '../../services/intervalPlayer';
import { extractVideoId } from '../../services/videoService';

interface VideoPlayerProps {
  videoData: VideoData | null;
  highlightIntervals: HighlightInterval[];
  isPlaying: boolean;
  currentTime: number;
  selectedHighlight?: string | null;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  onIntervalChange?: (intervalId: string | null) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoData,
  highlightIntervals,
  isPlaying,
  currentTime,
  selectedHighlight,
  onPlay,
  onPause,
  onTimeUpdate,
  onSeek,
  onIntervalChange
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const intervalPlayerRef = useRef<IntervalPlayer>(new IntervalPlayer());
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    // Initialize YouTube player when video data is available
    if (videoData && !playerReady) {
      // Reset highlights initialization when new video loads
      setHighlightsInitialized(false);
      
      const videoId = extractVideoId(videoData.url);
      intervalPlayerRef.current
        .initializePlayer('youtube-player', videoId)
        .then(() => {
          setPlayerReady(true);
        })
        .catch(error => {
          console.error('Failed to initialize YouTube player:', error);
        });
    }
  }, [videoData, playerReady]);

  const [highlightsInitialized, setHighlightsInitialized] = useState(false);


  useEffect(() => {
    // Initialize highlights only once when ready
    if (highlightIntervals.length > 0 && playerReady && !highlightsInitialized) {
      console.log('Setting up highlights:', highlightIntervals.length, 'intervals');
      intervalPlayerRef.current.setIntervals(highlightIntervals);
      
      // Set up callback to track current highlight
      intervalPlayerRef.current.setOnIntervalChangeCallback((intervalId) => {
        if (onIntervalChange) {
          onIntervalChange(intervalId);
        }
      });
      
      setHighlightsInitialized(true);
      
      // Auto-start highlights with retry logic
      let retryCount = 0;
      const maxRetries = 5;
      
      const startHighlights = async () => {
        console.log('Auto-starting highlights...');
        try {
          // Call onPlay first
          onPlay();
          // Start the highlight reel
          await intervalPlayerRef.current.playHighlightReel();
        } catch (error) {
          console.error('Failed to play highlights:', error);
          onPause();
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Failed to start highlights (attempt ${retryCount}/${maxRetries}), retrying in 1 second...`, error instanceof Error ? error.message : String(error));
            setTimeout(startHighlights, 1000); // Retry after 1 second
          } else {
            console.error('Failed to start highlights after maximum retries:', error instanceof Error ? error.message : String(error));
          }
        }
      };
      
      setTimeout(startHighlights, 1500); // Initial delay
    }
  }, [highlightIntervals, playerReady, highlightsInitialized, onIntervalChange, onPlay, onPause]);

  useEffect(() => {
    // Handle video playback state changes
    if (!playerReady) return;

    if (!isPlaying) {
      intervalPlayerRef.current.pauseIntervals();
    }
  }, [isPlaying, playerReady]);

  // Handle specific highlight selection (seek to segment and start playing)
  useEffect(() => {
    if (selectedHighlight && playerReady) {
      const targetInterval = highlightIntervals.find(interval => interval.id === selectedHighlight);
      if (targetInterval) {
        console.log('Seeking and playing selected highlight:', targetInterval.id);
        // Set the current interval index and start playing from there
        const intervalIndex = highlightIntervals.findIndex(interval => interval.id === selectedHighlight);
        if (intervalIndex !== -1) {
          intervalPlayerRef.current.seekToIntervalAndPlay(intervalIndex);
        }
      }
    }
  }, [selectedHighlight, playerReady, highlightIntervals]);

  const handlePlayPause = () => {
    // Handle play/pause for sequential highlight playback
    if (intervalPlayerRef.current.isPlaying()) {
      // Currently playing - pause it
      intervalPlayerRef.current.pauseIntervals();
      onPause();
    } else {
      // Not playing - start/resume sequential playback from current position
      if (highlightIntervals.length > 0) {
        intervalPlayerRef.current.resumeOrStartFromCurrent();
        onPlay();
      }
    }
  };

  const handleSkipInterval = (direction: 'next' | 'previous') => {
    // Skip to next/previous highlight interval
    if (direction === 'next') {
      intervalPlayerRef.current.skipToNextInterval();
    } else {
      intervalPlayerRef.current.skipToPreviousInterval();
    }
    
    // The interval change will be automatically notified through the callback
  };


  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar || !selectedHighlight) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    // Find current highlight and seek within it (like normal video player)
    const currentInterval = highlightIntervals.find(interval => interval.id === selectedHighlight);
    if (!currentInterval) return;
    
    // Calculate target time within current highlight
    const highlightDuration = currentInterval.endTime - currentInterval.startTime;
    const targetTimeInHighlight = percentage * highlightDuration;
    const actualVideoTime = currentInterval.startTime + targetTimeInHighlight;
    
    onSeek(actualVideoTime);
  };

  // Calculate current highlight progress (like a normal video player but for current segment)
  const getCurrentHighlightProgress = () => {
    if (!highlightIntervals.length || !selectedHighlight) {
      return { progress: 0, currentHighlightTime: 0, currentHighlightDuration: 0 };
    }
    
    // Find the currently selected highlight
    const currentInterval = highlightIntervals.find(interval => interval.id === selectedHighlight);
    if (!currentInterval) {
      return { progress: 0, currentHighlightTime: 0, currentHighlightDuration: 0 };
    }
    
    // Calculate time within current highlight (like normal video player seconds)
    const currentHighlightTime = Math.max(0, Math.min(
      currentTime - currentInterval.startTime,
      currentInterval.endTime - currentInterval.startTime
    ));
    
    const currentHighlightDuration = currentInterval.endTime - currentInterval.startTime;
    const progress = currentHighlightDuration > 0 ? (currentHighlightTime / currentHighlightDuration) * 100 : 0;
    
    return {
      progress: Math.max(0, Math.min(100, progress)),
      currentHighlightTime,
      currentHighlightDuration
    };
  };

  const { progress, currentHighlightTime, currentHighlightDuration } = getCurrentHighlightProgress();

  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full">
      {/* YouTube Player Container */}
      <div className="aspect-video bg-slate-900 relative">
        {videoData ? (
          <>
            {/* YouTube IFrame Player */}
            <div 
              id="youtube-player"
              ref={playerContainerRef}
              style={{ 
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
                display: 'block'
              }}
            />
            
            {/* Loading State - only show when player is not ready */}
            {!playerReady && (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 absolute inset-0" style={{ zIndex: 5 }}>
                <Logo size="lg" showTitle={false} />
                {videoData.thumbnailUrl && (
                  <img 
                    src={videoData.thumbnailUrl} 
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                  />
                )}
                <div className="absolute bottom-4 text-white text-sm">Loading player...</div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <Logo size="lg" showTitle={false} />
          </div>
        )}
      </div>
      
      {/* Player Controls */}
      <div className="bg-slate-800 pt-4 pb-4 px-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="bg-slate-700 rounded-full h-3 overflow-hidden cursor-pointer"
          >
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Control Buttons and Time */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Skip Controls */}
            <button 
              onClick={() => handleSkipInterval('previous')}
              className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
              title="Previous highlight"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            {/* Main Play/Pause Button */}
            <button 
              onClick={handlePlayPause}
              className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
              title={isPlaying ? "Pause highlights" : "Play highlights"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 ml-0.5 fill-white" />
              )}
            </button>
            
            <button 
              onClick={() => handleSkipInterval('next')}
              className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
              title="Next highlight"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            <span className="text-lg font-semibold">
              {formatTime(currentHighlightTime)} / {formatTime(currentHighlightDuration)}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {videoData && (
              <div className="text-sm text-slate-300 max-w-xs truncate">
                {videoData.title}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};