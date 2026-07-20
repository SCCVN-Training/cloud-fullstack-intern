import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthEvent } from './features/auth/data-access/with-auth-event';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authEvent = inject(AuthEvent);
      return authEvent.initializeSession(); //Initialize session restoration before the app starts
    }),
  ],
};
