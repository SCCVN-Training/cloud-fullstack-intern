import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './admin-layout/admin-layout';
import { AdminDashboardComponent } from './dashboard/admin-dashboard';
import { UserManagementComponent } from './user-management/user-management';
import { SkillManagementComponent } from './skill-management/skill-management';
import { BookingManagementComponent } from './booking-management/booking-management';
import { ReviewManagementComponent } from './review-management/review-management';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
      },
      {
        path: 'skill-management',
        component: SkillManagementComponent,
      },
      {
        path: 'booking-management',
        component: BookingManagementComponent,
      },
      {
        path: 'review-management',
        component: ReviewManagementComponent,
      },
    ],
  },
];
