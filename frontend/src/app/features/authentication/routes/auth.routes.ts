import { Routes } from '@angular/router';
import { SignIn } from '../pages/sign-in/sign-in';

export const authRoutes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'sign-in', component: SignIn },
      { path: '', redirectTo: 'sign-in', pathMatch: 'full' }
    ]
  }
];