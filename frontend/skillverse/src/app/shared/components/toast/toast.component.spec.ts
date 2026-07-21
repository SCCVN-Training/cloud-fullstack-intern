import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);

    fixture.detectChanges();
  });

  // ==========================
  // Component Creation
  // ==========================
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================
  // Success Toast
  // ==========================
  it('should display a success toast', () => {
    toastService.showSuccess('Operation completed');

    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast-success'));

    expect(toast).toBeTruthy();
    expect(toast.nativeElement.textContent).toContain('Operation completed');
    expect(toast.nativeElement.textContent).toContain('check_circle');
  });

  // ==========================
  // Error Toast
  // ==========================
  it('should display an error toast', () => {
    toastService.showError('Something went wrong');

    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast-error'));

    expect(toast).toBeTruthy();
    expect(toast.nativeElement.textContent).toContain('Something went wrong');
    expect(toast.nativeElement.textContent).toContain('error');
  });

  // ==========================
  // Info Toast
  // ==========================
  it('should display an info toast', () => {
    toastService.showInfo('Information');

    fixture.detectChanges();

    const toast = fixture.debugElement.query(By.css('.toast-info'));

    expect(toast).toBeTruthy();
    expect(toast.nativeElement.textContent).toContain('Information');
    expect(toast.nativeElement.textContent).toContain('info');
  });

  // ==========================
  // Destroy
  // ==========================
it('should destroy without errors', () => {
  expect(() => component.ngOnDestroy()).not.toThrow();
});
});

function spyOn(sub: any, arg1: string) {
    throw new Error('Function not implemented.');
}
