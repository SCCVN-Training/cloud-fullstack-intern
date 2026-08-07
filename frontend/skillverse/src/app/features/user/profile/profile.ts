import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile {
  readonly bioMaxLength = 100;
  readonly maxAvatarSizeMb = 3;
  readonly defaultAvatarUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAnJDZJ7HPUz6UO5KHJIpDXWzIMNOrTgJIV9LBYIPU2_-x3KlaNFPjRV3Wj58JhdP_NpaJaYzNsgNyGm-V9logDArO32uEon3kYj4aZEWBAFtcIg36LYgy7HjRoIJaBeFjs4_BwIAWAGttKOcONUZEnCSr2Zlc_bHcjkmPInUY4HVGjpZhjVEefPsx20wfKUTWMq-mFxBllBPzQBqENX5V24_gHikMUF7PRuRbFDgsmGwgi6SItN5Wl5l7jpQ1WXePl36D0zqWQegi1';

  isUploadingAvatar = signal(false);

  // Personal Information card — view vs. edit mode
  isEditingInfo = signal(false);
  isSaving = signal(false);

  editName = '';
  editEmail = '';
  editBio = '';
  editAge: number | null = null;
  editGender = '';

  // Delete-account confirmation dialog
  showDeleteConfirm = signal(false);
  isDeleting = signal(false);

  // Skills I'm Learning — inline add via the + button
  addingSkill = signal(false);
  skillInput = '';

  // Interests — inline add via the + button
  addingInterest = signal(false);
  interestInput = '';

  // Reviews carousel — static sample data for now; shape matches what
  // GET /users/{id}/profile will eventually return under `reviews.items`
  // (reviewer name/avatar + comment), see the earlier ERD discussion.
  reviews = [
    {
      name: 'Sarah J.',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCPPt-M9Q3i0VOkQJFKgjVEKfzRWMIi6FYYQyed3eQoRkf7tQ13ocYz3LFuzbI0YKeaq5ZsaJDTLO7yQnGyNHa5i9IcvdzlwnHRH9QvHJzNYvOEvn5AAoFAWknVQA1rSsQdW5iBushH2qJXl9LrF_WiBAYi-ICutbeiB3Y3ShAaUdzWRqOwN4izJxK8xvRwLV_xGVOHoNs6oCCO7hMpbk5iaTApMAyzMaNOywMoAVEKIcxdiB3bXdJJeQPX8ll28TEgEdRoOtOyTuHa',
      text: 'Alex was incredibly patient explaining the basics of Figma components. Highly recommend booking a session!',
    },
    {
      name: 'Mark T.',
      avatarUrl: null,
      text: 'Great session on UI principles. Looking forward to our next exchange.',
    },
    {
      name: 'Priya R.',
      avatarUrl: null,
      text: 'Clear, structured, and genuinely fun. Learned more in an hour than a week of tutorials.',
    },
  ];
  currentReviewIndex = signal(0);

  constructor(
    public authService: AuthService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  // ---- Personal Information: Edit / Update / Cancel ----

  startEdit(): void {
    const user = this.authService.currentUser();
    this.editName = user?.name ?? '';
    this.editEmail = user?.email ?? '';
    this.editBio = user?.profile?.bio ?? '';
    this.editAge = user?.profile?.age ?? null;
    this.editGender = user?.profile?.gender ?? '';
    this.isEditingInfo.set(true);
  }

  cancelEdit(): void {
    this.isEditingInfo.set(false);
  }

  saveEdit(): void {
    if (!this.editName.trim() || !this.editEmail.trim()) {
      this.toastService.showError('Name and email cannot be empty.');
      return;
    }

    if (this.editBio.length > this.bioMaxLength) {
      this.toastService.showError(`About Me must be ${this.bioMaxLength} characters or fewer.`);
      return;
    }

    this.isSaving.set(true);

    this.authService
      .updateAccountInfo({
        name: this.editName.trim(),
        email: this.editEmail.trim(),
        bio: this.editBio.trim(),
        age: this.editAge ?? undefined,
        gender: this.editGender,
      })
      .subscribe({
        next: (success) => {
          this.isSaving.set(false);
          if (success) {
            this.toastService.showSuccess('Profile updated.');
            this.isEditingInfo.set(false);
          } else {
            this.toastService.showError('Could not save changes. Please try again.');
          }
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.showError('Connection error! Please try again.');
        },
      });
  }

  // ---- Delete account ----

  openDeleteConfirm(): void {
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  confirmDelete(): void {
    this.isDeleting.set(true);

    this.authService.deleteAccount().subscribe({
      next: (success) => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        if (success) {
          this.toastService.showSuccess('Your account has been deleted.');
          this.router.navigate(['/login']);
        } else {
          this.toastService.showError('Could not delete account. Please try again.');
        }
      },
      error: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.toastService.showError('Connection error! Please try again.');
      },
    });
  }

  // ---- Avatar upload ----

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // reset so re-selecting the same file still fires change

    if (!file) return;

    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      this.toastService.showError('Please choose a .jpg or .png image.');
      return;
    }

    if (file.size > this.maxAvatarSizeMb * 1024 * 1024) {
      this.toastService.showError(`Image must be under ${this.maxAvatarSizeMb}MB.`);
      return;
    }

    this.isUploadingAvatar.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      this.authService.updateAvatar(dataUrl).subscribe({
        next: (success) => {
          this.isUploadingAvatar.set(false);
          if (success) {
            this.toastService.showSuccess('Profile photo updated.');
          } else {
            this.toastService.showError('Could not update photo. Please try again.');
          }
        },
        error: () => {
          this.isUploadingAvatar.set(false);
          this.toastService.showError('Connection error! Please try again.');
        },
      });
    };
    reader.onerror = () => {
      this.isUploadingAvatar.set(false);
      this.toastService.showError('Could not read that file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  // ---- Skills I'm Learning ----

  toggleAddSkill(): void {
    this.addingSkill.set(!this.addingSkill());
    this.skillInput = '';
  }

  confirmAddSkill(): void {
    const value = this.skillInput.trim();
    this.skillInput = '';
    this.addingSkill.set(false);

    if (!value) return;

    const profile = this.authService.currentUser()?.profile;
    if (!profile || profile.skillsLearning.includes(value)) return;

    this.authService
      .updateProfileFields({ skillsLearning: [...profile.skillsLearning, value] })
      .subscribe();
  }

  removeSkill(item: string): void {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return;

    this.authService
      .updateProfileFields({ skillsLearning: profile.skillsLearning.filter((s) => s !== item) })
      .subscribe();
  }

  // ---- Interests ----

  toggleAddInterest(): void {
    this.addingInterest.set(!this.addingInterest());
    this.interestInput = '';
  }

  confirmAddInterest(): void {
    const value = this.interestInput.trim();
    this.interestInput = '';
    this.addingInterest.set(false);

    if (!value) return;

    const profile = this.authService.currentUser()?.profile;
    if (!profile || profile.interests.includes(value)) return;

    this.authService.updateProfileFields({ interests: [...profile.interests, value] }).subscribe();
  }

  removeInterest(item: string): void {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return;

    this.authService
      .updateProfileFields({ interests: profile.interests.filter((i) => i !== item) })
      .subscribe();
  }

  // ---- Reviews carousel ----

  prevReview(): void {
    const total = this.reviews.length;
    this.currentReviewIndex.set((this.currentReviewIndex() - 1 + total) % total);
  }

  nextReview(): void {
    const total = this.reviews.length;
    this.currentReviewIndex.set((this.currentReviewIndex() + 1) % total);
  }
}
