import { Routes } from '@angular/router';
import { UserLayoutComponent } from '../../shared/components/layout/user-layout/user-layout';

import { Dashboard } from './dashboard/dashboard';
import { Profile } from './profile/profile';
import { MySkills } from './my-skills/my-skills';
import { MyBookings } from './my-bookings/my-bookings';
import { Wallet } from './wallet/wallet';

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
      {
        path: 'my-skills',
        component: MySkills,
      },
      {
        path: "my-bookings",
        component: MyBookings,
      },
      {
        path: 'wallet',
        component: Wallet,
      },
    ],
  },
];
