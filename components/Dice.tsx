'use client';

import React from 'react';

interface DiceProps {
  value: number;
  isRolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  clickable?: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling = false, size = 'md', onClick, clickable = false }) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
  };

  const dotPositions: { [key: number]: string[] } = {
    1: ['center'],
    2: ['top-left', 'bottom-right'],
    3: ['top-left', 'center', 'bottom-right'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  const positions = dotPositions[value] || [];

  return (
    <div
      onClick={clickable && !isRolling ? onClick : undefined}
      className={`
        ${sizeClasses[size]}
        bg-white border-2 border-gray-800 rounded-lg shadow-lg
        flex items-center justify-center relative
        ${isRolling ? 'animate-spin' : ''}
        transition-transform duration-300
        ${clickable && !isRolling ? 'cursor-pointer hover:scale-110 hover:shadow-xl active:scale-95' : ''}
      `}
      style={clickable && !isRolling ? { userSelect: 'none' } : {}}
    >
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => {
          const positionMap: { [key: string]: number } = {
            'top-left': 1,
            'top-center': 2,
            'top-right': 3,
            'middle-left': 4,
            'center': 5,
            'middle-right': 6,
            'bottom-left': 7,
            'bottom-center': 8,
            'bottom-right': 9,
          };
          const shouldShow = positions.some((p) => positionMap[p] === pos);
          return (
            <div key={pos} className="flex items-center justify-center">
              {shouldShow && (
                <div
                  className={`
                    ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'}
                    bg-gray-800 rounded-full
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dice;

