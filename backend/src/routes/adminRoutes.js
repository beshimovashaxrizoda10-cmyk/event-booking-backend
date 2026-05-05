const express = require('express');
const { updateUserRole } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, admin); // barcha endpointlar admin uchun
router.patch('/users/:userId/role', updateUserRole);

module.exports = router;