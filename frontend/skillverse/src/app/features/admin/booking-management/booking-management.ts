import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-management.html',
  styleUrls: ['./booking-management.scss'],
})
export class BookingManagementComponent {
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

  readonly bookings: Booking[] = [
    {
      id: 'BK-1001',
      learner: 'Emma Johnson',
      learnerAvatar: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=fce7f3&color=a43073',
      mentor: 'Olivia Smith',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Olivia+Smith&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 10, 2026 · 10:00 AM',
      amount: 250,
      status: 'completed',
      topic: 'Advanced Watercolor Techniques',
    },
    {
      id: 'BK-1002',
      learner: 'James Wilson',
      learnerAvatar: 'https://ui-avatars.com/api/?name=James+Wilson&background=fce7f3&color=a43073',
      mentor: 'Sophia Brown',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Sophia+Brown&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 10, 2026 · 2:00 PM',
      amount: 180,
      status: 'confirmed',
      topic: 'Digital Photography',
    },
    {
      id: 'BK-1003',
      learner: 'Michael Davis',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Michael+Davis&background=fce7f3&color=a43073',
      mentor: 'Ava Taylor',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Ava+Taylor&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 11, 2026 · 9:30 AM',
      amount: 320,
      status: 'pending',
      topic: 'Creative Writing',
    },
    {
      id: 'BK-1004',
      learner: 'William Miller',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=William+Miller&background=fce7f3&color=a43073',
      mentor: 'Isabella Anderson',
      mentorAvatar:
        'https://ui-avatars.com/api/?name=Isabella+Anderson&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 11, 2026 · 3:00 PM',
      amount: 150,
      status: 'confirmed',
      topic: 'Guitar Fundamentals',
    },
    {
      id: 'BK-1005',
      learner: 'Charlotte Moore',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Charlotte+Moore&background=fce7f3&color=a43073',
      mentor: 'Mia Thomas',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Mia+Thomas&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 12, 2026 · 11:00 AM',
      amount: 275,
      status: 'pending',
      topic: 'UI/UX Design',
    },
    {
      id: 'BK-1006',
      learner: 'Daniel Jackson',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Daniel+Jackson&background=fce7f3&color=a43073',
      mentor: 'Amelia White',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Amelia+White&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 12, 2026 · 4:30 PM',
      amount: 200,
      status: 'completed',
      topic: 'Python Programming',
    },
    {
      id: 'BK-1007',
      learner: 'Benjamin Harris',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Benjamin+Harris&background=fce7f3&color=a43073',
      mentor: 'Harper Martin',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Harper+Martin&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 13, 2026 · 10:00 AM',
      amount: 220,
      status: 'cancelled',
      topic: 'Public Speaking',
    },
    {
      id: 'BK-1008',
      learner: 'Evelyn Thompson',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Evelyn+Thompson&background=fce7f3&color=a43073',
      mentor: 'Evelyn Garcia',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Evelyn+Garcia&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 13, 2026 · 1:30 PM',
      amount: 190,
      status: 'confirmed',
      topic: 'Spanish Conversation',
    },
    {
      id: 'BK-1009',
      learner: 'Alexander Martinez',
      learnerAvatar:
        'https://ui-avatars.com/api/?name=Alexander+Martinez&background=fce7f3&color=a43073',
      mentor: 'Ella Robinson',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Ella+Robinson&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 14, 2026 · 9:00 AM',
      amount: 300,
      status: 'completed',
      topic: 'Financial Planning',
    },
    {
      id: 'BK-1010',
      learner: 'Sofia Clark',
      learnerAvatar: 'https://ui-avatars.com/api/?name=Sofia+Clark&background=fce7f3&color=a43073',
      mentor: 'Liam Lewis',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Liam+Lewis&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 14, 2026 · 5:00 PM',
      amount: 175,
      status: 'pending',
      topic: 'Excel & Data Analysis',
    },
    {
      id: 'BK-1011',
      learner: 'Lucas Lee',
      learnerAvatar: 'https://ui-avatars.com/api/?name=Lucas+Lee&background=fce7f3&color=a43073',
      mentor: 'Grace Walker',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Grace+Walker&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 15, 2026 · 10:30 AM',
      amount: 240,
      status: 'confirmed',
      topic: 'Content Creation',
    },
    {
      id: 'BK-1012',
      learner: 'Henry Hall',
      learnerAvatar: 'https://ui-avatars.com/api/?name=Henry+Hall&background=fce7f3&color=a43073',
      mentor: 'Lily Allen',
      mentorAvatar: 'https://ui-avatars.com/api/?name=Lily+Allen&background=eaddff&color=6750a4',
      scheduledDate: 'Aug 15, 2026 · 2:30 PM',
      amount: 210,
      status: 'completed',
      topic: 'Marketing Strategy',
    },
  ];

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
    if (!this.selectedBooking) {
      return;
    }

    this.selectedBooking.status = 'cancelled';

    this.closeModal();
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
