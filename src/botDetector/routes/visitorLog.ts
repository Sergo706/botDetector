import { Router } from 'express';
import { validator } from '../middlewares/canaryCookieChecker.js';

const router = Router();

router.use('/check', validator, (req, res) => {
  res.json({ ok: true, receivedAt: new Date().toISOString(), message: 'Fingerprint logged successfully' });
});

export default router;


