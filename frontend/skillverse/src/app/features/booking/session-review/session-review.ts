import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../core/services/booking/booking.service';
import { ReviewService } from '../../../core/services/review/review.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-session-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-review.html',
  styleUrl: './session-review.scss',
})
export class SessionReview implements OnInit {
  readonly stars = [1, 2, 3, 4, 5];

  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  // Forwarded via router navigation state from video-call-session's
  // endSession() — creditStatus isn't persisted on the booking, so a
  // fresh GET /bookings/{id} here (below) can't recover it. history.state
  // (not Router.getCurrentNavigation(), which is only populated during
  // the navigation itself, not by the time ngOnInit runs) is how Angular
  // exposes it to the destination component.
  creditFailed = signal(false);

  overallRating = 0;
  knowledgeRating = 0;
  communicationRating = 0;
  videoAudioRating = 0;
  feedback = '';

  isSubmitting = signal(false);
  submitError = signal('');
  submitted = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.creditFailed.set(!!history.state?.['creditFailed']);

    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.loadError.set('No session specified to review.');
      this.isLoading.set(false);
      return;
    }

    this.bookingService.getBookingById(bookingId).subscribe({
      next: (data) => {
        this.booking.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load booking for review:', err);
        this.loadError.set('Unable to load this session. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  get canSubmit(): boolean {
    return this.overallRating > 0 && !this.isSubmitting();
  }

  setOverallRating(rating: number): void {
    this.overallRating = rating;
  }

  setKnowledgeRating(rating: number): void {
    this.knowledgeRating = rating;
  }

  setCommunicationRating(rating: number): void {
    this.communicationRating = rating;
  }

  setVideoAudioRating(rating: number): void {
    this.videoAudioRating = rating;
  }

  submitReview(): void {
    const booking = this.booking();
    if (!booking || !this.canSubmit) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');

    // Only the learner may review, and only once the booking is
    // COMPLETED — enforced server-side; a violation surfaces here as a
    // real error, not a silent no-op.
    this.reviewService
      .submitReview(booking.id, {
        rating: this.overallRating,
        knowledge_rating: this.knowledgeRating,
        communication_rating: this.communicationRating,
        video_audio_rating: this.videoAudioRating,
        feedback: this.feedback.trim() || null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.submitted.set(true);
          setTimeout(() => this.router.navigate(['/user/my-bookings']), 1500);
        },
        error: (err) => {
          console.error('Failed to submit review:', err);
          this.isSubmitting.set(false);
          this.submitError.set(
            err?.error?.detail || 'Could not submit your review. Please try again.',
          );
        },
      });
  }
}
