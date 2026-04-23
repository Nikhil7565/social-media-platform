import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker, { Theme, Categories } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerElement: HTMLElement | null;
}

const PremiumEmojiPicker = ({ onEmojiSelect, isOpen, onClose, triggerElement }: PremiumEmojiPickerProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && triggerElement && triggerElement instanceof HTMLElement) {
      try {
        const rect = triggerElement.getBoundingClientRect();
        const pickerWidth = 320;
        const pickerHeight = 450; // Approximated
        
        // Calculate horizontal position
        let left = rect.left;
        if (left + pickerWidth > window.innerWidth) {
          left = window.innerWidth - pickerWidth - 20;
        }
        if (left < 20) left = 20;

        // Calculate vertical position (try top first, then bottom)
        let top = rect.top - pickerHeight - 10;
        if (top < 10) {
          top = rect.bottom + 10;
        }

        setCoords({ top, left });
      } catch (e) {
        console.warn('Failed to calculate emoji picker coordinates:', e);
      }
    }
  }, [isOpen, triggerElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node) && 
          triggerElement && !triggerElement.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', onClose, { passive: true });
      window.addEventListener('resize', onClose);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', onClose);
      window.removeEventListener('resize', onClose);
    };
  }, [isOpen, onClose, triggerElement]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{ 
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999
          }}
          className="shadow-[0_0_50px_rgba(124,58,237,0.3)] rounded-2xl overflow-hidden border border-primary/30 backdrop-blur-2xl bg-black/80 w-[320px]"
        >
          <div className="p-2 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-white/5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">Bio-Emitter [PORTAL MODE]</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-75" />
              </div>
            </div>
          </div>
          
          <div className="custom-emoji-picker">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              lazyLoadEmojis={true}
              searchPlaceHolder="Search symbols..."
              width={320}
              height={400}
              categories={[
                { category: Categories.SUGGESTED, name: 'Recently Used' },
                { category: Categories.SMILEYS_PEOPLE, name: 'Beings' },
                { category: Categories.ANIMALS_NATURE, name: 'Sector Fauna' },
                { category: Categories.FOOD_DRINK, name: 'Fuel' },
                { category: Categories.TRAVEL_PLACES, name: 'Worlds' },
                { category: Categories.ACTIVITIES, name: 'Missions' },
                { category: Categories.OBJECTS, name: 'Tech' },
                { category: Categories.SYMBOLS, name: 'Codes' },
                { category: Categories.FLAGS, name: 'Alliances' },
              ]}
            />
          </div>

          <style>{`
            .custom-emoji-picker .epr-main {
              background-color: transparent !important;
              border: none !important;
              border-radius: 0 !important;
            }
            .custom-emoji-picker .epr-category-nav {
              padding: 10px !important;
              background: rgba(255, 255, 255, 0.03) !important;
            }
            .custom-emoji-picker .epr-search-container input {
              background: rgba(255, 255, 255, 0.05) !important;
              border: 1px solid rgba(124, 58, 237, 0.2) !important;
              border-radius: 12px !important;
              color: white !important;
            }
            .custom-emoji-picker .epr-emoji-category-label {
              background: rgba(0, 0, 0, 0.6) !important;
              backdrop-filter: blur(10px) !important;
              font-size: 10px !important;
              text-transform: uppercase !important;
              letter-spacing: 1px !important;
              font-weight: 800 !important;
              color: #a78bfa !important;
            }
            .custom-emoji-picker .epr-body::-webkit-scrollbar {
              width: 4px;
            }
            .custom-emoji-picker .epr-body::-webkit-scrollbar-thumb {
              background: rgba(124, 58, 237, 0.3);
              border-radius: 10px;
            }
            .custom-emoji-picker .epr-emoji:hover {
              background: rgba(124, 58, 237, 0.2) !important;
              transform: scale(1.2) !important;
              transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
              border-radius: 8px !important;
            }
            .custom-emoji-picker .epr-preview {
              display: none !important;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PremiumEmojiPicker;
