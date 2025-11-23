import React from 'react';
import { Scissors } from 'lucide-react';
import { AppState } from '../../types';
import { Logo } from '../common/Logo';
import { validateYouTubeUrl } from '../../utils/urlUtils';
import { processVideoUrl } from '../../services/videoService';

interface ExploreScreenProps {
  state: AppState;
  actions: {
    setInputUrl: (url: string) => void;
    setScreen: (screen: 'input' | 'processing' | 'player' | 'explore') => void;
    setProcessing: (processing: any) => void;
    setVideoData: (data: any) => void;
    setTranscript: (transcript: any) => void;
    setHighlights: (highlights: any[]) => void;
    setHighlightIntervals: (intervals: any[]) => void;
    resetState: () => void;
  };
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ state, actions }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setInputUrl(e.target.value);
  };

  const handleSubmit = async () => {
    // TODO: Validate YouTube URL
    if (!validateYouTubeUrl(state.inputUrl)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    // TODO: Start processing new video
    actions.setScreen('processing');
    
    try {
      // TODO: Process new video URL
      const result = await processVideoUrl(state.inputUrl);
      actions.setVideoData(result.videoData);
      actions.setTranscript(result.transcript);
      actions.setHighlights(result.highlights);
      actions.setHighlightIntervals(result.highlightIntervals);
      // Navigate to player after processing
      setTimeout(() => actions.setScreen('player'), 2000);
    } catch (error) {
      console.error('Processing failed:', error);
      // TODO: Handle error state
      actions.setScreen('explore');
    }
  };

  const handleBack = () => {
    // TODO: Navigate back to player
    actions.setScreen('player');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 px-5 py-3 bg-gray-700 text-gray-100 font-semibold rounded-full hover:bg-gray-600 transition-all border border-gray-600"
        >
          ← Back
        </button>

        <div className="bg-gray-800 rounded-3xl shadow-2xl p-12 text-center border border-gray-700">
          <Logo size="md" showTitle={false} />
          
          <h2 className="text-3xl font-bold text-gray-100 mb-3 mt-6">
            Try Another Video! 🎬
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Paste a new YouTube link to create more highlights
          </p>
          
          <div className="max-w-2xl mx-auto">
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

          {/* TODO: Add recent videos or suggested content */}
          <div className="mt-12 text-left">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              💡 Pro Tips:
            </h3>
            <ul className="space-y-2 text-gray-400">
              <li>• Works best with educational and tutorial videos</li>
              <li>• Longer videos (5+ minutes) generate better highlights</li>
              <li>• Videos with clear speech work best for analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};