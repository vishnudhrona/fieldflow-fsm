import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { sequelize } from './models/index';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import menuRoutes from './routes/menuRoutes';
import uploadRoutes from './routes/uploadRoutes';
import assetRoutes from './routes/assetRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assets', assetRoutes);

app.get('/api/health/ready', async (req: Request, res: Response) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection lost',
      error: error?.message
    });
  }
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
  } catch (error: any) {
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const server = app.listen(PORT);

  const handleShutdown = (signal: string) => {
    server.close(async () => {
      try {
        await sequelize.close();
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
export default app;
