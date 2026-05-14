import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as verificationController from '../controllers/verification.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-code', verificationController.sendCode);

export default router;
