import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

import { Register } from './register';
import { ToastService } from '../../../shared/services/toast.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let toastService: {
  showSuccess: ReturnType<typeof vi.fn>;
  showError: ReturnType<typeof vi.fn>;
};

toastService = {
  showSuccess: vi.fn(),
  showError: vi.fn()
};
  beforeEach(async () => {
    toastService = {
      showSuccess: vi.fn(),
      showError: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        Register
      ],
      providers: [
        provideRouter([]),
        {
          provide: ToastService,
          useValue: toastService
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the page title', () => {
    const title = fixture.debugElement.query(By.css('.auth-title'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('SkillVerse');
  });

  it('should render username input', () => {
    const input = fixture.debugElement.query(
      By.css('input[formControlName="name"]')
    );

    expect(input).toBeTruthy();
  });

  it('should render email input', () => {
    const input = fixture.debugElement.query(
      By.css('input[formControlName="email"]')
    );

    expect(input).toBeTruthy();
  });

  it('should render password input', () => {
    const input = fixture.debugElement.query(
      By.css('input[formControlName="password"]')
    );

    expect(input).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);

    component.togglePasswordVisibility();

    expect(component.showPassword).toBe(true);

    component.togglePasswordVisibility();

    expect(component.showPassword).toBe(false);
  });

  it('should mark form touched when submit invalid form', () => {
    const markSpy = vi.spyOn(component.registerForm, 'markAllAsTouched');

    component.onSubmit();

    expect(markSpy).toHaveBeenCalled();  });

  it('should keep form invalid when empty', () => {
    expect(component.registerForm.invalid).toBe(true);
  });

  it('should become valid with correct values', () => {
    component.registerForm.setValue({
      name: 'Cherry',
      email: 'cherry@test.com',
      password: '123456'
    });

    expect(component.registerForm.valid).toBe(true);
  });

  it('should show loading while registering', () => {
    component.registerForm.setValue({
      name: 'Cherry',
      email: 'cherry@test.com',
      password: '123456'
    });

    component.onSubmit();

    expect(component.isLoading$.value).toBe(true);
  });

  it('should render Create Account button', () => {
    const button = fixture.debugElement.query(
      By.css('.btn-auth-submit')
    );

    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain('Create Account');
  });

  it('should render Sign in link', () => {
    const link = fixture.debugElement.query(
      By.css('a[routerLink="/login"]')
    );

    expect(link).toBeTruthy();
    expect(link.nativeElement.textContent).toContain('Sign in');
  });
});