import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Paperclip, Send, Smile } from 'lucide-react';
import { showXPToast } from '../components/XPToast';

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [otherUser, setOtherUser] = useState<any>({ username: 'Loading...', xp: 0 });
  const [streak, setStreak] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
          setOtherUser(data.otherUser);
          setStreak(data.streak?.streakCount || 0);
        }
      } catch (e) {
        console.error('Failed to load messages');
      }
    };
    fetchMessages();
  }, [userId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    try {
      const res = await fetch(`/api/messages/${userId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: inputText })
      });
      
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setInputText('');
        showXPToast(2, 'Message sent!');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        
        // Refresh streak
        const refreshRes = await fetch(`/api/messages/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setStreak(data.streak?.streakCount || 0);
        }
      }
    } catch {}
  };

  const level = Math.floor(Math.sqrt((otherUser.xp || 0) / 50));

  return (
    <div className="h-full flex flex-col pt-4">
      {/* Header */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-primary/30 py-3 px-4 flex items-center z-10">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser.username}&background=random`} className="w-10 h-10 rounded-full" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg leading-tight">{otherUser.username}</h2>
              <span className="bg-accent/20 text-accent text-[10px] px-1.5 py-0.5 rounded border border-accent/50">L{level}</span>
            </div>
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500/30" />
            <span className="text-amber-500 font-bold text-sm tracking-wide">{streak} DAY STREAK</span>
          </div>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-black/20 custom-scrollbar space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-70">
            <Flame className="w-16 h-16 text-amber-500/50 mb-4" />
            <p>Start a conversation with {otherUser.username}.</p>
            <p className="text-sm mt-2 text-accent">Message daily to build a streak!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === myId;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`flex max-w-[75%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="w-8 flex-shrink-0 flex items-end pb-1">
                      {showAvatar && <img src={`https://ui-avatars.com/api/?name=${otherUser.username}&background=random`} className="w-8 h-8 rounded-full" />}
                    </div>
                  )}
                  
                  <div className={`p-3 relative shadow-md ${
                    isMe 
                      ? 'bg-gradient-to-br from-primary to-violet-800 rounded-2xl rounded-br-sm' 
                      : 'bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-white/10 rounded-2xl rounded-bl-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed text-white/95">{msg.content}</p>
                    <div className={`text-[10px] text-white/50 w-full flex items-center justify-end gap-1 mt-1 ${isMe ? '' : 'justify-end'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {isMe && <span className="text-blue-400">✓✓</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-black/60 backdrop-blur-xl p-4 border-t border-primary/20 flex flex-col gap-2">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button type="button" className="text-gray-400 hover:text-accent transition-colors"><Smile className="w-6 h-6" /></button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 pr-10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-white/10 transition-all outline-none"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] disabled:opacity-50 disabled:shadow-none transition-all">
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
        <div className="text-center text-[11px] text-gray-500 font-medium tracking-wide">
          XP per message / streaks build with daily chats
        </div>
      </div>
    </div>
  );
};

export default Chat;
