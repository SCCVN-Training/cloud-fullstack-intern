import { Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { AuthEvent } from '../../../auth/data-access/with-auth-event';
import { AuthStore } from '../../../auth/data-access/with-auth-store';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class DashboardNavbarComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly authEvent = inject(AuthEvent);

  readonly user = this.authStore.currentUser();

  logout(): void {
    this.authEvent.logout();
  }
}
