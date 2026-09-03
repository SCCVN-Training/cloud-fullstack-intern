import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookingService } from '../../../core/services/booking/booking.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Booking as ApiBooking } from '../../../core/models/booking.model';

interface Booking {
  id: string;
  learner: string;
  learnerAvatar: string;
  mentor: string;
  mentorAvatar: string;
  scheduledDate: string;
  amount: number;
  status: BookingStatus;
  topic: string;
}

type BookingStatus = 'completed' | 'confirmed' | 'pending' | 'cancelled';

function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
}

function toViewModel(booking: ApiBooking): Booking {
  const learner = booking.learnerName || 'Unknown';
  const mentor = booking.mentorName || 'Unknown';
  return {
    id: booking.id,
    learner,
    learnerAvatar: avatarUrl(learner),
    mentor,
    mentorAvatar: avatarUrl(mentor),
    scheduledDate: new Date(booking.sessionDate).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    amount: booking.pricePaid,
    status: booking.status.toLowerCase() as BookingStatus,
    topic: booking.skillTitle || 'Skill Session',
  };
}

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-management.html',
  styleUrls: ['./booking-management.scss'],
})
export class BookingManagementComponent implements OnInit {
  // ========================================
  // Modal
  // ========================================

  isModalOpen = false;

  selectedBooking: Booking | null = null;

  // ========================================
  // Filters
  // ========================================

  selectedStatus = '';

  // ========================================
  // Pagination
  // ========================================

  currentPage = 1;

  readonly pageSize = 10;

  // ========================================
  // Booking Data
  // ========================================

  bookings: Booking[] = [];
  isLoading = signal(true);

  constructor(
    private bookingService: BookingService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.bookingService.getAllBookings(0, 100).subscribe({
      next: (res) => {
        this.bookings = res.bookings.map(toViewModel);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load bookings:', err);
        this.toastService.showError('Could not load bookings. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // ========================================
  // Computed Data
  // ========================================

  get filteredBookings(): Booking[] {
    if (!this.selectedStatus) {
      return this.bookings;
    }

    return this.bookings.filter((booking) => booking.status === this.selectedStatus);
  }

  get totalEntries(): number {
    return this.filteredBookings.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalEntries / this.pageSize));
  }

  get paginatedBookings(): Booking[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredBookings.slice(startIndex, startIndex + this.pageSize);
  }

  get showingFrom(): number {
    if (this.totalEntries === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    if (this.totalEntries === 0) {
      return 0;
    }

    return Math.min(this.currentPage * this.pageSize, this.totalEntries);
  }

  // ========================================
  // Filter
  // ========================================

  onStatusChange(): void {
    this.currentPage = 1;
  }

  // ========================================
  // Status
  // ========================================

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'completed':
        return 'Completed';

      case 'confirmed':
        return 'Confirmed';

      case 'pending':
        return 'Pending';

      case 'cancelled':
        return 'Cancelled';

      default:
        return status;
    }
  }

  // ========================================
  // Modal
  // ========================================

  openModal(booking: Booking): void {
    this.selectedBooking = booking;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedBooking = null;
  }

  // ========================================
  // Force Cancel
  // ========================================

  forceCancel(): void {
    const booking = this.selectedBooking;
    if (!booking) {
      return;
    }

    this.bookingService.updateBookingStatus(booking.id, 'CANCELLED').subscribe({
      next: () => {
        booking.status = 'cancelled';
        this.toastService.showSuccess('Booking cancelled.');
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to cancel booking:', err);
        this.toastService.showError(
          err?.error?.detail || 'Could not cancel this booking. Please try again.',
        );
      },
    });
  }

  // ========================================
  // Pagination
  // ========================================

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  // ========================================
  // CSV Export
  // ========================================

  exportCsv(): void {
    const rows = this.filteredBookings;

    if (rows.length === 0) {
      return;
    }

    const header = [
      'Booking ID',
      'Learner',
      'Mentor',
      'Scheduled Date',
      'Amount (SC)',
      'Status',
      'Topic',
    ];

    const csvRows = rows.map((booking) => [
      booking.id,
      booking.learner,
      booking.mentor,
      booking.scheduledDate,
      booking.amount,
      this.getStatusLabel(booking.status),
      booking.topic,
    ]);

    const csvContent = [header, ...csvRows]
      .map((row) => row.map((value) => this.escapeCsvValue(String(value))).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'skillverse-bookings.csv';

    link.click();

    URL.revokeObjectURL(url);
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }
}
