import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { USER_PROFILE_ENDPOINTS } from '../constants/user-profile-endpoints';
import { GetProfileResponse, UserProfile } from '../data-access/user-profile.schema';

@Injectable({
  providedIn: 'root',
})
export class UserProfileApi {
  private readonly api = inject(ApiClient);

  getMyProfile() {
    return this.api.get<GetProfileResponse>(USER_PROFILE_ENDPOINTS.ME);
  }

  updateMyProfile(profileData: Partial<UserProfile>) {
    return this.api.patch<GetProfileResponse>(USER_PROFILE_ENDPOINTS.ME, profileData);
  }
}
