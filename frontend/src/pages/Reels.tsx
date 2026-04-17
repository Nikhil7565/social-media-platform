import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Music2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showXPToast } from '../components/XPToast';

interface Reel {
  id: number;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  hasLiked: boolean;
  user: {
    id: number;
    username: string;
    avatarUrl: string;
    xp: number;
  };
}

const ReelItem = ({ reel, isActive }: { reel: Reel, isActive: boolean }) => {
  const [liked, setLiked] = useState(reel.hasLiked);
  const [likesCount, setLikesCount] = useState(reel.likes);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle autoplay block
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/feed/${reel.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        if (!liked) showXPToast(1, 'Liked Reel!');
      }
    } catch {}
  };

  const level = Math.floor(Math.sqrt(reel.user.xp / 50));

  return (
    <div className="relative h-full w-full bg-black snap-start overflow-hidden flex items-center justify-center">
      {/* Video Content */}
      <video
        ref={videoRef}
        className="h-full w-auto max-w-full object-contain z-0"
        loop
        playsInline
        muted
        preload="auto"
        onClick={(e) => {
          const v = e.currentTarget;
          v.paused ? v.play().catch(() => {}) : v.pause();
        }}
      >
        <source src={reel.videoUrl} type="video/mp4" />
      </video>

      {/* Side Actions (Pattern Match) */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5 z-20">
        <div className="flex flex-col items-center group">
          <button 
            onClick={handleLike}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[rgba(255,255,255,0.1)] backdrop-blur-3xl hover:bg-white/20 active:scale-90"
          >
            <Heart className={`w-7 h-7 ${liked ? 'fill-white text-white' : 'text-white'}`} />
          </button>
          <span className="text-white text-xs font-medium mt-1 drop-shadow-md">{likesCount >= 1000 ? (likesCount/1000).toFixed(1) + 'K' : likesCount}</span>
        </div>

        <div className="flex flex-col items-center group">
          <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[rgba(255,255,255,0.1)] backdrop-blur-3xl hover:bg-white/20 active:scale-90">
            <Heart className="w-7 h-7 text-white rotate-180" /> {/* Simulate Dislike with inverted heart if Lucide Dislike is missing, but Lucide has ThumbsDown */}
          </button>
          <span className="text-white text-xs font-medium mt-1 drop-shadow-md">Dislike</span>
        </div>

        <div className="flex flex-col items-center group">
          <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[rgba(255,255,255,0.1)] backdrop-blur-3xl hover:bg-white/20 active:scale-90">
            <MessageCircle className="w-7 h-7 text-white fill-transparent" />
          </button>
          <span className="text-white text-xs font-medium mt-1 drop-shadow-md">{reel.comments}</span>
        </div>

        <div className="flex flex-col items-center group">
          <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-[rgba(255,255,255,0.1)] backdrop-blur-3xl hover:bg-white/20 active:scale-90">
            <Share2 className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs font-medium mt-1 drop-shadow-md">Share</span>
        </div>

        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-gray-800 to-gray-600 border-2 border-white/20 flex items-center justify-center relative mt-4 overflow-hidden group">
          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
          <Music2 className="w-5 h-5 text-white z-10" />
        </div>
      </div>

      {/* Bottom Content Overlay (Pattern Match) */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pt-20">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={reel.user.avatarUrl || `https://ui-avatars.com/api/?name=${reel.user.username}&background=random`} 
            className="w-10 h-10 rounded-full border border-white/30" 
            alt="avatar"
          />
          <span className="text-white font-bold text-base drop-shadow-md">@{reel.user.username}</span>
          <button className="bg-white text-black text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:bg-gray-200">
            Subscribe
          </button>
        </div>

        <p className="text-white text-sm max-w-[85%] leading-snug drop-shadow-sm mb-4 line-clamp-2">
          {reel.caption}
        </p>

        <div className="flex items-center gap-2 text-white text-[12px] bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5">
          <Music2 className="w-3 h-3" />
          <span className="truncate max-w-[150px]">Original sound - {reel.user.username}</span>
        </div>
      </div>
      
      {/* Progress Bar (Thin Red Line Pattern) */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-white/20 w-full z-40">
        <motion.div 
          initial={{ width: 0 }}
          animate={isActive ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"
        />
      </div>
    </div>
  );
};

const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Login required to access Reels');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/kinetic-reels');
        
        if (res.ok) {
          const data = await res.json();
          setReels(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || `System Error (${res.status})`);
        }
      } catch (e) {
        setError('Connection to Reels Sector lost');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReels();
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  return (
    <div className="fixed inset-0 top-[70px] bg-black z-0 flex justify-center">
      {/* Mobile-style frame */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[450px] h-full bg-black overflow-y-scroll snap-y snap-mandatory custom-scrollbar-none relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence initial={false}>
          {isLoading ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-primary animate-spin" />
              <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Accessing Reels Sector...</p>
            </div>
          ) : error ? (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <Flame className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Sector Blocked</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all"
              >
                Re-Authorize
              </button>
            </div>
          ) : reels.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-8 text-center gap-4">
              <p className="font-bold tracking-widest uppercase text-xs">No reels found in this sector.</p>
            </div>
          ) : (
            reels.map((reel, index) => (
              <ReelItem key={reel.id} reel={reel} isActive={index === activeIndex} />
            ))
          )}
        </AnimatePresence>

        {/* Global UI Overlays */}
        <div className="absolute top-6 left-6 z-30 pointer-events-none">
          <h2 className="text-white text-xl font-black italic tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
            REELS <span className="text-primary">LIVE</span>
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Reels;
