// Booking.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createBooking, checkAvailability, getBookings, cancelBooking } from "../api/api";
import { BookingForm, Booking } from "../types/types";
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Loader2, 
  AlertCircle, 
  Check, 
  X, 
  CalendarDays,
  BarChart3,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import debounce from "lodash/debounce";

export default function BookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<BookingForm>({
    customerName: "",
    customerEmail: "",
    bookingDate: "",
    bookingType: "FULL",
    bookingSlot: undefined,
    startTime: "",
    endTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    status: "available" | "unavailable" | "checking" | null;
    message?: string;
  }>({ status: null });
  const [activeTab, setActiveTab] = useState<"create" | "view">("create");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  // Fetch bookings with pagination
  const { 
    data: bookingsData, 
    isLoading: isLoadingBookings,
    refetch: refetchBookings 
  } = useQuery({
    queryKey: ["bookings", filterDate, currentPage],
    queryFn: () => getBookings(filterDate, currentPage, itemsPerPage),
    enabled: !!token && activeTab === "view",
    staleTime: 30000, // Cache for 30 seconds
  });

  // Debounced availability check
  const debouncedCheckAvailability = useCallback(
    debounce(async (formData: BookingForm) => {
      if (!formData.bookingDate) return;

      const requiredFieldsValid = 
        formData.bookingType === "FULL" || 
        (formData.bookingType === "HALF" && formData.bookingSlot) ||
        (formData.bookingType === "CUSTOM" && formData.startTime && formData.endTime);

      if (!requiredFieldsValid) return;

      setAvailabilityStatus({ status: "checking" });

      try {
        const response = await checkAvailability({
          bookingDate: formData.bookingDate,
          bookingType: formData.bookingType,
          bookingSlot: formData.bookingSlot,
          startTime: formData.startTime || "",
          endTime: formData.endTime || ""
        });
        
        setAvailabilityStatus({ 
          status: response.available ? "available" : "unavailable",
          message: response.message
        });
      } catch (error: any) {
        setAvailabilityStatus({ 
          status: "unavailable", 
          message: error.response?.data?.message || "Error checking availability" 
        });
      }
    }, 800), // Increased debounce time for better performance
    []
  );

  // Trigger availability check when relevant fields change
  useEffect(() => {
    debouncedCheckAvailability(form);
    return () => debouncedCheckAvailability.cancel();
  }, [form, debouncedCheckAvailability]);

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: (data: BookingForm) => createBooking(data),
    onSuccess: () => {
      // Show success message
      alert("🎉 Booking created successfully!");
      // Reset form
      setForm({
        customerName: "",
        customerEmail: "",
        bookingDate: "",
        bookingType: "FULL",
        bookingSlot: undefined,
        startTime: "",
        endTime: "",
      });
      setErrors({});
      setAvailabilityStatus({ status: null });
      // Refresh bookings list
      refetchBookings();
    },
    onError: (err: any) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else if (err.response?.status === 409) {
        setErrors({ 
          general: "Booking slot is already taken. Please choose another time." 
        });
        setAvailabilityStatus({ 
          status: "unavailable", 
          message: "This slot is already booked" 
        });
      } else {
        setErrors({ 
          general: err.response?.data?.message || "Error creating booking. Please try again." 
        });
      }
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      alert("Booking cancelled successfully!");
      refetchBookings();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Error cancelling booking");
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    
    if (!form.customerEmail) {
      newErrors.customerEmail = "Customer email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.customerEmail)) {
      newErrors.customerEmail = "Email is invalid";
    }
    
    if (!form.bookingDate) {
      newErrors.bookingDate = "Booking date is required";
    }
    
    if (form.bookingType === "HALF" && !form.bookingSlot) {
      newErrors.bookingSlot = "Please select a booking slot";
    }
    
    if (form.bookingType === "CUSTOM") {
      if (!form.startTime) {
        newErrors.startTime = "Start time is required";
      }
      if (!form.endTime) {
        newErrors.endTime = "End time is required";
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        newErrors.endTime = "End time must be after start time";
      }
      if (form.startTime && form.endTime) {
        const start = new Date(`2000-01-01T${form.startTime}`);
        const end = new Date(`2000-01-01T${form.endTime}`);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
        if (duration > 12) {
          newErrors.endTime = "Maximum booking duration is 12 hours";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle booking type change specially
    if (name === "bookingType") {
      const bookingType = value as "FULL" | "HALF" | "CUSTOM";
      setForm({
        ...form,
        bookingType,
        bookingSlot: bookingType === "HALF" ? form.bookingSlot : undefined,
        startTime: bookingType === "CUSTOM" ? form.startTime : "",
        endTime: bookingType === "CUSTOM" ? form.endTime : "",
      });
    } else if (name === "bookingSlot") {
      setForm({
        ...form,
        bookingSlot: value as "FIRST" | "SECOND"
      });
    } else {
      setForm({ ...form, [name]: value });
    }
    
    // Clear errors
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (errors.general) {
      setErrors({ ...errors, general: "" });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm() && availabilityStatus.status === "available") {
      createMutation.mutate(form);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(bookingId);
    }
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  // Format time for display
  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get slot display text
  const getSlotDisplay = (booking: Booking) => {
    switch (booking.bookingType) {
      case "FULL":
        return "Full Day (9 AM - 6 PM)";
      case "HALF":
        return `Half Day (${booking.bookingSlot === "FIRST" ? "Morning (9 AM - 1 PM)" : "Afternoon (2 PM - 6 PM)"})`;
      case "CUSTOM":
        return `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`;
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📅 Booking Management System</h1>
            <p className="text-gray-600 mt-1">Efficiently manage your appointments with our high-performance system</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Performance:</span> 
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Optimized for 10k+ daily bookings
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("create")}
              className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "create"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Calendar className="inline-block w-4 h-4 mr-2" />
              Create Booking
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "view"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDays className="inline-block w-4 h-4 mr-2" />
              View Bookings
              {bookingsData?.total && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {bookingsData.total}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "create" ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Panel - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Create New Booking</h2>
                    <p className="text-gray-600 mt-2">Fill in the details to create a new booking</p>
                  </div>

                  {/* General Error */}
                  {errors.general && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-pulse">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 text-sm">{errors.general}</span>
                    </div>
                  )}

                  {/* Availability Status */}
                  {availabilityStatus.status && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                      availabilityStatus.status === "available" 
                        ? "bg-green-50 border border-green-200" 
                        : availabilityStatus.status === "checking"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-red-50 border border-red-200"
                    }`}>
                      {availabilityStatus.status === "available" && (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      {availabilityStatus.status === "checking" && (
                        <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin" />
                      )}
                      {availabilityStatus.status === "unavailable" && (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        availabilityStatus.status === "available" 
                          ? "text-green-700" 
                          : availabilityStatus.status === "checking"
                          ? "text-blue-700"
                          : "text-red-700"
                      }`}>
                        {availabilityStatus.status === "checking" 
                          ? "Checking availability..." 
                          : availabilityStatus.message || 
                            (availabilityStatus.status === "available" 
                              ? "This slot is available!" 
                              : "This slot is not available")}
                      </span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            name="customerName"
                            placeholder="John Doe"
                            value={form.customerName}
                            onChange={handleChange}
                            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${
                              errors.customerName ? "border-red-300 bg-red-50" : "border-gray-300"
                            }`}
                            disabled={createMutation.isPending}
                          />
                        </div>
                        {errors.customerName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.customerName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            name="customerEmail"
                            type="email"
                            placeholder="customer@example.com"
                            value={form.customerEmail}
                            onChange={handleChange}
                            className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${
                              errors.customerEmail ? "border-red-300 bg-red-50" : "border-gray-300"
                            }`}
                            disabled={createMutation.isPending}
                          />
                        </div>
                        {errors.customerEmail && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.customerEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Booking Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          name="bookingDate"
                          value={form.bookingDate}
                          onChange={handleChange}
                          min={today}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${
                            errors.bookingDate ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                          disabled={createMutation.isPending}
                        />
                      </div>
                      {errors.bookingDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.bookingDate}
                        </p>
                      )}
                    </div>

                    {/* Booking Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "FULL", label: "Full Day", description: "9 AM - 6 PM" },
                          { value: "HALF", label: "Half Day", description: "Morning or Afternoon" },
                          { value: "CUSTOM", label: "Custom", description: "Choose your time" }
                        ].map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleChange({ 
                              target: { name: "bookingType", value: type.value } 
                            } as any)}
                            className={`p-4 text-left rounded-lg border transition-all ${
                              form.bookingType === type.value
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium text-gray-800">{type.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Booking Slot (for HALF day) */}
                    {form.bookingType === "HALF" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Booking Slot
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "FIRST", label: "First Half", time: "9 AM - 1 PM" },
                            { value: "SECOND", label: "Second Half", time: "2 PM - 6 PM" }
                          ].map((slot) => (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => handleChange({ 
                                target: { name: "bookingSlot", value: slot.value } 
                              } as any)}
                              className={`p-4 text-left rounded-lg border transition-all ${
                                form.bookingSlot === slot.value
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium text-gray-800">{slot.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{slot.time}</div>
                            </button>
                          ))}
                        </div>
                        {errors.bookingSlot && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.bookingSlot}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Custom Time (for CUSTOM booking) */}
                    {form.bookingType === "CUSTOM" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="time"
                              name="startTime"
                              value={form.startTime}
                              onChange={handleChange}
                              min="09:00"
                              max="18:00"
                              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${
                                errors.startTime ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              disabled={createMutation.isPending}
                            />
                          </div>
                          {errors.startTime && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.startTime}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="time"
                              name="endTime"
                              value={form.endTime}
                              onChange={handleChange}
                              min={form.startTime || "09:00"}
                              max="18:00"
                              className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none ${
                                errors.endTime ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              disabled={createMutation.isPending}
                            />
                          </div>
                          {errors.endTime && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.endTime}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={createMutation.isPending || availabilityStatus.status !== "available"}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Creating Booking...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-5 w-5" />
                          Create Booking
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Panel - Rules & Info */}
            <div>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Booking Rules
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">To prevent scheduling conflicts:</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">❌ No Overlapping Bookings</h4>
                      <ul className="text-sm text-red-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Full day blocks entire day</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Half day blocks corresponding half</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Custom bookings block overlapping times</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📅 Business Hours</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Monday - Friday: 9 AM - 6 PM</li>
                        <li>• Saturday: 9 AM - 1 PM</li>
                        <li>• Sunday: Closed</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">⚡ System Performance</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Optimized for 10k+ daily bookings</li>
                        <li>• Handles 1M+ existing records</li>
                        <li>• Real-time availability checks</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3">📊 Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{bookingsData?.total || 0}</div>
                        <div className="text-xs text-gray-600">Total Bookings</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{bookingsData?.availableToday || 0}</div>
                        <div className="text-xs text-gray-600">Available Today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View Bookings Tab */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">All Bookings</h2>
                <p className="text-gray-600 mt-2">View and manage your bookings</p>
              </div>

              {/* Filters */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => {
                        setFilterDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Filter by date"
                    />
                    <button
                      onClick={() => {
                        setFilterDate("");
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings Table */}
              {isLoadingBookings ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading bookings...</p>
                </div>
              ) : bookingsData?.bookings?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
                  <p className="mt-1 text-gray-500">Try changing your filters or create a new booking.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookingsData?.bookings?.map((booking: Booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-medium text-gray-900">{booking.customerName}</div>
                                <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getSlotDisplay(booking)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                booking.bookingType === "FULL" 
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.bookingType === "HALF"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {booking.bookingType === "FULL" ? "Full Day" :
                                 booking.bookingType === "HALF" ? "Half Day" : "Custom"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                booking.status === 'confirmed'
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {booking.status === 'confirmed' && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancelMutation.isPending}
                                  className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {bookingsData && bookingsData.total > itemsPerPage && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, bookingsData.total)}
                        </span> of{' '}
                        <span className="font-medium">{bookingsData.total}</span> results
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {currentPage} of {Math.ceil(bookingsData.total / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => 
                            prev < Math.ceil(bookingsData.total / itemsPerPage) ? prev + 1 : prev
                          )}
                          disabled={currentPage >= Math.ceil(bookingsData.total / itemsPerPage)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Booking Management System • Optimized for high-volume operations • {new Date().getFullYear()}</p>
          <p className="mt-1">Handles 10k+ daily bookings with 1M+ existing records</p>
        </div>
      </footer>
    </div>
  );
}