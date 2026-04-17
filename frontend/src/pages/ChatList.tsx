import { useState, useEffect } from 'react';
import { Search, Flame, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatList = () => {
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messages/conversations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map data to match the UI format expected by the template
          const formatted = data.map((conv: any) => {
            const timeDiff = Date.now() - new Date(conv.lastMessageAt).getTime();
            const minAgo = Math.floor(timeDiff / 60000);
            const hrsAgo = Math.floor(minAgo / 60);
            let timeStr = 'just now';
            if (minAgo > 0 && minAgo < 60) timeStr = `${minAgo} min ago`;
            else if (hrsAgo > 0 && hrsAgo < 24) timeStr = `${hrsAgo} hours ago`;
            else if (hrsAgo >= 24) timeStr = `${Math.floor(hrsAgo / 24)} days ago`;

            return {
              id: conv.id,
              user: conv.user,
              lastMessage: 'Tap to view messages...', // We don't fetch lastMessage content in prototype
              timestamp: timeStr,
              streak: conv.streakCount
            };
          });
          setConversations(formatted);
        }
      } catch (e) {
        console.error('Failed to load conversations');
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-20 custom-scrollbar">
        {conversations.length === 0 && (
          <div className="text-center text-gray-500 mt-20">No messages yet. Start a conversation!</div>
        )}

        {conversations.map(conv => (
          <Link key={conv.id} to={`/messages/${conv.user.id}`} className="block">
            <div className="glass-card p-4 transition-all hover:bg-primary/20 hover:border-primary/50 cursor-pointer flex items-center gap-4 relative group">
              <div className="relative">
                <img src={conv.user.avatarUrl || `https://ui-avatars.com/api/?name=${conv.user.username}&background=random`} className="w-14 h-14 rounded-full border-2 border-transparent group-hover:border-primary/50 transition-colors" />
                {conv.streak > 0 && (
                  <div className="absolute -top-1 -right-1 bg-black rounded-full border border-background">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500/20" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-lg">{conv.user.username}</h3>
                  <span className="text-xs text-gray-400">{conv.timestamp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300 truncate pr-4">{conv.lastMessage}</p>
                  
                  {conv.streak > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs font-bold">{conv.streak}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-6 left-4 right-4 glass-card p-3 flex items-center justify-center gap-2 border-accent/30 text-sm opacity-80 backdrop-blur-3xl bg-black/60">
        <MessageSquare className="w-4 h-4 text-accent" />
        <span className="text-gray-300">Earn <strong className="text-accent">+2 XP</strong> per message! Streaks build daily.</span>
      </div>
    </div>
  );
};

export default ChatList;
