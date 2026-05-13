import { Router } from 'express';
import * as settingController from '../controllers/setting.controller';

const router = Router();

router.get('/dashboard', settingController.getDashboard);
router.get('/settings', settingController.getSettings);
router.put('/settings', settingController.updateSettings);
router.get('/achievements', settingController.getAchievements);
router.get('/goal', settingController.getDailyGoal);
router.put('/goal', settingController.updateDailyGoal);
router.get('/journal', settingController.getDailyJournal);
router.put('/journal', settingController.updateDailyJournal);

export default router;
