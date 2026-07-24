import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventFiltersComponent } from './event-filters.component';

describe('EventFiltersComponent', () => {
  let component: EventFiltersComponent;
  let fixture: ComponentFixture<EventFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EventFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle a topic on and off', () => {
    component.toggleTopic('Analytics');
    expect(component.isTopicSelected('Analytics')).toBe(true);
    component.toggleTopic('Analytics');
    expect(component.isTopicSelected('Analytics')).toBe(false);
  });

  it('should emit filters with only checked formats on applyFilters', () => {
    component.filtersChanged.subscribe((filters) => {
      expect(filters.formats).toEqual(['in-person']);
    });
    component.applyFilters();
  });
});
