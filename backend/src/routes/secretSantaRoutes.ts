import { Router } from 'express';
import { secretSantaController } from '../controllers/secretSantaController.js';
import { asyncHandler, asyncMiddleware } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/invite/:token', asyncHandler(secretSantaController.getGuestInvite));
router.post('/invite/:token/accept', asyncHandler(secretSantaController.guestAccept));
router.post('/invite/:token/decline', asyncHandler(secretSantaController.guestDecline));
router.get('/invite/:token/assignment', asyncHandler(secretSantaController.guestAssignment));
router.post('/invite/:token/confirm-reveal', asyncHandler(secretSantaController.confirmGuestReveal));

router.use(asyncMiddleware(requireAuth));

router.get('/', asyncHandler(secretSantaController.list));
router.post('/', asyncHandler(secretSantaController.create));
router.get('/:id', asyncHandler(secretSantaController.getById));
router.post('/:id/invite-member', asyncHandler(secretSantaController.inviteMember));
router.post('/:id/invite-email', asyncHandler(secretSantaController.inviteEmail));
router.patch('/:id/respond', asyncHandler(secretSantaController.respond));
router.post('/:id/draw', asyncHandler(secretSantaController.draw));
router.get('/:id/my-assignment', asyncHandler(secretSantaController.myAssignment));
router.post('/:id/confirm-reveal', asyncHandler(secretSantaController.confirmReveal));
router.get(
  '/:id/participants/:participantId/invite-link',
  asyncHandler(secretSantaController.inviteLink),
);
router.delete(
  '/:id/participants/:participantId',
  asyncHandler(secretSantaController.removeParticipant),
);
router.delete('/:id', asyncHandler(secretSantaController.deleteGroup));

export default router;
