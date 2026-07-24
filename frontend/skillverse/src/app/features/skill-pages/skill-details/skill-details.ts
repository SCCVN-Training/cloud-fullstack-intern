import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SkillHero } from './components/skill-hero/skill-hero';
import { InstructorCard } from './components/instructor-card/instructor-card';
import { BookingCard } from './components/booking-card/booking-card';
import { ReviewCarousel } from './components/review-carousel/review-carousel';

@Component({
  selector: 'app-skill-details',
  standalone: true,
  imports: [CommonModule, RouterLink, SkillHero, ReviewCarousel, BookingCard, InstructorCard],
  templateUrl: './skill-details.html',
  styleUrls: ['./skill-details.scss'],
})
export class SkillDetailsPage implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Skill ID =', id);
  }
}
