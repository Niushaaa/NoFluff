import React, { useEffect, useRef } from 'react';
import { HighlightSegment } from '../../types';

interface HighlightTimelineProps {
  highlights: HighlightSegment[];
  currentHighlight: string | null;
  onHighlightSelect: (highlightId: string) => void;
}

export const HighlightTimeline: React.FC<HighlightTimelineProps> = ({
  highlights,
  currentHighlight,
  onHighlightSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep the active highlight visible
  useEffect(() => {
    if (currentHighlight && containerRef.current && activeItemRef.current) {
      const container = containerRef.current;
      const activeItem = activeItemRef.current;
      
      const containerWidth = container.clientWidth;
      const containerScrollLeft = container.scrollLeft;
      
      const activeItemLeft = activeItem.offsetLeft;
      const activeItemWidth = activeItem.offsetWidth;
      const activeItemRight = activeItemLeft + activeItemWidth;
      
      // Check if the active item is fully visible
      const isVisible = activeItemLeft >= containerScrollLeft && 
                       activeItemRight <= containerScrollLeft + containerWidth;
      
      if (!isVisible) {
        // Calculate scroll position to center the active item
        const scrollPosition = activeItemLeft - (containerWidth - activeItemWidth) / 2;
        
        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [currentHighlight]);
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
      <div 
        ref={containerRef}
        className="flex w-full gap-3 overflow-x-auto scrollbar-hide pb-2" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {highlights.map((highlight, idx) => {
          const isActive = highlight.id === currentHighlight;
          
          return (
            <div
              key={highlight.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => onHighlightSelect(highlight.id)}
              className={`relative flex-shrink-0 w-24 h-20 rounded-lg cursor-pointer transition-all duration-200 group flex flex-col justify-between p-2 ${
                isActive 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg border-2 border-red-300' 
                  : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              {/* Top Row: Number */}
              <div className="flex justify-between items-start">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-white/90 text-red-600' : 'bg-gray-600 text-gray-300'
                }`}>
                  {isActive ? '▶' : idx + 1}
                </div>
              </div>
              
              {/* Middle: Title */}
              <div className={`text-center text-xs font-medium ${
                isActive ? 'text-white' : 'text-gray-300'
              }`} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                {(() => {
                  const title = highlight.title || `Clip ${idx + 1}`;
                  return title.length > 12 ? title.substring(0, 12) + '...' : title;
                })()}
              </div>
              
              {/* Bottom: Time */}
              <div className={`text-center text-xs ${
                isActive ? 'text-white/80' : 'text-gray-400'
              }`} style={{ fontSize: '9px' }}>
                {formatHighlightTime(highlight)}
              </div>
              
              {/* Hover Tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                {highlight.title || `Segment ${idx + 1}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatHighlightTime = (highlight: HighlightSegment): string => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(highlight.startTime)}-${formatTime(highlight.endTime)}`;
};