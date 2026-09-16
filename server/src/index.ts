import express from 'express';
import cors from 'cors';
import { config } from './config';
import chatRouter from './routes/chat';
import healthRouter from './routes/health';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api', healthRouter);
app.use('/api', chatRouter);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
