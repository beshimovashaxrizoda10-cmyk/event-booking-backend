const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ism kiritish majburiy'],
    trim: true,
    minlength: [2, 'Ism kamida 2 harf']
  },
  email: {
    type: String,
    required: [true, 'Email kiritish majburiy'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Email noto\'g\'ri'
    ]
  },
  password: {
    type: String,
    required: [true, 'Parol kiritish majburiy'],
    minlength: [6, 'Parol kamida 6 harf'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'organizer'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Parolni hash qilish
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Parolni tekshirish
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);