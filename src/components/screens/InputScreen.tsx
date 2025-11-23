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
    setScreen: (screen: 'input' | 'processing' | 'player' | 'explore') => void;
    setProcessing: (processing: any) => void;
    setVideoData: (data: any) => void;
    setTranscript: (transcript: any) => void;
    setHighlights: (highlights: any[]) => void;
    setHighlightIntervals: (intervals: any[]) => void;
  };
}

export const InputScreen: React.FC<InputScreenProps> = ({ state, actions }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setInputUrl(e.target.value);
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
      // Stage 1: URL Validation (25%)
      actions.setProcessing({
        stage: 'validating',
        progress: 25,
        message: 'Validating YouTube URL...'
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stage 2: Transcript Fetching (50%) 
      actions.setProcessing({
        stage: 'fetching_transcript', 
        progress: 50,
        message: 'Downloading audio and generating transcript...'
      });
      
      // Process video URL and extract highlights
      const result = await processVideoUrl(state.inputUrl);
      
      // Stage 3: AI Analysis (75%)
      actions.setProcessing({
        stage: 'ai_analysis',
        progress: 75, 
        message: 'AI analyzing transcript for highlights...'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stage 4: Complete (100%)
      actions.setProcessing({
        stage: 'complete',
        progress: 100,
        message: 'Ready to watch highlights!'
      });
      
      // Set the results
      actions.setVideoData(result.videoData);
      actions.setTranscript(result.transcript);
      actions.setHighlights(result.highlights);
      actions.setHighlightIntervals(result.highlightIntervals);
      
      // Navigate to player after brief completion display
      setTimeout(() => actions.setScreen('player'), 1500);
    } catch (error) {
      console.error('Processing failed:', error);
      // Handle error state
      actions.setProcessing({
        stage: 'error',
        progress: 0,
        message: 'Processing failed. Please try again.'
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
        </div>
      </div>
    </div>
  );
};