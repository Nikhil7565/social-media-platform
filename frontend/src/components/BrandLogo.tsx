import React from 'react';
import { User, MessageCircle, Heart, Mail, Play, Video, Star } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', layout = 'vertical', className = '' }) => {
  const baseSize = size === 'sm' ? 80 : size === 'md' ? 160 : 240;
  const iconSize = size === 'sm' ? 10 : size === 'md' ? 18 : 28;
  const centralIconSize = size === 'sm' ? 20 : size === 'md' ? 40 : 64;

  const orbitals = [
    { id: 'chat', Icon: MessageCircle, color: '#4ADE80', x: 80, y: 20 },
    { id: 'video', Icon: Video, color: '#60A5FA', x: 25, y: 55 },
    { id: 'heart', Icon: Heart, color: '#F87171', x: 135, y: 70 },
    { id: 'play', Icon: Play, color: '#A78BFA', x: 45, y: 125 },
    { id: 'mail', Icon: Mail, color: '#FB923C', x: 115, y: 125 },
  ];

  const stars = [
    { x: 15, y: 25, color: '#F87171', delay: '0s' },
    { x: 145, y: 35, color: '#60A5FA', delay: '0.4s' },
    { x: 10, y: 95, color: '#FACC15', delay: '0.8s' },
    { x: 140, y: 110, color: '#4ADE80', delay: '1.2s' },
    { x: 80, y: 145, color: '#A78BFA', delay: '0.2s' },
  ];

  return (
    <div className={`flex ${layout === 'horizontal' ? 'flex-row items-center gap-4' : 'flex-col items-center'} ${className}`}>
      <div 
        className="relative transition-transform duration-500 group-hover:scale-105 shrink-0" 
        style={{ width: baseSize, height: baseSize }}
      >
        <svg viewBox="0 0 160 160" className="w-full h-full overflow-visible">
          {/* Connection Lines */}
          <g stroke="white" strokeWidth="1.5" strokeOpacity="0.2">
            {orbitals.map((orb) => (
              <line key={orb.id} x1="80" y1="80" x2={orb.x} y2={orb.y} />
            ))}
            <line x1="25" y1="55" x2="80" y2="20" />
            <line x1="135" y1="70" x2="115" y2="125" />
            <line x1="45" y1="125" x2="25" y2="55" />
          </g>

          {/* Central Orbit Ring */}
          <circle 
            cx="80" cy="80" r="35" 
            fill="none" 
            stroke="#FACC15" 
            strokeWidth="4" 
            className="drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
          />

          {/* Central Icon Background */}
          <circle cx="80" cy="80" r="30" fill="#FACC15" />
        </svg>

        {/* Central Person Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black">
          <User size={centralIconSize} fill="currentColor" />
        </div>

        {/* Orbitals */}
        {orbitals.map((orb) => {
          const ratio = baseSize / 160;
          return (
            <div 
              key={orb.id}
              className="absolute rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg transition-all duration-700 hover:scale-110"
              style={{ 
                left: `${orb.x * ratio}px`, 
                top: `${orb.y * ratio}px`, 
                width: iconSize * 2, 
                height: iconSize * 2,
                backgroundColor: orb.color,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 15px ${orb.color}66`
              }}
            >
              <orb.Icon size={iconSize} className="text-white drop-shadow-md" />
            </div>
          );
        })}

        {/* Animated Stars */}
        {stars.map((star, i) => {
          const ratio = baseSize / 160;
          return (
            <Star 
              key={i}
              size={size === 'sm' ? 8 : 14}
              className="absolute animate-pulse"
              style={{ 
                left: `${star.x * ratio}px`, 
                top: `${star.y * ratio}px`, 
                color: star.color,
                fill: star.color,
                boxShadow: `0 0 10px ${star.color}`,
                animationDelay: star.delay,
                opacity: 0.8
              }}
            />
          );
        })}
      </div>

      <div className={`${layout === 'vertical' ? 'text-center mt-2' : 'text-left'} group`}>
        <h1 className={`text-white font-black italic tracking-[0.15em] ${size === 'sm' ? 'text-xl' : 'text-2xl'} mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all group-hover:tracking-[0.25em]`}>
          KINETIC
        </h1>
        <div className={`flex items-center ${layout === 'vertical' ? 'justify-center' : 'justify-start'} gap-2`}>
          <div className="h-[1px] w-4 bg-yellow-400/50"></div>
          <p className="text-yellow-400 font-bold text-[10px] tracking-[0.3em] uppercase">
            Social Media
          </p>
          <div className="h-[1px] w-4 bg-yellow-400/50"></div>
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
