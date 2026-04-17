import { useState, useEffect } from 'react';
import { Trophy, Zap, Crown } from 'lucide-react';

const Leaderboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const myUsername = JSON.parse(localStorage.getItem('user') || '{}').username;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error('Failed to load leaderboard');
      }
    };
    fetchLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  // Podium Array: [2nd, 1st, 3rd] for visual layout
  const podium = [
    { ...top3[1], rank: 2, height: 'h-16', ring: 'border-gray-300', from: 'from-gray-400/20', to: 'to-gray-600/50' },
    { ...top3[0], rank: 1, height: 'h-24', ring: 'border-yellow-400', from: 'from-yellow-400/30', to: 'to-yellow-600/60' },
    { ...top3[2], rank: 3, height: 'h-12', ring: 'border-amber-700', from: 'from-amber-700/30', to: 'to-orange-900/60' }
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 h-full overflow-y-auto">
      <div className="flex flex-col items-center mb-12">
        <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-4" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">Global Leaderboard</h1>
        <p className="text-gray-400 mt-2">Earn XP by engaging to climb the ranks!</p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-2 mb-16 mt-8 h-48 px-4">
        {podium.map((u, i) => (
          <div key={i} className="flex flex-col items-center w-28">
            {u.rank === 1 && <Crown className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />}
            
            <div className={`w-16 h-16 rounded-full border-4 ${u.ring} mb-3 relative shrink-0 p-0.5 bg-black z-10 shadow-[0_0_20px_rgba(0,0,0,0.8)]`}>
              <img src={`https://ui-avatars.com/api/?name=${u.username}&background=random`} className="w-full h-full rounded-full" />
              <div className="absolute -bottom-2 lg:-bottom-3 left-1/2 -translate-x-1/2 bg-background font-bold text-xs px-1.5 py-0.5 rounded-full border shadow-lg z-20">
                #{u.rank}
              </div>
            </div>
            
            <span className="font-bold mb-1 w-full text-center truncate">{u.username}</span>
            <span className="text-xs text-accent font-semibold mb-2">{u.xp} XP</span>
            
            <div className={`w-full ${u.height} relative overflow-hidden rounded-t-lg glass-card border-b-0 flex items-center justify-center`}>
              <div className={`absolute inset-0 bg-gradient-to-t ${u.from} ${u.to} opacity-50`}></div>
              <span className="relative z-10 text-2xl font-black opacity-30">{u.rank}</span>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3 pb-20">
        {rest.map((user, index) => {
          const rank = index + 4;
          const isMe = user.username === myUsername;
          const level = Math.floor(Math.sqrt(user.xp / 50));
          
          return (
            <div key={user.id} className={`glass-card p-4 flex items-center gap-4 transition-transform hover:scale-[1.01] ${isMe ? 'bg-primary/20 border-primary/60 shadow-[0_0_15px_rgba(124,58,237,0.2)]' : ''}`}>
              <div className="w-8 font-bold text-gray-500 text-lg text-center">#{rank}</div>
              <img src={`https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-12 h-12 rounded-full border border-white/10" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg ${isMe ? 'text-white' : 'text-gray-200'}`}>{user.username}</h3>
                  <span className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded">L{level}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full text-accent font-bold group">
                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                {user.xp}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
