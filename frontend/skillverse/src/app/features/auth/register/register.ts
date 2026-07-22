import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  registerForm: FormGroup;
  isLoading$ = new BehaviorSubject<boolean>(false);
  showPassword = false;

  constructor(
    private fb: FormBuilder, 
    private toastService: ToastService,
    private authService: AuthService) {
    
      this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

onSubmit() {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  this.isLoading$.next(true);

  const { name, email, password } = this.registerForm.value;

  this.authService
    .register({
      name,
      email,
      password
    })
    .subscribe({
      next: () => {
        this.toastService.showSuccess(
          'Account created successfully! Please log in.'
        );

        this.registerForm.reset();

        this.isLoading$.next(false);
      },

      error: () => {
        this.toastService.showError(
          'Connection error! Please try again.'
        );

        this.isLoading$.next(false);
      }
    });
}
}
