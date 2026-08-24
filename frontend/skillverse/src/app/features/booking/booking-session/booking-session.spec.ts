import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { BookingSession } from './booking-session';
import { SkillService } from '../../../core/services/skill/skill.service';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Skill } from '../../../core/models/skill.model';
import { Booking } from '../../../core/models/booking.model';

const mockSkill: Skill = {
  id: 'react-architecture-patterns',
  title: 'React Architecture Patterns',
  category: 'Development',
  description: 'Learn modern frontend architecture.',
  image: '/assets/images/skill-react.png',
  price: 120,
  duration: '2h',
  level: 'Intermediate',
  requirements: 'Basic React knowledge',
  rating: 4.8,
  reviewCount: 42,
  instructorName: 'Jane Doe',
  instructorTitle: 'Senior Developer',
  instructorBio: 'Frontend expert',
  instructorAvatar: '/assets/images/jane-avatar.png',
  availableSlots: 5,
  language: 'English',
  tags: ['react', 'architecture'],
  featured: false,
  createdAt: '2026-07-01',
};

const mockBooking: Booking = {
  id: 'booking-1',
  skillId: mockSkill.id,
  learnerId: 'learner-1',
  mentorId: 'mentor-1',
  sessionDate: '2026-08-25T10:00:00Z',
  status: 'PENDING',
  pricePaid: mockSkill.price,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
};

describe('BookingSession', () => {
  let component: BookingSession;
  let fixture: ComponentFixture<BookingSession>;
  let skillService: { getSkillById: ReturnType<typeof vi.fn> };
  let bookingService: { createBooking: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(skillId: string | null = mockSkill.id) {
    skillService = { getSkillById: vi.fn().mockReturnValue(of(mockSkill)) };
    bookingService = { createBooking: vi.fn().mockReturnValue(of(mockBooking)) };

    await TestBed.configureTestingModule({
      imports: [BookingSession],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: SkillService, useValue: skillService },
        { provide: BookingService, useValue: bookingService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => skillId } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSession);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should load the skill from the route param', async () => {
    await setup();
    expect(skillService.getSkillById).toHaveBeenCalledWith(mockSkill.id);
    expect(component.skill()?.title).toBe(mockSkill.title);
  });

  it('should render the loaded skill title and real price', async () => {
    await setup();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(mockSkill.title);
    expect(element.textContent).toContain(`${mockSkill.price} LC`);
  });

  it('should show an error state when no skillId is present in the route', async () => {
    await setup(null);
    expect(component.errorMessage()).toContain('No skill selected');
    expect(skillService.getSkillById).not.toHaveBeenCalled();
  });

  it('should show an error state when the skill fails to load', async () => {
    skillService = { getSkillById: vi.fn().mockReturnValue(throwError(() => new Error('boom'))) };
    bookingService = { createBooking: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [BookingSession],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: SkillService, useValue: skillService },
        { provide: BookingService, useValue: bookingService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => mockSkill.id } } },  },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BookingSession);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('Unable to load this skill');
  });

  it('should submit a booking with the skillId, chosen date, and notes', async () => {
    await setup();
    component.sessionNotes.set('Focus on hooks');
    component.sessionDateTime.set('2026-08-25T10:00');

    component.confirmBooking();

    expect(bookingService.createBooking).toHaveBeenCalledWith({
      skillId: mockSkill.id,
      sessionDate: new Date('2026-08-25T10:00').toISOString(),
      sessionNotes: 'Focus on hooks',
    });
  });

  it('should navigate to my-bookings after a successful booking', async () => {
    await setup();
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.confirmBooking();

    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-bookings']);
  });

  it('should show a submit error message when booking creation fails', async () => {
    await setup();
    bookingService.createBooking.mockReturnValue(
      throwError(() => ({ error: { detail: 'No slots available' } })),
    );

    component.confirmBooking();

    expect(component.submitError()).toBe('No slots available');
    expect(component.isSubmitting()).toBe(false);
  });
});
