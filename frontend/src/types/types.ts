// // src/types/index.ts

// export type SignupForm = {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
// };

// export type SignupResponse = {
//   message: string;
//   verificationToken?: string;
// };

// export type LoginForm = {
//   email: string;
//   password: string;
// };

// export type LoginResponse = {
//   message: string;
//   token: string;
// };

// export type BookingForm = {
//   customerName: string;
//   customerEmail: string;
//   bookingDate: string;
//   bookingType: string;
//   bookingSlot: string;
//   startTime: string;
//   endTime: string;
// };

// export type BookingResponse = {
//   message: string;
// };

// types.ts
// types.ts

// types.ts
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface BookingForm {
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  bookingType: "FULL" | "HALF" | "CUSTOM";
  bookingSlot?: "FIRST" | "SECOND";
  startTime?: string;
  endTime?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  bookingType: "FULL" | "HALF" | "CUSTOM";
  bookingSlot?: "FIRST" | "SECOND";
  startTime?: string;
  endTime?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: 'confirmed' | 'cancelled';
}

export interface AvailabilityCheck {
  bookingDate: string;
  bookingType: "FULL" | "HALF" | "CUSTOM";
  bookingSlot?: "FIRST" | "SECOND";
  startTime?: string;
  endTime?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  message?: string;
  conflictingBookings?: Booking[];
}

export interface BookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
  availableToday: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}