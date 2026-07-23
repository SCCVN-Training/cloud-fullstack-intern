import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-sign-in-sso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-in-sso.component.html',
  styleUrls: ['./sign-in-sso.component.scss'],
})
export class SignInSSOComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  currentStep: 'domain' | 'providers' = 'domain';
  selectedCompanyDomain: string = '';
  isLoading = false;

  form = this.fb.group({
    domain: ['', [Validators.required, this.domainValidator.bind(this)]],
  });

  // Mock SSO providers - would typically be fetched from backend based on company domain
  ssoProviders: SSOProvider[] = [
    {
      id: 'google',
      name: 'Google Workspace',
      icon: 'language',
      description: 'Sign in with your Google account',
    },
    {
      id: 'microsoft',
      name: 'Microsoft Entra ID',
      icon: 'verified_user',
      description: 'Sign in with your Microsoft account',
    },
    {
      id: 'okta',
      name: 'Okta',
      icon: 'security',
      description: 'Sign in with your Okta credentials',
    },
  ];

  domainValidator(control: any): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;
    // Simple domain validation pattern
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.com$/;
    return domainPattern.test(value) ? null : { invalidDomain: true };
  }

  onSubmitDomain(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.selectedCompanyDomain = this.form.get('domain')?.value || '';
      // Simulate backend call to fetch SSO providers for the domain
      setTimeout(() => {
        this.currentStep = 'providers';
        this.isLoading = false;
      }, 800);
    }
  }

  onSelectProvider(provider: SSOProvider): void {
    this.isLoading = true;
    // In a real app, this would initiate OAuth flow or redirect to SSO provider
    console.log(`Signing in with ${provider.name} for domain ${this.selectedCompanyDomain}`);
    // Simulate SSO flow
    setTimeout(() => {
      // After successful SSO, navigate to dashboard
      this.router.navigate(['/dashboard']);
    }, 1200);
  }

  onBackClick(): void {
    if (this.currentStep === 'providers') {
      this.currentStep = 'domain';
      this.selectedCompanyDomain = '';
      this.form.reset();
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
  }
}
