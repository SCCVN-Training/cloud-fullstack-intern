import { Component, inject, input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthEvent } from '../../../../../../core/auth/data-access/with-auth-event';
import { AuthStore } from '../../../../../../core/auth/data-access/with-auth-store';

@Component({
  selector: 'app-dashboard-navbar-menu',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './navbar-menu.component.html',
  styleUrl: './navbar-menu.component.scss',
})
export class DashboardNavbarMenuComponent {
  readonly open = input.required<boolean>();
  private readonly authStore = inject(AuthStore);
  private readonly authEvent = inject(AuthEvent);

  readonly user = this.authStore.currentUser;

  logout(): void {
    this.authEvent.logout();
  }
}
