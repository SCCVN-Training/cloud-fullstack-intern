import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard';
import { DashboardHome } from './pages/dashboard-home/dashboard-home';

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
        loadComponent: () =>
          import('./pages/dashboard-user-profile/dashboard-user-profile').then(
            (m) => m.DashboardUserProfile,
          ),
      },
      {
        path: 'profile/edit',
        loadComponent: () =>
          import('./pages/dashboard-user-profile-edit/dashboard-user-profile-edit').then(
            (m) => m.DashboardUserProfileEdit,
          ),
      },
      {
        path: 'seasonal-anime',
        loadComponent: () =>
          import('../anime/pages/seasonal-anime-list/seasonal-anime-list').then(
            (m) => m.SeasonalAnimeList,
          ),
      },
      {
        path: 'image-generation',
        loadComponent: () =>
          import('../image-generation/pages/image-generation/image-generation').then(
            (m) => m.ImageGeneration,
          ),
      },
    ],
  },
];
