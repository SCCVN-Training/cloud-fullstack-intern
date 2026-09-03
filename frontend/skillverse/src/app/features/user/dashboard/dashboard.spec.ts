import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Dashboard } from './dashboard';
import { BookingService } from '../../../core/services/booking/booking.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Booking } from '../../../core/models/booking.model';

function makeBooking(overrides: Partial<Booking>): Booking {
  return {
    id: 'booking-1',
    skillId: 'skill-1',
    learnerId: 'learner-1',
    mentorId: 'mentor-1',
    sessionDate: '2026-09-01T10:00:00Z',
    status: 'PENDING',
    pricePaid: 50,
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
    skillTitle: 'React Basics',
    learnerName: 'Alex Learner',
    mentorName: 'Jane Mentor',
    ...overrides,
  };
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let bookingService: {
    getMyBookings: ReturnType<typeof vi.fn>;
    updateBookingStatus: ReturnType<typeof vi.fn>;
  };
  let toastService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  async function setup(bookings: Booking[]) {
    bookingService = {
      getMyBookings: vi.fn().mockReturnValue(of({ total: bookings.length, bookings })),
      updateBookingStatus: vi.fn().mockReturnValue(of(makeBooking({ status: 'CONFIRMED' }))),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup([]);
    expect(component).toBeTruthy();
  });

  it('fetches bookings as mentor', async () => {
    await setup([]);
    expect(bookingService.getMyBookings).toHaveBeenCalledWith(true);
  });

  it('filters to only PENDING bookings', async () => {
    await setup([
      makeBooking({ id: 'b1', status: 'PENDING' }),
      makeBooking({ id: 'b2', status: 'CONFIRMED' }),
      makeBooking({ id: 'b3', status: 'PENDING' }),
    ]);
    expect(component.pendingBookings().map((b) => b.id)).toEqual(['b1', 'b3']);
  });

  it('does not render the pending-bookings panel when there are none', async () => {
    await setup([]);
    expect(fixture.nativeElement.textContent).not.toContain('Pending Booking Requests');
  });

  it('renders skill name, session date, and learner name for a pending booking', async () => {
    await setup([makeBooking({ id: 'b1' })]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('React Basics');
    expect(text).toContain('Alex Learner');
  });

  it('accepting a booking calls updateBookingStatus with CONFIRMED and removes it from the list', async () => {
    await setup([makeBooking({ id: 'b1' })]);

    component.acceptBooking(component.pendingBookings()[0]);

    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith('b1', 'CONFIRMED');
    expect(component.pendingBookings().length).toBe(0);
    expect(toastService.showSuccess).toHaveBeenCalledWith('Booking accepted.');
  });

  it('cancelling a booking calls updateBookingStatus with CANCELLED and removes it from the list', async () => {
    await setup([makeBooking({ id: 'b1' })]);

    component.cancelBooking(component.pendingBookings()[0]);

    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith('b1', 'CANCELLED');
    expect(component.pendingBookings().length).toBe(0);
    expect(toastService.showSuccess).toHaveBeenCalledWith('Booking cancelled.');
  });

  it('shows an error toast and keeps the booking in the list on failure', async () => {
    await setup([makeBooking({ id: 'b1' })]);
    bookingService.updateBookingStatus.mockReturnValue(
      throwError(() => ({ error: { detail: 'Nope' } })),
    );

    component.acceptBooking(component.pendingBookings()[0]);

    expect(toastService.showError).toHaveBeenCalledWith('Nope');
    expect(component.pendingBookings().length).toBe(1);
    expect(component.processingBookingId()).toBeNull();
  });

  it('renders Accept/Cancel buttons for each pending booking', async () => {
    await setup([makeBooking({ id: 'b1' }), makeBooking({ id: 'b2' })]);
    const text = fixture.nativeElement.textContent;
    const acceptCount = (text.match(/Accept/g) || []).length;
    const cancelCount = (text.match(/Cancel/g) || []).length;
    expect(acceptCount).toBe(2);
    expect(cancelCount).toBeGreaterThanOrEqual(2);
  });
});
