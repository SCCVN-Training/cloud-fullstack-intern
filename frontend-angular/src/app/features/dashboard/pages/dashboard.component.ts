import { Component, inject } from '@angular/core';

import { RouterModule } from '@angular/router';

import { AuthStore } from '../../../core/auth/data-access/with-auth-store';
import { DashboardNavbarComponent } from '../components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, DashboardNavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly authStore = inject(AuthStore);
}
