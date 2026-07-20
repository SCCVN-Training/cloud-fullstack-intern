import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../core/services/notification.service';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  User,
} from './auth.schema';
import { AuthReducer } from './with-auth-reducer';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  private readonly http = inject(HttpClient);
  private readonly reducer = inject(AuthReducer);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  private readonly API_URL = environment.apiUrl + '/auth';

  login(payload: LoginPayload): void {
    this.reducer.setLoading(true);

    // withCredentials: true ensures cookies are accepted and sent across domains if needed
    this.http
      .post<LoginResponse>(`${this.API_URL}/login`, payload, { withCredentials: true })
      .pipe(
        tap((response) => {
          const { user } = response.data;

          // Token is saved inside HttpOnly cookie automatically by the browser.
          // We only store non-sensitive state in memory!
          this.reducer.setLoading(false);
          this.reducer.setError(null);
          this.reducer.loginSuccess(user);
          this.notification.success(`Welcome back, ${user.username}!`);
          this.router.navigate(['/dashboard']);
        }),
        catchError((error: HttpErrorResponse) => {
          const message = error.error?.message || 'Login failed. Please try again.';
          this.reducer.setError(message);
          this.notification.error(message);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  register(payload: RegisterPayload): void {
    this.reducer.setLoading(true);

    this.http
      .post<RegisterResponse>(`${this.API_URL}/register`, payload)
      .pipe(
        tap(() => {
          this.reducer.setLoading(false);
          this.reducer.setError(null);
          this.notification.success('Account created successfully! Please log in.');
          this.router.navigate(['/login']);
        }),
        catchError((error: HttpErrorResponse) => {
          const message = error.error?.message || 'Registration failed. Please try again.';
          this.reducer.setError(message);
          this.notification.error(message);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  logout(): void {
    // Send request so backend clears the HttpOnly cookie via Set-Cookie header
    this.http
      .post(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.notification.info('You have been logged out.');
          this.reducer.logoutSuccess();
          this.router.navigate(['/login']);
        }),
        catchError(() => {
          // Even if backend call fails, wipe state locally
          this.reducer.logoutSuccess();
          this.router.navigate(['/']);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  restoreSession(): void {
    this.http
      .post(
        `${this.API_URL}/restore-session`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        switchMap(() =>
          this.http.get<{ data: { user: User } }>(`${this.API_URL}/me`, {
            withCredentials: true,
          }),
        ),
        tap((response) => {
          this.reducer.setCurrentUser(response.data.user);
        }),
        catchError(() => {
          this.reducer.setCurrentUser(null);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  //This is Observable version of restoreSession, which can be used in app initializer to ensure session restoration is complete before the app starts.
  initializeSession(): Observable<void> {
    return this.http
      .post(
        `${this.API_URL}/restore-session`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        switchMap(() =>
          this.http.get<{ data: { user: User } }>(`${this.API_URL}/me`, {
            withCredentials: true,
          }),
        ),
        tap((response) => {
          this.reducer.setCurrentUser(response.data.user);
        }),
        map(() => void 0),
        catchError(() => {
          this.reducer.setCurrentUser(null);
          return of(void 0);
        }),
      );
  }

  getCurrentUser(): void {
    this.http
      .get<{ data: { user: User } }>(`${this.API_URL}/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.reducer.setCurrentUser(response.data.user);
        }),
        catchError(() => {
          this.reducer.setCurrentUser(null);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
