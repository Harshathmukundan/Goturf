import express from 'express';
import {
  getTurfs, getOwnerTurfs, getTurf, getTurfSlots, createTurf, updateTurf, deleteTurf
} from '../controllers/turfController.js';
import { protect, ownerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTurfs);
router.get('/owner/my-turfs', protect, ownerOrAdmin, getOwnerTurfs);
router.get('/:id', getTurf);
router.get('/:id/slots', getTurfSlots);
router.post('/', protect, ownerOrAdmin, createTurf);
router.put('/:id', protect, ownerOrAdmin, updateTurf);
router.delete('/:id', protect, ownerOrAdmin, deleteTurf);

export default router;
