import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-skill-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './skill-details.html',
  styleUrls: ['./skill-details.scss'],
})
export class SkillDetailsPage implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Skill ID =', id);
  }

  reviews = [
    {
      id: 1,
      initials: 'JD',
      initialsClass: 'initials-jd',
      name: 'James D.',
      stars: 5,
      text: "Elena is fantastic! I was completely lost with Procreate's interface, but she explained everything so clearly.",
    },
    {
      id: 2,
      initials: 'SW',
      initialsClass: 'initials-sw',
      name: 'Sarah W.',
      stars: 4.5,
      text: 'Great tips on brush customization. I wish the session was a bit longer because time flew by, but totally worth it!',
    },
    {
      id: 3,
      initials: 'MT',
      initialsClass: 'initials-jd',
      name: 'Michael T.',
      stars: 5,
      text: 'Excellent course! The section on color theory really opened my eyes to new possibilities.',
    },
    {
      id: 4,
      initials: 'AL',
      initialsClass: 'initials-sw',
      name: 'Anna L.',
      stars: 5,
      text: 'Highly recommended. The way she breaks down complex fundamentals makes it so easy to follow along!',
    },
    {
      id: 5,
      initials: 'KC',
      initialsClass: 'initials-jd',
      name: 'Kevin C.',
      stars: 4,
      text: 'A very solid introduction to Procreate. I loved the section on creating custom brushes.',
    },
  ];

  currentReviewIndex = 0;
  reviewsPerPage = 2;

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
