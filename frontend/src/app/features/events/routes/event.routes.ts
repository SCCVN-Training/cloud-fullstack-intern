import { Routes } from '@angular/router';

import { EventsComponentList } from '../pages/event-list-page/event-list-page.component';
import { WorkshopDetailComponent } from '../pages/event-detail-page/workshop-detail.component';
import { EventCreatePageComponent } from '../pages/event-create-page/event-create-page.component';
import { EventEditPageComponent } from '../pages/event-edit-page/event-edit-page.component';

export const eventRoutes: Routes = [
  {
    path: 'events',
    children: [
      {
        path: '',
        component: EventsComponentList
      },
      {
        path: 'new',
        component: EventCreatePageComponent
      },
      {
        path: ':id',
        component: WorkshopDetailComponent
      },
      {
        path: ':id/edit',
        component: EventEditPageComponent
      }
    ]
  }
];
