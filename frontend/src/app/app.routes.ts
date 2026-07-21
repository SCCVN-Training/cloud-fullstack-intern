import { Routes } from '@angular/router';
import { Login } from './features/auth/components/login/login';
import { Register } from './features/auth/components/register/register';
import { Landing } from './features/landing/landing';
import { Drive } from './features/drive/drive';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: Landing },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'drive', component: Drive },
  { path: '**', redirectTo: 'landing' },
];
