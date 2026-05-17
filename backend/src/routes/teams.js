import express from 'express';
import { createTeam, getTeam, getTeamByInviteCode, inviteMember, respondToInvite } from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createTeam);
router.get('/invite/:code', getTeamByInviteCode);
router.get('/:id', getTeam);
router.post('/:id/invite', inviteMember);
router.put('/:id/respond', respondToInvite);

export default router;
