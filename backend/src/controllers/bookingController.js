const Booking = require('../models/Booking');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Joy band qilish
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, seats, attendeeName, attendeeEmail, attendeePhone, specialRequests } = req.body;

    // 1. Eventni top va availableSeats ni tekshir
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Event topilmadi' });
    }

    if (event.availableSeats < seats) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: `Faqat ${event.availableSeats} ta joy qolgan` });
    }

    // (user bu eventga oldin band qilganmi?)
    const existingBooking = await Booking.findOne({
      user: req.user.id,
      event: eventId,
      status: 'confirmed'
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Siz bu eventga allaqachon band qilgansiz' });
    }

    // 3. Joyni kamaytirish
    event.availableSeats -= seats;
    await event.save({ session });

    // 4. Booking yaratish
    const totalPrice = event.price * seats;
    const booking = await Booking.create([{
      user: req.user.id,
      event: eventId,
      seats,
      totalPrice,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      specialRequests,
      status: 'confirmed'
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: booking[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Foydalanuvchining barcha bookinglarini ko'rish
// @route   GET /api/bookings/my-bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title date location')
      .sort('-createdAt');
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bookingni bekor qilish (joyni qaytaradi)
// @route   DELETE /api/bookings/:id
const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Booking topilmadi' });
    }

    // Faqat o'z bookingini yoki admin bekor qila oladi
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({ success: false, error: 'Ruxsat yo‘q' });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Bu booking allaqachon bekor qilingan' });
    }

    // Eventni top va joylarni qaytar
    const event = await Event.findById(booking.event).session(session);
    if (event) {
      event.availableSeats += booking.seats;
      await event.save({ session });
    }

    booking.status = 'cancelled';
    await booking.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: 'Booking bekor qilindi', data: booking });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Event ishtirokchilari ro‘yxati
const getAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event topilmadi' });
    }

    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Ruxsat yo‘q' });
    }

    const attendees = await Booking.find({ event: req.params.eventId, status: 'confirmed' })
      .populate('user', 'name email')
      .select('attendeeName attendeeEmail attendeePhone seats specialRequests')
      .lean();

    res.json({ success: true, count: attendees.length, data: attendees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getAttendees };