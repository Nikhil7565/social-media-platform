import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ModernVectorBackground: React.FC = () => {
  const rings = useMemo(() => [
    { r: "35%", duration: 60, dir: 1, dash: "0" },
    { r: "30%", duration: 40, dir: -1, dash: "5 15" },
    { r: "45%", duration: 80, dir: 1, dash: "1 10" },
  ], []);

  const lines = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x1: Math.random() * 100,
    y1: Math.random() * 100,
    x2: Math.random() * 100,
    y2: Math.random() * 100,
    duration: Math.random() * 15 + 10,
  })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#020617]" style={{ zIndex: -1 }}>
      {/* SVG Filter for Wavy Water Effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="wavyFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="3" result="noise">
            <animate attributeName="baseFrequency" dur="20s" values="0.01 0.01;0.02 0.015;0.01 0.01" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" />
        </filter>
      </svg>

      {/* Primary Background Image Layer with Wavy Filter */}
      <motion.div 
        className="absolute inset-[-10%] w-[120%] h-[120%] bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/nova-bg.jpg')",
          opacity: 0.85,
          filter: "url(#wavyFilter)"
        }}
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Ambient Depth Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#020617]/10 to-[#020617]/60" />

      {/* Neon Glow Accents (Blue, Purple, Cyan) */}
      <motion.div 
        className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px]"
        animate={{ 
          x: [-20, 20, -20],
          y: [-30, 30, -30],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[10%] right-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[150px]"
        animate={{ 
          x: [30, -30, 30],
          y: [20, -20, 20],
          opacity: [0.05, 0.1, 0.05]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute top-[40%] left-[60%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.03, 0.08, 0.03]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-30">
        {/* Rotating Tech Rings */}
        {rings.map((ring, i) => (
          <motion.circle
            key={i}
            cx="50%"
            cy="50%"
            r={ring.r}
            fill="none"
            stroke={i % 2 === 0 ? "#22d3ee" : "#a855f7"}
            strokeWidth="0.5"
            strokeDasharray={ring.dash}
            animate={{ rotate: 360 * ring.dir }}
            transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
            style={{ originX: "50%", originY: "50%", opacity: 0.2 }}
          />
        ))}

        {/* Floating Neon Lines */}
        {lines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="#22d3ee"
            strokeWidth="0.5"
            className="opacity-20"
            animate={{
              opacity: [0.05, 0.2, 0.05],
            }}
            transition={{ duration: line.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}
      />
    </div>
  );
};

export default ModernVectorBackground;
