import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpCardComponent } from './help-card.component';

describe('HelpCardComponent', () => {
  let component: HelpCardComponent;
  let fixture: ComponentFixture<HelpCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fall back to default copy when no inputs are provided', () => {
    expect(component.title).toBe('Need assistance?');
    expect(component.linkLabel).toBe('Contact Support');
  });

  it('should render custom inputs when provided', () => {
    fixture.componentRef.setInput('title', 'Custom title');
    fixture.componentRef.setInput('linkLabel', 'Custom link');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Custom title');
    expect(text).toContain('Custom link');
  });
});
