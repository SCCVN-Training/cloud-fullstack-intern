import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-carousel.html',
  styleUrls: ['./review-carousel.scss'],
})
export class ReviewCarousel {
  @Input() skill: any;

  currentReviewIndex = 0;

  reviewsPerPage = 2;

  get reviews() {
    return [
      {
        id: 1,
        initials: 'JD',
        initialsClass: 'initials-jd',
        name: 'James D.',
        stars: 5,
        text: `${this.skill?.name} explained everything clearly. Fantastic mentor!`,
      },
      {
        id: 2,
        initials: 'SW',
        initialsClass: 'initials-sw',
        name: 'Sarah W.',
        stars: 4,
        text: `Really enjoyed learning from ${this.skill?.name}.`,
      },
      {
        id: 3,
        initials: 'MT',
        initialsClass: 'initials-jd',
        name: 'Michael T.',
        stars: 5,
        text: `The teaching style was excellent.`,
      },
      {
        id: 4,
        initials: 'AL',
        initialsClass: 'initials-sw',
        name: 'Anna L.',
        stars: 5,
        text: `Would definitely book another session.`,
      },
    ];
  }

  get displayedReviews() {
    return this.reviews.slice(
      this.currentReviewIndex,
      this.currentReviewIndex + this.reviewsPerPage,
    );
  }

  nextReviews() {
    if (this.canGoNext()) {
      this.currentReviewIndex += this.reviewsPerPage;
    }
  }

  prevReviews() {
    if (this.canGoPrev()) {
      this.currentReviewIndex -= this.reviewsPerPage;
    }
  }

  canGoNext() {
    return this.currentReviewIndex + this.reviewsPerPage < this.reviews.length;
  }

  canGoPrev() {
    return this.currentReviewIndex > 0;
  }
}
