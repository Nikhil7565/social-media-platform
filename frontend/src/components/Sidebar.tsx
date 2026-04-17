import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, MessageSquare, PlusSquare, Bell, Trophy, LogOut, Film } from 'lucide-react';
import { useState, useEffect } from 'react';

import BrandLogo from './BrandLogo';

const API_HEADERS = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

const Sidebar = ({ setIsAuthenticated }: { setIsAuthenticated: (b: boolean) => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{username: string, xp: number, avatarUrl: string} | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/auth/stats', { headers: API_HEADERS() });
        if (res.ok) {
          const data = await res.json();
          setUnreadAlerts(data.alerts || 0);
          setUnreadMessages(data.unreadMessages || 0);
          // Refresh XP in sidebar
          const u = localStorage.getItem('user');
          if (u) {
            const parsed = JSON.parse(u);
            setUser({ ...parsed, xp: data.xp });
          }
        }
      } catch {}
    };
    fetchStats();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Feed', path: '/', icon: Home, badge: 0 },
    { name: 'Reels', path: '/reels', icon: Film, badge: 0 },
    { name: 'Messages', path: '/messages', icon: MessageSquare, badge: unreadMessages },
    { name: 'Create', path: '/create', icon: PlusSquare, badge: 0 },
    { name: 'Alerts', path: '/notifications', icon: Bell, badge: unreadAlerts },
    { name: 'Ranks', path: '/leaderboard', icon: Trophy, badge: 0 },
  ];

  const level = user ? Math.floor(Math.sqrt(user.xp / 50)) : 0;
  const nextXp = Math.pow(level + 1, 2) * 50;
  const currLevelXp = Math.pow(level, 2) * 50;
  const progress = ((user?.xp || 0) - currLevelXp) / (nextXp - currLevelXp) * 100;

  return (
    <div className="w-full h-[70px] fixed left-0 top-0 bg-background/80 backdrop-blur-xl border-b border-white/10 z-[100] flex items-center justify-between px-6 shadow-2xl">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <BrandLogo size="sm" layout="horizontal" />
      </div>

      {/* Center: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.name === 'Messages' && location.pathname.startsWith('/messages'));
          
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex flex-col items-center justify-center w-20 py-2 rounded-xl transition-all relative group ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-background">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`}>
                {item.name}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-2 w-8 h-1 bg-accent rounded-full shadow-[0_0_10px_#38bdf8]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <Link to="/profile" className="flex items-center gap-3 glass-card py-1.5 pl-1.5 pr-4 rounded-full border border-white/5 hover:border-primary/40 transition-all group">
            <div className="relative">
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=7c3aed&color=fff`} 
                className="w-8 h-8 rounded-full border border-primary/30 group-hover:scale-105 transition-transform" 
                alt="avatar" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow-lg"></div>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold leading-none mb-1">{user.username}</div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-accent font-black">L{level}</div>
                <div className="w-12 bg-black/40 rounded-full h-1">
                  <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          </Link>
        )}
        
        <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
        
        <button 
          onClick={handleLogout} 
          className="p-2.5 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
