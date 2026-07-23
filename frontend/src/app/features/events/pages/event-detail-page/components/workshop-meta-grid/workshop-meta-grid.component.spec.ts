import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkshopMetaGridComponent } from './workshop-meta-grid.component';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

describe('WorkshopMetaGridComponent', () => {
  let component: WorkshopMetaGridComponent;
  let fixture: ComponentFixture<WorkshopMetaGridComponent>;

  const mockWorkshop = {
    dateLabel: 'Oct 24, 2024',
    timeLabel: '10:00 AM (2h)',
    location: 'Main Hall, HQ-12',
    seatsTotal: 50,
  } as WorkshopDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopMetaGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopMetaGridComponent);
    component = fixture.componentInstance;
    component.workshop = mockWorkshop;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build 4 meta items from the workshop', () => {
    expect(component.items.length).toBe(4);
    expect(component.items[3].value).toBe('50 Seats Max');
  });
});
