import { Component, OnDestroy, OnInit, signal, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking } from '../../../core/models/booking.model';

const SESSION_LENGTH_SECONDS = 45 * 60;
const JITSI_DOMAIN = 'meet.jit.si';
const JITSI_SCRIPT_URL = `https://${JITSI_DOMAIN}/external_api.js`;

// Loaded from Jitsi's own script, not an npm package — no real published
// types for it, so this is a deliberately minimal shape covering only
// what's actually used below.
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void;
    };
  }
}

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
  private pollHandle?: ReturnType<typeof setInterval>;
  private jitsiApi: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private bookingService: BookingService,
  ) {
    afterNextRender(() => {
      if (this.booking() && !this.jitsiApi) {
        this.initJitsi();
      }
    });
  }

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
        if (!this.isHost()) {
          this.startStatusPoll(bookingId);
        }
        requestAnimationFrame(() => this.initJitsi());
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
    this.clearStatusPoll();
    this.jitsiApi?.dispose();
  }

  // Learner-only: she has no end-session button of her own (only the
  // mentor can end a session), so the only way she learns the session is
  // over is by polling for the status change the mentor's endSession()
  // causes. 5s is plenty for a 45-min session.
  private startStatusPoll(bookingId: string): void {
    this.pollHandle = setInterval(() => {
      this.bookingService.getBookingById(bookingId).subscribe({
        next: (data) => {
          if (data.status === 'COMPLETED') {
            this.clearStatusPoll();
            this.router.navigate(['/session-review', bookingId]);
          } else if (data.status !== 'CONFIRMED') {
            // e.g. CANCELLED — nothing to review, just get her out of
            // a call that isn't happening rather than polling forever.
            this.clearStatusPoll();
            this.router.navigate(['/user/my-bookings']);
          }
        },
        error: (err) => {
          // A transient network blip isn't worth surfacing to a user who
          // didn't initiate this request — just skip the tick and retry.
          console.error('Booking status poll failed:', err);
        },
      });
    }, 5000);
  }

  private clearStatusPoll(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = undefined;
    }
  }

  private loadJitsiScript(): Promise<void> {
    if (window.JitsiMeetExternalAPI) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${JITSI_SCRIPT_URL}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.src = JITSI_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi Meet script'));
      document.head.appendChild(script);
    });
  }

  private async initJitsi(): Promise<void> {
    if (this.jitsiApi) return;
    const booking = this.booking();
    const container = document.getElementById('jitsi-container');
    if (!booking || !container) return;

    try {
      await this.loadJitsiScript();
    } catch (err) {
      console.error(err);
      this.loadError.set('Could not load the video call. Check your connection and reload.');
      return;
    }

    if (!window.JitsiMeetExternalAPI) return;

    const roomName = `skillverse-${booking.id}`;
    const displayName = this.auth.currentUser()?.name || 'SkillVerse User';

    this.jitsiApi = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName,
      parentNode: container,
      userInfo: { displayName },
      configOverwrite: {
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    });
  }

  private startTimer(): void {
    this.timerHandle = setInterval(() => {
      const next = this.remainingSeconds() - 1;
      if (next <= 0) {
        this.remainingSeconds.set(0);
        this.clearTimer();
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
      next: (updated) => {
        // Reviews are learner-only, so the mentor who just ended the
        // session goes to her bookings list, not session-review. She's
        // still the one who needs to know if HER payout failed to
        // credit, though — creditStatus only ever appears on this PATCH
        // response, so it has to be forwarded via navigation state here,
        // not re-fetched later.
        this.router.navigate(['/user/my-bookings'], {
          state: { creditFailed: updated.creditStatus === 'FAILED', bookingId: booking.id },
        });
      },
      error: (err) => {
        console.error('Failed to complete booking:', err);
        this.isEnding.set(false);
        this.endError.set(
          err?.error?.detail || 'Could not end the session. Please try again.',
        );
        this.startTimer();
      },
    });
  }
}
