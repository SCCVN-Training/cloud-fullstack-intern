/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkshopRegistrationCardComponent } from './workshop-registration-card.component';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

describe('WorkshopRegistrationCardComponent', () => {
  let component: WorkshopRegistrationCardComponent;
  let fixture: ComponentFixture<WorkshopRegistrationCardComponent>;

  const mockWorkshop = {
    id: 'wk-1',
    seatsFilled: 42,
    seatsTotal: 50,
  } as WorkshopDetail;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopRegistrationCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopRegistrationCardComponent);
    component = fixture.componentInstance;
    component.workshop = mockWorkshop;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute seats remaining and capacity percent', () => {
    expect(component.seatsRemaining).toBe(8);
    expect(component.capacityPercent).toBe(84);
  });

  it('should clamp capacity percent to 100 even with bad data (filled > total)', () => {
    component.workshop = { ...mockWorkshop, seatsFilled: 60, seatsTotal: 50 };
    expect(component.capacityPercent).toBe(100);
  });

  // Test that status changes and emit is called immediately
  it('should move to processing and emit when registering', () => {
    vi.spyOn(component.register, 'emit');
    expect(component.status).toBe('idle');

    component.onRegisterClick();
    expect(component.status).toBe('processing');
    expect(component.register.emit).toHaveBeenCalledWith('wk-1');
  });

  // Test that status transitions to registered after timeout completes
  it('should move to registered after setTimeout resolves', (done) => {
    vi.spyOn(component.register, 'emit');
    component.onRegisterClick();

    setTimeout(() => {
      expect(component.status).toBe('registered');
      done();
    }, 1300);
  });

  // Test that second click is ignored while processing
  it('should ignore a second click while already processing', () => {
    vi.spyOn(component.register, 'emit');
    component.onRegisterClick();
    component.onRegisterClick(); // should be a no-op
    expect(component.register.emit).toHaveBeenCalledTimes(1);
  });
});
