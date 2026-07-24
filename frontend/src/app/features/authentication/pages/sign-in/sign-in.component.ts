import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  errorMessage = '';
  isSubmitting = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email, this.sccEmailValidator]],
    password: ['', Validators.required],
    remember: [false],
  });

  private sccEmailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }

    return value.trim().toLowerCase().endsWith('@scc.com') ? null : { invalidSccEmail: true };
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.errorMessage = 'Please enter a valid @scc.com email address and password.';
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    this.isSubmitting = true;

    this.authService.login(email, password).subscribe((result) => {
      this.isSubmitting = false;

      if (!result.success) {
        this.errorMessage = result.message;
        return;
      }

      this.authService.saveSession(result.user!);
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    });
  }

  onSSOClick(): void {
    this.router.navigate(['/auth/sign-in-sso']);
  }
}