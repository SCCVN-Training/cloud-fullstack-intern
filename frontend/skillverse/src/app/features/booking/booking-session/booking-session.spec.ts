import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingSession } from './booking-session';

describe('BookingSession', () => {
  let component: BookingSession;
  let fixture: ComponentFixture<BookingSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingSession],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSession);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // =====================================
  // Component
  // =====================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =====================================
  // Page Header
  // =====================================

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Confirm Your Skill Session');
  });

  it('should render the page subtitle', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Review your session details, add any notes, and confirm your booking.',
    );
  });

  // =====================================
  // Booking Step
  // =====================================

  it('should render the booking step', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Booking');
  });

  // =====================================
  // Session Notes
  // =====================================

  it('should render the session notes section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Session Notes');
  });

  it('should render the session notes textarea', () => {
    const textarea = fixture.nativeElement.querySelector('#session-notes') as HTMLTextAreaElement;

    expect(textarea).toBeTruthy();
    expect(textarea.rows).toBe(4);
  });

  it('should render the session notes placeholder', () => {
    const textarea = fixture.nativeElement.querySelector('#session-notes') as HTMLTextAreaElement;

    expect(textarea.placeholder).toContain(
      "Example: I'd like to dive deep into decorators and context managers in Python 3.12...",
    );
  });

  // =====================================
  // Booking Tags
  // =====================================

  it('should render all booking tags', () => {
    const tags = fixture.nativeElement.querySelectorAll(
      '.booking-tag',
    ) as NodeListOf<HTMLButtonElement>;

    expect(tags.length).toBe(3);

    expect(tags[0].textContent?.trim()).toBe('#Decorators');
    expect(tags[1].textContent?.trim()).toBe('#AsyncIO');
    expect(tags[2].textContent?.trim()).toBe('#MetaClasses');
  });

  // =====================================
  // What To Expect
  // =====================================

  it('should render the what to expect section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('What to Expect');
  });

  it('should render three expectation items', () => {
    const items = fixture.nativeElement.querySelectorAll('.booking-expect-item');

    expect(items.length).toBe(3);
  });

  it('should render the online video session information', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Online video session');
    expect(element.textContent).toContain('Meet your mentor through SkillVerse Video Rooms.');
  });

  it('should render the 60-minute session information', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('60-minute session');
    expect(element.textContent).toContain('Your selected time slot is reserved for one hour.');
  });

  it('should render the protected payment information', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Protected payment');
    expect(element.textContent).toContain(
      'Coins are released after the session is completed and verified.',
    );
  });

  // =====================================
  // Booking Summary
  // =====================================

  it('should render the booking summary', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Booking Summary');
  });

  it('should render the booking date', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Tuesday, Oct 8, 2024');
  });

  it('should render the booking time', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('11:30 AM — 12:30 PM (60 min)');
  });

  it('should render the booking platform', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('SkillVerse Video Rooms');
  });

  it('should render the total cost', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('450 LC');
    expect(element.textContent).toContain('Luminous Coins');
  });

  // =====================================
  // Confirmation
  // =====================================

  it('should render the confirm booking button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    const confirmButton = Array.from(buttons).find((button) =>
      (button as HTMLElement).textContent?.includes('Confirm Booking'),
    );

    expect(confirmButton).toBeTruthy();
  });

  // =====================================
  // Trust Badge
  // =====================================

  it('should render the SkillVerse Guarantee', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('SkillVerse Guarantee');
  });

  it('should render the payment guarantee message', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Coins are only released after the session is completed and verified.',
    );
  });
});
