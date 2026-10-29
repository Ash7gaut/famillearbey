import { Router } from 'express';
import familyMemberRoutes from './familyMemberRoutes.js';
import relationshipRoutes from './relationshipRoutes.js';
import albumRoutes from './albumRoutes.js';
import photoRoutes from './photoRoutes.js';
import quizRoutes from './quizRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import accessRequestRoutes from './accessRequestRoutes.js';
import secretSantaRoutes from './secretSantaRoutes.js';
import calendarRoutes from './calendarRoutes.js';
import eventRoutes from './eventRoutes.js';
import commentRoutes from './commentRoutes.js';
import tribuRoutes from './tribuRoutes.js';
import messagingRoutes from './messagingRoutes.js';
import pushRoutes from './pushRoutes.js';

const router = Router();

router.use('/members', familyMemberRoutes);
router.use('/relationships', relationshipRoutes);
router.use('/albums', albumRoutes);
router.use('/photos', photoRoutes);
router.use('/quiz', quizRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/secret-santa', secretSantaRoutes);
router.use('/calendar', calendarRoutes);
router.use('/events', eventRoutes);
router.use('/comments', commentRoutes);
router.use('/tribus', tribuRoutes);
router.use('/conversations', messagingRoutes);
router.use('/push', pushRoutes);

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', app: 'FamilyHub – Famille Arbey' } });
});

export default router;
