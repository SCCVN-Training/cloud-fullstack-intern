import { Routes } from '@angular/router';
import { SignInComponent } from '../pages/sign-in/sign-in.component';
import { SignInSSOComponent } from '../pages/sign-in-sso/sign-in-sso.component';

export const authRoutes: Routes = [
  { path: 'sign-in', component: SignInComponent },
  { path: 'sign-in-sso', component: SignInSSOComponent },
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' }
];