import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventCardComponent } from './event-card.component';
import { Workshop } from '../../models/event.model';

describe('EventCardComponent', () => {
  let component: EventCardComponent;
  let fixture: ComponentFixture<EventCardComponent>;

  const mockWorkshop: Workshop = {
    id: 'wk-1',
    title: 'Test Workshop',
    categoryTags: ['LOGISTICS'],
    speakerName: 'Jane Doe',
    dateLabel: 'Jan 1, 2026 | 10:00 AM',
    location: 'Main Hall',
    format: 'in-person',
    difficulty: 'beginner',
    topics: ['Supply Chain'],
    seatsFilled: 10,
    seatsTotal: 20,
    thumbnailUrl: 'assets/images/workshops/test.jpg',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCardComponent);
    component = fixture.componentInstance;
    component.workshop = mockWorkshop;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute the seats label', () => {
    expect(component.seatsLabel).toBe('10 / 20 seats');
  });

  it('should compute capacity percent', () => {
    expect(component.capacityPercent).toBe(50);
  });
});
