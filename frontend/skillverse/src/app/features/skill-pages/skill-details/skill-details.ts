import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { SkillHero } from './components/skill-hero/skill-hero';
import { InstructorCard } from './components/instructor-card/instructor-card';
import { BookingCard } from './components/booking-card/booking-card';
import { ReviewCarousel } from './components/review-carousel/review-carousel';
import { SkillAbout } from './components/skill-about/skill-about';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

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

    this.skillService.getSkillById(id).subscribe({
      next: (data) => {
        console.log('API Response received:', data);

        if (data) {
          this.skill = data;
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
