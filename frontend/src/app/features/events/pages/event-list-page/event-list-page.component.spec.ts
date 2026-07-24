/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EventsComponentList } from './event-list-page.component';
import { EventService } from '../../services/event.service';
import { PagedResult, Workshop, WorkshopFilters, WorkshopFormat, WorkshopDifficulty } from '../../models/event.model';

describe('EventsComponentList', () => {
  let component: EventsComponentList;
  let fixture: ComponentFixture<EventsComponentList>;
  let eventService: jasmine.SpyObj<EventService>;

  const mockWorkshops: Workshop[] = [
    {
      id: 'ws-1',
      title: 'Workshop 1',
      categoryTags: ['LOGISTICS'],
      speakerName: 'John Doe',
      dateLabel: 'Oct 24, 2024 | 10:00 AM',
      location: 'Room A',
      format: 'in-person' as WorkshopFormat,
      difficulty: 'beginner' as WorkshopDifficulty,
      topics: ['topic1'],
      seatsFilled: 10,
      seatsTotal: 20,
      thumbnailUrl: 'https://example.com/img1.jpg',
    },
    {
      id: 'ws-2',
      title: 'Workshop 2',
      categoryTags: ['STRATEGY'],
      speakerName: 'Jane Smith',
      dateLabel: 'Oct 25, 2024 | 2:00 PM',
      location: 'Room B',
      format: 'virtual' as WorkshopFormat,
      difficulty: 'intermediate' as WorkshopDifficulty,
      topics: ['topic2'],
      seatsFilled: 5,
      seatsTotal: 30,
      thumbnailUrl: 'https://example.com/img2.jpg',
    },
  ];

  const mockPagedResult: PagedResult<Workshop> = {
    items: mockWorkshops,
    totalItems: 2,
    totalPages: 1,
    page: 1,
  };

  beforeEach(async () => {
    eventService = jasmine.createSpyObj('EventService', ['getWorkshops']);
    eventService.getWorkshops.and.returnValue(of(mockPagedResult));

    await TestBed.configureTestingModule({
      imports: [EventsComponentList],
      providers: [{ provide: EventService, useValue: eventService }],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponentList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load workshops on initialization', () => {
    fixture.detectChanges();

    expect(eventService.getWorkshops).toHaveBeenCalledWith({}, 1);
    expect(component.workshops).toEqual(mockWorkshops);
    expect(component.totalItems).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should set isLoading to true while loading workshops', () => {
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
  });

  it('should update filters and reset page to 1 when onFiltersChanged is called', () => {
    fixture.detectChanges();
    eventService.getWorkshops.calls.reset();

    const newFilters: Partial<WorkshopFilters> = { timeline: 'today' };
    component.onFiltersChanged(newFilters);

    expect(component.currentPage).toBe(1);
    expect(eventService.getWorkshops).toHaveBeenCalledWith(newFilters, 1);
  });

  it('should load workshops with updated page when onPageChanged is called', () => {
    fixture.detectChanges();
    eventService.getWorkshops.calls.reset();

    component.onPageChanged(2);

    expect(component.currentPage).toBe(2);
    expect(eventService.getWorkshops).toHaveBeenCalledWith({}, 2);
  });

  it('should handle error when loading workshops', () => {
    eventService.getWorkshops.and.returnValue(throwError(() => new Error('Network error')));

    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.workshops.length).toBe(0);
  });

  it('should update workshops list when service returns data', () => {
    const additionalWorkshop: Workshop = {
      id: 'ws-3',
      title: 'Workshop 3',
      categoryTags: ['LOGISTICS'],
      speakerName: 'Bob Johnson',
      dateLabel: 'Oct 26, 2024 | 3:00 PM',
      location: 'Room C',
      format: 'in-person' as WorkshopFormat,
      difficulty: 'advanced' as WorkshopDifficulty,
      topics: ['topic3'],
      seatsFilled: 15,
      seatsTotal: 25,
      thumbnailUrl: 'https://example.com/img3.jpg',
    };

    const additionalWorkshops: Workshop[] = [...mockWorkshops, additionalWorkshop];

    const newPagedResult: PagedResult<Workshop> = {
      items: additionalWorkshops,
      totalItems: 3,
      totalPages: 2,
      page: 1,
    };

    eventService.getWorkshops.and.returnValue(of(newPagedResult));

    fixture.detectChanges();

    expect(component.workshops.length).toBe(3);
    expect(component.totalItems).toBe(3);
    expect(component.totalPages).toBe(2);
  });

  it('should apply filters and load updated workshops list', () => {
    fixture.detectChanges();
    eventService.getWorkshops.calls.reset();

    const filters: Partial<WorkshopFilters> = { 
      timeline: 'this-week',
      formats: ['virtual'],
    };
    
    component.onFiltersChanged(filters);

    expect(eventService.getWorkshops).toHaveBeenCalledWith(filters, 1);
    expect(component.currentPage).toBe(1);
  });

  it('should maintain active filters when changing pages', () => {
    fixture.detectChanges();

    const filters: Partial<WorkshopFilters> = { timeline: 'today' };
    component.onFiltersChanged(filters);

    eventService.getWorkshops.calls.reset();
    component.onPageChanged(2);

    expect(eventService.getWorkshops).toHaveBeenCalledWith(filters, 2);
  });
});
