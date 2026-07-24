import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, delay, finalize, of } from 'rxjs';
import { RouterLink, Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import {
  SocialAuthService,
  GoogleSigninButtonModule,
  SocialUser,
} from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loginForm: FormGroup;
  isLoading$ = new BehaviorSubject<boolean>(false);
  errorMessage$ = new BehaviorSubject<string | null>(null);
  showPassword = false;
  isTest = false;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private socialAuthService: SocialAuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    if (!this.isTest) {
      this.socialAuthService.authState.subscribe((user: SocialUser | null) => {
        if (user) {
          this.authService.loginWithGoogle({
            firstName: user.firstName,
            email: user.email,
            photoUrl: user.photoUrl,
          });

          this.toastService.showSuccess(`Welcome ${user.firstName}!`);
          this.router.navigate(['/']);
        }
      });
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading$.next(true);
    this.errorMessage$.next(null);

    const { email, password } = this.loginForm.value;

    this.authService.authenticate(email, password).subscribe({
      next: (success) => {
        this.isLoading$.next(false);
        if (success) {
          this.toastService.showSuccess('Login successful!');
          this.router.navigate(['/']);
        } else {
          this.errorMessage$.next('Invalid email or password.');
          this.toastService.showError('Email or password is incorrect.');
        }
      },
      error: (err) => {
        this.isLoading$.next(false);
        console.error('Connection error', err);
        this.toastService.showError('System connection error!');
      },
    });
  }
}
