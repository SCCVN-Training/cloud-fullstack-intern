import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HomepageComponent } from './features/homepage/homepage.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomepageComponent
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];