import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AuthEvent } from '../../data-access/with-auth-event';
import { AuthStore } from '../../data-access/with-auth-store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);

  readonly authEvent = inject(AuthEvent);
  readonly authStore = inject(AuthStore);

  hidePassword = true;
  hideConfirmPassword = true;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],

    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(6)]],

    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  register(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const { username, email, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.form.controls.confirmPassword.setErrors({
        passwordMismatch: true,
      });
      return;
    }

    const payload = {
      username,
      email,
      password,
      avatarUrl: null,
    };

    this.authEvent.register(payload);
  }
}
