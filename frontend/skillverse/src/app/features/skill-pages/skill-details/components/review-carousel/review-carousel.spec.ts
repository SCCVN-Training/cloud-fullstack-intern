import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewCarousel } from './review-carousel';

const mockSkill = {
  reviews: [
    {
      name: 'Alex',
      initials: 'AD',
      initialsClass: 'initials-primary',
      stars: 5,
      text: 'Excellent course and instructor support.',
    },
    {
      name: 'Jamie',
      initials: 'JM',
      initialsClass: 'initials-secondary',
      stars: 4,
      text: 'Very informative and well structured.',
    },
    {
      name: 'Sam',
      initials: 'SK',
      initialsClass: 'initials-tertiary',
      stars: 4,
      text: 'Great practical examples.',
    },
  ],
};

describe('ReviewCarousel', () => {
  let component: ReviewCarousel;
  let fixture: ComponentFixture<ReviewCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewCarousel],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCarousel);
    component = fixture.componentInstance;
    component.skill = mockSkill;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the first page of reviews', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.review-card').length).toBe(2);
    expect(compiled.querySelector('.review-text')?.textContent).toContain(
      mockSkill.reviews[0].text,
    );
  });

  it('should navigate review pages', () => {
    expect(component.canGoPrev()).toBe(false);
    expect(component.canGoNext()).toBe(true);

    component.nextReviews();
    fixture.detectChanges();

    expect(component.currentReviewIndex).toBe(2);
    expect(component.canGoPrev()).toBe(true);
    expect(component.canGoNext()).toBe(false);

    component.prevReviews();
    fixture.detectChanges();

    expect(component.currentReviewIndex).toBe(0);
  });
});
