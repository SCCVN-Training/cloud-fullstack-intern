import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Login } from './login';
import { AuthService } from '@core/auth/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Set up spies to safely mock our dependencies
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideNoopAnimations(), // Required for MatFormFieldModule and MatInputModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePassword();
    expect(component.showPassword).toBeTrue();
  });

  it('should mark all controls as touched if form is invalid on submit', () => {
    spyOn(component.loginForm, 'markAllAsTouched');
    component.onSubmit();

    expect(component.loginForm.markAllAsTouched).toHaveBeenCalled();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should navigate to /drive on successful login', () => {
    authServiceSpy.login.and.returnValue(of({ email: 'test@nephos.com' }));

    component.loginForm.patchValue({
      email: 'test@nephos.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(component.isLoading()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/drive']);
  });

  it('should set an error message signal on failed login', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Auth failed')));

    component.loginForm.patchValue({
      email: 'test@nephos.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(component.isLoading()).toBeFalse();
    expect(component.errorMessage()).toBe('Invalid email or password. Please try again.');
  });
});
