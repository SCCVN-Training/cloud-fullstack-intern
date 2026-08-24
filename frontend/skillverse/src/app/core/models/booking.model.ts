export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// Matches marketplace-service's BookingCreate (camelCase over the wire —
// alias_generator=to_camel on the backend).
export interface BookingCreateRequest {
  skillId: string;
  sessionDate: string; // ISO 8601 — new Date(...).toISOString()
  sessionNotes?: string;
}

// Matches marketplace-service's BookingResponse.
export interface Booking {
  id: string;
  skillId: string;
  learnerId: string;
  mentorId: string;
  sessionDate: string;
  sessionNotes?: string;
  status: BookingStatus;
  pricePaid: number;
  createdAt: string;
  updatedAt: string;
  skillTitle?: string;
  learnerName?: string;
  mentorName?: string;
}

// Matches marketplace-service's BookingListResponse.
export interface BookingListResponse {
  total: number;
  bookings: Booking[];
}
