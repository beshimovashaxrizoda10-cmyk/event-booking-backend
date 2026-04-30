const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token yaratish
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Ro'yxatdan o'tish (oddiy foydalanuvchi)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }
    
    // Oddiy user sifatida ro'yxatdan o'tadi
    const user = await User.create({ name, email, password, role: 'user' });
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin tomonidan organizer yaratish
// @route   POST /api/auth/create-organizer (faqat admin)
const createOrganizer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }
    
    // Organizer rolida yaratish
    const user = await User.create({ name, email, password, role: 'organizer' });
    
    res.status(201).json({
      success: true,
      message: 'Organizer muvaffaqiyatli yaratildi',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin tomonidan admin yaratish
// @route   POST /api/auth/create-admin (faqat super admin)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }
    
    const user = await User.create({ name, email, password, role: 'admin' });
    
    res.status(201).json({
      success: true,
      message: 'Admin muvaffaqiyatli yaratildi',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Tizimga kirish
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email yoki parol noto\'g\'ri' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Email yoki parol noto\'g\'ri' });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    O'z ma'lumotlarini ko'rish
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// @desc    Barcha foydalanuvchilarni ko'rish (faqat admin)
// @route   GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  register, 
  login, 
  getMe, 
  createOrganizer, 
  createAdmin, 
  getAllUsers 
};