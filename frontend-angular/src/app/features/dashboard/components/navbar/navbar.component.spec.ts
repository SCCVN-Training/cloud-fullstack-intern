import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { DashboardNavbarComponent } from './navbar.component';

describe('DashboardNavbarComponent', () => {
  let component: DashboardNavbarComponent;
  let fixture: ComponentFixture<DashboardNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardNavbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
