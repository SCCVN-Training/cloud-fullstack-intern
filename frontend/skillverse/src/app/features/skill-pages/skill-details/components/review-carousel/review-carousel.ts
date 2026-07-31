import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-carousel.html',
  styleUrls: ['./review-carousel.scss'],
})
export class ReviewCarousel implements OnChanges {
  @Input() skill: any;

  currentReviewIndex = 0;
  reviewsPerPage = 2;

  get reviews() {
    return this.skill?.reviews || [];
  }

  get displayedReviews() {
    return this.reviews.slice(
      this.currentReviewIndex,
      this.currentReviewIndex + this.reviewsPerPage,
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['skill'] && changes['skill'].currentValue) {
      this.currentReviewIndex = 0;
    }
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
