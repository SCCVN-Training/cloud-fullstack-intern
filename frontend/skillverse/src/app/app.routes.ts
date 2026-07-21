import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './shared/components/layout/public-layout/public-layout.component';
import { HomepageComponent } from './features/homepage/homepage.component';
import { HowItWorksPage } from './features/how-it-works/how-it-works';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomepageComponent
      },
      {
        path: 'how-it-works',
        component: HowItWorksPage
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];