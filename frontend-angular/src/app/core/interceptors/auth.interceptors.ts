import { HttpClient, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core/primitives/di';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthReducer } from '../../features/auth/data-access/with-auth-reducer';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  // Always send cookies
  let request: HttpRequest<unknown>;
  if (req.url.startsWith(environment.apiUrl)) {
    request = req.clone({
      withCredentials: true,
    });
  } else {
    request = req;
  }

  return next(request).pipe(
    catchError((error) => {
      if (error.status !== 401) return throwError(() => error);

      // Don't refresh auth endpoints
      if (request.url.includes('/auth/login')) return throwError(() => error);

      if (request.url.includes('/auth/register')) return throwError(() => error);

      if (request.url.includes('/auth/logout')) return throwError(() => error);

      if (request.url.includes('/auth/refresh-session')) return throwError(() => error);

      return http
        .post(
          '/auth/refresh-session',
          {},
          {
            withCredentials: true,
          },
        )
        .pipe(
          switchMap(() => {
            return next(request);
          }),

          catchError(() => {
            const reducer = inject(AuthReducer);
            const router = inject(Router);

            reducer.logoutSuccess();

            router.navigate(['/login']);

            return throwError(() => error);
          }),
        );
    }),
  );
};
