import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SkillDetailsPage } from './skill-details';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

const mockSkill: Skill = {
  id: 'react-architecture-patterns',
  title: 'React Architecture Patterns',
  category: 'Development',
  description: 'Learn modern frontend architecture.',
  image: '/assets/images/skill-react.png',
  price: 120,
  duration: '2h',
  level: 'Intermediate',
  requirements: 'Basic React knowledge',
  rating: 4.8,
  reviewCount: 42,
  instructorName: 'Jane Doe',
  instructorTitle: 'Senior Developer',
  instructorBio: 'Frontend expert',
  instructorAvatar: '/assets/images/jane-avatar.png',
  availableSlots: 5,
  language: 'English',
  tags: ['react', 'architecture'],
  featured: false,
  createdAt: '2026-07-01',
  aboutText: 'Deep dive into React architecture patterns.',
  learningOutcomes: ['Design reusable UI architecture', 'Build scalable React applications'],
  reviews: [
    {
      name: 'Alex',
      initials: 'AD',
      initialsClass: 'initials-primary',
      stars: 5,
      text: 'Excellent skill details and instructor support.',
    },
  ],
};

describe('SkillDetailsPage', () => {
  let component: SkillDetailsPage;
  let fixture: ComponentFixture<SkillDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillDetailsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: mockSkill.id })),
            snapshot: {
              paramMap: convertToParamMap({ id: mockSkill.id }),
            },
          },
        },
        {
          provide: SkillService,
          useValue: {
            getSkillById: vi.fn().mockReturnValue(of(mockSkill)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load skill data', () => {
    expect(component).toBeTruthy();
    expect(component.skill).toEqual(mockSkill);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should render Skill Hero', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-skill-hero')).toBeTruthy();
  });

  it('should render Booking Card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-booking-card')).toBeTruthy();
  });

  it('should render Instructor Card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-instructor-card')).toBeTruthy();
  });

  it('should render Review Carousel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-review-carousel')).toBeTruthy();
  });
});
