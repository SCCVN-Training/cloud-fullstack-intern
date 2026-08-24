import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingCreateRequest } from '../../models/booking.model';
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
}
