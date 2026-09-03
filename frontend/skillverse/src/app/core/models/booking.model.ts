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
  // Only set on the response to a status update that transitioned this
  // booking to COMPLETED — 'CREDITED' or 'FAILED'. Absent otherwise.
  // Booking completion itself never fails because of a wallet issue; this
  // is purely visibility into whether the mentor's payout landed.
  creditStatus?: 'CREDITED' | 'FAILED';
}

// Matches marketplace-service's BookingListResponse.
export interface BookingListResponse {
  total: number;
  bookings: Booking[];
}
