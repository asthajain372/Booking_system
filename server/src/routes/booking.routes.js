// src/routes/booking.routes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All booking routes require authentication
router.use(authMiddleware.verifyToken);

// Create a new booking
router.post('/', bookingController.createBooking);

// Check booking availability
router.post('/check-availability', bookingController.checkAvailability);

// Get all bookings for the authenticated user
router.get('/', bookingController.getBookings);

// Cancel a booking
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;