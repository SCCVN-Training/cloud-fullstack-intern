import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { VideoCallSession } from './video-call-session';
import { AuthService } from '../../../core/services/auth/auth';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Booking } from '../../../core/models/booking.model';

const mockBooking: Booking = {
  id: 'booking-1',
  skillId: 'skill-1',
  learnerId: 'learner-1',
  mentorId: 'mentor-1',
  sessionDate: '2026-08-25T10:00:00Z',
  status: 'CONFIRMED',
  pricePaid: 120,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
  skillTitle: 'React Architecture Patterns',
  learnerName: 'Alex Learner',
  mentorName: 'Jane Mentor',
};

describe('VideoCallSession', () => {
  let component: VideoCallSession;
  let fixture: ComponentFixture<VideoCallSession>;
  let bookingService: { getBookingById: ReturnType<typeof vi.fn>; updateBookingStatus: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(currentUserId: string) {
    bookingService = {
      getBookingById: vi.fn().mockReturnValue(of(mockBooking)),
      updateBookingStatus: vi.fn().mockReturnValue(of({ ...mockBooking, status: 'COMPLETED' })),
    };

    await TestBed.configureTestingModule({
      imports: [VideoCallSession],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: AuthService, useValue: { currentUser: () => ({ id: currentUserId }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => mockBooking.id } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoCallSession);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // Jitsi's script is loaded from an external CDN at runtime, not an
    // npm package — stub it out so initJitsi() doesn't try to fetch a
    // real script during tests. A plain function (not an arrow function)
    // is required here since the component calls this with `new`, and
    // arrow functions can't be used as constructors.
    (window as any).JitsiMeetExternalAPI = vi.fn(function () {
      return { dispose: vi.fn() };
    });
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
    delete (window as any).JitsiMeetExternalAPI;
  });

  it('should create and load the booking', async () => {
    await setup('mentor-1');
    expect(bookingService.getBookingById).toHaveBeenCalledWith(mockBooking.id);
    expect(component.booking()?.id).toBe(mockBooking.id);
  });

  it('should identify the mentor as host', async () => {
    await setup('mentor-1');
    expect(component.isHost()).toBe(true);
  });

  it('should identify the learner as not-host', async () => {
    await setup('learner-1');
    expect(component.isHost()).toBe(false);
  });

  it('should count down from 45:00', async () => {
    await setup('mentor-1');
    expect(component.remainingLabel()).toBe('45:00');

    vi.advanceTimersByTime(1000);
    expect(component.remainingLabel()).toBe('44:59');
  });

  it('should let the host end the session, updating status and navigating to my-bookings', async () => {
    await setup('mentor-1');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.endSession();

    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith(mockBooking.id, 'COMPLETED');
    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-bookings'], {
      state: { creditFailed: false, bookingId: mockBooking.id },
    });
  });

  it('forwards creditFailed via navigation state to my-bookings when the credit failed', async () => {
    await setup('mentor-1');
    bookingService.updateBookingStatus.mockReturnValue(
      of({ ...mockBooking, status: 'COMPLETED', creditStatus: 'FAILED' }),
    );
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.endSession();

    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-bookings'], {
      state: { creditFailed: true, bookingId: mockBooking.id },
    });
  });

  it('should not let a non-host end the session', async () => {
    await setup('learner-1');
    component.endSession();
    expect(bookingService.updateBookingStatus).not.toHaveBeenCalled();
  });

  it('should auto-end the session for the host when the timer reaches zero', async () => {
    await setup('mentor-1');
    vi.advanceTimersByTime(45 * 60 * 1000);
    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith(mockBooking.id, 'COMPLETED');
  });

  it('does not start a status poll for the host', async () => {
    await setup('mentor-1');
    bookingService.getBookingById.mockClear();

    vi.advanceTimersByTime(5000);

    expect(bookingService.getBookingById).not.toHaveBeenCalled();
  });

  it("learner's poll detects COMPLETED and navigates to session-review", async () => {
    await setup('learner-1');
    const navigateSpy = vi.spyOn(router, 'navigate');
    bookingService.getBookingById.mockReturnValue(of({ ...mockBooking, status: 'COMPLETED' }));

    vi.advanceTimersByTime(5000);

    expect(bookingService.getBookingById).toHaveBeenCalledWith(mockBooking.id);
    expect(navigateSpy).toHaveBeenCalledWith(['/session-review', mockBooking.id]);
  });

  it("learner's poll detects a non-CONFIRMED, non-COMPLETED status (e.g. CANCELLED) and returns her to my-bookings", async () => {
    await setup('learner-1');
    const navigateSpy = vi.spyOn(router, 'navigate');
    bookingService.getBookingById.mockReturnValue(of({ ...mockBooking, status: 'CANCELLED' }));

    vi.advanceTimersByTime(5000);

    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-bookings']);
  });

  it("learner's poll keeps polling and does not navigate while status stays CONFIRMED", async () => {
    await setup('learner-1');
    const navigateSpy = vi.spyOn(router, 'navigate');

    vi.advanceTimersByTime(5000);

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("learner's poll logs and retries quietly on a transient error, without surfacing a banner", async () => {
    await setup('learner-1');
    const navigateSpy = vi.spyOn(router, 'navigate');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bookingService.getBookingById.mockReturnValue(throwError(() => new Error('network blip')));

    vi.advanceTimersByTime(5000);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(component.loadError()).toBe('');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('clears the status poll interval on destroy for the learner', async () => {
    await setup('learner-1');
    bookingService.getBookingById.mockClear();

    fixture.destroy();
    vi.advanceTimersByTime(10000);

    expect(bookingService.getBookingById).not.toHaveBeenCalled();
  });

  it('should show an error and resume the timer if ending the session fails', async () => {
    await setup('mentor-1');
    bookingService.updateBookingStatus.mockReturnValue(
      throwError(() => ({ error: { detail: 'Not allowed' } })),
    );

    component.endSession();

    expect(component.endError()).toBe('Not allowed');
    expect(component.isEnding()).toBe(false);
  });
});
