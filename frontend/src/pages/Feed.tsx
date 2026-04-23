import { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, Share2, Globe, Plus, Image, Film, Newspaper, AlignLeft, X, Send, Trash2, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { showXPToast } from '../components/XPToast';
import PremiumEmojiPicker from '../components/PremiumEmojiPicker';

const themes = [
  'bg-gradient-to-br from-violet-900 via-indigo-900 to-black',
  'bg-gradient-to-br from-cyan-900 via-blue-900 to-black',
  'bg-gradient-to-br from-rose-900 via-pink-900 to-black',
  'bg-gradient-to-br from-emerald-900 via-teal-900 to-black',
  'bg-gradient-to-br from-amber-900 via-orange-900 to-black',
  'bg-gradient-to-br from-indigo-900 via-purple-900 to-black',
];

const POST_TYPES = [
  { id: 'text', label: 'Status', icon: AlignLeft, color: 'from-violet-500 to-purple-700' },
  { id: 'image', label: 'Image', icon: Image, color: 'from-cyan-500 to-blue-700' },
  { id: 'reel', label: 'Reel', icon: Film, color: 'from-rose-500 to-pink-700' },
  { id: 'news', label: 'News', icon: Newspaper, color: 'from-amber-500 to-orange-700' },
];

const XP_MAP: Record<string, number> = { POST: 10, COMMENT: 5, SHARE: 2 };

const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: 'Posts', value: '...', color: 'text-violet-400' },
    { label: 'My XP', value: '...', color: 'text-accent' },
    { label: 'Streaks', value: '...', color: 'text-amber-500' },
    { label: 'Alerts', value: '...', color: 'text-pink-500' },
  ]);
  const [isPosting, setIsPosting] = useState(false);
  const [postType, setPostType] = useState('text');
  const [postCaption, setPostCaption] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postVideoUrl, setPostVideoUrl] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [storyUsers, setStoryUsers] = useState<any[]>([]);
  const [postIdConfirming, setPostIdConfirming] = useState<number | null>(null);
  const [feedType, setFeedType] = useState<'main' | 'trending'>('main');
  const [postComments, setPostComments] = useState<Record<number, any[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTrigger, setEmojiTrigger] = useState<HTMLElement | null>(null);


  const getAuthHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    if (feedType === 'main') fetchPosts();
    else fetchTrending();
    fetchStats();
    fetchStoryUsers();
  }, [feedType]);


  const fetchStoryUsers = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) setStoryUsers((await res.json()).slice(0, 8));
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/auth/stats', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setStats([
          { label: 'Posts', value: data.posts.toString(), color: 'text-violet-400' },
          { label: 'My XP', value: data.xp.toLocaleString(), color: 'text-accent' },
          { label: 'Streaks', value: data.streaks.toString(), color: 'text-amber-500' },
          { label: 'Alerts', value: data.alerts.toString(), color: 'text-pink-500' },
        ]);
      }
    } catch {}
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/feed', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch {
      console.error('Failed to fetch posts');
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await fetch('/api/feed/trending', { headers: getAuthHeader() });
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch {
      console.error('Failed to fetch trending');
    }
  };


  const handleLike = async (postId: number, currentLiked: boolean) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: 'POST', headers: getAuthHeader() });
      if (res.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, hasLiked: !currentLiked, likes: currentLiked ? p.likes - 1 : p.likes + 1 } : p));
        if (!currentLiked) showXPToast(1, 'Like sent!');
      }
    } catch {}
  };

  const fetchComments = async (postId: number) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setPostComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId: number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      if (!postComments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        // Update post count
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
        // Add to list if already loaded
        if (postComments[postId]) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const augmentedComment = {
            ...newComment,
            user: {
              id: user.id,
              username: user.username,
              avatarUrl: user.avatarUrl,
              xp: user.xp || 0
            }
          };
          setPostComments(prev => ({
            ...prev,
            [postId]: [augmentedComment, ...(prev[postId] || [])]
          }));
        }
        setCommentText('');
        showXPToast(XP_MAP.COMMENT, 'Comment posted!');
        fetchStats();
      }
    } catch {}
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim() && !postImageUrl && !postVideoUrl) return;
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          caption: postCaption,
          postType,
          imageUrl: postImageUrl || undefined,
          videoUrl: postVideoUrl || undefined,
          themeName: themes[Math.floor(Math.random() * themes.length)]
        })
      });
      if (res.ok) {
        setPostCaption('');
        setPostImageUrl('');
        setPostVideoUrl('');
        setIsPosting(false);
        setPostType('text');
        showXPToast(XP_MAP.POST, 'Post published!');
        fetchPosts();
        fetchStats();
      }
    } catch {}
  };

  const handleShare = async (post: any) => {
    try {
      const res = await fetch(`/api/feed/${post.id}/share`, { method: 'POST', headers: getAuthHeader() });
      if (res.ok) {
        showXPToast(XP_MAP.SHARE, 'Shared!');
        fetchStats();
        
        const shareUrl = `${window.location.origin}/profile/${post.user.id}`;
        if (navigator.share) {
          await navigator.share({
            title: `Kinetic - ${post.user.username}'s post`,
            text: post.caption,
            url: shareUrl,
          }).catch(() => {});
        } else {
          await navigator.clipboard.writeText(shareUrl);
        }
      }
    } catch {}
  };

  const handleDeletePost = async (postId: number) => {
    try {
      const res = await fetch(`/api/feed/${postId}`, { method: 'DELETE', headers: getAuthHeader() });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        showXPToast(0, 'Post deleted');
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch {
      alert('Network error while deleting post');
    } finally {
      setPostIdConfirming(null);
    }
  };

  // Render media based on post type
  const renderMedia = (post: any) => {
    const isDirectVideo = post.videoUrl && (post.videoUrl.endsWith('.mp4') || post.videoUrl.endsWith('.webm') || post.videoUrl.includes('vjs.zencdn.net'));
    
    if (post.postType === 'reel' && post.videoUrl) {
      if (isDirectVideo) {
        return (
          <div className="rounded-lg overflow-hidden mb-4 border border-white/10 video-glow relative group">
            <video 
              src={post.videoUrl} 
              className="w-full hd-quality shadow-2xl" 
              controls 
              playsInline 
              muted 
              loop
            />
            {post.impactScore > 50 && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-accent/40 rounded-md px-2 py-1 text-[10px] font-black tracking-tighter text-accent animate-pulse">
                4K ULTRA HD
              </div>
            )}
          </div>
        );
      }
      // Handle YouTube URLs
      let videoSrc = post.videoUrl;
      const ytMatch = post.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
      if (ytMatch) videoSrc = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`;
      return (
        <div className="rounded-lg overflow-hidden mb-4 border border-white/10 aspect-video relative">
          <iframe src={videoSrc} className="w-full h-full" allowFullScreen title="Reel" />
        </div>
      );
    }
    if (post.imageUrl) {
      return (
        <div className="rounded-lg overflow-hidden mb-4 border border-white/5 relative group">
          <img src={post.imageUrl} alt="Post media" className="w-full hd-quality object-contain bg-black/20" />
          {post.impactScore > 50 && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 rounded-md px-2 py-1 text-[10px] font-black tracking-tighter text-white/90">
              UHD 4K RESOLUTION
            </div>
          )}
        </div>
      );
    }
    return null;
  };


  // Post type badge
  const renderTypeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      image: { label: '📷 Image', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      reel: { label: '🎬 Reel', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
      news: { label: '📰 News', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    };
    const info = map[type];
    if (!info) return null;
    return <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${info.cls}`}>{info.label}</span>;
  };

  // News post style card
  const renderNewsCard = (post: any, _themeClass: string, level: number) => (
    <motion.div 
      key={post.id} 
      whileHover={{ scale: 1.01 }}
      className="glass-card animated-glass border border-amber-500/30 bg-amber-950/20 overflow-hidden cosmic-card glow-amber"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold text-xs tracking-widest uppercase">Breaking News</span>
        </div>
        {Number(post.user?.id) === Number(JSON.parse(localStorage.getItem('user') || '{}').id) && (
          <div className="flex items-center gap-2">
            {postIdConfirming === post.id ? (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                <button 
                  onClick={() => setPostIdConfirming(null)} 
                  className="text-[10px] font-bold text-amber-500/50 hover:text-amber-400 uppercase tracking-wider px-2 py-1 rounded-md hover:bg-white/5"
                >
                  No
                </button>
                <button 
                  onClick={() => handleDeletePost(post.id)} 
                  className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setPostIdConfirming(post.id)} 
                className="text-amber-500/50 hover:text-red-400 transition-colors p-1"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-lg font-bold text-white leading-snug mb-3">{post.caption}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <Link to={`/profile/${post.user?.id}`} className="relative group">
            <img src={post.user?.avatarUrl || `https://ui-avatars.com/api/?name=${post.user?.username}&background=random`} className="w-7 h-7 rounded-full border border-white/20 transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-bold px-1 rounded-full border border-black shadow-[0_0_5px_rgba(245,158,11,0.5)]">L{level}</div>
          </Link>
          <span className="text-gray-400 text-sm">{post.user?.username}</span>
          <div className="ml-auto flex items-center gap-4">
            <button onClick={() => handleLike(post.id, post.hasLiked)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.hasLiked ? 'text-rose-400' : 'text-gray-400 hover:text-rose-400'}`}>
              <Heart className="w-4 h-4" fill={post.hasLiked ? 'currentColor' : 'none'} />{post.likes}
            </button>
            <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
              <MessageCircle className="w-4 h-4" />{post.comments}
            </button>
            <button onClick={() => handleShare(post)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {activeCommentPostId === post.id && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Comment List */}
            <div className="max-h-60 overflow-y-auto space-y-3 px-1 custom-scrollbar">
              {loadingComments[post.id] ? (
                <div className="text-center py-4">
                  <div className="inline-block w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : postComments[post.id]?.length === 0 ? (
                <p className="text-center text-xs text-amber-500/50 py-2 italic font-medium tracking-tight">No transmissions yet. Be the first!</p>
              ) : postComments[post.id]?.map((comment: any) => {
                const cLevel = Math.floor(Math.sqrt((comment.user?.xp || 0) / 50));
                return (
                  <div key={comment.id} className="flex gap-2 items-start group/comment">
                    <img src={comment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${comment.user?.username}&background=random`} className="w-6 h-6 rounded-full border border-amber-500/20" />
                    <div className="flex-1 bg-amber-950/30 border border-amber-500/10 rounded-xl px-3 py-2">
                       <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[11px] font-black text-amber-400 uppercase tracking-tighter">{comment.user?.username}</span>
                         <span className="text-[8px] bg-amber-500 text-black px-1 font-bold rounded">L{cLevel}</span>
                         <span className="text-[9px] text-amber-500/40 ml-auto">{new Date(comment.createdAt).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs text-white/90 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-amber-500/10 items-center">
              <div className="relative">
                <button 
                  type="button" 
                  onClick={(e) => {
                    setEmojiTrigger(e.currentTarget);
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className={`${showEmojiPicker ? 'text-amber-400' : 'text-amber-500/40'} hover:text-amber-400 transition-colors p-1`}
                >
                  <Smile className="w-4 h-4" />
                </button>
                <PremiumEmojiPicker 
                  isOpen={showEmojiPicker} 
                  onClose={() => setShowEmojiPicker(false)}
                  triggerElement={emojiTrigger}
                  onEmojiSelect={(emoji) => {
                    setCommentText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
              <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)} placeholder="Transmit report..." className="flex-1 bg-black/50 border border-amber-500/20 rounded-lg px-4 py-2 text-xs text-white placeholder:text-amber-500/30 focus:border-amber-400 outline-none" />
              <button onClick={() => handleCommentSubmit(post.id)} disabled={!commentText.trim()} className="text-amber-400 hover:text-white font-black text-xs px-3 disabled:opacity-30 transition-all uppercase tracking-widest">Send</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-8 px-4 h-full overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-3 active:scale-95 transition-transform group">
            <span className="glow-text glitch-text">Kinetic Feed</span> <Sparkles className="text-accent w-6 h-6 animate-pulse star-accent group-hover:rotate-12 transition-transform" />
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setFeedType('main')}
              className={`text-xs font-black uppercase tracking-widest transition-all ${feedType === 'main' ? 'text-accent border-b-2 border-accent pb-1' : 'text-gray-500 hover:text-white'}`}
            >
              Main Sector
            </button>
            <button 
              onClick={() => setFeedType('trending')}
              className={`text-xs font-black uppercase tracking-widest transition-all ${feedType === 'trending' ? 'text-amber-500 border-b-2 border-amber-500 pb-1' : 'text-gray-500 hover:text-white'}`}
            >
              🔥 Breaking News
            </button>
          </div>
        </div>
        <button onClick={() => setIsPosting(!isPosting)} className="btn-primary rounded-full px-6 py-2 shadow-lg hover:shadow-cyan-500/30 flex items-center gap-2 glow-primary hover:scale-105 active:scale-95 transition-all">
          {isPosting ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isPosting ? 'Cancel' : 'Post'}
        </button>
      </div>


      {/* Enhanced Post Creation Modal */}
      <AnimatePresence>
        {isPosting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            className="glass-card animated-glass p-5 mb-8 border border-primary/40 shadow-[0_0_30px_rgba(124,58,237,0.15)]"
          >
          {/* Post Type Tabs */}
          <div className="flex gap-2 mb-4">
            {POST_TYPES.map(t => {
              const Icon = t.icon;
              const active = postType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setPostType(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? `bg-gradient-to-r ${t.color} text-white shadow-lg` : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
            <textarea
              value={postCaption}
              onChange={e => setPostCaption(e.target.value)}
              placeholder={
                postType === 'news' ? 'Write your news headline or story...' :
                postType === 'reel' ? 'Describe your reel...' :
                postType === 'image' ? 'Caption for your image...' :
                'Share an update, traveler...'
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent resize-none h-24"
              autoFocus
            />
            {(postType === 'image' || postType === 'news') && (
              <input
                type="url"
                value={postImageUrl}
                onChange={e => setPostImageUrl(e.target.value)}
                placeholder="Image URL (optional) — paste any image link"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            )}
            {postType === 'reel' && (
              <input
                type="url"
                value={postVideoUrl}
                onChange={e => setPostVideoUrl(e.target.value)}
                placeholder="Video URL — YouTube, Vimeo, or direct .mp4 link"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-rose-500"
              />
            )}
            {/* Preview */}
            {postImageUrl && (
              <div className="rounded-lg overflow-hidden border border-white/10 max-h-48">
                <img src={postImageUrl} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                ⚡ <span className="text-accent font-semibold">+{XP_MAP.POST} XP</span> for posting
              </span>
              <button type="submit" className="btn-primary px-6 py-2 rounded-full font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 flex items-center gap-2">
                <Send className="w-4 h-4" /> Transmit
              </button>
            </div>
          </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 gap-4 mb-8 float-ui">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card animated-glass p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
            <span className="text-gray-400 text-sm mb-1">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPosting(true)} 
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center mb-2 hover:border-primary transition-colors bg-black/20">
            <Plus className="text-primary w-6 h-6" />
          </div>
          <span className="text-xs text-gray-400">Your story</span>
        </motion.button>
        {storyUsers.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
          >
            <Link to={`/profile/${user.id}`} className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-primary mb-2 transition-transform">
                <div className="w-full h-full rounded-full bg-background border-2 border-background overflow-hidden p-1">
                  <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt={user.username} className="w-full h-full rounded-full" />
                </div>
              </div>
              <span className="text-xs text-gray-300">{user.username}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20 px-6 glass-card border-dashed border-white/20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="text-accent w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No activity in this sector yet</h2>
            <p className="text-gray-400 max-w-xs mx-auto">Be the first to leave your mark on the galaxy by creating a post!</p>
          </div>
        ) : posts.map((post) => {
          const themeClass = themes[post.id % themes.length];
          const level = Math.floor(Math.sqrt((post.user?.xp || 0) / 50));

          if (post.postType === 'news') return renderNewsCard(post, themeClass, level);

          return (
            <motion.div 
              key={post.id} 
              whileHover={{ scale: 1.01 }}
              className={`rounded-xl border overflow-hidden relative ${themeClass} shadow-xl cosmic-card nebula-border transition-all duration-500 animated-glass`}
            >
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

              <div className="p-4 relative z-10 backdrop-blur-sm bg-black/40">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Link to={`/profile/${post.user?.id}`} className="relative group">
                    <img src={post.user?.avatarUrl || `https://ui-avatars.com/api/?name=${post.user?.username}&background=random`} className="w-10 h-10 rounded-full border-2 border-accent transition-transform group-hover:scale-110" />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black shadow-[0_0_5px_rgba(56,189,248,0.8)]">L{level}</div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${post.user?.id}`} className="font-bold text-white hover:text-accent transition-colors">{post.user?.username}</Link>
                      {renderTypeBadge(post.postType)}
                    </div>
                    <div className="flex items-center text-xs text-gray-400 gap-1">
                      <Globe className="w-3 h-3" /> <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {Number(post.user?.id) === Number(JSON.parse(localStorage.getItem('user') || '{}').id) && (
                    <div className="flex items-center gap-2">
                      {postIdConfirming === post.id ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                          <button 
                            onClick={() => setPostIdConfirming(null)} 
                            className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded-md hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)} 
                            className="bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setPostIdConfirming(post.id)} 
                          className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-full hover:bg-red-400/10 group/trash"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4 transition-transform group-hover/trash:scale-110" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {post.caption && <p className="text-white/80 text-sm mb-4">{post.caption}</p>}
                {renderMedia(post)}

                <hr className="border-white/10 my-3" />

                {/* Actions */}
                <div className="flex items-center gap-6">
                  <button onClick={() => handleLike(post.id, post.hasLiked)} className={`flex items-center gap-2 transition-colors ${post.hasLiked ? 'text-pinklike drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-gray-400 hover:text-pinklike'}`}>
                    <Heart className="w-5 h-5" fill={post.hasLiked ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                  <button onClick={() => handleShare(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors ml-auto border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                {activeCommentPostId === post.id && (
                  <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/5 pt-4">
                    {/* Comment List */}
                    <div className="max-h-64 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                      {loadingComments[post.id] ? (
                        <div className="text-center py-6">
                           <div className="inline-block w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        </div>
                      ) : postComments[post.id]?.length === 0 ? (
                        <div className="text-center py-4 bg-black/20 rounded-lg border border-dashed border-white/5">
                          <p className="text-xs text-gray-500 italic">No activity yet in this channel.</p>
                        </div>
                      ) : postComments[post.id]?.map((comment: any) => {
                        const cLevel = Math.floor(Math.sqrt((comment.user?.xp || 0) / 50));
                        return (
                          <div key={comment.id} className="flex gap-3 group/comment items-start">
                            <img src={comment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${comment.user?.username}&background=random`} className="w-8 h-8 rounded-full border border-accent/20 transition-transform group-hover/comment:scale-110" />
                            <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 hover:bg-white/10 transition-colors">
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-sm font-bold text-white/90">{comment.user?.username}</span>
                                 <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 font-black rounded border border-accent/30">L{cLevel}</span>
                                 <span className="text-[10px] text-gray-500 ml-auto">{new Date(comment.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                     <div className="flex gap-3 pt-2 items-center">
                        <div className="relative flex-1 flex items-center gap-2">
                           <div className="relative">
                             <button 
                               type="button" 
                               onClick={(e) => {
                                 setEmojiTrigger(e.currentTarget);
                                 setShowEmojiPicker(!showEmojiPicker);
                               }}
                               className={`${showEmojiPicker ? 'text-accent' : 'text-gray-500'} hover:text-accent transition-colors p-1`}
                             >
                               <Smile className="w-5 h-5" />
                             </button>
                             <PremiumEmojiPicker 
                               isOpen={showEmojiPicker} 
                               onClose={() => setShowEmojiPicker(false)}
                               triggerElement={emojiTrigger}
                               onEmojiSelect={(emoji) => {
                                 setCommentText(prev => prev + emoji);
                                 setShowEmojiPicker(false);
                               }}
                             />
                           </div>
                           <input
                             type="text"
                             value={commentText}
                             onChange={e => setCommentText(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                             placeholder="Type your message..."
                             className="w-full bg-black/40 border border-white/10 rounded-full px-5 py-2.5 text-sm text-white focus:border-accent outline-none ring-1 ring-white/5 focus:ring-accent/20 transition-all shadow-inner"
                           />
                           <div className="absolute right-2 top-1/2 -translate-y-1/2">
                             <button
                               onClick={() => handleCommentSubmit(post.id)}
                               disabled={!commentText.trim()}
                               className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-[0_0_20px_rgba(56,189,248,0.5)] glow-accent"
                             >
                               <Send className="w-4 h-4" />
                             </button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
export default Feed;
