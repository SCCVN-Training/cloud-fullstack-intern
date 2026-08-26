import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification/services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else if (error.error) {
        // Backend returned an error response
        // Match the standardized backend contract: { error_code, message, details } or { message }
        errorMessage = error.error.message || error.error.detail || errorMessage;
      }

      // Handle specific status codes
      switch (error.status) {
        case 401:
          // Unauthorized - could trigger a redirect or auth clear action here
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          // Keep backend message or fallback
          break;
        case 500:
          errorMessage = 'Server error occurred. Please try again later.';
          break;
      }

      // Show toast notification
      notificationService.error(errorMessage);

      // Re-throw so individual effects or components can still handle loading states
      return throwError(() => error);
    }),
  );
};
