import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { DashboardNavbar } from './dashboard-navbar';

describe('DashboardNavbar', () => {
  let component: DashboardNavbar;
  let fixture: ComponentFixture<DashboardNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavbar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
