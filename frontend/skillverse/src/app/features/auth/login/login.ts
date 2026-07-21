import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, delay, finalize, of } from 'rxjs';
import { RouterLink, Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loginForm: FormGroup;
  isLoading$ = new BehaviorSubject<boolean>(false);
  errorMessage$ = new BehaviorSubject<string | null>(null);
  showPassword = false;

  constructor(
    private fb: FormBuilder, 
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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

    of(null).pipe(
      delay(1500),
      finalize(() => this.isLoading$.next(false))
    ).subscribe({
      next: () => {
        // 1. CASE: BOTH EMAIL AND PASSWORD ARE CORRECT
        if (email === 'admin@gmail.com' && password === '123456') {
          console.log('Login success!');
          this.authService.login();
          this.toastService.showSuccess('Login successful!'); 
          // this.router.navigate(['/']); 
        } 
        // 2. CASE: INCORRECT EMAIL
        else if (email !== 'admin@gmail.com') {
          console.warn('Login failed: Incorrect email');
          this.errorMessage$.next('Email does not exist in the system.');
          this.toastService.showError('Incorrect email. Please check again!');
        }
        // 3. CASE: CORRECT EMAIL BUT INCORRECT PASSWORD
        else if (password !== '123456') {
          console.warn('Login failed: Incorrect password');
          this.errorMessage$.next('Password is not correct.');
          this.toastService.showError('Incorrect password. Please try again!');
        }
      },
      error: (err) => {
        console.error('Connection error', err);
        this.toastService.showError('System connection error!');
      }
    });
  }
}
