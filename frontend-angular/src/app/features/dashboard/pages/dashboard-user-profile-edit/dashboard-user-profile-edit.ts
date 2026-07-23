import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import { debounceTime } from 'rxjs';
import { UserProfileFormPayload } from '../../../user-profile/data-access/user-profile-form.schema';
import { UserProfile } from '../../../user-profile/data-access/user-profile.schema';
import { UserProfileEvent } from '../../../user-profile/data-access/with-user-profile-event';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';
import { ColorPickerComponent } from '../dashboard-user-profile/components/color-picker/color-picker';
import { ProfileCardComponent } from '../dashboard-user-profile/components/profile-card/profile-card';

@Component({
  selector: 'app-dashboard-user-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    ProfileCardComponent,
    ColorPickerComponent,
  ],
  templateUrl: './dashboard-user-profile-edit.html',
  styleUrl: './dashboard-user-profile-edit.scss',
})
export class DashboardUserProfileEdit implements OnInit {
  readonly profileStore = inject(UserProfileStore);
  readonly profileEvent = inject(UserProfileEvent);
  readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly cardStyleOptions = ['Minimal', 'Standard', 'Gradient', 'Modern'];

  // Signal to track form value changes for reactive preview
  private readonly formValuesSignal = signal<Partial<UserProfile> | null>(null);
  private originalProfile: UserProfile | null = null;

  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(100)]],
    bio: ['', [Validators.maxLength(500)]],
    avatarUrl: ['', [Validators.pattern(/^(https?:\/\/.+|)$/)]],
    bannerUrl: ['', [Validators.pattern(/^(https?:\/\/.+|)$/)]],
    accentColor: ['#2563eb', [Validators.required]],
    backgroundColor: ['#ffffff', [Validators.required]],
    profileCardStyle: ['Standard', [Validators.required]],
    isProfilePublic: [true],
  });

  readonly previewProfile = computed(() => {
    const profile = this.profileStore.profile();
    const formValues = this.formValuesSignal();

    if (!profile) return null;

    return {
      ...profile,
      displayName: formValues?.displayName ?? profile.displayName,
      bio: formValues?.bio ?? profile.bio,
      avatarUrl: this.isValidUrl(formValues?.avatarUrl)
        ? (formValues?.avatarUrl ?? '')
        : (profile.avatarUrl ?? ''),

      bannerUrl: this.isValidUrl(formValues?.bannerUrl)
        ? (formValues?.bannerUrl ?? '')
        : (profile.bannerUrl ?? ''),
      accentColor: formValues?.accentColor ?? profile.accentColor,
      backgroundColor: formValues?.backgroundColor ?? profile.backgroundColor,
      profileCardStyle: formValues?.profileCardStyle ?? profile.profileCardStyle,
      isProfilePublic: formValues?.isProfilePublic ?? profile.isProfilePublic,
    };
  });
  ngOnInit(): void {
    const profile = this.profileStore.profile();
    if (profile) {
      this.originalProfile = profile;
      this.profileForm.patchValue({
        displayName: profile.displayName,
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || '',
        accentColor: profile.accentColor,
        backgroundColor: profile.backgroundColor,
        profileCardStyle: profile.profileCardStyle,
        isProfilePublic: profile.isProfilePublic,
      });
      // Initialize the form values signal
      this.formValuesSignal.set(this.profileForm.getRawValue());

      // Subscribe to form value changes with debounce
      this.profileForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
        this.formValuesSignal.set(this.profileForm.getRawValue());
      });
    } else {
      this.profileEvent.getMyProfile();
    }
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.getRawValue() as UserProfileFormPayload;
    this.profileEvent.updateMyProfile(formValue);
    // Navigation happens in effect after success
  }

  onCancel(): void {
    this.router.navigate(['/dashboard', 'profile']);
  }

  onRevert(): void {
    if (this.originalProfile) {
      this.profileForm.patchValue({
        displayName: this.originalProfile.displayName,
        bio: this.originalProfile.bio || '',
        avatarUrl: this.originalProfile.avatarUrl || '',
        bannerUrl: this.originalProfile.bannerUrl || '',
        accentColor: this.originalProfile.accentColor,
        backgroundColor: this.originalProfile.backgroundColor,
        profileCardStyle: this.originalProfile.profileCardStyle,
        isProfilePublic: this.originalProfile.isProfilePublic,
      });
      this.profileForm.markAsUntouched();
      this.formValuesSignal.set(this.profileForm.getRawValue());
    }
  }

  isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getValidAvatarUrl(): string | null {
    const url = this.profileForm.get('avatarUrl')?.value;
    return url && this.isValidUrl(url) ? url : null;
  }

  getValidBannerUrl(): string | null {
    const url = this.profileForm.get('bannerUrl')?.value;
    return url && this.isValidUrl(url) ? url : null;
  }

  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (!control?.errors || !control?.touched) return '';

    if (control.hasError('required')) return `${this.formatLabel(controlName)} is required`;
    if (control.hasError('maxlength'))
      return `${this.formatLabel(controlName)} exceeds maximum length`;
    if (control.hasError('pattern')) return `Invalid ${this.formatLabel(controlName)} format`;
    if (control.hasError('email')) return `Invalid email format`;

    return 'Invalid input';
  }

  private formatLabel(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
