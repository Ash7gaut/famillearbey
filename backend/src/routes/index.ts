import { Router } from 'express';
import familyMemberRoutes from './familyMemberRoutes.js';
import relationshipRoutes from './relationshipRoutes.js';
import albumRoutes from './albumRoutes.js';
import photoRoutes from './photoRoutes.js';
import quizRoutes from './quizRoutes.js';

const router = Router();

router.use('/members', familyMemberRoutes);
router.use('/relationships', relationshipRoutes);
router.use('/albums', albumRoutes);
router.use('/photos', photoRoutes);
router.use('/quiz', quizRoutes);

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', app: 'FamilyHub – Famille Arbey' } });
});

export default router;
