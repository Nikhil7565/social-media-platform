import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Sparkles, Activity } from 'lucide-react';
import { useState } from 'react';

export type ReactionType = 'like' | 'pulse' | 'sparkle' | 'bolt';

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  currentType?: ReactionType;
  hasLiked: boolean;
}

const REACTIONS: { type: ReactionType; icon: any; color: string; label: string }[] = [
  { type: 'like', icon: Heart, color: 'text-rose-500', label: 'Heart' },
  { type: 'pulse', icon: Activity, color: 'text-cyan-400', label: 'Pulse' },
  { type: 'sparkle', icon: Sparkles, color: 'text-amber-400', label: 'Sparkle' },
  { type: 'bolt', icon: Zap, color: 'text-violet-400', label: 'Bolt' },
];

const ReactionPicker = ({ onSelect, currentType, hasLiked }: ReactionPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const CurrentIcon = REACTIONS.find(r => r.type === (currentType || 'like'))?.icon || Heart;
  const currentColor = hasLiked ? REACTIONS.find(r => r.type === (currentType || 'like'))?.color : 'text-gray-400 hover:text-white';

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -45, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute left-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex gap-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[60]"
          >
            {REACTIONS.map((r) => {
              const Icon = r.icon;
              return (
                <motion.button
                  key={r.type}
                  whileHover={{ scale: 1.3, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(r.type);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 ${r.color}`}
                  title={r.label}
                >
                  <Icon className="w-5 h-5" fill={currentType === r.type && hasLiked ? 'currentColor' : 'none'} />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={(e) => {
            e.stopPropagation();
            onSelect('like');
        }}
        className={`flex items-center gap-2 transition-all duration-300 ${currentColor} ${hasLiked ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}`}
      >
        <CurrentIcon className="w-5 h-5" fill={hasLiked ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
};

export default ReactionPicker;
