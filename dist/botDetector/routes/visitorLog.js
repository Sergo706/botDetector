import { Router } from 'express';
import { validator } from '../middlewares/canaryCookieChecker.js';
const router = Router();
router.use('/check', validator, (req, res) => {
    res.json({ results: req.botDetection, message: 'Fingerprint logged successfully' });
});
export default router;
