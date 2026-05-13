import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authenticate } from './middlewares/auth.middleware';
import authRoutes from './routes/auth.routes';
import noteRoutes from './routes/note.routes';
import focusRoutes from './routes/focus.routes';
import taskRoutes from './routes/task.routes';
import quoteRoutes from './routes/quote.routes';
import checkinRoutes from './routes/checkin.routes';
import settingRoutes from './routes/setting.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 公开路由（无需认证）
app.use('/api/auth', authRoutes);

// 受保护路由（需要 JWT）
app.use('/api/notes', authenticate, noteRoutes);
app.use('/api/focus-sessions', authenticate, focusRoutes);
app.use('/api/tasks', authenticate, taskRoutes);
app.use('/api/quote', authenticate, quoteRoutes);
app.use('/api/checkin', authenticate, checkinRoutes);
app.use('/api/setting', authenticate, settingRoutes);

export default app;
