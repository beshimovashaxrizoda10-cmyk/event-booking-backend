const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware (faqat login bo'lishini tekshiradi)
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Ruxsat yo\'q, token topilmadi' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Ruxsat yo\'q, token noto\'g\'ri' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Admin huquqi talab qilinadi',
      required_role: 'admin',
      your_role: req.user?.role || 'not_logged_in'
    });
  }
};

// Organizer middleware
const organizer = (req, res, next) => {
  if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Organizer yoki Admin huquqi talab qilinadi',
      required_roles: ['organizer', 'admin'],
      your_role: req.user?.role || 'not_logged_in'
    });
  }
};

// User middleware (hamma oddiy foydalanuvchilar)
const user = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'User huquqi talab qilinadi',
      required_role: 'user',
      your_role: req.user?.role || 'not_logged_in'
    });
  }
};

// Role based middleware (dynamic)
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Avval tizimga kiring' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Sizga ruxsat yo'q. Kerakli rollar: ${roles.join(', ')}`,
        your_role: req.user.role
      });
    }
    
    next();
  };
};

module.exports = { protect, admin, organizer, user, hasRole };