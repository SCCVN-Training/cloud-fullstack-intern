import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  pendingBookings = signal<Booking[]>([]);
  isLoadingPending = signal(true);

  // Tracks which booking currently has an Accept/Cancel request in
  // flight, so only that row's buttons disable — not the whole panel.
  processingBookingId = signal<string | null>(null);

  constructor(
    private bookingService: BookingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.bookingService.getMyBookings(true).subscribe({
      next: (res) => {
        this.pendingBookings.set(res.bookings.filter((b) => b.status === 'PENDING'));
        this.isLoadingPending.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending bookings:', err);
        this.isLoadingPending.set(false);
      },
    });
  }

  acceptBooking(booking: Booking): void {
    this.respondToBooking(booking, 'CONFIRMED', 'Booking accepted.');
  }

  cancelBooking(booking: Booking): void {
    this.respondToBooking(booking, 'CANCELLED', 'Booking cancelled.');
  }

  private respondToBooking(
    booking: Booking,
    status: 'CONFIRMED' | 'CANCELLED',
    successMessage: string,
  ): void {
    this.processingBookingId.set(booking.id);

    this.bookingService.updateBookingStatus(booking.id, status).subscribe({
      next: () => {
        // Accepted/cancelled bookings belong in Upcoming/Cancelled on
        // my-bookings now, not here — drop it from this pending view
        // rather than re-fetching the whole list.
        this.pendingBookings.set(this.pendingBookings().filter((b) => b.id !== booking.id));
        this.processingBookingId.set(null);
        this.toastService.showSuccess(successMessage);
      },
      error: (err) => {
        console.error('Failed to update booking status:', err);
        this.processingBookingId.set(null);
        this.toastService.showError(
          err?.error?.detail || 'Could not update this booking. Please try again.',
        );
      },
    });
  }
}
