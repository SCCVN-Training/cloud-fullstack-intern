import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain three statistics', () => {
    expect(component.stats.length).toBe(3);
  });

  it('should have the correct statistics', () => {
    expect(component.stats[0]).toEqual({
      label: 'Active Skills',
      value: '1,840',
      percentage: '+5%',
      icon: 'psychology',
      type: 'skills',
    });

    expect(component.stats[1]).toEqual({
      label: 'Total Bookings',
      value: '3,210',
      percentage: '+24%',
      icon: 'event_available',
      type: 'bookings',
    });

    expect(component.stats[2]).toEqual({
      label: 'Skill Coins',
      value: '850,000 SC',
      percentage: '+8%',
      icon: 'toll',
      type: 'coins',
    });
  });

  it('should render the page title', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Admin Dashboard');
  });

  it('should render the page subtitle', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Overview of SkillVerse activity and platform performance.',
    );
  });

  it('should render all statistics cards', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Active Skills');
    expect(element.textContent).toContain('1,840');

    expect(element.textContent).toContain('Total Bookings');
    expect(element.textContent).toContain('3,210');

    expect(element.textContent).toContain('Skill Coins');
    expect(element.textContent).toContain('850,000 SC');
  });

  it('should render the Platform Growth section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Platform Growth');
    expect(element.textContent).toContain('New registrations and bookings over the last 30 days.');
  });

  it('should render the growth chart canvas', () => {
    const canvas = fixture.nativeElement.querySelector('#growthChart') as HTMLCanvasElement | null;

    // The template currently uses #growthChart as a template reference,
    // not an id, so verify the canvas itself instead.
    const chartCanvas = canvas ?? fixture.nativeElement.querySelector('canvas');

    expect(chartCanvas).toBeTruthy();
  });

  it('should render the Recent Activity section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Recent Activity');
    expect(element.textContent).toContain('Latest activity across the platform.');
  });

  it('should render all recent activity items', () => {
    const activities = fixture.nativeElement.querySelectorAll('.activity-item');

    expect(activities.length).toBe(4);
  });

  it('should render recent activity titles', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('New user registered');
    expect(element.textContent).toContain('Booking completed');
    expect(element.textContent).toContain('New skill published');
    expect(element.textContent).toContain('New review submitted');
  });

  it('should render the View all link', () => {
    const link = fixture.nativeElement.querySelector('.dashboard-view-all') as HTMLAnchorElement;

    expect(link).toBeTruthy();
    expect(link.textContent).toContain('View all');
  });
});
