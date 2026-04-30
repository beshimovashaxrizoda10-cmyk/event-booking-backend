const express = require('express');
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAttendees
} = require('../controllers/bookingController');
const { protect, hasRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // Barcha endpointlar uchun login talab qilinadi

router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.delete('/:id', cancelBooking);
router.get('/event/:eventId/attendees', hasRole('admin', 'organizer'), getAttendees);

module.exports = router;