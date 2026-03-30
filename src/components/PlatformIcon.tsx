import React from 'react';
import { Linkedin, Twitter, Youtube, Instagram, Github } from 'lucide-react';

interface PlatformIconProps {
  platform: string;
  size?: number;
  className?: string;
  color?: boolean; // Whether to use brand colors
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  platform, 
  size = 20, 
  className = "", 
  color = true 
}) => {
  const p = platform.toLowerCase();
  
  const getIcon = () => {
    switch (p) {
      case 'linkedin':
        return <Linkedin size={size} className={color ? "text-blue-600" : ""} />;
      case 'twitter':
      case 'x':
        return <Twitter size={size} className={color ? "text-sky-500" : ""} />;
      case 'youtube':
      case 'youtube-shorts':
        return <Youtube size={size} className={color ? (p === 'youtube' ? "text-red-600" : "text-red-500") : ""} />;
      case 'instagram':
        return <Instagram size={size} className={color ? "text-pink-600" : ""} />;
      case 'github':
        return <Github size={size} className={color ? "text-slate-900" : ""} />;
      default:
        return <Share2 size={size} className="text-slate-400" />;
    }
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {getIcon()}
    </div>
  );
};

import { Share2 } from 'lucide-react';
