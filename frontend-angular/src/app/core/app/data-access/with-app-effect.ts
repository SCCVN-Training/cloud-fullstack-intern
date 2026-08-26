import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable, of, switchMap } from 'rxjs';
import { tap } from 'rxjs/internal/operators/tap';
import { AuthApi } from '../../../features/auth/api/auth.api';
import { AuthEffect } from '../../../features/auth/data-access/with-auth-effect';
import { AuthStore } from '../../../features/auth/data-access/with-auth-store';
import { UserProfileEffect } from '../../../features/user-profile/data-access/with-user-profile-effect';
import { NotificationService } from '../../notification/services/notification.service';
import { AppApi } from '../api/app.api';
import { AppReducer } from './with-app-reducer';

@Injectable({
  providedIn: 'root',
})
export class AppEffect {
  private readonly api = inject(AppApi);
  private readonly authApi = inject(AuthApi);
  private readonly authEffect = inject(AuthEffect);
  private readonly authStore = inject(AuthStore);
  private readonly profileEffect = inject(UserProfileEffect);
  private readonly reducer = inject(AppReducer);
  private readonly notification = inject(NotificationService);

  initializeApp(): Observable<void> {
    return this.api.health().pipe(
      tap((response) => {
        this.reducer.patch({
          serverAvailable: true,
          version: response.version,
        });
      }),

      switchMap(() => this.authEffect.refreshSession()),

      switchMap(() => {
        return this.authStore.isAuthenticated() ? this.profileEffect.getMyProfile() : of(void 0);
      }),

      tap(() => {
        this.reducer.patch({
          initialized: true,
          profileLoaded: this.authStore.isAuthenticated(),
        });
      }),

      catchError(() => {
        this.reducer.patch({
          serverAvailable: false,
          initialized: true,
        });

        //this.notification.error('Server is unavailable!');
        return EMPTY;
      }),

      map(() => void 0),
    );
  }

  initializeAppWithoutHealth(): Observable<void> {
    return this.authEffect.refreshSession().pipe(
      tap(() => {
        this.reducer.patch({
          serverAvailable: true,
          version: '1.0.0',
        });
      }),

      switchMap(() => {
        if (this.authStore.isAuthenticated()) {
          return this.profileEffect.getMyProfile().pipe(
            catchError((profileErr) => {
              console.error('Failed to load profile during init:', profileErr);

              return of(void 0);
            }),
          );
        }
        return of(void 0);
      }),

      tap(() => {
        this.reducer.patch({
          initialized: true,

          profileLoaded: this.authStore.isAuthenticated(),
        });
      }),

      catchError((error) => {
        const status = error?.status || error?.error?.status;

        if (status === 401) {
          this.reducer.patch({
            serverAvailable: true,
            initialized: true,
          });
          return of(void 0);
        }

        this.reducer.patch({
          serverAvailable: false,
          initialized: true,
        });

        //this.notification.error('Server is currently unavailable or experiencing issues!');

        return of(void 0);
      }),

      map(() => void 0),
    );
  }
}
