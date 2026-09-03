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
  duration: 45,
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
};

// What GET /skills/{id}/reviews returns — mapped by the component into
// the {name, initials, initialsClass, stars, text} shape ReviewCarousel
// expects (see toCarouselReview in skill-details.ts).
const mockReviewsResponse = {
  total: 1,
  items: [
    {
      id: 'review-1',
      booking_id: 'booking-1',
      reviewer_id: 'reviewer-1',
      reviewer_name: 'Alex D',
      reviewer_avatar_url: null,
      rating: 5,
      knowledge_rating: 5,
      communication_rating: 5,
      video_audio_rating: 5,
      feedback: 'Excellent skill details and instructor support.',
      created_at: '2026-07-05T00:00:00Z',
    },
  ],
};

const expectedMappedReviews = [
  {
    name: 'Alex D',
    initials: 'AD',
    initialsClass: 'initials-primary',
    stars: 5,
    text: 'Excellent skill details and instructor support.',
  },
];

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
            getSkillReviews: vi.fn().mockReturnValue(of(mockReviewsResponse)),
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
    expect(component.skill).toEqual({ ...mockSkill, reviews: expectedMappedReviews });
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('maps the fetched reviews onto the skill for the carousel to render', () => {
    expect(component.skill?.reviews).toEqual(expectedMappedReviews);
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

  // Regression test: the carousel component itself has always correctly
  // rendered whatever `skill.reviews` it's given (see
  // review-carousel.spec.ts) — the actual bug was that skill-details
  // never fetched or attached any reviews in the first place, so the
  // carousel silently rendered zero cards. This asserts the real DOM
  // output end-to-end, not just that getSkillReviews was called.
  it('renders actual review content fetched from GET /skills/{id}/reviews, not an empty carousel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const reviewCards = compiled.querySelectorAll('app-review-carousel .review-card');

    expect(reviewCards.length).toBe(1);
    expect(compiled.querySelector('app-review-carousel .reviewer-name')?.textContent).toContain(
      'Alex D',
    );
    expect(compiled.querySelector('app-review-carousel .review-text')?.textContent).toContain(
      'Excellent skill details and instructor support.',
    );
  });
});
