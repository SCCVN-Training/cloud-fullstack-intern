import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';

import { NotificationService } from '../../../core/notification/services/notification.service';
import { UserProfileEffect } from '../../user-profile/data-access/with-user-profile-effect';
import { UserProfileReducer } from '../../user-profile/data-access/with-user-profile-reducer';
import { AuthApi } from '../api/auth.api';
import { LoginPayload, RegisterPayload } from './auth.schema';
import { AuthReducer } from './with-auth-reducer';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  private readonly api = inject(AuthApi);
  private readonly profileEffect = inject(UserProfileEffect);
  private readonly profileReducer = inject(UserProfileReducer);
  private readonly reducer = inject(AuthReducer);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  login(payload: LoginPayload): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.login(payload).pipe(
      tap((response) => {
        this.reducer.setError(null);
        this.reducer.loginSuccess(response.data.user);
        this.notification.success(`Login successful!`);
      }),
      switchMap(() => this.profileEffect.getMyProfile()),
      tap(() => {
        this.router.navigate(['/dashboard']);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Login failed. Please try again.';
        this.reducer.setError(message);
        this.notification.error(message);
        return EMPTY;
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
      map(() => void 0),
    );
  }

  register(payload: RegisterPayload): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.register(payload).pipe(
      tap(() => {
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
      finalize(() => {
        this.reducer.setLoading(false);
      }),
      map(() => void 0),
    );
  }

  logout(): Observable<void> {
    // Send request so backend clears the HttpOnly cookie via Set-Cookie header
    this.reducer.setLoading(true);

    return this.api.logout().pipe(
      tap(() => {
        this.reducer.setError(null);
        this.notification.info('You have been logged out.');
        this.reducer.logoutSuccess();
        this.profileReducer.reset();
        this.router.navigate(['/login']);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Log out failed. Please try again.';
        this.reducer.setError(message);
        this.notification.error(message);

        // Even if backend call fails, wipe state locally
        this.reducer.logoutSuccess();
        this.profileReducer.reset();
        this.router.navigate(['/']);
        return EMPTY;
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
      map(() => void 0),
    );
  }

  restoreSession(): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.restoreSession().pipe(
      switchMap(() => this.api.getCurrentUser()),
      tap((response) => {
        this.reducer.setCurrentUser(response.data.user);
      }),
      catchError(() => {
        this.reducer.setError(null);
        this.reducer.setCurrentUser(null);
        return of(void 0);
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
      map(() => void 0),
    );
  }

  //This is Observable version of restoreSession, which can be used in app initializer to ensure session restoration is complete before the app starts.
  // initializeSession(): Observable<void> {
  //   return this.api.restoreSession().pipe(
  //     switchMap(() => this.api.getCurrentUser()),
  //     tap((response) => {
  //       this.reducer.setCurrentUser(response.data.user);
  //     }),
  //     map(() => void 0),
  //     catchError(() => {
  //       this.reducer.setCurrentUser(null);
  //       return of(void 0);
  //     }),
  //   );
  // }

  getCurrentUser(): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.getCurrentUser().pipe(
      tap((response) => {
        this.reducer.setError(null);
        this.reducer.setCurrentUser(response.data.user);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || 'Get profile failed. Please try again.';
        this.reducer.setError(message);
        this.notification.error(message);
        this.reducer.setCurrentUser(null);
        return EMPTY;
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
      map(() => void 0),
    );
  }
}
