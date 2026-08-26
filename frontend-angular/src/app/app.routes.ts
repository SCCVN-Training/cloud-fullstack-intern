import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // 1. The Default Redirect Rule
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // 2. The Actual Home Route
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },

  // Other routes (login, register, etc.) go here...
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/register/register').then((m) => m.Register),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },

  // 3. The Wildcard Fallback (Always keep this last!)
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];
