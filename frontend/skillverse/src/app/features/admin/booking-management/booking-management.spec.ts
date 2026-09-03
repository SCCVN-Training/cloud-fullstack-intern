import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingManagementComponent } from './booking-management';
import { BookingService } from '../../../core/services/booking/booking.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Booking } from '../../../core/models/booking.model';

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: 'booking-1',
    skillId: 'skill-1',
    learnerId: 'learner-1',
    mentorId: 'mentor-1',
    sessionDate: '2026-08-10T10:00:00Z',
    status: 'PENDING',
    pricePaid: 250,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    skillTitle: 'Advanced Watercolor Techniques',
    learnerName: 'Emma Johnson',
    mentorName: 'Olivia Smith',
    ...overrides,
  };
}

describe('BookingManagementComponent', () => {
  let component: BookingManagementComponent;
  let fixture: ComponentFixture<BookingManagementComponent>;
  let bookingService: {
    getAllBookings: ReturnType<typeof vi.fn>;
    updateBookingStatus: ReturnType<typeof vi.fn>;
  };
  let toastService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  async function setup(bookings: Booking[]) {
    bookingService = {
      getAllBookings: vi.fn().mockReturnValue(of({ total: bookings.length, bookings })),
      updateBookingStatus: vi.fn().mockReturnValue(of(makeBooking({ status: 'CANCELLED' }))),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BookingManagementComponent],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and fetch all bookings (admin-scoped)', async () => {
    await setup([makeBooking({})]);
    expect(component).toBeTruthy();
    expect(bookingService.getAllBookings).toHaveBeenCalledWith(0, 100);
    expect(component.bookings.length).toBe(1);
  });

  it('maps status to lowercase and skillTitle to topic for the view model', async () => {
    await setup([makeBooking({ status: 'CONFIRMED' })]);
    expect(component.bookings[0].status).toBe('confirmed');
    expect(component.bookings[0].topic).toBe('Advanced Watercolor Techniques');
  });

  it('filters by status', async () => {
    await setup([
      makeBooking({ id: 'b1', status: 'PENDING' }),
      makeBooking({ id: 'b2', status: 'CANCELLED' }),
    ]);
    component.selectedStatus = 'cancelled';
    expect(component.filteredBookings.map((b) => b.id)).toEqual(['b2']);
  });

  it('forceCancel calls the real status-update endpoint and updates the row', async () => {
    await setup([makeBooking({ id: 'b1', status: 'CONFIRMED' })]);
    component.openModal(component.bookings[0]);

    component.forceCancel();

    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith('b1', 'CANCELLED');
    expect(component.bookings[0].status).toBe('cancelled');
    expect(toastService.showSuccess).toHaveBeenCalledWith('Booking cancelled.');
    expect(component.isModalOpen).toBe(false);
  });

  it('forceCancel shows an error toast and keeps the modal open on failure', async () => {
    await setup([makeBooking({ id: 'b1', status: 'CONFIRMED' })]);
    bookingService.updateBookingStatus.mockReturnValue(
      throwError(() => ({ error: { detail: 'Nope' } })),
    );
    component.openModal(component.bookings[0]);

    component.forceCancel();

    expect(toastService.showError).toHaveBeenCalledWith('Nope');
    expect(component.bookings[0].status).toBe('confirmed');
    expect(component.isModalOpen).toBe(true);
  });

  it('shows an error toast when the fetch fails', async () => {
    bookingService = {
      getAllBookings: vi.fn().mockReturnValue(throwError(() => new Error('network error'))),
      updateBookingStatus: vi.fn(),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BookingManagementComponent],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingManagementComponent);
    fixture.detectChanges();

    expect(toastService.showError).toHaveBeenCalledWith(
      'Could not load bookings. Please try again.',
    );
  });
});
