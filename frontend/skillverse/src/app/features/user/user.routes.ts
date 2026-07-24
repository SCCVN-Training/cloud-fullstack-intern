import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { UserLayoutComponent } from '../../shared/components/layout/user-layout/user-layout';

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
    ],
  },
];
