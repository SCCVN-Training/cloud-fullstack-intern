import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { DashboardHomeComponent } from './pages/home/dashboard-home.component';

// dashboard.routes.ts
export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        component: DashboardHomeComponent,
      },
    ],
  },
];
