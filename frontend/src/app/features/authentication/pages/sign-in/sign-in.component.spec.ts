import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi, type Mock } from 'vitest';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../services/auth.service';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authService: { login: Mock; saveSession: Mock };
  let router: { navigate: Mock; navigateByUrl: Mock };

  beforeEach(async () => {
    authService = { login: vi.fn(), saveSession: vi.fn() };
    router = { navigate: vi.fn(), navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show an error when the email format is invalid', () => {
    component.form.patchValue({ email: 'invalid-email', password: 'abc123' });

    component.onSubmit();

    expect(component.errorMessage).toContain('valid @scc.com');
  });

  it('should navigate to dashboard when credentials are accepted', () => {
    authService.login.mockReturnValue(
      of({ success: true, message: '', user: { email: 'admin@scc.com', role: 'admin' } }),
    );

    component.form.patchValue({ email: 'admin@scc.com', password: 'password123' });
    component.onSubmit();

    expect(authService.saveSession).toHaveBeenCalledWith({ email: 'admin@scc.com', role: 'admin' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', { replaceUrl: true });
  });
});
