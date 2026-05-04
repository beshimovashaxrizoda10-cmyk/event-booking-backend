const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const imgbbUploader = require('imgbb-uploader');
const morgan = require('morgan');
const { logger } = require('./src/utils/logger');
const { protect, hasRole } = require('./src/middlewares/authMiddleware');

const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB ulanish
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch((err) => console.log('❌ MongoDB error:', err.message));

// ImgBB uchun multer sozlamalari (xotiraga saqlash)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Rasm yuklash endpointi (ImgBB)
app.post('/api/upload', protect, hasRole('admin', 'organizer'), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Rasm fayli kerak' });
  }
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'IMGBB_API_KEY topilmadi' });
  }
  try {
    const formData = new FormData();
    formData.append('image', req.file.buffer.toString('base64')); // ImgBB base64 qabul qiladi
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      res.json({ success: true, imageUrl: data.data.url });
    } else {
      throw new Error(data.error?.message || 'ImgBB xatosi');
    }
  } catch (err) {
    console.error('Rasm yuklash xatosi:', err);
    res.status(500).json({ success: false, error: 'Rasm yuklashda xatolik' });
  }
});
// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/events', require('./src/routes/eventRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));

// Health check va boshqa endpointlar
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Event Booking System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Morgan loglarini winstonga yozish
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));

// Error handler (eng oxirida)
app.use((err, req, res, next) => {
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.statusCode || 500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Health: http://localhost:${PORT}/health`);
  logger.info(`📊 Status: http://localhost:${PORT}/status`);
});