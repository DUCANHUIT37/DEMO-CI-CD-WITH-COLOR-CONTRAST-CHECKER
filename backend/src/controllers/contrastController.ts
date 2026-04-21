import { Request, Response } from 'express';
import { calculateContrastRatio } from '../utils/contrastCalculator';

export function getContrast(req: Request, res: Response): void {
  const { foreground, background } = req.body as {
    foreground?: string;
    background?: string;
  };

  if (!foreground || !background) {
    res.status(400).json({ error: 'foreground and background are required.' });
    return;
  }

  const result = calculateContrastRatio(foreground, background);

  if (!result) {
    res.status(400).json({
      error: 'Invalid hex color values. Use format #RRGGBB or #RGB.',
    });
    return;
  }

  res.json(result);
}

export function getContrastQuery(req: Request, res: Response): void {
  const fg = req.query['fg'] as string | undefined;
  const bg = req.query['bg'] as string | undefined;

  if (!fg || !bg) {
    res.status(400).json({ error: 'fg and bg query params are required.' });
    return;
  }

  const result = calculateContrastRatio(fg, bg);

  if (!result) {
    res.status(400).json({
      error: 'Invalid hex color values. Use format #RRGGBB or #RGB.',
    });
    return;
  }

  res.json(result);
}
