/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: Barcha eventlarni olish
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Eventlar ro‘yxati
 *   post:
 *     summary: Yangi event yaratish
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               ...
 *     responses:
 *       201:
 *         description: Event yaratildi
 */

const express = require('express');
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, hasRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Open routes (hamma ko'ra oladi)
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes (faqat organizer va admin)
router.post('/', protect, hasRole('organizer', 'admin'), createEvent);
router.put('/:id', protect, hasRole('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, hasRole('organizer', 'admin'), deleteEvent);

module.exports = router;