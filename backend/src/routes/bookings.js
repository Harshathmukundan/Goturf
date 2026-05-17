import express from 'express';
import {
  createBooking, getUserBookings, getBooking, confirmBooking, cancelBooking,
  getAllBookings, getAdminStats, getOwnerBookings, getOwnerStats
} from '../controllers/bookingController.js';
import { protect, adminOnly, ownerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createBooking);
router.get('/my', getUserBookings);
router.get('/admin/all', adminOnly, getAllBookings);
router.get('/admin/stats', adminOnly, getAdminStats);
router.get('/owner/my-bookings', ownerOrAdmin, getOwnerBookings);
router.get('/owner/stats', ownerOrAdmin, getOwnerStats);
router.get('/:id', getBooking);
router.put('/:id/confirm', confirmBooking);
router.delete('/:id', cancelBooking);

export default router;
