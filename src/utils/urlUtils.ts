export const validateYouTubeUrl = (url: string): boolean => {
  // TODO: Validate YouTube URL format
  // Should accept various formats:
  // - https://youtube.com/watch?v=VIDEO_ID
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://youtube.com/embed/VIDEO_ID
  
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(&.*)?$/;
  
  return youtubeRegex.test(url.trim());
};

export const formatTime = (seconds: number): string => {
  // TODO: Format seconds to MM:SS or HH:MM:SS format
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export const parseTimeToSeconds = (timeString: string): number => {
  // TODO: Parse time string (MM:SS or HH:MM:SS) to seconds
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
};