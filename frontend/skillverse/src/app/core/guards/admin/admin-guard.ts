  import { inject } from '@angular/core';
  import { CanActivateFn, Router } from '@angular/router';

  import { AuthService } from '../../services/auth/auth';

  export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    if (user.role !== 'admin') {
      return router.createUrlTree(['/homepage']);
    }

    return true;
  };
