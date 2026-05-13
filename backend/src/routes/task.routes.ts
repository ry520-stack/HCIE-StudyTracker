import { Router } from 'express';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.post('/', taskController.create);
router.get('/', taskController.list);
router.get('/stats', taskController.stats);
router.get('/:id', taskController.getById);
router.put('/:id', taskController.update);
router.patch('/:id/toggle', taskController.toggle);
router.delete('/:id', taskController.remove);

export default router;
