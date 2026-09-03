import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingCreateRequest, BookingListResponse, BookingStatus } from '../../models/booking.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = `${environment.marketplaceApiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // POST /bookings — learner_id comes from the JWT server-side, mentor_id
  // is derived from the skill's instructor_id; the frontend only ever
  // sends skillId/sessionDate/sessionNotes.
  createBooking(request: BookingCreateRequest): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, request);
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  // GET /bookings/me?as_mentor=true|false — the same user can appear as
  // learner on some bookings and mentor on others, so the caller decides
  // which side to fetch. my-bookings.ts fetches both and merges them.
  getMyBookings(asMentor: boolean, skip = 0, limit = 100): Observable<BookingListResponse> {
    const params = { skip: String(skip), limit: String(limit), as_mentor: String(asMentor) };
    return this.http.get<BookingListResponse>(`${this.apiUrl}/me`, { params });
  }

  // PATCH /bookings/{id}/status — only the mentor (or admin) may move a
  // booking to CONFIRMED/COMPLETED; only learner/mentor/admin may CANCEL.
  // Backend enforces this — a disallowed attempt returns 403, which the
  // caller must handle, not assume success.
  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}/status`, { status });
  }

  // GET /bookings — admin-only, every booking in the system (unlike
  // /bookings/me, which is scoped to the caller). A non-admin caller
  // gets a 403; the admin booking-management page is the only consumer.
  getAllBookings(
    skip = 0,
    limit = 100,
    status?: BookingStatus,
  ): Observable<BookingListResponse> {
    const params: Record<string, string> = { skip: String(skip), limit: String(limit) };
    if (status) params['status'] = status;
    return this.http.get<BookingListResponse>(this.apiUrl, { params });
  }
}
