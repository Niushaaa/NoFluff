import React from 'react';
import { Scissors } from 'lucide-react';
import { AppState } from '../../types';

interface ProcessingScreenProps {
  state: AppState;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ state }) => {
  // Progress is now controlled by InputScreen during actual processing

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-16 text-center border border-gray-700">
          <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse shadow-xl">
            <Scissors className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            Skip the long stuff.
          </h2>
          
          {state.processing && (
            <div className="mb-6">
              <p className="text-lg text-gray-300 mb-4">{state.processing.message}</p>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${state.processing.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">{state.processing.progress}% complete</p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};