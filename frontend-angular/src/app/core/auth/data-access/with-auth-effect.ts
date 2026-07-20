import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { NotificationService } from '../../notification/services/notification.service';
import { AuthApi } from '../api/auth.api';
import { LoginPayload, RegisterPayload } from './auth.schema';
import { AuthReducer } from './with-auth-reducer';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  private readonly api = inject(AuthApi);
  private readonly reducer = inject(AuthReducer);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  login(payload: LoginPayload): void {
    this.reducer.setLoading(true);

    this.api
      .login(payload)
      .pipe(
        tap((response) => {
          this.reducer.setLoading(false);
          this.reducer.setError(null);
          this.reducer.loginSuccess(response.data.user);
          this.notification.success(
            `Login successful! Welcome back, ${response.data.user.username}.`,
          );
          this.router.navigate(['/dashboard']);
        }),
        catchError((error: HttpErrorResponse) => {
          this.reducer.setLoading(false);
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

    this.api
      .register(payload)
      .pipe(
        tap((response) => {
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
    this.api
      .logout()
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
    this.api
      .restoreSession()
      .pipe(
        switchMap(() => this.api.getCurrentUser()),
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
    return this.api.restoreSession().pipe(
      switchMap(() => this.api.getCurrentUser()),
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
    this.api
      .getCurrentUser()
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
