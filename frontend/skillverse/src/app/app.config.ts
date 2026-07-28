import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SOCIAL_AUTH_CONFIG,
} from '@abacritt/angularx-social-login';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),

    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.googleClientId),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
};
