import React from 'react';

interface ScrollArrowProps {
  direction: 'left' | 'right';
  onClick: () => void;
  visible: boolean;
}

const ScrollArrow: React.FC<ScrollArrowProps> = React.memo(({ direction, onClick, visible }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-ot-athens-gray transition-colors ${
        direction === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <svg
        className="w-5 h-5 text-ot-charade"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {direction === 'left' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
});

ScrollArrow.displayName = 'ScrollArrow';

export default ScrollArrow;
