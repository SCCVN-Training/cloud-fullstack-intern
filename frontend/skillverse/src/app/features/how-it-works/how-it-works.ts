import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Step {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.html',
  styleUrls: ['./how-it-works.scss']
})
export class HowItWorksPage {

  steps: Step[] = [
    {
      title: 'Create a Profile',
      description: 'Build your digital portfolio and showcase your unique expertise to the global community.',
      icon: 'person_add',
      color: 'bg-primary-container'
    },
    {
      title: 'Teach & Earn',
      description: 'Host sessions or create courses to share your wisdom and earn Skill Coins for your time.',
      icon: 'payments',
      color: 'bg-primary'
    },
    {
      title: 'Browse & Book',
      description: 'Use your earned Skill Coins to book 1-on-1 sessions with experts in any field you desire.',
      icon: 'travel_explore',
      color: 'bg-secondary'
    },
    {
      title: 'Learn & Grow',
      description: 'Level up your skills, gain certificates, and restart the cycle with new-found expertise.',
      icon: 'auto_graph',
      color: 'bg-on-primary-container'
    }
  ];

  benefits: Benefit[] = [
    {
      title: 'Authentic Connection',
      description: 'Learn from real-world practitioners who deal with practical problems every single day.',
      icon: 'diversity_3'
    },
    {
      title: 'Unmatched Flexibility',
      description: 'No semesters or deadlines. Book sessions that fit your busy schedule, anytime, anywhere.',
      icon: 'schedule'
    },
    {
      title: 'Democratized Growth',
      description: 'Knowledge is a human right. We remove the financial barrier to becoming your best self.',
      icon: 'universal_currency_alt'
    }
  ];

}