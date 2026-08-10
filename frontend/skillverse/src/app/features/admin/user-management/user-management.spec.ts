import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManagementComponent } from './user-management';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ============================================================
  // Component
  // ============================================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ============================================================
  // Users
  // ============================================================

  it('should contain twelve users', () => {
    expect(component.users.length).toBe(12);
  });

  it('should initialize with all users', () => {
    expect(component.filteredUsers.length).toBe(12);
  });

  // ============================================================
  // Pagination
  // ============================================================

  it('should initialize on the first page', () => {
    expect(component.currentPage).toBe(1);
  });

  it('should use a page size of five', () => {
    expect(component.pageSize).toBe(5);
  });

  it('should calculate the total number of pages', () => {
    expect(component.totalPages).toBe(3);
  });

  it('should return five users on the first page', () => {
    expect(component.paginatedUsers.length).toBe(5);
  });

  it('should calculate the showing range', () => {
    expect(component.showingFrom).toBe(1);
    expect(component.showingTo).toBe(5);
  });

  // ============================================================
  // Filtering
  // ============================================================

  it('should filter users by role', () => {
    component.selectedRole = 'learner';

    component.onFilterChange();

    expect(component.filteredUsers.every((user) => user.role === 'learner')).toBe(true);

    expect(component.filteredUsers.length).toBe(
      component.users.filter((user) => user.role === 'learner').length,
    );
  });

  it('should filter users by status', () => {
    component.selectedStatus = 'banned';

    component.onFilterChange();

    expect(component.filteredUsers.every((user) => user.status === 'banned')).toBe(true);

    expect(component.filteredUsers.length).toBe(3);
  });

  it('should apply role and status filters together', () => {
    component.selectedRole = 'mentor';
    component.selectedStatus = 'banned';

    component.onFilterChange();

    expect(component.filteredUsers.length).toBe(2);

    expect(
      component.filteredUsers.every((user) => user.role === 'mentor' && user.status === 'banned'),
    ).toBe(true);
  });

  it('should reset pagination when filters change', () => {
    component.currentPage = 2;

    component.onFilterChange();

    expect(component.currentPage).toBe(1);
  });

  // ============================================================
  // Pagination Navigation
  // ============================================================

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

  it('should generate page numbers', () => {
    expect(component.pageNumbers).toEqual([1, 2, 3]);
  });

  // ============================================================
  // User Helpers
  // ============================================================

  it('should generate initials from a name', () => {
    expect(component.getInitials('Emma Wilson')).toBe('EW');
    expect(component.getInitials('James Anderson')).toBe('JA');
    expect(component.getInitials('John')).toBe('J');
  });

  it('should return the correct role labels', () => {
    expect(component.getRoleLabel('mentor')).toBe('Mentor');
    expect(component.getRoleLabel('learner')).toBe('Learner');
  });

  it('should return the correct status labels', () => {
    expect(component.getStatusLabel('active')).toBe('Active');
    expect(component.getStatusLabel('banned')).toBe('Banned/Suspended');
  });

  // ============================================================
  // Ban / Unban
  // ============================================================

  it('should toggle a banned user to active', () => {
    const user = component.users.find((item) => item.status === 'banned')!;

    component.toggleBan(user);

    expect(user.status).toBe('active');
  });

  it('should toggle an active user to banned', () => {
    const user = component.users.find((item) => item.status === 'active')!;

    component.toggleBan(user);

    expect(user.status).toBe('banned');
  });

  // ============================================================
  // Template
  // ============================================================

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('User Management');
  });

  it('should render the user table', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(5);
  });

  it('should render user information', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Emma Wilson');
    expect(element.textContent).toContain('emma.wilson@example.com');
  });
});
