const User = require('../models/User');

// @desc    Foydalanuvchi rolini o‘zgartirish (faqat admin)
// @route   PATCH /api/admin/users/:userId/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    
    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Noto‘g‘ri rol' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { updateUserRole };