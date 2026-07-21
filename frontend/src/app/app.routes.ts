import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

import { dashboardRoutes } from './features/dashboard/routes/dashboard.routes';
import { eventRoutes } from './features/events/routes/event.routes';
import { registrationRoutes } from './features/registrations/routes/registration.routes';
import { authRoutes } from './features/authentication/routes/auth.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/sign-in',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: authRoutes
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      ...dashboardRoutes,
      ...eventRoutes,
      ...registrationRoutes
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/sign-in'
  }
];

