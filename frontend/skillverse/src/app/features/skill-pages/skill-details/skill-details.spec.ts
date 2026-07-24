import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';

import { SkillDetailsPage } from './skill-details';

describe('SkillDetailsPage', () => {
  let component: SkillDetailsPage;
  let fixture: ComponentFixture<SkillDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillDetailsPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                id: 'react-architecture-patterns',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillDetailsPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  // =====================================
  // Component
  // =====================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =====================================
  // Route Parameter
  // =====================================

  it('should read route parameter', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    component.ngOnInit();

    expect(spy).toHaveBeenCalledWith('Skill ID =', 'react-architecture-patterns');

    spy.mockRestore();
  });

  // =====================================
  // Reviews
  // =====================================

  it('should display first two reviews initially', () => {
    expect(component.displayedReviews.length).toBe(2);

    expect(component.displayedReviews[0].name).toBe('James D.');
    expect(component.displayedReviews[1].name).toBe('Sarah W.');
  });

  it('should go to next reviews', () => {
    component.nextReviews();

    expect(component.currentReviewIndex).toBe(2);

    expect(component.displayedReviews[0].name).toBe('Michael T.');
    expect(component.displayedReviews[1].name).toBe('Anna L.');
  });

  it('should go back to previous reviews', () => {
    component.nextReviews();
    component.prevReviews();

    expect(component.currentReviewIndex).toBe(0);
  });

  it('should not go previous when already at first page', () => {
    component.prevReviews();

    expect(component.currentReviewIndex).toBe(0);
  });

  it('should stop at last page', () => {
    component.nextReviews(); // index = 2
    component.nextReviews(); // index = 4
    component.nextReviews(); // should stay

    expect(component.currentReviewIndex).toBe(4);
  });

  it('should return false when cannot go previous', () => {
    expect(component.canGoPrev()).toBe(false);
  });

  it('should return true when can go next', () => {
    expect(component.canGoNext()).toBe(true);
  });

  it('should return false when at last page', () => {
    component.nextReviews();
    component.nextReviews();

    expect(component.canGoNext()).toBe(false);
  });
});
