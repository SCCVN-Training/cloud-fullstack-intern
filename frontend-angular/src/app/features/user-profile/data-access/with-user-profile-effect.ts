import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, map, tap } from 'rxjs';
import { NotificationService } from '../../../core/notification/services/notification.service';
import { UserProfileApi } from '../api/user-profile.api';
import { UserProfile } from './user-profile.schema';
import { UserProfileReducer } from './with-user-profile-reducer';

@Injectable({
  providedIn: 'root',
})
export class UserProfileEffect {
  private readonly api = inject(UserProfileApi);
  private readonly reducer = inject(UserProfileReducer);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  getMyProfile(): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.getMyProfile().pipe(
      tap((response) => {
        this.reducer.setError(null);
        this.reducer.patch({ profile: response.data.profile });
      }),
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        this.reducer.setError(null);
        this.notification.error(error.message || 'Failed to load profile');
        return EMPTY;
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
    );
  }

  updateMyProfile(payload: Partial<UserProfile>): Observable<void> {
    this.reducer.setLoading(true);

    return this.api.updateMyProfile(payload).pipe(
      tap((response) => {
        this.reducer.setError(null);
        this.reducer.patch({ profile: response.data.profile });
        this.notification.success('Profile updated successfully');
        this.router.navigate(['/dashboard', 'profile']);
      }),
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        this.reducer.setError(null);
        this.notification.error(error.message || 'Failed to update profile');
        return EMPTY;
      }),
      finalize(() => {
        this.reducer.setLoading(false);
      }),
    );
  }
}
