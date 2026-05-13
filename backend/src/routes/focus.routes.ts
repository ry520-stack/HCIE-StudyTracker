import { Router } from 'express';
import * as focusController from '../controllers/focus.controller';

const router = Router();

router.post('/', focusController.create);
router.get('/', focusController.list);
router.get('/today-stats', focusController.todayStats);
router.get('/:id', focusController.getById);
router.patch('/:id', focusController.update);
router.delete('/:id', focusController.remove);

export default router;
