import { Routes } from '@angular/router';
import { UserLayoutComponent } from '../../shared/components/layout/user-layout/user-layout';

import { Dashboard } from './dashboard/dashboard';
import { Profile } from './profile/profile';

export const userRoutes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'profile',
        component: Profile,
      },
    ],
  },
];
