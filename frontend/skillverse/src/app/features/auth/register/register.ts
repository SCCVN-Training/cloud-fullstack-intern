import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';
import { Router } from '@angular/router';

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
    private authService: AuthService,
    private router: Router) {
    
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

  this.authService.register({ name, email, password }).subscribe({
    next: (success) => {
      this.isLoading$.next(false);

      if (success) {
        this.toastService.showSuccess('Account created successfully!');
        this.registerForm.reset();
        this.router.navigate(['/login']);
      } else {
        this.toastService.showError('Email is already registered.');
      }
    },
    error: () => {
      this.isLoading$.next(false);
      this.toastService.showError('Connection error! Please try again.');
    }
  });
}}