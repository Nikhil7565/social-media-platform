import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import feedRoutes from './routes/feed.js';
import messagesRoutes from './routes/messages.js';
import notificationsRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Final Catch-All (MUST BE LAST)
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(frontendDistPath, 'index.html');
    res.sendFile(indexPath);
  } catch (e) {
    res.status(404).send('Sector 404: Frontend not built');
  }
});

export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
