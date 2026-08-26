import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { ApiResponse } from '../../../shared/types/api-response';
import { AUTH_ENDPOINTS } from '../constants/auth-endpoints';
import { LoginPayload, User } from '../data-access/auth.schema';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(request: LoginPayload) {
    return this.api.post<ApiResponse<User>>(AUTH_ENDPOINTS.LOGIN, request);
  }

  register(request: { email: string; password: string }) {
    return this.api.post<ApiResponse<User>>(AUTH_ENDPOINTS.REGISTER, request);
  }

  logout() {
    return this.api.post<void>(AUTH_ENDPOINTS.LOGOUT, {});
  }

  refreshSession() {
    return this.api.post<void>(AUTH_ENDPOINTS.REFRESH_SESSION, {});
  }

  getCurrentUser() {
    return this.api.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
  }
}
