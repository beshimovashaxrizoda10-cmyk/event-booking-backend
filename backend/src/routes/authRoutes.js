const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  createOrganizer, 
  createAdmin, 
  getAllUsers 
} = require('../controllers/authController');
const { protect, admin, hasRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Open routes (hamma uchun)
router.post('/register', register);
router.post('/login', login);

// Protected routes (faqat login qilganlar uchun)
router.get('/me', protect, getMe);

// Admin only routes
router.post('/create-organizer', protect, admin, createOrganizer);
router.post('/create-admin', protect, admin, createAdmin);
router.get('/users', protect, admin, getAllUsers);

// Role based example (faqat organizer va admin)
router.get('/dashboard', protect, hasRole('admin', 'organizer'), (req, res) => {
  res.json({ 
    success: true, 
    message: `Xush kelibsiz ${req.user.role} paneliga`,
    user: req.user
  });
});

module.exports = router;