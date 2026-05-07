const express = require('express');
const { updateUserRole } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Barcha route'lar admin va login talab qiladi
router.use(protect, admin);

router.patch('/users/:userId/role', updateUserRole);

module.exports = router;