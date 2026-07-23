import { Routes } from '@angular/router';

import { EventsComponentList } from '../pages/event-list-page/event-list-page.component';
import { EventDetailPageComponent } from '../pages/event-detail-page/event-detail-page.component';
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
        component: EventDetailPageComponent
      },
      {
        path: ':id/edit',
        component: EventEditPageComponent
      }
    ]
  }
];
