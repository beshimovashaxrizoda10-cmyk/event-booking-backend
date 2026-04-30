const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: {
    type: Number,
    required: [true, 'Necha joy band qilayotganingizni kiriting'],
    min: [1, 'Kamida 1 joy band qilishingiz mumkin'],
    max: [10, 'Bir marta ko‘pi bilan 10 joy band qilish mumkin']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  attendeeName: {
    type: String,
    required: [true, 'Ismingizni kiriting'],
    trim: true
  },
  attendeeEmail: {
    type: String,
    required: [true, 'Emailingizni kiriting'],
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email noto‘g‘ri']
  },
  attendeePhone: {
    type: String,
    match: [/^\+?998[0-9]{9}$/, 'Telefon raqam +998XXXXXXXXX formatida bo‘lishi kerak']
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending', 'checked_in'],
    default: 'confirmed'
  },
  checkedInAt: {
    type: Date
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Maxsus so‘rov 500 belgidan oshmasligi kerak']
  }
}, {
  timestamps: true
});

// Bir foydalanuvchi bir eventga faqat bir marta confirmed booking qila oladi
bookingSchema.index({ user: 1, event: 1, status: 1 }, {
  unique: true,
  partialFilterExpression: { status: 'confirmed' }
});

module.exports = mongoose.model('Booking', bookingSchema);