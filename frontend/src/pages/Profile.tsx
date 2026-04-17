import { useState, useEffect } from 'react';
import { Zap, Flame, ImageOff, Grid3x3, MessageCircle, Settings, X, Save, Edit2, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const themes = [
  'from-violet-900 via-indigo-900 to-black',
  'from-cyan-900 via-blue-900 to-black',
  'from-rose-900 via-pink-900 to-black',
  'from-emerald-900 via-teal-900 to-black',
  'from-amber-900 via-orange-900 to-black',
  'from-indigo-900 via-purple-900 to-black',
];

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  
  const [postIdConfirming, setPostIdConfirming] = useState<number | null>(null);
  
  const userStr = localStorage.getItem('user');
  const myData = userStr ? JSON.parse(userStr) : {};
  const myId = Number(myData.id || 0);
  const targetId = userId || 'me';
  const isMe = !userId || Number(userId) === myId;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${targetId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditAvatar(data.avatarUrl || '');
        setEditBio(data.bio || '');
      }
    } catch (e) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId]);

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ avatarUrl: editAvatar, bio: editBio })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile({ ...profile, ...updated });
        setIsEditing(false);
        // Update local storage so sidebar updates
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, avatarUrl: updated.avatarUrl }));
        window.dispatchEvent(new Event('storage')); // Trigger update if other components listen
      }
    } catch (e) {
      console.error('Update failed');
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      const res = await fetch(`/api/feed/${postId}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      if (res.ok) {
        setProfile({
          ...profile,
          postCount: Math.max(0, profile.postCount - 1),
          posts: profile.posts.filter((p: any) => p.id !== postId)
        });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        User not found.
      </div>
    );
  }

  const nextXp = Math.pow(profile.level + 1, 2) * 50;
  const currLevelXp = Math.pow(profile.level, 2) * 50;
  const progress = ((profile.xp || 0) - currLevelXp) / (nextXp - currLevelXp) * 100;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-20 overflow-y-auto h-full relative">

      {/* Header Card */}
      <div className="glass-card p-6 mb-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary to-accent shadow-[0_0_25px_rgba(124,58,237,0.5)]">
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&background=7c3aed&color=fff&size=128`}
                alt={profile.username}
                className="w-full h-full rounded-full border-2 border-background object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-accent text-black text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-background shadow-[0_0_8px_rgba(56,189,248,0.8)]">
              L{profile.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black truncate">{profile.username}</h1>
              {isMe && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                  title="Edit Profile"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <p className="text-gray-400 text-xs mb-3">
              Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}
            </p>

            {/* Bio Display */}
            {profile.bio && (
              <p className="text-white/80 text-sm mb-4 bg-white/5 border border-white/10 rounded-lg p-3 italic">
                "{profile.bio}"
              </p>
            )}

            {/* XP Bar */}
            <div className="mb-1 flex justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 text-accent font-semibold"><Zap className="w-3 h-3" /> {profile.xp} XP</span>
              <span>{nextXp} XP to L{profile.level + 1}</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
                style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-black text-white">{profile.postCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Posts</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />{profile.streakCount}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Streaks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-accent">{profile.level}</div>
            <div className="text-xs text-gray-400 mt-0.5">Level</div>
          </div>
        </div>

        {/* Message button if viewing someone else */}
        {!isMe && (
          <div className="relative z-10 mt-5">
            <Link
              to={`/messages/${profile.id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent font-bold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4" /> Message {profile.username}
            </Link>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="glass-card w-full max-w-md p-6 relative z-10 border-primary/40 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" /> Edit Profile
              </h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Avatar URL</label>
                <input 
                  type="text" 
                  value={editAvatar} 
                  onChange={e => setEditAvatar(e.target.value)}
                  placeholder="Paste image link..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Bio</label>
                <textarea 
                  value={editBio} 
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="What's your story, traveler?"
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-accent outline-none h-24 resize-none"
                />
              </div>
              <button 
                onClick={handleUpdateProfile}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold shadow-lg"
              >
                <Save className="w-5 h-5" /> Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="mb-4 flex items-center gap-2 text-gray-300 font-semibold text-sm">
        <Grid3x3 className="w-4 h-4" /> RECENT TRANSMISSIONS
      </div>

      {profile.posts.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center text-gray-500">
          <ImageOff className="w-12 h-12 mb-3 opacity-40" />
          <p>No posts yet.</p>
          {isMe && <p className="text-sm mt-1 text-accent">Share your first post from the Feed!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {profile.posts.map((post: any) => {
            const theme = themes[post.id % themes.length];
            return (
              <div
                key={post.id}
                className={`aspect-square rounded-lg overflow-hidden relative bg-gradient-to-br ${theme} border border-white/10 group cursor-pointer`}
              >
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-white/70 text-xs text-center line-clamp-4">{post.caption}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-2 text-center line-clamp-3">{post.caption}</span>
                </div>
                {isMe && (
                  <div className="absolute top-2 right-2 z-20">
                    {postIdConfirming === post.id ? (
                      <div className="flex flex-col gap-1 animate-in fade-in zoom-in duration-200">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                          className="bg-red-500 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded shadow-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPostIdConfirming(null); }}
                          className="bg-black/80 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded shadow-lg hover:bg-black transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPostIdConfirming(post.id); }}
                        className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Profile;
