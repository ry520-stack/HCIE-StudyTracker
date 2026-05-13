import { Router } from 'express';
import * as checkinController from '../controllers/checkin.controller';

const router = Router();

router.post('/', checkinController.checkin);
router.post('/makeup', checkinController.makeup);
router.get('/stats', checkinController.stats);
router.get('/month', checkinController.monthData);

export default router;
