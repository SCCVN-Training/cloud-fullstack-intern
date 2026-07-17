import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. The Default Redirect Rule
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // 2. The Actual Home Route
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },

  // Other routes (login, register, etc.) go here...
  // {
  //   path: 'login',
  //   loadComponent: () =>
  //     import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  // },
  // {
  //   path: 'register',
  //   loadComponent: () =>
  //     import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  // },

  // 3. The Wildcard Fallback (Always keep this last!)
  { path: '**', redirectTo: 'home' },
];
