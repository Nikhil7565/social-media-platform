import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Flame, MessageSquare, PlusSquare, Trophy, Trash2, Sparkles } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          // Format timestamps
          const formatted = data.map((notif: any) => {
            const timeDiff = Date.now() - new Date(notif.createdAt).getTime();
            const minAgo = Math.floor(timeDiff / 60000);
            const hrsAgo = Math.floor(minAgo / 60);
            let timeStr = 'just now';
            if (minAgo > 0 && minAgo < 60) timeStr = `${minAgo} min ago`;
            else if (hrsAgo > 0 && hrsAgo < 24) timeStr = `${hrsAgo} hours ago`;
            else if (hrsAgo >= 24) timeStr = `${Math.floor(hrsAgo / 24)} days ago`;
            
            return { ...notif, createdAt: timeStr };
          });
          
          setNotifications(formatted);

          // Mark as read immediately when viewed
          const hasUnread = data.some((n: any) => !n.isRead);
          if (hasUnread) {
            fetch('/api/notifications/read', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
          }
        }
      } catch (e) {
        console.error('Failed to load notifications');
      }
    };
    fetchNotifications();
  }, []);
  
  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      const res = await fetch('/api/notifications/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications');
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart className="w-5 h-5 text-white" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-white" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-white" />;
      case 'streak': return <Flame className="w-5 h-5 text-white" />;
      case 'new_post': return <PlusSquare className="w-5 h-5 text-white" />;
      case 'level_up': return <Trophy className="w-5 h-5 text-white" />;
      case 'rank_change': return <Sparkles className="w-5 h-5 text-white" />;
      default: return <MessageSquare className="w-5 h-5 text-white" />;
    }
  };

  const getColorClass = (type: string) => {
    switch(type) {
      case 'like': return 'bg-pinklike shadow-[0_0_15px_rgba(236,72,153,0.5)]';
      case 'comment': return 'bg-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]';
      case 'message': return 'bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]';
      case 'streak': return 'bg-amber-500 shadow-[0_0_15_rgba(245,158,11,0.5)]';
      case 'new_post': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      case 'level_up': return 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)]';
      case 'rank_change': return 'bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]';
      default: return 'bg-gray-500';
    }
  };

  const getMessage = (notif: any) => {
    switch(notif.type) {
      case 'like': return <span><span className="font-bold">{notif.actor.username}</span> liked your post.</span>;
      case 'comment': return <span><span className="font-bold">{notif.actor.username}</span> commented on your post.</span>;
      case 'message': return <span><span className="font-bold">{notif.actor.username}</span> sent you a message.</span>;
      case 'streak': return <span>You hit a <span className="font-bold">{notif.data || 5} day streak</span> with <span className="font-bold">{notif.actor.username}</span>! Keep it up 🔥</span>;
      case 'new_post': return <span><span className="font-bold">{notif.actor.username}</span> shared a new post. Check it out!</span>;
      case 'level_up': return <span><span className="font-bold text-yellow-400">Level UP!</span> You reached <span className="font-bold">Level {notif.data}</span>. Keep grinding! 🚀</span>;
      case 'rank_change': return <span>You moved up to <span className="font-bold">Rank {notif.data}</span> on the leaderboard! 🏆</span>;
      default: return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(notif => (
          <div key={notif.id} className={`glass-card p-4 flex items-start gap-4 transition-colors ${notif.isRead ? '' : 'bg-primary/10 border-primary/50'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${getColorClass(notif.type)}`}>
              {getIcon(notif.type)}
            </div>
            
            <div className="flex-1 mt-1">
              <p className="text-[15px] text-white/90">{getMessage(notif)}</p>
              <p className="text-xs text-gray-400 mt-1.5">{notif.createdAt}</p>
            </div>

            {!notif.isRead && (
              <div className="w-2.5 h-2.5 bg-accent rounded-full mt-2 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No notifications.</div>
        )}
      </div>
    </div>
  );
};
export default Notifications;
