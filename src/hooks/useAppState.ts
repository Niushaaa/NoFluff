import { useState, useCallback } from 'react';
import { AppState, AppScreen, VideoData, HighlightSegment, ProcessingStatus, VideoTranscript, HighlightInterval } from '../types';

const initialState: AppState = {
  currentScreen: 'input',
  inputUrl: '',
  desiredDuration: 3, // Default to 3 minutes
  videoData: null,
  transcript: null,
  highlights: [],
  highlightIntervals: [],
  processing: null,
  currentHighlight: null,
  isPlaying: false,
  currentTime: 0,
  totalHighlightDuration: 0,
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>(initialState);

  const setScreen = useCallback((screen: AppScreen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const setInputUrl = useCallback((url: string) => {
    setState(prev => ({ ...prev, inputUrl: url }));
  }, []);

  const setVideoData = useCallback((data: VideoData | null) => {
    setState(prev => ({ ...prev, videoData: data }));
  }, []);

  const setTranscript = useCallback((transcript: VideoTranscript | null) => {
    setState(prev => ({ ...prev, transcript }));
  }, []);

  const setHighlights = useCallback((highlights: HighlightSegment[]) => {
    setState(prev => ({ ...prev, highlights }));
  }, []);

  const setHighlightIntervals = useCallback((highlightIntervals: HighlightInterval[]) => {
    setState(prev => ({ ...prev, highlightIntervals }));
  }, []);

  const setProcessing = useCallback((processing: ProcessingStatus | null) => {
    setState(prev => ({ ...prev, processing }));
  }, []);

  const setCurrentHighlight = useCallback((highlightId: string | null) => {
    setState(prev => ({ ...prev, currentHighlight: highlightId }));
  }, []);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    setState(prev => ({ ...prev, isPlaying }));
  }, []);

  const setCurrentTime = useCallback((currentTime: number) => {
    setState(prev => ({ ...prev, currentTime }));
  }, []);

  const setTotalHighlightDuration = useCallback((totalHighlightDuration: number) => {
    setState(prev => ({ ...prev, totalHighlightDuration }));
  }, []);

  const setDesiredDuration = useCallback((desiredDuration: number) => {
    setState(prev => ({ ...prev, desiredDuration }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    actions: {
      setScreen,
      setInputUrl,
      setDesiredDuration,
      setVideoData,
      setTranscript,
      setHighlights,
      setHighlightIntervals,
      setProcessing,
      setCurrentHighlight,
      setIsPlaying,
      setCurrentTime,
      setTotalHighlightDuration,
      resetState,
    },
  };
};