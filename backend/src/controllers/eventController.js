const Event = require('../models/Event');

// @desc    Yangi event yaratish (faqat organizer va admin)
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    const event = await Event.create(req.body);
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Barcha eventlarni ko'rish
// @route   GET /api/events
const getEvents = async (req, res) => {
  try {
    const { search, category, location, minDate, maxDate, sort } = req.query;
    let query = {};
    
    // Search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Location filter
    if (location) {
      query.location = location;
    }
    
    // Date range filter
    if (minDate || maxDate) {
      query.date = {};
      if (minDate) query.date.$gte = new Date(minDate);
      if (maxDate) query.date.$lte = new Date(maxDate);
    }
    
    let eventsQuery = Event.find(query).populate('createdBy', 'name email');
    
    // Sorting
    if (sort === 'price_asc') eventsQuery = eventsQuery.sort('price');
    else if (sort === 'price_desc') eventsQuery = eventsQuery.sort('-price');
    else if (sort === 'date_asc') eventsQuery = eventsQuery.sort('date');
    else if (sort === 'date_desc') eventsQuery = eventsQuery.sort('-date');
    else eventsQuery = eventsQuery.sort('-createdAt');
    
    const events = await eventsQuery;
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bitta eventni ko'rish
// @route   GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event topilmadi' });
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Eventni yangilash (faqat event yaratuvchisi yoki admin)
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event topilmadi' });
    }
    
    // Check permission: creator or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Faqat event yaratuvchisi yoki admin yangilay oladi' 
      });
    }
    
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Eventni o'chirish (faqat event yaratuvchisi yoki admin)
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event topilmadi' });
    }
    
    // Check permission: creator or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Faqat event yaratuvchisi yoki admin o\'chira oladi' 
      });
    }
    
    await event.deleteOne();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};