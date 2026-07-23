import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkshopHeroComponent } from './workshop-hero.component';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

describe('WorkshopHeroComponent', () => {
  let component: WorkshopHeroComponent;
  let fixture: ComponentFixture<WorkshopHeroComponent>;

  const mockWorkshop = {
    id: 'wk-1',
    title: 'Test Workshop',
    status: 'published',
    heroImageUrl: 'assets/test.jpg',
  } as WorkshopDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopHeroComponent],
      providers: [provideRouter([])], // RouterLink needs a Router in the injector, even with no real routes
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopHeroComponent);
    component = fixture.componentInstance;
    component.workshop = mockWorkshop;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the workshop title in the breadcrumb and hero', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Test Workshop');
  });
});
