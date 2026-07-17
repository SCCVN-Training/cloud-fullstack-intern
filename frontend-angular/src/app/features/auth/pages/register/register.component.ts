import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { AuthEvent } from '../../data-access/with-auth-event';
import { AuthStore } from '../../data-access/with-auth-store';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const passwordControl = control.get('password');
  const confirmControl = control.get('confirmPassword');

  if (!passwordControl || !confirmControl) {
    return null;
  }

  // Don't compare until both controls are valid
  if (passwordControl.invalid || confirmControl.invalid) {
    return null;
  }

  return passwordControl.value === confirmControl.value ? null : { passwordMismatch: true };
};

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

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required]],

      email: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required, Validators.minLength(6)]],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordMatchValidator,
    },
  );

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password } = this.form.getRawValue();

    const payload = {
      username,
      email,
      password,
      avatarUrl: null,
    };

    this.authEvent.register(payload);
  }
}
