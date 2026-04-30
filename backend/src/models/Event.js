const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event nomi kiritish majburiy'],
    trim: true,
    maxlength: [100, 'Nomi 100 harfdan kam bo\'lishi kerak']
  },
  description: {
    type: String,
    required: [true, 'Event tavsifi kiritish majburiy'],
    maxlength: [2000, 'Tavsif 2000 harfdan kam bo\'lishi kerak']
  },
  date: {
    type: Date,
    required: [true, 'Event sanasi kiritish majburiy'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event sanasi kelajakda bo\'lishi kerak'
    }
  },
  startTime: {
    type: String,
    required: [true, 'Boshlanish vaqti kiritish majburiy'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Vaqt format noto\'g\'ri (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'Tugash vaqti kiritish majburiy'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Vaqt format noto\'g\'ri (HH:MM)']
  },
  location: {
    type: String,
    required: [true, 'Joylashuv kiritish majburiy'],
    enum: ['Online', 'Tashkent', 'Samarqand', 'Bukhara', 'Andijan', 'Other']
  },
  address: {
    type: String,
    required: function() {
      return this.location !== 'Online';
    }
  },
  totalSeats: {
    type: Number,
    required: [true, 'Umumiy o\'rinlar soni kiritish majburiy'],
    min: [1, 'Kamida 1 o\'rin'],
    max: [1000, 'Ko\'pi bilan 1000 o\'rin']
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0,
    default: function() {
      return this.totalSeats;
    }
  },
  price: {
    type: Number,
    required: [true, 'Narx kiritish majburiy'],
    min: [0, 'Narx manfiy bo\'lishi mumkin emas'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Kategoriya kiritish majburiy'],
    enum: ['Technology', 'Business', 'Marketing', 'Design', 'Health', 'Education', 'Other']
  },
  speaker: {
    type: String,
    required: [true, 'Spiker nomi kiritish majburiy']
  },
  image: {
    type: String,
    default: 'default-event.jpg'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field - bookinglar soni
eventSchema.virtual('bookingsCount', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Index for search
eventSchema.index({ title: 'text', description: 'text', speaker: 'text' });

// Update availableSeats pre-save
eventSchema.pre('save', function(next) {
  if (this.isNew) {
    this.availableSeats = this.totalSeats;
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);