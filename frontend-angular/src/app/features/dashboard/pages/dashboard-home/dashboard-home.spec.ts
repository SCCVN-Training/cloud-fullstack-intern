import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { DashboardHome } from './dashboard-home';

describe('DashboardHome', () => {
  let component: DashboardHome;
  let fixture: ComponentFixture<DashboardHome>;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHome],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
