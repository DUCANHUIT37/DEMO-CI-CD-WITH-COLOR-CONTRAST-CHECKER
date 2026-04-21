import { Router } from 'express';
import { getContrast, getContrastQuery } from '../controllers/contrastController';

const router = Router();

router.post('/contrast', getContrast);

router.get('/contrast', getContrastQuery);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
