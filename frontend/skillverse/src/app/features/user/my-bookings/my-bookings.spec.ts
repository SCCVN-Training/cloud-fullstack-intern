import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MyBookings } from './my-bookings';

describe('MyBookings', () => {
  let component: MyBookings;
  let fixture: ComponentFixture<MyBookings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBookings],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with Upcoming tab', () => {
    expect(component.activeTab).toBe('Upcoming');
  });

  it('should contain three tabs', () => {
    expect(component.tabs).toEqual([
      'Upcoming',
      'Completed',
      'Cancelled'
    ]);
  });

  it('should contain three bookings', () => {
    expect(component.bookings.length).toBe(3);
  });

  it('should return only upcoming bookings', () => {
    component.activeTab = 'Upcoming';

    expect(component.filteredBookings.length).toBe(3);
    expect(component.filteredBookings.every(b => b.tab === 'Upcoming')).toBe(true);
  });

  it('should return no completed bookings', () => {
    component.activeTab = 'Completed';

    expect(component.filteredBookings.length).toBe(0);
  });

  it('should return the selected booking', () => {
    const booking = component.selectedBooking;

    expect(booking).toBeTruthy();
    expect(booking?.id).toBe(1);
  });

  it('should change active tab', () => {
    component.selectTab('Cancelled');

    expect(component.activeTab).toBe('Cancelled');
  });

  it('should select booking by id', () => {
    component.selectBooking(2);

    expect(component.bookings[1].selected).toBe(true);
    expect(component.bookings[0].selected).toBe(false);
    expect(component.bookings[2].selected).toBe(false);
  });

  it('should render page title', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('My Bookings');
  });

  it('should render all tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('.tab-btn'));

    expect(tabs.length).toBe(3);

    expect(tabs[0].nativeElement.textContent).toContain('Upcoming');
    expect(tabs[1].nativeElement.textContent).toContain('Completed');
    expect(tabs[2].nativeElement.textContent).toContain('Cancelled');
  });

  it('should render all upcoming bookings', () => {
    const bookings = fixture.debugElement.queryAll(By.css('.booking-card'));

    expect(bookings.length).toBe(3);
  });

  it('should render booking titles', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Advanced Figma Prototyping');
    expect(compiled.textContent).toContain('Conversational Spanish for Beginners');
    expect(compiled.textContent).toContain('Python Data Analysis Basics');
  });

  it('should display session details for selected booking', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Session Details');
    expect(compiled.textContent).toContain('Sarah Jenkins');
  });

  it('should display meeting link for actionable booking', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Meeting Link');
    expect(compiled.textContent).toContain('Passcode');
  });

  it('should update booking selection when booking card is clicked', () => {
    const bookingCards = fixture.debugElement.queryAll(By.css('.booking-card'));

    bookingCards[1].nativeElement.click();
    fixture.detectChanges();

    expect(component.selectedBooking?.id).toBe(2);
  });

  it('should highlight active tab', () => {
    const tabs = fixture.debugElement.queryAll(By.css('.tab-btn'));

    expect(tabs[0].nativeElement.classList).toContain('active');
  });

  it('should render Join Session button for actionable bookings', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Join Session');
  });

  it('should render Awaiting Confirmation button for pending bookings', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Awaiting Confirmation');
  });

  it('should render Join Meeting Now button in sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Join Meeting Now');
  });

  it('should render Reschedule button in sidebar', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Reschedule');
  });
});