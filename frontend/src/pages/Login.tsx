import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BrandLogo from '../components/BrandLogo';

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleQuickFill = () => {
    setEmail('alex@example.com');
    setPassword('password123');
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, username };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
        navigate('/');
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 border-primary/40">
        <div className="mb-8">
          <BrandLogo size="md" />
        </div>

        <div className="flex mb-8 bg-black/40 rounded-lg p-1">
          <button className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} onClick={() => setIsLogin(true)}>Sign In</button>
          <button className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} onClick={() => setIsLogin(false)}>Create Account</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input type="text" placeholder="Username" className="glass-input" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input type="email" placeholder="Email Address" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="glass-input" value={password} onChange={e => setPassword(e.target.value)} required />
          
          <button type="submit" className="btn-primary mt-4 py-3 text-lg font-bold">
            {isLogin ? 'Enter System' : 'Initialize Account'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 text-center text-sm text-gray-400">
            <button onClick={handleQuickFill} className="hover:text-accent transition-colors underline decoration-dotted">Try alex@example.com / password123</button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
