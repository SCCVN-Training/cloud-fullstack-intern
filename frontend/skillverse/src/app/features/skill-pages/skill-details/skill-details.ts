import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SkillHero } from './components/skill-hero/skill-hero';
import { InstructorCard } from './components/instructor-card/instructor-card';
import { BookingCard } from './components/booking-card/booking-card';
import { ReviewCarousel } from './components/review-carousel/review-carousel';
import { SkillAbout } from './components/skill-about/skill-about';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';
import { ReviewItemResponse } from '../../../core/services/review/review.types';

const INITIALS_CLASSES = ['initials-primary', 'initials-secondary', 'initials-tertiary'];

// review-carousel.ts reads skill.reviews expecting {name, initials,
// initialsClass, stars, text} — the shape a static mock used to provide
// directly. The backend's ReviewItem has different field names (and no
// initials/color), so this maps one to the other rather than changing
// the carousel, which already renders this shape correctly.
function toCarouselReview(item: ReviewItemResponse, index: number) {
  const name = item.reviewer_name || 'Anonymous';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return {
    name,
    initials,
    initialsClass: INITIALS_CLASSES[index % INITIALS_CLASSES.length],
    stars: item.rating,
    text: item.feedback || '',
  };
}

@Component({
  selector: 'app-skill-details',
  standalone: true,
  imports: [CommonModule, SkillHero, ReviewCarousel, BookingCard, InstructorCard, SkillAbout],
  templateUrl: './skill-details.html',
  styleUrls: ['./skill-details.scss'],
})
export class SkillDetailsPage implements OnInit {
  skill: Skill | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private skillService: SkillService,
    private cdr: ChangeDetectorRef, // ← ADD THIS
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe({
      next: (params) => {
        const id = params.get('id');
        console.log('Route id from paramMap:', id);

        if (id) {
          this.loadSkill(id);
        } else {
          this.errorMessage = 'No skill ID provided';
          this.isLoading = false;
          this.cdr.detectChanges(); // ← ADD THIS
        }
      },
      error: (err) => {
        console.error('Route error:', err);
        this.errorMessage = 'Failed to load route parameters';
        this.isLoading = false;
        this.cdr.detectChanges(); // ← ADD THIS
      },
    });
  }

  loadSkill(id: string) {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Calling service to load skill:', id);

    // Fetched together and only assigned to `skill` once both resolve —
    // otherwise the carousel would render with `skill` set but reviews
    // still missing, then flash in the actual reviews a moment later.
    forkJoin({
      skill: this.skillService.getSkillById(id),
      reviews: this.skillService.getSkillReviews(id),
    }).subscribe({
      next: ({ skill, reviews }) => {
        console.log('API Response received:', skill);

        if (skill) {
          this.skill = { ...skill, reviews: reviews.items.map(toCarouselReview) };
          console.log('Skill set successfully:', this.skill.title);
        } else {
          this.errorMessage = 'Skill not found';
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // ← ADD THIS - Force UI update
      },
      error: (err) => {
        console.error('Failed to load skill details:', err);
        this.errorMessage = 'Unable to load skill details. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges(); // ← ADD THIS
      },
    });
  }

  retryLoad() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSkill(id);
    }
  }
}
