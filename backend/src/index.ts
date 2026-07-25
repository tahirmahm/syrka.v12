import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import skillsRouter from './routes/skills';
import readinessRouter from './routes/readiness';
import applicationsRouter from './routes/applications';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/skills', skillsRouter);
app.use('/api/readiness', readinessRouter);
app.use('/api/applications', applicationsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Syrka Backend listening at http://localhost:${port}`);
  });
}

export default app;
