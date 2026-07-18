import React, { useRef } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  [key: string]: any;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(124, 92, 255, 0.06)',
  onClick,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`card-spotlight ${className}`}
      {...props}
    >
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default SpotlightCard;
