import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReviewCreateRequest, ReviewItemResponse } from './review.types';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = environment.marketplaceApiUrl;

  constructor(private http: HttpClient) {}

  // POST /bookings/{bookingId}/reviews — only the learner on a COMPLETED
  // booking may call this, and only once (enforced server-side).
  submitReview(bookingId: string, request: ReviewCreateRequest): Observable<ReviewItemResponse> {
    return this.http.post<ReviewItemResponse>(
      `${this.apiUrl}/bookings/${bookingId}/reviews`,
      request,
    );
  }
}
