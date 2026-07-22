import { Component, inject, input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthEvent } from '../../../../../auth/data-access/with-auth-event';
import { UserProfileStore } from '../../../../../user-profile/data-access/with-user-profile-store';

@Component({
  selector: 'app-dashboard-navbar-menu',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './dashboard-navbar-menu.html',
  styleUrl: './dashboard-navbar-menu.scss',
})
export class DashboardNavbarMenu {
  readonly open = input.required<boolean>();
  private readonly profileStore = inject(UserProfileStore);
  private readonly authEvent = inject(AuthEvent);

  readonly profile = this.profileStore.profile;

  logout(): void {
    this.authEvent.logout();
  }
}
