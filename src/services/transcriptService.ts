import { VideoTranscript } from '../types';

export const validateTranscript = (transcript: VideoTranscript): boolean => {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return false;
  }

  // Check if transcript has reasonable coverage (segments span most of the video)
  const totalDuration = transcript.segments.reduce((total, segment) => 
    total + segment.duration, 0
  );
  
  // Require at least 30 seconds of transcript content
  return totalDuration >= 30;
};