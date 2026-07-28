import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { SkillHero } from './components/skill-hero/skill-hero';
import { InstructorCard } from './components/instructor-card/instructor-card';
import { BookingCard } from './components/booking-card/booking-card';
import { ReviewCarousel } from './components/review-carousel/review-carousel';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-skill-details',
  standalone: true,
  imports: [CommonModule, SkillHero, ReviewCarousel, BookingCard, InstructorCard],
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
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    console.log('Route id:', id);

    if (id) {
      this.skillService.getSkillById(id).subscribe({
        next: (data) => {
          console.log('========== API RESPONSE ==========');
          console.log(data);
          this.skill = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load skill details:', err);
          this.errorMessage = 'Unable to load skill details';
          this.isLoading = false;
        },
      });
    } else {
      this.errorMessage = 'No skill id provided';
      this.isLoading = false;
    }
  }
}
