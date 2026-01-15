// src/controllers/booking.controller.js
const { Booking } = require('../models');
const { Op } = require('sequelize');
const isOverlap = require('../utils/timeOverlap');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      bookingDate,
      bookingType,
      bookingSlot,
      startTime,
      endTime
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !bookingDate || !bookingType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Validate HALF day booking
    if (bookingType === "HALF" && !bookingSlot) {
      return res.status(400).json({
        success: false,
        message: "Booking slot is required for half day bookings"
      });
    }

    // Validate CUSTOM booking
    if (bookingType === "CUSTOM") {
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Start time and end time are required for custom bookings"
        });
      }
      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time"
        });
      }
    }

    // Check for existing bookings on the same date
    const existingBookings = await Booking.findAll({
      where: { 
        booking_date: bookingDate,
        status: { [Op.ne]: 'cancelled' }
      }
    });

    for (const existingBooking of existingBookings) {
      // FULL DAY BLOCKS EVERYTHING
      if (existingBooking.booking_type === "FULL") {
        return res.status(409).json({
          success: false,
          message: "Full day already booked on this date"
        });
      }

      // New FULL DAY cannot be created if anything exists
      if (bookingType === "FULL") {
        return res.status(409).json({
          success: false,
          message: "Cannot create full day booking when other bookings exist on this date"
        });
      }

      // HALF DAY SLOT CONFLICT
      if (bookingType === "HALF" && 
          existingBooking.booking_type === "HALF" && 
          existingBooking.booking_slot === bookingSlot) {
        return res.status(409).json({
          success: false,
          message: `Half day ${bookingSlot.toLowerCase()} slot already booked`
        });
      }

      // CUSTOM TIME OVERLAP
      if (bookingType === "CUSTOM" && existingBooking.booking_type === "CUSTOM") {
        if (isOverlap(startTime, endTime, existingBooking.start_time, existingBooking.end_time)) {
          return res.status(409).json({
            success: false,
            message: "Booking time overlaps with existing custom booking"
          });
        }
      }
    }

    // Create the booking
    const booking = await Booking.create({
      customer_name: customerName,
      customer_email: customerEmail,
      booking_date: bookingDate,
      booking_type: bookingType,
      booking_slot: bookingType === "HALF" ? bookingSlot : null,
      start_time: bookingType === "CUSTOM" ? startTime : null,
      end_time: bookingType === "CUSTOM" ? endTime : null,
      user_id: req.user.id,
      status: 'confirmed'
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        id: booking.id,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        bookingDate: booking.booking_date,
        bookingType: booking.booking_type,
        bookingSlot: booking.booking_slot,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error: error.message
    });
  }
};

// Check booking availability
exports.checkAvailability = async (req, res) => {
  try {
    const {
      bookingDate,
      bookingType,
      bookingSlot,
      startTime,
      endTime
    } = req.body;

    if (!bookingDate || !bookingType) {
      return res.status(400).json({
        success: false,
        message: "Booking date and type are required"
      });
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.findAll({
      where: { 
        booking_date: bookingDate,
        status: 'confirmed'
      }
    });

    let available = true;
    let message = "This slot is available";

    for (const existingBooking of existingBookings) {
      // Check conflicts based on booking type
      if (existingBooking.booking_type === "FULL") {
        available = false;
        message = "Full day already booked";
        break;
      }

      if (bookingType === "FULL") {
        available = false;
        message = "Cannot book full day when other bookings exist";
        break;
      }

      if (bookingType === "HALF" && 
          existingBooking.booking_type === "HALF" && 
          existingBooking.booking_slot === bookingSlot) {
        available = false;
        message = `Half day ${bookingSlot.toLowerCase()} slot already booked`;
        break;
      }

      if (bookingType === "CUSTOM" && existingBooking.booking_type === "CUSTOM") {
        if (isOverlap(startTime, endTime, existingBooking.start_time, existingBooking.end_time)) {
          available = false;
          message = "Time slot overlaps with existing booking";
          break;
        }
      }
    }

    res.json({
      success: true,
      available,
      message
    });

  } catch (error) {
    console.error("Availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking availability",
      error: error.message
    });
  }
};

// Get all bookings for the authenticated user
exports.getBookings = async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      status: 'confirmed',
      user_id: req.user.id
    };

    if (date) {
      where.booking_date = date;
    }

    // Get total count for pagination
    const total = await Booking.count({ where });

    // Get bookings with pagination
    const bookings = await Booking.findAll({
      where,
      order: [['booking_date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Transform the response
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      bookingDate: booking.booking_date,
      bookingType: booking.booking_type,
      bookingSlot: booking.booking_slot,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.json({
      success: true,
      data: {
        bookings: transformedBookings,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
      error: error.message
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Check if booking can be cancelled
    const bookingDate = new Date(booking.booking_date);
    const today = new Date();
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past bookings"
      });
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
      error: error.message
    });
  }
};