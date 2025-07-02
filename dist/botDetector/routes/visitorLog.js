import { Router } from 'express';
import { validator } from '../middlewares/canaryCookieChecker.js';
import { warmUp } from '../db/warmUp.js';
const router = Router();
router.use('/check', warmUp, validator, (req, res) => {
    res.json({ results: req.botDetection, message: 'Fingerprint logged successfully' });
});
export default router;
