import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService, OnboardingProfile } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {
  onboardingForm: FormGroup;
  isLoading$ = new BehaviorSubject<boolean>(false);

  interests: string[] = [];
  interestInput = '';

  skillsLearning: string[] = [];
  skillInput = '';

  // Teaching skills aren't collected here — every account starts with 0
  // taught skills and grows that list later via the create-skill / video
  // session flow. Shown as read-only context, not an input.
  readonly skillsTaughtCount = 0;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.onboardingForm = this.fb.group({
      age: [null, [Validators.required, Validators.min(13), Validators.max(120)]],
      gender: ['', [Validators.required]],
      bio: [''],
    });
  }

  get f() {
    return this.onboardingForm.controls;
  }

  addInterest(): void {
    const value = this.interestInput.trim();
    if (!value) return;
    if (!this.interests.includes(value)) {
      this.interests = [...this.interests, value];
    }
    this.interestInput = '';
  }

  removeInterest(item: string): void {
    this.interests = this.interests.filter((i) => i !== item);
  }

  addSkill(): void {
    const value = this.skillInput.trim();
    if (!value) return;
    if (!this.skillsLearning.includes(value)) {
      this.skillsLearning = [...this.skillsLearning, value];
    }
    this.skillInput = '';
  }

  removeSkill(item: string): void {
    this.skillsLearning = this.skillsLearning.filter((s) => s !== item);
  }

  onSubmit(): void {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      this.toastService.showError('Please fill in the required fields.');
      return;
    }

    this.isLoading$.next(true);

    const { age, gender, bio } = this.onboardingForm.value;

    const profile: OnboardingProfile = {
      age,
      gender,
      bio: bio || '',
      interests: this.interests,
      skillsLearning: this.skillsLearning,
      skillsTaught: this.skillsTaughtCount,
    };

    this.authService.completeOnboarding(profile).subscribe({
      next: (success) => {
        this.isLoading$.next(false);
        if (success) {
          this.toastService.showSuccess('Welcome to SkillVerse!');
          this.router.navigate(['/']);
        } else {
          this.toastService.showError('Something went wrong. Please try again.');
        }
      },
      error: () => {
        this.isLoading$.next(false);
        this.toastService.showError('Connection error! Please try again.');
      },
    });
  }
}
