import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { DashboardNavbarMenu } from './dashboard-navbar-menu';

describe('DashboardNavbarMenu', () => {
  let component: DashboardNavbarMenu;
  let fixture: ComponentFixture<DashboardNavbarMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavbarMenu],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardNavbarMenu);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
