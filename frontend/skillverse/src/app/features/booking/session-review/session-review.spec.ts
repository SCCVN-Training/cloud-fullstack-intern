import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SessionReview } from './session-review';
import { BookingService } from '../../../core/services/booking/booking.service';
import { ReviewService } from '../../../core/services/review/review.service';
import { Booking } from '../../../core/models/booking.model';
import { ReviewItemResponse } from '../../../core/services/review/review.types';

const mockBooking: Booking = {
  id: 'booking-1',
  skillId: 'skill-1',
  learnerId: 'learner-1',
  mentorId: 'mentor-1',
  sessionDate: '2026-08-25T10:00:00Z',
  status: 'COMPLETED',
  pricePaid: 120,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
  skillTitle: 'React Architecture Patterns',
  mentorName: 'Sarah',
};

const mockReviewResponse: ReviewItemResponse = {
  id: 'review-1',
  booking_id: mockBooking.id,
  reviewer_id: 'learner-1',
  reviewer_name: 'Alex Learner',
  reviewer_avatar_url: null,
  rating: 5,
  knowledge_rating: 4,
  communication_rating: 5,
  video_audio_rating: 4,
  feedback: 'Excellent session.',
  created_at: '2026-08-24T00:00:00Z',
};

describe('SessionReview', () => {
  let component: SessionReview;
  let fixture: ComponentFixture<SessionReview>;
  let bookingService: { getBookingById: ReturnType<typeof vi.fn> };
  let reviewService: { submitReview: ReturnType<typeof vi.fn> };

  async function setup(bookingId: string | null = mockBooking.id) {
    bookingService = { getBookingById: vi.fn().mockReturnValue(of(mockBooking)) };
    reviewService = { submitReview: vi.fn().mockReturnValue(of(mockReviewResponse)) };

    await TestBed.configureTestingModule({
      imports: [SessionReview],
      providers: [
        provideRouter([]),
        { provide: BookingService, useValue: bookingService },
        { provide: ReviewService, useValue: reviewService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => bookingId } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create and load the booking', async () => {
    await setup();
    expect(bookingService.getBookingById).toHaveBeenCalledWith(mockBooking.id);
    expect(component.booking()?.mentorName).toBe('Sarah');
  });

  it('should show an error state when no bookingId is present in the route', async () => {
    await setup(null);
    expect(component.loadError()).toContain('No session specified');
    expect(bookingService.getBookingById).not.toHaveBeenCalled();
  });

  it('should initialize with five stars and zero ratings', async () => {
    await setup();
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
    expect(component.overallRating).toBe(0);
    expect(component.knowledgeRating).toBe(0);
    expect(component.communicationRating).toBe(0);
    expect(component.videoAudioRating).toBe(0);
  });

  it('should not allow submission without an overall rating', async () => {
    await setup();
    expect(component.canSubmit).toBe(false);
  });

  it('should allow submission after selecting an overall rating', async () => {
    await setup();
    component.setOverallRating(5);
    expect(component.canSubmit).toBe(true);
  });

  it('should render the mentor name in the header', async () => {
    await setup();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('How was your session with Sarah?');
  });

  it('should render five overall rating buttons per category (20 total)', async () => {
    await setup();
    const buttons = fixture.nativeElement.querySelectorAll('.rating-star');
    expect(buttons.length).toBe(20);
  });

  it('should update the overall rating when a star is clicked', async () => {
    await setup();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.rating-star',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[2].click();
    fixture.detectChanges();

    expect(component.overallRating).toBe(3);
  });

  it('should update the feedback when the textarea changes', async () => {
    await setup();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'Very helpful session.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.feedback).toBe('Very helpful session.');
  });

  it('should submit a review with the real booking id and chosen ratings', async () => {
    await setup();
    component.setOverallRating(5);
    component.setKnowledgeRating(4);
    component.setCommunicationRating(5);
    component.setVideoAudioRating(4);
    component.feedback = 'Excellent session.';

    component.submitReview();

    expect(reviewService.submitReview).toHaveBeenCalledWith(mockBooking.id, {
      rating: 5,
      knowledge_rating: 4,
      communication_rating: 5,
      video_audio_rating: 4,
      feedback: 'Excellent session.',
    });
  });

  it('should not submit when there is no overall rating', async () => {
    await setup();
    component.feedback = 'Great session.';

    component.submitReview();

    expect(reviewService.submitReview).not.toHaveBeenCalled();
  });

  it('should show a submit error when the backend rejects the review', async () => {
    await setup();
    reviewService.submitReview.mockReturnValue(
      throwError(() => ({ error: { detail: 'You have already reviewed this booking' } })),
    );
    component.setOverallRating(5);

    component.submitReview();

    expect(component.submitError()).toBe('You have already reviewed this booking');
    expect(component.isSubmitting()).toBe(false);
  });
});
