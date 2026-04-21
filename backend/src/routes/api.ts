import { Router } from 'express';
import { getContrast, getContrastQuery } from '../controllers/contrastController';

const router = Router();

// POST /api/contrast — body: { foreground, background }
router.post('/contrast', getContrast);

// GET  /api/contrast — query: ?fg=&bg=
router.get('/contrast', getContrastQuery);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
