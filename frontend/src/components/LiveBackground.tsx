import React from 'react';

const LiveBackground: React.FC = () => {
  const particles = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Base Image with Ken Burns effect */}
      <div 
        className="live-bg-layer"
        style={{ backgroundImage: "url('/nova-bg.jpg')" }}
      />
      
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-[#0a071e]/70" />

      {/* Holographic GIF Overlay */}
      <div 
        className="absolute inset-0 hologram-effect"
        style={{ 
          backgroundImage: "url('https://cdn.svgator.com/images/2025/10/ar-vr-motion-graphics.gif')",
          backgroundSize: '800px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Another layer of the same GIF, smaller and offset for complexity */}
      <div 
        className="absolute inset-0 hologram-effect"
        style={{ 
          backgroundImage: "url('https://cdn.svgator.com/images/2025/10/ar-vr-motion-graphics.gif')",
          backgroundSize: '400px',
          backgroundPosition: 'bottom right',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          transform: 'scale(0.8) rotate(15deg)',
        }}
      />

      {/* Glass Particles */}
      {particles.map((_, i) => (
        <div
          key={i}
          className="glass-particle"
          style={{
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            opacity: Math.random() * 0.1,
          }}
        />
      ))}

      {/* Volumetric Depth: Foreground Particles that drift OVER the content */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`fg-${i}`}
            className="glass-particle"
            style={{
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 8 + 8}s`,
              opacity: Math.random() * 0.05, // Very subtle
              filter: 'blur(8px)', // More blur for sense of being close to the "camera"
              background: 'white',
            }}
          />
        ))}
      </div>

      {/* Global Glow pulse */}
      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
    </div>
  );
};

export default LiveBackground;
