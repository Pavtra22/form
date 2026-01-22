import React from 'react';

interface ResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export const Resizer = ({ onMouseDown, className = "" }: ResizerProps) => (
  <div
    className={`w-1 hover:w-1.5 bg-gray-200 hover:bg-blue-500 cursor-col-resize transition-colors z-40 flex-shrink-0 relative group ${className}`}
    onMouseDown={onMouseDown}
  >
     {/* Invisible wider hit area for easier grabbing */}
     <div className="absolute inset-y-0 -left-2 -right-2 bg-transparent z-10" />
     
     {/* Visual Indicator */}
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-300 rounded-full group-hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
  </div>
);