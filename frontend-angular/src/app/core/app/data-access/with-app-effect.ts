import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { tap } from 'rxjs/internal/operators/tap';
import { AuthEffect } from '../../auth/data-access/with-auth-effect';
import { NotificationService } from '../../notification/services/notification.service';
import { AppApi } from '../api/app.api';
import { AppReducer } from './with-app-reducer';

@Injectable({
  providedIn: 'root',
})
export class AppEffect {
  private readonly api = inject(AppApi);
  private readonly authEffect = inject(AuthEffect);
  private readonly reducer = inject(AppReducer);
  private readonly notification = inject(NotificationService);

  initializeApp(): Observable<void> {
    return this.api.health().pipe(
      tap((response) => {
        this.reducer.patch({ serverAvailable: true, version: response.version });
      }),
      switchMap(() => this.authEffect.initializeSession()),
      tap(() => {
        this.reducer.patch({ initialized: true });
      }),

      catchError(() => {
        this.reducer.patch({
          serverAvailable: false,
          initialized: true,
        });
        this.notification.error('Server is unavailable!');
        return of(void 0);
      }),
    );
  }
}
