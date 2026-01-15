// api.ts
import axios from "axios";
import { 
  LoginForm, 
  SignupForm, 
  BookingForm, 
  AvailabilityCheck,
  AvailabilityResponse,
  BookingsResponse 
} from "../types/types";

const api = axios.create({ 
  baseURL: "http://localhost:5000/api",
  timeout: 10000 // 10 second timeout
});

// Add request interceptor for token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const signup = (data: SignupForm) => 
  api.post("/auth/signup", data).then(res => res.data);

export const login = (data: LoginForm) => 
  api.post("/auth/login", data).then(res => res.data);

// Booking APIs
export const createBooking = (data: BookingForm) => 
  api.post("/bookings", data).then(res => res.data);

export const checkAvailability = (data: AvailabilityCheck): Promise<AvailabilityResponse> => 
  api.post("/bookings/check-availability", data).then(res => res.data);

export const getBookings = (
  filterDate?: string, 
  page: number = 1, 
  limit: number = 10
): Promise<BookingsResponse> => {
  const params = new URLSearchParams();
  if (filterDate) params.append('date', filterDate);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  return api.get(`/bookings?${params.toString()}`).then(res => res.data);
};

export const cancelBooking = (bookingId: string) => 
  api.delete(`/bookings/${bookingId}`).then(res => res.data);

export const getBookingStats = () => 
  api.get("/bookings/stats").then(res => res.data);

// Export API instance for custom requests
export default api;