import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth';

// Sits alongside authGuard on protected routes (e.g. the /user/** tree).
// A logged-in user who hasn't finished onboarding gets bounced to
// /onboarding instead of reaching the dashboard, no matter how they
// navigated there (login redirect, deep link, back button, etc).
export const onboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.needsOnboarding()) {
    return router.parseUrl('/onboarding');
  }

  return true;
};
