import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { MyBookings } from './my-bookings';
import { AuthService } from '../../../core/services/auth/auth';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking, BookingListResponse } from '../../../core/models/booking.model';

const CURRENT_USER_ID = 'user-me';

// I'm the LEARNER here — confirmed, so it should be actionable/joinable.
const confirmedAsLearner: Booking = {
  id: 'booking-1',
  skillId: 'skill-1',
  learnerId: CURRENT_USER_ID,
  mentorId: 'mentor-1',
  sessionDate: '2026-09-01T10:00:00Z',
  status: 'CONFIRMED',
  pricePaid: 120,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
  skillTitle: 'Advanced Figma Prototyping',
  mentorName: 'Sarah Jenkins',
};

// I'm the MENTOR here — still pending, not joinable yet.
const pendingAsMentor: Booking = {
  id: 'booking-2',
  skillId: 'skill-2',
  learnerId: 'learner-2',
  mentorId: CURRENT_USER_ID,
  sessionDate: '2026-09-05T14:30:00Z',
  status: 'PENDING',
  pricePaid: 90,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
  skillTitle: 'Conversational Spanish for Beginners',
  learnerName: 'Carlos Mateo',
};

describe('MyBookings', () => {
  let component: MyBookings;
  let fixture: ComponentFixture<MyBookings>;
  let bookingService: { getMyBookings: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    bookingService = {
      getMyBookings: vi.fn((asMentor: boolean) => {
        const response: BookingListResponse = asMentor
          ? { total: 1, bookings: [pendingAsMentor] }
          : { total: 1, bookings: [confirmedAsLearner] };
        return of(response);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [MyBookings],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: AuthService, useValue: { currentUser: () => ({ id: CURRENT_USER_ID }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch bookings as both learner and mentor', () => {
    expect(bookingService.getMyBookings).toHaveBeenCalledWith(false);
    expect(bookingService.getMyBookings).toHaveBeenCalledWith(true);
  });

  it('should merge both sides into one list', () => {
    expect(component.bookings.length).toBe(2);
  });

  it('should show the OTHER party\'s name, not the current user\'s', () => {
    const learnerSide = component.bookings.find((b) => b.id === 'booking-1');
    const mentorSide = component.bookings.find((b) => b.id === 'booking-2');

    expect(learnerSide?.mentor).toBe('Sarah Jenkins'); // I'm learning, show the mentor
    expect(mentorSide?.mentor).toBe('Carlos Mateo'); // I'm hosting, show the learner
  });

  it('should mark only CONFIRMED bookings as actionable', () => {
    const confirmed = component.bookings.find((b) => b.id === 'booking-1');
    const pending = component.bookings.find((b) => b.id === 'booking-2');

    expect(confirmed?.actionable).toBe(true);
    expect(pending?.actionable).toBe(false);
  });

  it('should initialize with the Upcoming tab, containing both bookings', () => {
    expect(component.activeTab).toBe('Upcoming');
    expect(component.filteredBookings.length).toBe(2);
  });

  it('should return no completed bookings', () => {
    component.activeTab = 'Completed';
    expect(component.filteredBookings.length).toBe(0);
  });

  it('should change active tab', () => {
    component.selectTab('Cancelled');
    expect(component.activeTab).toBe('Cancelled');
  });

  it('should select a booking by its real id', () => {
    component.selectBooking('booking-2');

    const selected = component.bookings.find((b) => b.id === 'booking-2');
    const other = component.bookings.find((b) => b.id === 'booking-1');

    expect(selected?.selected).toBe(true);
    expect(other?.selected).toBe(false);
  });

  it('should render page title and real booking titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('My Bookings');
    expect(compiled.textContent).toContain('Advanced Figma Prototyping');
    expect(compiled.textContent).toContain('Conversational Spanish for Beginners');
  });

  it('should render a real Join Session link for the actionable booking', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const joinLinks = Array.from(compiled.querySelectorAll('a, button')).filter((el) =>
      el.textContent?.includes('Join Session'),
    );

    expect(joinLinks.length).toBeGreaterThan(0);
  });

  it('should render Awaiting Confirmation for the pending booking', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Awaiting Confirmation');
  });

  it('should highlight the active tab', () => {
    const tabs = fixture.debugElement.queryAll(By.css('.tab-btn'));
    expect(tabs[0].nativeElement.classList).toContain('active');
  });
});
