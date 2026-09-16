import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthReducer } from '../../features/auth/data-access/with-auth-reducer';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject dependencies synchronously at the top-level injection context
  const http = inject(HttpClient);
  const router = inject(Router);
  const reducer = inject(AuthReducer);

  // Define the absolute refresh URL using environment API configuration
  const refreshUrl = `${environment.apiUrl}/auth/refresh-session`;

  // Always enforce JSON accept header and send credentials for backend API calls
  let request: HttpRequest<unknown> = req;
  if (req.url.startsWith(environment.apiUrl)) {
    request = req.clone({
      withCredentials: true,
      setHeaders: {
        Accept: 'application/json',
      },
    });
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      // Ignore non-401 errors or requests that are not HttpErrorResponse
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Do not attempt token refresh on authentication endpoints to prevent infinite loops
      const url = request.url;
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/refresh-session')
      ) {
        return throwError(() => error);
      }

      // Trigger the refresh session API against the backend gateway
      return http
        .post(
          refreshUrl,
          {},
          {
            withCredentials: true,
            headers: {
              Accept: 'application/json',
            },
          },
        )
        .pipe(
          switchMap(() => {
            // Retry the original request after session has been refreshed
            return next(request);
          }),
          catchError((refreshError: unknown) => {
            // Handle refresh failure safely using pre-injected services
            reducer.logoutSuccess();
            router.navigate(['/login']);

            return throwError(() => refreshError);
          }),
        );
    }),
  );
};
