import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';
import { AUTH_ENDPOINTS } from '../constants/auth-endpoints';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '../data-access/auth.schema';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(request: LoginPayload) {
    return this.api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, request);
  }

  register(request: RegisterPayload) {
    return this.api.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, request);
  }

  logout() {
    return this.api.post<void>(AUTH_ENDPOINTS.LOGOUT, {});
  }

  restoreSession() {
    return this.api.post<void>(AUTH_ENDPOINTS.RESTORE_SESSION, {});
  }

  getCurrentUser() {
    return this.api.get<LoginResponse>(AUTH_ENDPOINTS.ME);
  }
}
