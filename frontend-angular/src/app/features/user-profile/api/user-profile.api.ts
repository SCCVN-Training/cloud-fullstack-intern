import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { ApiResponse } from '../../../shared/types/api-response';
import { USER_PROFILE_ENDPOINTS } from '../constants/user-profile-endpoints';
import { CreateProfileRequest, UserProfile } from '../data-access/user-profile.schema';

@Injectable({
  providedIn: 'root',
})
export class UserProfileApi {
  private readonly api = inject(ApiClient);

  createProfile(request: CreateProfileRequest) {
    return this.api.post<ApiResponse<UserProfile>>(USER_PROFILE_ENDPOINTS.ROOT, request);
  }

  getMyProfile() {
    return this.api.get<ApiResponse<UserProfile>>(USER_PROFILE_ENDPOINTS.ME);
  }

  updateMyProfile(profileData: Partial<UserProfile>) {
    return this.api.patch<ApiResponse<UserProfile>>(USER_PROFILE_ENDPOINTS.ME, profileData);
  }
}
