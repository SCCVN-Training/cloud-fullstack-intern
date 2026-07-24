import { Injectable, inject } from '@angular/core';
import { UserProfile } from './user-profile.schema';
import { UserProfileEffect } from './with-user-profile-effect';

@Injectable({
  providedIn: 'root',
})
export class UserProfileEvent {
  private readonly effect = inject(UserProfileEffect);

  getMyProfile(): void {
    console.log('[User Profile Event] Get my profile triggered');
    this.effect.getMyProfile().subscribe();
  }

  updateMyProfile(payload: Partial<UserProfile>): void {
    console.log('[User Profile Event] Update my profile triggered');
    this.effect.updateMyProfile(payload).subscribe();
  }
}
