import { useState, useEffect } from 'react';
import { Search, Flame, MessageSquare, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ChatList = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiInfo, setAiInfo] = useState<any>(null);


  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messages/conversations', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
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
              lastMessage: 'Tap to view messages...',
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

    const fetchAIInfo = async () => {
      try {
        const res = await fetch('/api/ai/info', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setAiInfo(await res.json());
      } catch {}
    };
    fetchAIInfo();
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/profile/search?q=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error('Search failed');
      }
    };

    const debounce = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <button 
          onClick={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchQuery('');
          }}
          className={`w-10 h-10 rounded-full glass-card flex items-center justify-center transition-all ${isSearching ? 'bg-primary border-primary shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'hover:bg-white/10'}`}
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>

      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="relative">
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any pulse in the sector..."
                className="w-full bg-white/5 border border-primary/30 rounded-2xl px-5 py-4 pl-12 text-white placeholder-gray-500 focus:border-primary focus:bg-white/10 transition-all outline-none"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto space-y-2 pb-20 custom-scrollbar relative">
        {searchQuery.length >= 2 ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4 pl-1">Results Found</h2>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic text-sm">No matches found in this sector.</div>
            ) : (
              searchResults.map(user => (
                <Link key={user.id} to={`/messages/${user.id}`} className="block mb-2">
                  <div className="glass-card p-3 transition-all hover:bg-accent/10 hover:border-accent/50 cursor-pointer flex items-center gap-4 group">
                    <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-accent/50 transition-colors" />
                    <div>
                      <h3 className="font-bold text-white group-hover:text-accent transition-colors">{user.username}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">LEVEL {Math.floor(Math.sqrt((user.xp || 0) / 50))}</span>
                        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Start Chat</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <hr className="my-8 border-white/5" />
          </div>
        ) : null}

        {/* Featured AI Assistant */}
        {aiInfo && (
          <Link to={`/messages/${aiInfo.id}`} className="block mb-6">
            <div className="glass-card p-4 transition-all bg-gradient-to-br from-cyan-900/40 via-blue-900/40 to-black border-cyan-500/30 flex items-center gap-4 relative group hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="relative">
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 animate-pulse">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    <img src={aiInfo.avatarUrl || "https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=2670&auto=format&fit=crop"} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black text-[8px] font-black px-1.5 rounded-full border border-black">AI</div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-400 text-lg">KINETIC AI</h3>
                <p className="text-xs text-cyan-300/70 font-medium">Your strategic Action Advisor. Ask me anything.</p>
              </div>
              <div className="bg-cyan-500/10 text-cyan-400 p-2 rounded-full border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 pl-1">Recent Pulses</h2>

        
        {conversations.length === 0 && searchQuery.length < 2 && (
          <div className="text-center text-gray-500 mt-20 italic">Empty sector. Start a conversation!</div>
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
