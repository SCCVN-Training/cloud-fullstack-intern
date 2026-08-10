import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingManagementComponent } from './booking-management';

describe('BookingManagementComponent', () => {
  let component: BookingManagementComponent;
  let fixture: ComponentFixture<BookingManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingManagementComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain twelve bookings', () => {
    expect(component.bookings.length).toBe(12);
  });

  it('should initialize with all booking statuses selected', () => {
    expect(component.selectedStatus).toBe('');
    expect(component.filteredBookings.length).toBe(12);
  });

  it('should initialize on the first page', () => {
    expect(component.currentPage).toBe(1);
  });

  it('should use a page size of ten', () => {
    expect(component.pageSize).toBe(10);
  });

  it('should return the first ten bookings on the first page', () => {
    expect(component.paginatedBookings.length).toBe(10);
  });

  it('should calculate the correct total pages', () => {
    expect(component.totalPages).toBe(2);
  });

  it('should calculate the correct showing range', () => {
    expect(component.showingFrom).toBe(1);
    expect(component.showingTo).toBe(10);
  });

  it('should filter bookings by status', () => {
    component.selectedStatus = 'completed';

    expect(component.filteredBookings.length).toBe(4);
    expect(component.filteredBookings.every((booking) => booking.status === 'completed')).toBe(
      true,
    );
  });

  it('should reset pagination when the status filter changes', () => {
    component.currentPage = 2;

    component.onStatusChange();

    expect(component.currentPage).toBe(1);
  });

  it('should return the correct status labels', () => {
    expect(component.getStatusLabel('completed')).toBe('Completed');
    expect(component.getStatusLabel('confirmed')).toBe('Confirmed');
    expect(component.getStatusLabel('pending')).toBe('Pending');
    expect(component.getStatusLabel('cancelled')).toBe('Cancelled');
  });

  it('should open the booking modal', () => {
    const booking = component.bookings[0];

    component.openModal(booking);

    expect(component.isModalOpen).toBe(true);
    expect(component.selectedBooking).toBe(booking);
  });

  it('should close the booking modal', () => {
    component.openModal(component.bookings[0]);

    component.closeModal();

    expect(component.isModalOpen).toBe(false);
    expect(component.selectedBooking).toBeNull();
  });

  it('should force cancel the selected booking', () => {
    const booking = component.bookings[1];

    component.openModal(booking);
    component.forceCancel();

    expect(booking.status).toBe('cancelled');
    expect(component.isModalOpen).toBe(false);
    expect(component.selectedBooking).toBeNull();
  });

  it('should not force cancel when no booking is selected', () => {
    component.selectedBooking = null;
    component.isModalOpen = false;

    component.forceCancel();

    expect(component.isModalOpen).toBe(false);
    expect(component.selectedBooking).toBeNull();
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

  it('should ignore an invalid page number', () => {
    component.goToPage(0);

    expect(component.currentPage).toBe(1);

    component.goToPage(99);

    expect(component.currentPage).toBe(1);
  });

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Bookings & Transactions');
  });

  it('should render the booking table', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(rows.length).toBe(12);
  });

  it('should render booking IDs', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('BK-1001');
    expect(element.textContent).toContain('BK-1002');
    expect(element.textContent).toContain('BK-1010');
  });
});
