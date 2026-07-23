import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { WorkshopDetailComponent } from './workshop-detail.component';
import { WorkshopDetailService } from '../../services/workshop-detail.service';
import { WorkshopDetail } from '../../models/workshop-detail.model';

describe('WorkshopDetailComponent', () => {
  let component: WorkshopDetailComponent;
  let fixture: ComponentFixture<WorkshopDetailComponent>;
  let serviceSpy: jasmine.SpyObj<WorkshopDetailService>;

  const mockWorkshop = { id: 'wk-1', title: 'Test Workshop' } as WorkshopDetail;

  function setup(paramId: string | null, response = of(mockWorkshop)) {
    serviceSpy = jasmine.createSpyObj('WorkshopDetailService', ['getWorkshopById']);
    serviceSpy.getWorkshopById.and.returnValue(response);

    TestBed.configureTestingModule({
      imports: [WorkshopDetailComponent],
      providers: [
        provideRouter([]), // needed because this template renders <app-workshop-hero>, which uses RouterLink
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

  it('should load the workshop for the route id', () => {
    setup('wk-1');
    fixture.detectChanges();

    expect(serviceSpy.getWorkshopById).toHaveBeenCalledWith('wk-1');
    expect(component.workshop).toEqual(mockWorkshop);
    expect(component.isLoading).toBe(false);
  });

  it('should flag a load error when there is no id in the route', () => {
    setup(null);
    fixture.detectChanges();

    expect(serviceSpy.getWorkshopById).not.toHaveBeenCalled();
    expect(component.loadError).toBe(true);
  });

  it('should flag a load error when the service call fails', () => {
    setup('wk-1', throwError(() => new Error('network error')));
    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(component.isLoading).toBe(false);
  });
});
