import { Router } from 'express';
import * as noteController from '../controllers/note.controller';

const router = Router();

router.post('/', noteController.create);
router.get('/', noteController.list);
router.get('/due', noteController.getDue);
router.get('/:id', noteController.getById);
router.put('/:id', noteController.update);
router.delete('/:id', noteController.remove);
router.post('/:id/review', noteController.review);
router.get('/:id/health', noteController.getHealth);

export default router;
