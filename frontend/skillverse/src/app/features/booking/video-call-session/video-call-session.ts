import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking } from '../../../core/models/booking.model';

const SESSION_LENGTH_SECONDS = 45 * 60;

@Component({
  selector: 'app-video-call-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call-session.html',
  styleUrls: ['./video-call-session.scss'],
})
export class VideoCallSession implements OnInit, OnDestroy {
  booking = signal<Booking | null>(null);
  isLoading = signal(true);
  loadError = signal('');

  // Whether the CURRENT logged-in user is the mentor on this booking —
  // matches the backend's own rule (only mentor/admin may mark a
  // booking COMPLETED), so a learner never sees a working End Session
  // control here, not just a hidden one.
  isHost = computed(() => {
    const b = this.booking();
    const currentUserId = this.auth.currentUser()?.id;
    return !!b && !!currentUserId && b.mentorId === currentUserId;
  });

  remainingSeconds = signal(SESSION_LENGTH_SECONDS);
  remainingLabel = computed(() => {
    const total = this.remainingSeconds();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });

  isEnding = signal(false);
  endError = signal('');

  private timerHandle?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.loadError.set('No session specified.');
      this.isLoading.set(false);
      return;
    }

    this.bookingService.getBookingById(bookingId).subscribe({
      next: (data) => {
        this.booking.set(data);
        this.isLoading.set(false);
        this.startTimer();
      },
      error: (err) => {
        console.error('Failed to load booking for video session:', err);
        this.loadError.set('Unable to load this session. Please go back and try again.');
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.timerHandle = setInterval(() => {
      const next = this.remainingSeconds() - 1;
      if (next <= 0) {
        this.remainingSeconds.set(0);
        this.clearTimer();
        // Auto-end on timeout — only the host actually completes the
        // booking; a learner just sees the call end locally, since they
        // don't have permission to change the booking's status anyway.
        if (this.isHost()) {
          this.endSession();
        }
        return;
      }
      this.remainingSeconds.set(next);
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  endSession(): void {
    const booking = this.booking();
    if (!booking || !this.isHost() || this.isEnding()) return;

    this.isEnding.set(true);
    this.endError.set('');
    this.clearTimer();

    this.bookingService.updateBookingStatus(booking.id, 'COMPLETED').subscribe({
      next: () => {
        this.router.navigate(['/session-review', booking.id]);
      },
      error: (err) => {
        console.error('Failed to complete booking:', err);
        this.isEnding.set(false);
        this.endError.set(
          err?.error?.detail || 'Could not end the session. Please try again.',
        );
        // Session isn't actually over from the backend's point of view —
        // resume the countdown rather than leaving the user stuck with a
        // dead timer and no way to retry.
        this.startTimer();
      },
    });
  }
}
