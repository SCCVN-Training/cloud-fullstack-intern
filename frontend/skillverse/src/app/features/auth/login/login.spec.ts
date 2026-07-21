import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { vi } from 'vitest';

import { Login } from './login';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let toastService: ToastService;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),

        ToastService,

        {
          provide: AuthService,
          useValue: {
            login: vi.fn()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    toastService = TestBed.inject(ToastService);
    authService = TestBed.inject(AuthService);

    fixture.detectChanges();
  });

  // =====================================
  // Component
  // =====================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =====================================
  // Form
  // =====================================

  it('should create login form', () => {
    expect(component.loginForm).toBeTruthy();
    expect(component.loginForm.contains('email')).toBe(true);
    expect(component.loginForm.contains('password')).toBe(true);
  });

  it('should require email', () => {
    const email = component.f['email'];

    email.setValue('');

    expect(email.valid).toBe(false);
    expect(email.errors?.['required']).toBeTruthy();
  });

  it('should validate email format', () => {
    const email = component.f['email'];

    email.setValue('abc');

    expect(email.valid).toBe(false);
    expect(email.errors?.['email']).toBeTruthy();
  });

  it('should require password', () => {
    const password = component.f['password'];

    password.setValue('');

    expect(password.valid).toBe(false);
    expect(password.errors?.['required']).toBeTruthy();
  });

  it('should require password length >= 6', () => {
    const password = component.f['password'];

    password.setValue('123');

    expect(password.valid).toBe(false);
    expect(password.errors?.['minlength']).toBeTruthy();
  });

  // =====================================
  // Password Toggle
  // =====================================

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);

    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);

    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  // =====================================
  // Invalid Submit
  // =====================================

  it('should not submit invalid form', () => {
    component.loginForm.setValue({
      email: '',
      password: ''
    });

    component.onSubmit();

    expect(component.loginForm.invalid).toBe(true);
  });

  // =====================================
  // Login Logic
  // =====================================

  it('should login successfully', async () => {
    const loginSpy = vi.spyOn(authService, 'login');
    const successSpy = vi.spyOn(toastService, 'showSuccess');

    component.loginForm.setValue({
      email: 'admin@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    await new Promise(resolve => setTimeout(resolve, 1700));

    expect(loginSpy).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalledWith('Login successful!');
  });

  it('should show error for wrong email', async () => {
    const errorSpy = vi.spyOn(toastService, 'showError');

    component.loginForm.setValue({
      email: 'wrong@gmail.com',
      password: '123456'
    });

    component.onSubmit();

    await new Promise(resolve => setTimeout(resolve, 1700));

    expect(component.errorMessage$.value).toBe(
      'Email does not exist in the system.'
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Incorrect email. Please check again!'
    );
  });

  it('should show error for wrong password', async () => {
    const errorSpy = vi.spyOn(toastService, 'showError');

    component.loginForm.setValue({
      email: 'admin@gmail.com',
      password: '654321'
    });

    component.onSubmit();

    await new Promise(resolve => setTimeout(resolve, 1700));

    expect(component.errorMessage$.value).toBe(
      'Password is not correct.'
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Incorrect password. Please try again!'
    );
  });
});