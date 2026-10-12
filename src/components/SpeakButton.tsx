import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech.ts';

interface SpeakButtonProps {
  text: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inline?: boolean;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  title = 'Phát âm tiếng Anh chuẩn',
  size = 'md',
  className = '',
  inline = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    speakEnglish(text, () => {
      setIsPlaying(false);
    });
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonPaddings = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`group rounded-lg transition-all cursor-pointer flex items-center justify-center focus:outline-none ${
        inline ? 'inline-flex align-middle ml-1.5' : ''
      } ${
        isPlaying
          ? 'text-amber-400 bg-amber-500/20 ring-1 ring-amber-500/40 animate-pulse'
          : 'text-stone-400 hover:text-amber-300 hover:bg-stone-800/80 active:scale-95'
      } ${buttonPaddings[size]} ${className}`}
      title={isPlaying ? 'Đang phát âm...' : title}
      aria-label={title}
    >
      <Volume2
        className={`${iconSizes[size]} transition-transform group-hover:scale-110 ${
          isPlaying ? 'stroke-[2.5]' : ''
        }`}
      />
    </button>
  );
};
