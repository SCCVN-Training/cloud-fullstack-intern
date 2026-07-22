import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard';
import { DashboardHome } from './pages/dashboard-home/dashboard-home';
import { DashboardUserProfile } from './pages/dashboard-user-profile/dashboard-user-profile';

// dashboard.routes.ts
export const dashboardRoutes: Routes = [
  {
    path: '',
    component: Dashboard,
    children: [
      {
        path: '',
        component: DashboardHome,
      },
      {
        path: 'profile',
        component: DashboardUserProfile,
      },
    ],
  },
];
