import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Feed from './pages/Feed';
import ChatList from './pages/ChatList';
import Chat from './pages/Chat';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import { XPToastContainer } from './components/XPToast';
import ModernVectorBackground from './components/ModernVectorBackground';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <XPToastContainer />
      <ModernVectorBackground />
      <div className="flex h-screen overflow-hidden text-white w-full">
        {isAuthenticated && <Sidebar setIsAuthenticated={setIsAuthenticated} />}
        
        <main className={`flex-1 overflow-y-auto ${isAuthenticated ? 'pt-[70px]' : ''}`}>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="*" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
              </>
            ) : (
              <>
                <Route path="/login" element={<Navigate to="/" />} />
                <Route path="/" element={<Feed />} />
                <Route path="/messages" element={<ChatList />} />
                <Route path="/messages/:userId" element={<Chat />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/quests" element={<Quests />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/create" element={<Navigate to="/" />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
