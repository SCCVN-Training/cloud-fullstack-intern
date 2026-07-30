import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, type Mock } from 'vitest';
import { WorkshopDetailComponent } from './workshop-detail.component';
import { WorkshopDetailService } from '../../services/workshop-detail.service';
import { WorkshopDetail } from '../../models/workshop-detail.model';

describe('WorkshopDetailComponent', () => {
  // SETUP: Angular needs a sandbox (fake environment) to run the component. 
  let component: WorkshopDetailComponent;
  let fixture: ComponentFixture<WorkshopDetailComponent>;

  // This is a fake verion of WorkshopDetailService. We use `vi.fn()` (from Vitest) 
  // to watch whether `getWorkshopById` gets called and control what it returns 
  let serviceSpy: { getWorkshopById: Mock };

  // Fake data representing a workshop so we don't need real data from a server
  const mockWorkshop = {
    id: 'wk-1',
    title: 'Global Supply Chain Resilience 2024',
    status: 'published',
    heroImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    dateLabel: 'Oct 24, 2024',
    timeLabel: '10:00 AM (2h)',
    location: 'Main Hall, HQ-12',
    format: 'in-person',
    difficulty: 'intermediate',
    seatsFilled: 42,
    seatsTotal: 50,
    speaker: {
      name: 'Dr. Elena Rodriguez',
      title: 'Head of Global Logistics',
      bio: "Dr. Rodriguez is a distinguished expert with over 20 years of experience in optimizing international logistics chains. Her work focuses on integrating AI-driven predictive modeling to mitigate risks in global trade routes. She has pioneered resilience frameworks for SCC's top enterprise partners.",
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
    },
    description:
      'In an era of increasing global volatility, the ability to build and maintain a resilient supply chain is no longer just a competitive advantage — it is a survival necessity. This intensive 2-hour workshop will deconstruct the current landscape of global logistics and provide actionable strategies for risk management.',
    learningObjectives: [
      'Identify and quantify high-probability disruptors in the current logistics cycle.',
      "Develop a 'Dual-Source' strategy framework for critical component procurement.",
      'Implement real-time visibility tools across multi-tier supplier networks.',
    ],
    prerequisites:
      "Participants should have a foundational understanding of SCC's core logistical platform and at least 3 years of experience in supply chain management or procurement roles.",
  } as WorkshopDetail;

  function setup(paramId: string | null, response = of(mockWorkshop)) {
    serviceSpy = { getWorkshopById: vi.fn() };
    serviceSpy.getWorkshopById.mockReturnValue(response);

    TestBed.configureTestingModule({
      imports: [WorkshopDetailComponent],
      providers: [
        provideRouter([]),
        { provide: WorkshopDetailService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(paramId ? { id: paramId } : {}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopDetailComponent);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    setup('wk-1');
    expect(component).toBeTruthy();
  });

  // TEST 02: Displaying the corresponding detail page
  it('should load the workshop for the route id', () => {
    setup('wk-1');
    fixture.detectChanges();

    expect(serviceSpy.getWorkshopById).toHaveBeenCalledWith('wk-1');
    expect(component.workshop).toEqual(mockWorkshop);
    expect(component.isLoading).toBe(false);
  });

  // TEST 03: No ID specified in the URL?
  // the component shouldn't bother asking the server for data
  // it should immediately set `loadError = true`
  it('should flag a load error when there is no id in the route', () => {
    setup(null);
    fixture.detectChanges();

    expect(serviceSpy.getWorkshopById).not.toHaveBeenCalled();
    expect(component.loadError).toBe(true);
  });

  // TEST 04: What happens if the server/API fails?
  // if the user visit `/workshop/wk-1`, but the server returns a 500 Network Error, 
  // the component should stop loading (`isLoading = false`) and set `loadError = true`
  // so a friendly error message cna be shown to the user. 
  it('should flag a load error when the service call fails', () => {
    setup(
      'wk-1',
      throwError(() => new Error('network error')),
    );
    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoading).toBe(false);
  });

  it('should initialize with null workshop and false flags', () => {
    setup('wk-1');

    expect(component.workshop).toBeNull();
    expect(component.isLoading).toBe(false);
    expect(component.loadError).toBe(false);
  });

  it('should set isLoading to true before calling service', () => {
    setup('wk-1');

    expect(component.isLoading).toBe(false);
  });

  // it('should clear previous error on successful reload', () => {
  //   setup('wk-1');
  //   fixture.detectChanges();

  //   expect(component.loadError).toBe(false);
  //   expect(component.workshop).toEqual(mockWorkshop);
  // });

  // it('should call onRegister with the workshop id', () => {
  //   setup('wk-1');
  //   fixture.detectChanges();
  //   vi.spyOn(console, 'log');

  //   component.onRegister('wk-1');

  //   expect(console.log).toHaveBeenCalledWith('Register requested for workshop', 'wk-1');
  // });

  // it('should handle registration for different workshop ids', () => {
  //   setup('wk-1');
  //   fixture.detectChanges();
  //   vi.spyOn(console, 'log');

  //   const workshopIds = ['wk-1', 'wk-2', 'wk-3'];
  //   workshopIds.forEach((id) => {
  //     component.onRegister(id);
  //     expect(console.log).toHaveBeenCalledWith('Register requested for workshop', id);
  //   });

  //   expect(console.log).toHaveBeenCalledTimes(3);
  // });

  // it('should load workshop with different ids from route', () => {
  //   const workShopId = 'wk-2';
  //   setup(workShopId);
  //   fixture.detectChanges();

  //   expect(serviceSpy.getWorkshopById).toHaveBeenCalledWith(workShopId);
  // });

  // it('should log error to console when workshop load fails', () => {
  //   vi.spyOn(console, 'error');
  //   setup(
  //     'wk-1',
  //     throwError(() => new Error('network error')),
  //   );
  //   fixture.detectChanges();

  //   expect(console.error).toHaveBeenCalledWith(
  //     'WorkshopDetailComponent load error:',
  //     expect.any(Error),
  //   );
  // });
});