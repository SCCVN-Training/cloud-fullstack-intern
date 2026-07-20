import { Routes } from '@angular/router';
import { Login } from './features/auth/components/login/login.component';
import { Register } from './features/auth/components/register/register.component';
import { Landing } from './features/landing/landing';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '**', redirectTo: 'landing' },
];
