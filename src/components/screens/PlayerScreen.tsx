import React, { useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { AppState } from '../../types';
import { VideoPlayer } from '../common/VideoPlayer';
import { HighlightTimeline } from '../common/HighlightTimeline';
import { processVideoUrl } from '../../services/videoService';

interface PlayerScreenProps {
  state: AppState;
  actions: {
    setScreen: (screen: 'input' | 'processing' | 'player' | 'explore') => void;
    setCurrentHighlight: (highlightId: string | null) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTime: (time: number) => void;
    setHighlights: (highlights: any[]) => void;
    setHighlightIntervals: (intervals: any[]) => void;
    setTranscript: (transcript: any) => void;
    setVideoData: (data: any) => void;
  };
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ state, actions }) => {
  useEffect(() => {
    // TODO: Load mock data if no video data exists (for demo)
    if (!state.videoData || state.highlights.length === 0) {
      const loadMockData = async () => {
        // TODO: Use actual service to process a mock URL for demo
        try {
          const result = await processVideoUrl('https://youtube.com/watch?v=demo');
          actions.setVideoData(result.videoData);
          actions.setTranscript(result.transcript);
          actions.setHighlights(result.highlights);
          actions.setHighlightIntervals(result.highlightIntervals);
          actions.setCurrentHighlight(result.highlights[1]?.id || null); // Set second highlight as active
        } catch (error) {
          console.error('Failed to load mock data:', error);
        }
      };
      
      loadMockData();
    }
  }, [state.highlights.length, state.videoData, actions]);

  const handleNewVideo = () => {
    // TODO: Navigate back to input screen
    actions.setScreen('input');
  };

  const handleHighlightSelect = (highlightId: string) => {
    // Set the current highlight and start playing immediately
    actions.setCurrentHighlight(highlightId);
    actions.setIsPlaying(true); // Start playing the selected highlight immediately
  };

  const handleIntervalChange = (intervalId: string | null) => {
    // TODO: Handle interval change from video player
    actions.setCurrentHighlight(intervalId);
  };

  const handlePlay = () => {
    // TODO: Start video playback
    actions.setIsPlaying(true);
  };

  const handlePause = () => {
    // TODO: Pause video playback
    actions.setIsPlaying(false);
  };

  const handleTimeUpdate = (time: number) => {
    // TODO: Update current playback time
    actions.setCurrentTime(time);
    
    // TODO: Auto-update current highlight based on playback time
    const currentHighlight = state.highlights.find(h => 
      time >= h.startTime && time <= h.endTime
    );
    
    if (currentHighlight && currentHighlight.id !== state.currentHighlight) {
      actions.setCurrentHighlight(currentHighlight.id);
    }
  };

  const handleSeek = (time: number) => {
    // Find which highlight interval contains this time and seek to it
    const targetInterval = state.highlightIntervals.find(interval => 
      time >= interval.startTime && time <= interval.endTime
    );
    
    if (targetInterval) {
      // If the time is within a highlight, select that highlight
      actions.setCurrentHighlight(targetInterval.id);
      actions.setIsPlaying(true); // Start playing from the selected highlight
    }
    
    actions.setCurrentTime(time);
  };

  const handleShareHighlight = () => {
    // TODO: Generate shareable link for highlight reel
    const shareUrl = `${window.location.origin}/share/${state.videoData?.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this video highlight!',
        text: `Highlights from: ${state.videoData?.title}`,
        url: shareUrl
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const handleExploreMore = () => {
    // TODO: Navigate to explore screen
    actions.setScreen('explore');
  };

  return (
    <div className="h-screen bg-gray-900 p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <button
          onClick={handleNewVideo}
          className="mb-4 px-4 py-2 bg-gray-700 text-white font-semibold rounded-full hover:bg-gray-600 transition-all self-start border border-gray-600"
        >
          ← New Video
        </button>

        {/* Video Player Container */}
        <div className="flex-shrink-0 mb-3 flex justify-center">
          <div className="max-w-2xl w-full">
            <VideoPlayer
              videoData={state.videoData}
              highlightIntervals={state.highlightIntervals}
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              selectedHighlight={state.currentHighlight}
              onPlay={handlePlay}
              onPause={handlePause}
              onTimeUpdate={handleTimeUpdate}
              onSeek={handleSeek}
              onIntervalChange={handleIntervalChange}
            />
          </div>
        </div>

        {/* Timeline with Highlights - Aligned with Video */}
        <div className="mb-3 flex justify-center">
          <div className="max-w-2xl w-full">
            <HighlightTimeline
              highlights={state.highlights}
              currentHighlight={state.currentHighlight}
              onHighlightSelect={handleHighlightSelect}
            />
          </div>
        </div>

        {/* Action Buttons - Aligned with Video */}
        <div className="flex-shrink-0 flex justify-center">
          <div className="max-w-2xl w-full grid grid-cols-2 gap-3">
            <button 
              onClick={handleShareHighlight}
              className="px-6 py-3 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Highlight ✨
            </button>
            <button
              onClick={handleExploreMore}
              className="px-6 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 shadow-xl transition-all flex items-center justify-center gap-2 border border-gray-600"
            >
              Explore More 🔍
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};