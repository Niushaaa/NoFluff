import { VideoData, HighlightSegment, VideoTranscript, HighlightInterval } from '../types';
import { fetchYouTubeTranscript, validateTranscript } from './transcriptService';
import { extractHighlightsFromTranscript } from './aiService';

export interface VideoProcessingResult {
  videoData: VideoData;
  transcript: VideoTranscript;
  highlights: HighlightSegment[];
  highlightIntervals: HighlightInterval[];
}

export const processVideoUrl = async (url: string): Promise<VideoProcessingResult> => {
  // NEW FLOW:
  // 1. Validate YouTube URL and extract video ID
  // 2. Get video metadata (title, duration, thumbnail) 
  // 3. Fetch YouTube transcript with timestamps
  // 4. Validate transcript quality
  // 5. Use AI to analyze transcript and return highlight intervals
  // 6. Convert intervals to highlight segments for UI
  
  const videoId = extractVideoId(url);
  
  try {
    // Step 1: Get basic video metadata  
    const videoData = await getVideoMetadata(videoId);
    
    // Step 2: Fetch transcript from YouTube (includes real duration)
    const transcript = await fetchYouTubeTranscript(videoId);
    
    // Step 3: Update video duration with real duration from transcript
    if (transcript.totalDuration) {
      videoData.duration = transcript.totalDuration;
    }
    
    // Step 4: Validate transcript
    if (!validateTranscript(transcript)) {
      throw new Error('Video transcript is not available or too short');
    }
    
    // Step 5: AI analysis to get highlight intervals
    const highlightIntervals = await extractHighlightsFromTranscript(transcript);
    
    // Step 6: If no transcript duration, use sum of highlights as fallback
    if (!transcript.totalDuration) {
      const highlightDuration = highlightIntervals.reduce((sum, interval) => 
        sum + (interval.endTime - interval.startTime), 0);
      videoData.duration = highlightDuration; // Use highlight sum (could be 0)
    }
    
    // Step 7: Convert intervals to UI-friendly highlight segments
    const highlights = convertIntervalsToSegments(highlightIntervals);
    
    return {
      videoData,
      transcript,
      highlights,
      highlightIntervals
    };
  } catch (error) {
    throw new Error(`Failed to process video: ${error}`);
  }
};

export const extractVideoId = (url: string): string => {
  // TODO: Extract video ID from various YouTube URL formats
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  
  if (!match || !match[1]) {
    throw new Error('Invalid YouTube URL');
  }
  
  return match[1];
};

const getVideoMetadata = async (videoId: string): Promise<VideoData> => {
  try {
    // Use our backend API for video metadata
    const response = await fetch(`http://localhost:3001/api/video/${videoId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Backend video metadata error:', error);
    // Fallback to basic data
    return {
      id: videoId,
      title: `Video ${videoId}`,
      duration: 0, // Will be updated with real duration or highlight sum
      url: `https://youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  }
};

const convertIntervalsToSegments = (intervals: HighlightInterval[]): HighlightSegment[] => {
  return intervals.map((interval, index) => {
    // Use AI-provided name as title, with fallback
    const title = interval.name || generateSegmentTitle(interval.reason, index);
    const type = inferSegmentType(interval.reason);
    
    return {
      id: interval.id,
      title,
      startTime: interval.startTime,
      endTime: interval.endTime,
      type
    };
  });
};

const generateSegmentTitle = (reason: string, index: number): string => {
  if (!reason) return `Segment ${index + 1}`;
  
  // Extract meaningful concepts directly from AI reasoning
  const cleanReason = reason.replace(/^(This|It|The)\s+/i, '').trim();
  
  // If the reason is descriptive enough, use it directly as a title
  if (cleanReason.length > 5 && cleanReason.length < 50) {
    // Capitalize first letter and clean up
    const title = cleanReason.charAt(0).toUpperCase() + cleanReason.slice(1);
    // Remove trailing periods and clean up
    return title.replace(/\.$/, '').replace(/\s+/g, ' ');
  }
  
  const lowerReason = reason.toLowerCase();
  
  // Content-specific patterns for better titles
  if (lowerReason.includes('accountability') || lowerReason.includes('perception')) {
    return 'Accountability Discussion';
  } else if (lowerReason.includes('weather') || lowerReason.includes('forecast')) {
    return 'Weather Forecasting';
  } else if (lowerReason.includes('data') || lowerReason.includes('statistical') || lowerReason.includes('accuracy')) {
    return 'Data & Statistics';
  } else if (lowerReason.includes('reaction') || lowerReason.includes('angry') || lowerReason.includes('backlash')) {
    return 'Public Reaction';
  } else if (lowerReason.includes('example') || lowerReason.includes('concrete') || lowerReason.includes('evidence')) {
    return 'Real-World Example';
  } else if (lowerReason.includes('challenges') || lowerReason.includes('pressure') || lowerReason.includes('unique')) {
    return 'Key Challenges';
  } else if (lowerReason.includes('opening') || lowerReason.includes('stage') || lowerReason.includes('tone')) {
    return 'Opening Statement';
  } else if (lowerReason.includes('conclusion') || lowerReason.includes('reinforc') || lowerReason.includes('theme')) {
    return 'Main Conclusion';
  } else if (lowerReason.includes('insight') || lowerReason.includes('understanding') || lowerReason.includes('crucial')) {
    return 'Core Insight';
  } else {
    // Extract key noun from the reason
    const words = reason.split(' ');
    const importantWords = words.filter(word => {
      const w = word.toLowerCase().replace(/[^\w]/g, '');
      return w.length > 4 && !['this', 'that', 'with', 'from', 'about', 'which', 'where', 'their', 'being'].includes(w);
    });
    
    if (importantWords.length > 0) {
      const key = importantWords[0].replace(/[^\w]/g, '');
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
    
    // Better fallback titles based on position
    const fallbackTitles = [
      'Opening Hook',
      'Key Point', 
      'Main Idea',
      'Important Detail',
      'Conclusion'
    ];
    return fallbackTitles[index] || `Segment ${index + 1}`;
  }
};

const inferSegmentType = (reason: string): 'hook' | 'explanation' | 'demo' | 'tip' | 'conclusion' => {
  // TODO: Infer segment type from AI analysis reason
  const lowerReason = reason.toLowerCase();
  
  if (lowerReason.includes('hook') || lowerReason.includes('introduction')) {
    return 'hook';
  } else if (lowerReason.includes('demonstration') || lowerReason.includes('example')) {
    return 'demo';
  } else if (lowerReason.includes('tip') || lowerReason.includes('advice')) {
    return 'tip';
  } else if (lowerReason.includes('conclusion') || lowerReason.includes('summary')) {
    return 'conclusion';
  } else {
    return 'explanation';
  }
};

