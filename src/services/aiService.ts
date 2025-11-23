import { VideoTranscript, HighlightInterval } from '../types';

interface AIAnalysisPrompt {
  transcript: string;
  timestamps: Array<{ start: number; end: number; text: string }>;
}

export const extractHighlightsFromTranscript = async (
  transcript: VideoTranscript
): Promise<HighlightInterval[]> => {
  try {
    // Use our backend AI analysis endpoint
    const response = await fetch('http://localhost:3001/api/analyze-highlights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.highlights;
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const formatTranscriptForAI = (transcript: VideoTranscript): AIAnalysisPrompt => {
  // TODO: Format transcript for AI consumption
  const fullText = transcript.segments.map(segment => segment.text).join(' ');
  
  const timestamps = transcript.segments.map(segment => ({
    start: segment.start,
    end: segment.start + segment.duration,
    text: segment.text
  }));
  
  return {
    transcript: fullText,
    timestamps
  };
};

const analyzeWithAI = async (prompt: AIAnalysisPrompt): Promise<HighlightInterval[]> => {
  try {
    // Use OpenAI GPT-4o-mini to analyze the transcript
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this video transcript and identify the most important/interesting segments that add up to exactly 20 seconds total duration.

Transcript with timestamps:
${prompt.timestamps.map(t => `[${t.start}s-${t.end}s]: ${t.text}`).join('\n')}

Return a JSON array of highlight segments. Each segment should be:
{
  "id": "highlight_1", 
  "startTime": start_time_in_seconds,
  "endTime": end_time_in_seconds,
  "confidence": 0.8-1.0,
  "reason": "brief explanation why this is important"
}

Requirements:
- Total duration of all segments must be approximately 20 seconds
- Choose the most engaging, informative, or surprising moments
- Prefer segments with complete thoughts/sentences
- Maximum 5 segments
- Return only valid JSON array, no other text`
        }],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const highlights = JSON.parse(content);
    return highlights;

  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fallback to simple analysis
    return generateMockHighlights(prompt);
  }
};

const generateMockHighlights = (prompt: AIAnalysisPrompt): HighlightInterval[] => {
  // TODO: Replace with actual AI analysis
  // This simulates AI-identified highlights based on transcript content
  
  const highlights: HighlightInterval[] = [];
  
  // Analyze segments for key patterns that indicate highlights
  for (let i = 0; i < prompt.timestamps.length; i++) {
    const segment = prompt.timestamps[i];
    const text = segment.text.toLowerCase();
    
    // Look for introduction/hook patterns
    if (i <= 2 && (text.includes('welcome') || text.includes('today'))) {
      highlights.push({
        id: `intro-${i}`,
        name: "Opening Hook",
        startTime: segment.start,
        endTime: Math.min(segment.end + 10, prompt.timestamps[i + 2]?.end || segment.end),
        reason: "Strong opening hook - engaging introduction"
      });
    }
    
    // Look for demonstration/example patterns
    if (text.includes('show you') || text.includes('example') || text.includes('demo')) {
      const endIndex = Math.min(i + 3, prompt.timestamps.length - 1);
      highlights.push({
        id: `demo-${i}`,
        name: "Demo Example",
        startTime: segment.start,
        endTime: prompt.timestamps[endIndex].end,
        reason: "Practical demonstration - shows concrete examples"
      });
    }
    
    // Look for explanation patterns
    if (text.includes('this is') || text.includes('how to') || text.includes('because')) {
      const endIndex = Math.min(i + 2, prompt.timestamps.length - 1);
      highlights.push({
        id: `explanation-${i}`,
        name: "Key Point",
        startTime: segment.start,
        endTime: prompt.timestamps[endIndex].end,
        reason: "Key explanation - clarifies important concepts"
      });
    }
    
    // Look for important tips/advice
    if (text.includes('remember') || text.includes('important') || text.includes('tip')) {
      highlights.push({
        id: `tip-${i}`,
        name: "Pro Tip",
        startTime: segment.start,
        endTime: segment.end + 5,
        reason: "Important tip - valuable advice"
      });
    }
    
    // Look for conclusions/summaries
    if (i >= prompt.timestamps.length - 3 && 
        (text.includes('that covers') || text.includes('thanks') || text.includes('conclusion'))) {
      highlights.push({
        id: `conclusion-${i}`,
        name: "Conclusion",
        startTime: segment.start,
        endTime: prompt.timestamps[prompt.timestamps.length - 1].end,
        reason: "Strong conclusion - summarizes key points"
      });
    }
  }
  
  // Remove overlapping highlights and merge nearby ones
  return mergeAndFilterHighlights(highlights);
};

const mergeAndFilterHighlights = (highlights: HighlightInterval[]): HighlightInterval[] => {
  // TODO: Implement logic to merge overlapping highlights and filter by confidence
  
  // Sort by start time
  highlights.sort((a, b) => a.startTime - b.startTime);
  
  const merged: HighlightInterval[] = [];
  const MIN_SEGMENT_LENGTH = 15; // Minimum 15 seconds per highlight
  const MAX_SEGMENTS = 5; // Maximum 5 highlights
  
  for (const highlight of highlights) {
    // Skip very short segments
    if (highlight.endTime - highlight.startTime < MIN_SEGMENT_LENGTH) {
      continue;
    }
    
    // Check for overlap with last merged segment
    const lastMerged = merged[merged.length - 1];
    if (lastMerged && highlight.startTime <= lastMerged.endTime + 10) {
      // Merge overlapping or nearby segments
      lastMerged.endTime = Math.max(lastMerged.endTime, highlight.endTime);
      lastMerged.reason += ` + ${highlight.reason}`;
    } else {
      merged.push(highlight);
    }
  }
  
  // Return segments limited to MAX_SEGMENTS
  return merged.slice(0, MAX_SEGMENTS);
};

// TODO: Implement actual AI service calls
export const callOpenAI = async (prompt: string): Promise<any> => {
  // TODO: OpenAI API integration
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-3.5-turbo',
  //     messages: [{ role: 'user', content: prompt }],
  //     temperature: 0.3,
  //   }),
  // });
  throw new Error('OpenAI integration not implemented yet');
};

export const callClaude = async (prompt: string): Promise<any> => {
  // TODO: Anthropic Claude API integration
  // Similar structure to OpenAI but using Anthropic's API
  throw new Error('Claude integration not implemented yet');
};