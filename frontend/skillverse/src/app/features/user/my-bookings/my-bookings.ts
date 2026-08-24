import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/services/auth/auth';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking, BookingStatus } from '../../../core/models/booking.model';

interface BookingViewModel {
  id: string;
  title: string;
  mentor: string; // always the OTHER party — mentor name if I'm learning, learner name if I'm hosting
  status: string;
  statusColorClass: string;
  statusIcon: string;
  time: string;
  avatar: string;
  selected: boolean;
  tab: 'Upcoming' | 'Completed' | 'Cancelled';
  actionable: boolean; // only CONFIRMED bookings can actually be joined
  banner: string;
  dateStr: string;
  timeStr: string;
}

const STATUS_DISPLAY: Record<BookingStatus, { label: string; colorClass: string; icon: string; tab: BookingViewModel['tab'] }> = {
  PENDING: {
    label: 'Pending',
    colorClass: 'bg-surface-container-highest text-on-surface-variant',
    icon: 'schedule',
    tab: 'Upcoming',
  },
  CONFIRMED: {
    label: 'Confirmed',
    colorClass: 'bg-primary-container text-on-primary-container',
    icon: 'check_circle',
    tab: 'Upcoming',
  },
  COMPLETED: {
    label: 'Completed',
    colorClass: 'bg-secondary-container text-on-secondary-container',
    icon: 'task_alt',
    tab: 'Completed',
  },
  CANCELLED: {
    label: 'Cancelled',
    colorClass: 'bg-error-container text-on-error-container',
    icon: 'cancel',
    tab: 'Cancelled',
  },
};

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.scss'],
})
export class MyBookings implements OnInit {
  activeTab: BookingViewModel['tab'] = 'Upcoming';
  tabs: BookingViewModel['tab'][] = ['Upcoming', 'Completed', 'Cancelled'];

  bookings: BookingViewModel[] = [];
  isLoading = true;

  constructor(
    private auth: AuthService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    // A user can be the learner on some bookings and the mentor
    // (hosting) on others — fetch both sides and merge, so this page
    // shows every session they're actually part of, not just half.
    forkJoin({
      asLearner: this.bookingService.getMyBookings(false),
      asMentor: this.bookingService.getMyBookings(true),
    }).subscribe({
      next: ({ asLearner, asMentor }) => {
        const currentUserId = this.auth.currentUser()?.id;
        const merged = [...asLearner.bookings, ...asMentor.bookings].map((b) =>
          this.toViewModel(b, currentUserId),
        );
        merged.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        this.bookings = merged;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load bookings:', err);
        this.isLoading = false;
      },
    });
  }

  private toViewModel(booking: Booking, currentUserId: string | undefined): BookingViewModel {
    const display = STATUS_DISPLAY[booking.status];
    const isHosting = booking.mentorId === currentUserId;
    const otherPartyName = (isHosting ? booking.learnerName : booking.mentorName) || 'Unknown';

    const sessionDate = new Date(booking.sessionDate);
    const dateStr = sessionDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = sessionDate.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });

    return {
      id: booking.id,
      title: booking.skillTitle || 'Skill Session',
      mentor: otherPartyName,
      status: display.label,
      statusColorClass: display.colorClass,
      statusIcon: display.icon,
      time: `${dateStr}, ${timeStr}`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPartyName)}`,
      selected: false,
      tab: display.tab,
      actionable: booking.status === 'CONFIRMED',
      banner: '',
      dateStr,
      timeStr,
    };
  }

  get filteredBookings(): BookingViewModel[] {
    return this.bookings.filter((b) => b.tab === this.activeTab);
  }

  get selectedBooking(): BookingViewModel | undefined {
    return this.bookings.find((b) => b.selected) || this.filteredBookings[0];
  }

  selectTab(tab: BookingViewModel['tab']): void {
    this.activeTab = tab;
  }

  selectBooking(id: string): void {
    this.bookings.forEach((b) => (b.selected = b.id === id));
  }
}
