import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewManagementComponent } from './review-management';

describe('ReviewManagementComponent', () => {
  let component: ReviewManagementComponent;
  let fixture: ComponentFixture<ReviewManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewManagementComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain twelve reviews', () => {
    expect(component.reviews.length).toBe(12);
  });

  it('should initialize with all reviews', () => {
    expect(component.filteredReviews.length).toBe(12);
  });

  it('should calculate the total number of reviews', () => {
    expect(component.totalReviews).toBe(12);
  });

  it('should calculate the number of flagged reviews', () => {
    expect(component.flaggedReviews).toBe(3);
  });

  it('should calculate the average rating', () => {
    expect(component.averageRating).toBe(3.7);
  });

  it('should use a page size of ten', () => {
    expect(component.pageSize).toBe(10);
  });

  it('should calculate two pages', () => {
    expect(component.totalPages).toBe(2);
  });

  it('should return the first ten reviews on the first page', () => {
    expect(component.paginatedReviews.length).toBe(10);
  });

  it('should filter reviews by search term', () => {
    component.searchTerm = 'python';

    expect(component.filteredReviews.length).toBe(2);

    expect(
      component.filteredReviews.every(
        (review) =>
          review.reviewer.toLowerCase().includes('python') ||
          review.target.toLowerCase().includes('python') ||
          review.content.toLowerCase().includes('python'),
      ),
    ).toBe(true);
  });

  it('should filter reviews by reviewer name', () => {
    component.searchTerm = 'jane';

    expect(component.filteredReviews.length).toBe(1);
    expect(component.filteredReviews[0].reviewer).toBe('Jane Smith');
  });

  it('should filter reviews by status', () => {
    component.selectedStatus = 'flagged';

    expect(component.filteredReviews.length).toBe(3);

    expect(component.filteredReviews.every((review) => review.status === 'flagged')).toBe(true);
  });

  it('should apply search and status filters together', () => {
    component.searchTerm = 'python';
    component.selectedStatus = 'normal';

    expect(component.filteredReviews.length).toBe(1);
    expect(component.filteredReviews[0].reviewer).toBe('David Kim');
  });

  it('should reset pagination when filters change', () => {
    component.currentPage = 2;

    component.onFilterChange();

    expect(component.currentPage).toBe(1);
  });

  it('should clear all filters', () => {
    component.searchTerm = 'python';
    component.selectedStatus = 'flagged';
    component.currentPage = 2;

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.currentPage).toBe(1);
  });

  it('should calculate the showing range', () => {
    expect(component.showingFrom).toBe(1);
    expect(component.showingTo).toBe(10);
  });

  it('should move to the next page', () => {
    component.nextPage();

    expect(component.currentPage).toBe(2);
  });

  it('should not move beyond the last page', () => {
    component.currentPage = component.totalPages;

    component.nextPage();

    expect(component.currentPage).toBe(component.totalPages);
  });

  it('should move to the previous page', () => {
    component.currentPage = 2;

    component.previousPage();

    expect(component.currentPage).toBe(1);
  });

  it('should not move before the first page', () => {
    component.currentPage = 1;

    component.previousPage();

    expect(component.currentPage).toBe(1);
  });

  it('should navigate to a valid page', () => {
    component.goToPage(2);

    expect(component.currentPage).toBe(2);
  });

  it('should ignore invalid page numbers', () => {
    component.goToPage(0);

    expect(component.currentPage).toBe(1);

    component.goToPage(99);

    expect(component.currentPage).toBe(1);
  });

  it('should return five rating values', () => {
    expect(component.getRatingStars(5)).toEqual([1, 1, 1, 1, 1]);
    expect(component.getRatingStars(3)).toEqual([1, 1, 1, 0, 0]);
    expect(component.getRatingStars(1)).toEqual([1, 0, 0, 0, 0]);
  });

  it('should return the correct status labels', () => {
    expect(component.getStatusLabel('normal')).toBe('Normal');
    expect(component.getStatusLabel('flagged')).toBe('Flagged');
  });

  it('should return the correct page numbers', () => {
    expect(component.getPageNumbers()).toEqual([1, 2]);
  });

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Review Management');
  });

  it('should render review rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(10);
  });

  it('should render review content', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Jane Smith');
    expect(element.textContent).toContain('Advanced React Patterns');
    expect(element.textContent).toContain('Incredible session');
  });
});
