import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { DashboardNavbarMenuComponent } from './navbar-menu.component';

describe('DashboardNavbarMenuComponent', () => {
  let component: DashboardNavbarMenuComponent;
  let fixture: ComponentFixture<DashboardNavbarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavbarMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardNavbarMenuComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
