import React from 'react';
import { Scissors } from 'lucide-react';
import { AppState } from '../../types';
import { Logo } from '../common/Logo';
import { validateYouTubeUrl } from '../../utils/urlUtils';
import { processVideoUrl } from '../../services/videoService';

interface InputScreenProps {
  state: AppState;
  actions: {
    setInputUrl: (url: string) => void;
    setDesiredDuration: (duration: number) => void;
    setScreen: (screen: 'input' | 'processing' | 'player') => void;
    setProcessing: (processing: any) => void;
    setVideoData: (data: any) => void;
    setTranscript: (transcript: any) => void;
    setHighlights: (highlights: any[]) => void;
    setHighlightIntervals: (intervals: any[]) => void;
    setCurrentHighlight: (highlightId: string | null) => void;
    setTotalHighlightDuration: (duration: number) => void;
  };
}

export const InputScreen: React.FC<InputScreenProps> = ({ state, actions }) => {
  const [customDuration, setCustomDuration] = React.useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setInputUrl(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.inputUrl.trim()) {
      handleSubmit();
    }
  };

  const handleDurationSelect = (duration: number) => {
    actions.setDesiredDuration(duration);
    setCustomDuration(''); // Clear custom input when preset is selected
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDuration(value);
    
    if (value && !isNaN(Number(value))) {
      const duration = Math.max(1, Math.min(60, Number(value))); // Clamp between 1-60 minutes
      actions.setDesiredDuration(duration);
    }
  };

  const handleSubmit = async () => {
    // Validate YouTube URL
    if (!validateYouTubeUrl(state.inputUrl)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    // Start processing with progress tracking
    actions.setScreen('processing');
    
    try {
      // Stage 1: Initial setup
      actions.setProcessing({
        stage: 'validating',
        progress: 10,
        message: 'Validating YouTube URL...'
      });
      
      // Process video URL with real-time progress updates
      const result = await processVideoUrl(state.inputUrl, state.desiredDuration, (stage: string, progress: number, message: string) => {
        actions.setProcessing({
          stage,
          progress,
          message
        });
      });
      
      // Set the results
      actions.setVideoData(result.videoData);
      actions.setTranscript(result.transcript);
      actions.setHighlights(result.highlights);
      actions.setHighlightIntervals(result.highlightIntervals);
      actions.setTotalHighlightDuration(result.totalHighlightDuration);
      
      // Set the first highlight as the initial selection
      if (result.highlights && result.highlights.length > 0) {
        actions.setCurrentHighlight(result.highlights[0].id);
      }
      
      // Navigate to player after brief completion display
      setTimeout(() => actions.setScreen('player'), 1500);
    } catch (error) {
      console.error('Processing failed:', error);
      // Handle error state
      actions.setProcessing({
        stage: 'error',
        progress: 0,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTimeout(() => actions.setScreen('input'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo size="xl" />
          <p className="text-3xl text-gray-100 mt-4 font-bold">Turn any YouTube video into the core version that actually matters</p>
          <p className="text-xl text-gray-300 mt-2">Skip the long stuff.</p>
        </div>

        {/* Main Input Card */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-10 transform hover:scale-105 transition-transform border border-gray-700">
          <label className="block text-lg font-semibold text-gray-200 mb-4">
            🎬 Paste your YouTube link
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={state.inputUrl}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-6 py-4 border-2 border-gray-600 bg-gray-700 text-gray-100 rounded-2xl focus:border-red-500 focus:outline-none text-lg placeholder-gray-400"
            />
            <button
              onClick={handleSubmit}
              disabled={!state.inputUrl.trim()}
              className="px-10 py-4 bg-gradient-to-br from-red-600 to-red-700 text-white font-bold rounded-2xl hover:from-red-700 hover:to-red-800 shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Scissors className="w-6 h-6" />
              Go! ✨
            </button>
          </div>

          {/* Duration Selection */}
          <div className="flex items-center gap-4 my-8 text-gray-400">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="text-sm">How long should the highlights be?</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          <div className="space-y-4">
            {/* Preset Duration Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 3, 5, 10].map((duration) => (
                <button
                  key={duration}
                  onClick={() => handleDurationSelect(duration)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    state.desiredDuration === duration && !customDuration
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-650'
                  }`}
                >
                  <div className="text-2xl font-bold">{duration} min</div>
                  <div className="text-sm opacity-75">
                    {duration === 1 && 'Quick glance'}
                    {duration === 3 && 'Key points'}
                    {duration === 5 && 'Detailed'}
                    {duration === 10 && 'Comprehensive'}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Duration Input */}
            <div className="flex items-center gap-3 justify-center">
              <span className="text-gray-400 text-sm">or custom:</span>
              <input
                type="number"
                value={customDuration}
                onChange={handleCustomDurationChange}
                placeholder="Minutes"
                min="1"
                max="60"
                className="w-24 px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-center focus:border-red-500 focus:outline-none"
              />
              <span className="text-gray-400 text-sm">minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};