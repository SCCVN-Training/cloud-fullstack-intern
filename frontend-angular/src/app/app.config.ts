import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AppEvent } from './core/app/data-access/with-app-event';
import { authInterceptor } from './core/auth/interceptors/auth.interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAppInitializer(() => {
      const appEvent = inject(AppEvent);
      return firstValueFrom(appEvent.initializeApp()); //Initialize session restoration before the app starts
    }),
  ],
};
