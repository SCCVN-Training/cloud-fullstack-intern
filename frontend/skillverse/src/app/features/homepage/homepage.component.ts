import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, UserRecord } from '../../core/services/auth/auth';

interface Feature {
  title: string;
  description: string;
  accent: string;
  icon: string;
}

interface SkillCard {
  title: string;
  category: string;
  mentor: string;
  size: string;
  tone: string;
  image: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})

export class HomepageComponent {
  
  constructor(private authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
  
  get user(): UserRecord | null {
    return this.authService.currentUser();
  }

  features: Feature[] = [
    {
      title: 'Learn Together',
      description: 'Exchange skills with passionate community members.',
      accent: 'pink',
      icon: 'groups'
    },
    {
      title: 'Earn Skill Coins',
      description: 'Teach others and receive Skill Coins.',
      accent: 'purple',
      icon: 'monetization_on'
    },
    {
      title: 'Grow Your Network',
      description: 'Connect with learners and mentors.',
      accent: 'blue',
      icon: 'connect_without_contact'
    }
  ];

  skillCards: SkillCard[] = [
    {
      title: 'Angular Development',
      category: 'Programming',
      mentor: 'Alice',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      size: 'large',
      tone: 'pink'
    },
    {
      title: 'Photography',
      category: 'Creative',
      mentor: 'Bob',
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
      size: 'small',
      tone: 'purple'
    },
    {
      title: 'Japanese Language',
      category: 'Language',
      mentor: 'Carol',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
      size: 'small',
      tone: 'blue'
    }
  ];

  footerLinks = [
    'Home',
    'Browse Skills',
    'How it works',
    'About Us'
  ];
}