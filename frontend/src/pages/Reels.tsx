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
    <div className="relative h-full w-full bg-black snap-start overflow-hidden">
      {/* Video Content */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        muted
        onClick={(e) => {
          const v = e.currentTarget;
          v.paused ? v.play() : v.pause();
        }}
      />

      {/* Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1 group">
          <button 
            onClick={handleLike}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-black/40 backdrop-blur-md hover:bg-black/60 border border-white/10'}`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-white text-white' : 'text-white'}`} />
          </button>
          <span className="text-white text-[10px] font-black drop-shadow-md">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60 transition-all">
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-white text-[10px] font-black drop-shadow-md">{reel.comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/60 transition-all">
            <Share2 className="w-6 h-6 text-white" />
          </button>
          <span className="text-white text-[10px] font-black drop-shadow-md font-bold uppercase tracking-wider">Share</span>
        </div>

        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border-2 border-primary/50 overflow-hidden animate-[spin_4s_linear_infinite]">
          <Music2 className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* Bottom Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pt-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative group cursor-pointer">
            <img 
              src={reel.user.avatarUrl || `https://ui-avatars.com/api/?name=${reel.user.username}&background=random`} 
              className="w-11 h-11 rounded-full border-2 border-primary shadow-lg transition-transform group-hover:scale-105" 
              alt="avatar"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-black text-[10px] font-black">
              L{level}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-lg drop-shadow-md">{reel.user.username}</span>
              <button className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-black px-2 py-0.5 rounded border border-primary/30 transition-colors uppercase tracking-widest">
                Follow
              </button>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <div className="flex items-center gap-1 text-accent">
                <Flame className="w-3 h-3 fill-accent shadow-sm" />
                <span className="font-bold">Trending</span>
              </div>
              <span className="opacity-50">#kinetic #future #sector7</span>
            </div>
          </div>
        </div>

        <p className="text-white/90 text-[15px] max-w-[85%] leading-relaxed drop-shadow-sm mb-2">
          {reel.caption}
        </p>

        <div className="flex items-center gap-2 text-white/60 text-[13px] bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
          <Music2 className="w-3 h-3" />
          <span>Original Audio - {reel.user.username} Records</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary/30 w-full z-30">
        <motion.div 
          initial={{ width: 0 }}
          animate={isActive ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_#7c3aed]"
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

        const res = await fetch('/api/feed/reels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
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
