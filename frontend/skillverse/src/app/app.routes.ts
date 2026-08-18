import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth/auth-guard';
import { onboardingGuard } from './core/guards/onboarding/onboarding-guard';
import { adminGuard } from './core/guards/admin/admin-guard';

import { PublicLayoutComponent } from './shared/components/layout/public-layout/public-layout.component';

import { Homepage } from './features/homepage/homepage';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Onboarding } from './features/auth/onboarding/onboarding';

import { HowItWorksPage } from './features/how-it-works/how-it-works';
import { AboutUsPage } from './features/about-us/about-us';
import { BrowseSkillsPage } from './features/skill-pages/browse-skills/browse-skills';
import { SkillDetailsPage } from './features/skill-pages/skill-details/skill-details';
import { BookingSession } from './features/booking/booking-session/booking-session';
import { SessionReview } from './features/booking/session-review/session-review';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'homepage',
    pathMatch: 'full',
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'homepage',
        component: Homepage,
      },
      {
        path: 'how-it-works',
        component: HowItWorksPage,
      },
      {
        path: 'about-us',
        component: AboutUsPage,
      },
      {
        path: 'browse-skills',
        component: BrowseSkillsPage,
        canActivate: [authGuard],
      },
      {
        path: 'skill-details/:id',
        component: SkillDetailsPage,
        canActivate: [authGuard],
      },
      {
        path: 'booking',
        component: BookingSession,
        canActivate: [authGuard],
      },
      {
        path: 'session-review',
        component: SessionReview,
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.routes').then((m) => m.userRoutes),
    canActivate: [authGuard, onboardingGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'onboarding',
    component: Onboarding,
    canActivate: [authGuard],
  },
];
