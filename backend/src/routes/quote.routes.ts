import { Router } from 'express';
import * as quoteController from '../controllers/quote.controller';

const router = Router();

router.get('/', quoteController.getDaily);
router.get('/list', quoteController.list);
router.post('/', quoteController.create);
router.delete('/:id', quoteController.remove);

export default router;
