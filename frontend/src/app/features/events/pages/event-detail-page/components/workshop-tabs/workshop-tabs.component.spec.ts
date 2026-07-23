import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkshopTabsComponent } from './workshop-tabs.component';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

describe('WorkshopTabsComponent', () => {
  let component: WorkshopTabsComponent;
  let fixture: ComponentFixture<WorkshopTabsComponent>;

  const mockWorkshop = {
    description: 'Test description',
    learningObjectives: ['Objective one', 'Objective two'],
    prerequisites: 'Some prerequisites',
  } as WorkshopDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopTabsComponent);
    component = fixture.componentInstance;
    component.workshop = mockWorkshop;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the overview tab', () => {
    expect(component.activeTab).toBe('overview');
  });

  it('should switch tabs and update the label helper', () => {
    component.selectTab('materials');
    expect(component.activeTab).toBe('materials');
    expect(component.activeTabLabel).toBe('Materials');
  });
});
