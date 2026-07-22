import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardUserProfile } from './dashboard-user-profile';

describe('DashboardUserProfile', () => {
  let component: DashboardUserProfile;
  let fixture: ComponentFixture<DashboardUserProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardUserProfile],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardUserProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
