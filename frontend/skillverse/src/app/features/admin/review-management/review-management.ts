import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ReviewStatus = 'normal' | 'flagged';

interface Review {
  id: number;
  reviewer: string;
  reviewerInitials: string;
  target: string;
  rating: number;
  content: string;
  date: string;
  status: ReviewStatus;
}

@Component({
  selector: 'app-review-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-management.html',
  styleUrls: ['./review-management.scss'],
})
export class ReviewManagementComponent {
  // ========================================
  // Filters
  // ========================================

  searchTerm = '';
  selectedStatus = '';

  // ========================================
  // Pagination
  // ========================================

  currentPage = 1;
  readonly pageSize = 10;

  // ========================================
  // Mock Review Data
  // ========================================

  readonly reviews: Review[] = [
    {
      id: 1,
      reviewer: 'Jane Smith',
      reviewerInitials: 'JS',
      target: 'Advanced React Patterns',
      rating: 5,
      content:
        'Incredible session! The breakdown of custom hooks was exactly what I needed to finish my project.',
      date: 'Oct 24, 2023',
      status: 'normal',
    },
    {
      id: 2,
      reviewer: 'Unknown Dev',
      reviewerInitials: 'UD',
      target: 'Intro to Python',
      rating: 1,
      content: 'Terrible mentor, waste of time.',
      date: 'Oct 23, 2023',
      status: 'flagged',
    },
    {
      id: 3,
      reviewer: 'Marcus P.',
      reviewerInitials: 'MP',
      target: 'UI/UX Basics',
      rating: 4,
      content: 'Good intro, but wish we spent more time on Figma prototyping.',
      date: 'Oct 22, 2023',
      status: 'normal',
    },
    {
      id: 4,
      reviewer: 'Sarah Lee',
      reviewerInitials: 'SL',
      target: 'TypeScript Fundamentals',
      rating: 5,
      content: 'Very clear explanation and practical examples. The session was easy to follow.',
      date: 'Oct 21, 2023',
      status: 'normal',
    },
    {
      id: 5,
      reviewer: 'David Kim',
      reviewerInitials: 'DK',
      target: 'Python Data Analysis',
      rating: 3,
      content: 'The session was useful, although I think we could have covered more examples.',
      date: 'Oct 20, 2023',
      status: 'normal',
    },
    {
      id: 6,
      reviewer: 'Emily Tran',
      reviewerInitials: 'ET',
      target: 'Angular Development',
      rating: 5,
      content: 'Excellent mentor and very helpful feedback throughout the session.',
      date: 'Oct 19, 2023',
      status: 'normal',
    },
    {
      id: 7,
      reviewer: 'Michael Brown',
      reviewerInitials: 'MB',
      target: 'UI Design Principles',
      rating: 2,
      content:
        'The session did not match the description and several questions were left unanswered.',
      date: 'Oct 18, 2023',
      status: 'flagged',
    },
    {
      id: 8,
      reviewer: 'Lisa Nguyen',
      reviewerInitials: 'LN',
      target: 'JavaScript Essentials',
      rating: 4,
      content: 'Helpful session with a good balance between theory and practical examples.',
      date: 'Oct 17, 2023',
      status: 'normal',
    },
    {
      id: 9,
      reviewer: 'Chris Wilson',
      reviewerInitials: 'CW',
      target: 'Git & GitHub',
      rating: 5,
      content: 'Great explanation of branching strategies and pull requests.',
      date: 'Oct 16, 2023',
      status: 'normal',
    },
    {
      id: 10,
      reviewer: 'Anna Garcia',
      reviewerInitials: 'AG',
      target: 'Database Fundamentals',
      rating: 4,
      content: 'Good introduction to relational databases and SQL queries.',
      date: 'Oct 15, 2023',
      status: 'normal',
    },
    {
      id: 11,
      reviewer: 'Robert Chen',
      reviewerInitials: 'RC',
      target: 'REST API Design',
      rating: 5,
      content: 'Very practical and well structured. I learned a lot from this session.',
      date: 'Oct 14, 2023',
      status: 'normal',
    },
    {
      id: 12,
      reviewer: 'Kevin Jones',
      reviewerInitials: 'KJ',
      target: 'React Hooks',
      rating: 1,
      content: 'The mentor was extremely unhelpful and the session was inappropriate.',
      date: 'Oct 13, 2023',
      status: 'flagged',
    },
  ];

  // ========================================
  // Computed Data
  // ========================================

  get filteredReviews(): Review[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.reviews.filter((review) => {
      const matchesSearch =
        !search ||
        review.reviewer.toLowerCase().includes(search) ||
        review.target.toLowerCase().includes(search) ||
        review.content.toLowerCase().includes(search);

      const matchesStatus = !this.selectedStatus || review.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedReviews(): Review[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredReviews.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReviews.length / this.pageSize));
  }

  get totalReviews(): number {
    return this.reviews.length;
  }

  get flaggedReviews(): number {
    return this.reviews.filter((review) => review.status === 'flagged').length;
  }

  get averageRating(): number {
    if (this.reviews.length === 0) {
      return 0;
    }

    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);

    return Number((total / this.reviews.length).toFixed(1));
  }

  get showingFrom(): number {
    if (this.filteredReviews.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReviews.length);
  }

  // ========================================
  // Filter Handling
  // ========================================

  onFilterChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 1;
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
  // Review Actions
  // ========================================

  deleteReview(review: Review): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete the review from ${review.reviewer}?`,
    );

    if (!confirmed) {
      return;
    }

    const index = this.reviews.findIndex((item) => item.id === review.id);

    if (index === -1) {
      return;
    }

    this.reviews.splice(index, 1);

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  viewReview(review: Review): void {
    window.alert(
      `Review by ${review.reviewer}\n\n` +
        `Target: ${review.target}\n` +
        `Rating: ${review.rating}/5\n\n` +
        review.content,
    );
  }

  // ========================================
  // Helpers
  // ========================================

  getRatingStars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, index) => (index < rating ? 1 : 0));
  }

  getStatusLabel(status: ReviewStatus): string {
    return status === 'flagged' ? 'Flagged' : 'Normal';
  }

  trackByReviewId(_index: number, review: Review): number {
    return review.id;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];

    const start = Math.max(1, this.currentPage - 1);
    const end = Math.min(this.totalPages, start + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }
}
