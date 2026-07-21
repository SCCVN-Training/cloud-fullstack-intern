import { Routes } from '@angular/router';

import { dashboardRoutes } from './features/dashboard/routes/dashboard.routes';
import { eventRoutes } from './features/events/routes/event.routes';
import { registrationRoutes } from './features/registrations/routes/registration.routes';
import { authRoutes } from './features/authentication/routes/auth.routes';

// import { speakerRoutes } from './features/speakers/routes/speaker.routes';
// import { roomRoutes } from './features/rooms/routes/room.routes';
// import { notificationRoutes } from './features/notifications/routes/notification.routes';
// import { profileRoutes } from './features/profile/routes/profile.routes';
// import { reportRoutes } from './features/reports/routes/report.routes';

export const routes: Routes = [
  ...dashboardRoutes,
  ...eventRoutes,
  ...registrationRoutes,
  ...authRoutes,
//   ...speakerRoutes,
//   ...roomRoutes,
//   ...notificationRoutes,
//   ...profileRoutes,
//   ...reportRoutes,
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  },
  {
    path: 'auth',
    children: [
      ...authRoutes
    ]
  }
];

