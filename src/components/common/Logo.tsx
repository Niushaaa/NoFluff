import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTitle = true }) => {
  const sizeClasses = {
    sm: { 
      container: 'px-4 py-2', 
      text: 'text-xl',
      minWidth: 'min-w-[120px]'
    },
    md: { 
      container: 'px-6 py-3', 
      text: 'text-3xl',
      minWidth: 'min-w-[180px]'
    },
    lg: { 
      container: 'px-8 py-4', 
      text: 'text-5xl',
      minWidth: 'min-w-[240px]'
    },
    xl: { 
      container: 'px-12 py-6', 
      text: 'text-8xl',
      minWidth: 'min-w-[360px]'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center justify-center">
      {showTitle && (
        <div className={`${classes.container} ${classes.minWidth} bg-gray-900 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform`}>
          <h1 className={`${classes.text} font-bold tracking-tight`}>
            <span className="text-gray-100">No</span>
            <span className="text-red-500">Fluff</span>
          </h1>
        </div>
      )}
    </div>
  );
};