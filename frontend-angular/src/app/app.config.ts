import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AppEvent } from './core/app/data-access/with-app-event';
import { authInterceptor } from './core/interceptors/auth.interceptors';
import { errorInterceptor } from './core/interceptors/error.interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      }),
    ),
    provideAppInitializer(() => {
      return inject(AppEvent).initializeAppAsync(); //Initialize session restoration before the app starts
    }),
  ],
};
