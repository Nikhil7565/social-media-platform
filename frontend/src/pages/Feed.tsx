import { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, Share2, Globe, Plus, Image, Film, Newspaper, AlignLeft, X, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showXPToast } from '../components/XPToast';

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

  const getAuthHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    fetchPosts();
    fetchStats();
    fetchStoryUsers();
  }, []);

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

  const handleLike = async (postId: number, currentLiked: boolean) => {
    try {
      const res = await fetch(`/api/feed/${postId}/like`, { method: 'POST', headers: getAuthHeader() });
      if (res.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, hasLiked: !currentLiked, likes: currentLiked ? p.likes - 1 : p.likes + 1 } : p));
        if (!currentLiked) showXPToast(1, 'Like sent!');
      }
    } catch {}
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
        setPosts(posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
        setCommentText('');
        setActiveCommentPostId(null);
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
    if (post.postType === 'reel' && post.videoUrl) {
      // Handle YouTube URLs
      let videoSrc = post.videoUrl;
      const ytMatch = post.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
      if (ytMatch) videoSrc = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`;
      return (
        <div className="rounded-lg overflow-hidden mb-4 border border-white/10 aspect-video">
          <iframe src={videoSrc} className="w-full h-full" allowFullScreen title="Reel" />
        </div>
      );
    }
    if (post.imageUrl) {
      return (
        <div className="rounded-lg overflow-hidden mb-4 border border-white/5">
          <img src={post.imageUrl} alt="Post media" className="w-full max-h-96 object-cover" />
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
    <div key={post.id} className="glass-card border border-amber-500/30 bg-amber-950/20 overflow-hidden">
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
            <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
              <MessageCircle className="w-4 h-4" />{post.comments}
            </button>
            <button onClick={() => handleShare(post)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {activeCommentPostId === post.id && (
          <div className="mt-3 flex gap-2">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Comment..." className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-accent outline-none" />
            <button onClick={() => handleCommentSubmit(post.id)} disabled={!commentText.trim()} className="text-accent font-bold text-sm px-3 disabled:opacity-50">Post</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Kinetic Feed <Sparkles className="text-accent w-6 h-6 animate-pulse" />
        </h1>
        <button onClick={() => setIsPosting(!isPosting)} className="btn-primary rounded-full px-6 py-2 shadow-lg hover:shadow-cyan-500/30 flex items-center gap-2">
          {isPosting ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isPosting ? 'Cancel' : 'Post'}
        </button>
      </div>

      {/* Enhanced Post Creation Modal */}
      {isPosting && (
        <div className="glass-card p-5 mb-8 border border-primary/40 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
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
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
            <span className="text-gray-400 text-sm mb-1">{stat.label}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
        <button onClick={() => setIsPosting(true)} className="flex flex-col items-center flex-shrink-0 cursor-pointer">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center mb-2 hover:border-primary transition-colors bg-black/20">
            <Plus className="text-primary w-6 h-6" />
          </div>
          <span className="text-xs text-gray-400">Your story</span>
        </button>
        {storyUsers.map((user) => (
          <Link key={user.id} to={`/profile/${user.id}`} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-primary mb-2 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-background border-2 border-background overflow-hidden p-1">
                <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt={user.username} className="w-full h-full rounded-full" />
              </div>
            </div>
            <span className="text-xs text-gray-300">{user.username}</span>
          </Link>
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
            <div key={post.id} className={`rounded-xl border border-white/10 overflow-hidden relative ${themeClass} shadow-xl`}>
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
                  <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                  <button onClick={() => handleShare(post)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors ml-auto border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>

                {activeCommentPostId === post.id && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-accent outline-none"
                    />
                    <button onClick={() => handleCommentSubmit(post.id)} disabled={!commentText.trim()} className="text-accent hover:text-white font-bold text-sm px-3 disabled:opacity-50">Post</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Feed;
