import { Component, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside/click-outside';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';
import { DashboardNavbarMenu } from './components/navbar-menu/dashboard-navbar-menu';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    DashboardNavbarMenu,
    ClickOutsideDirective,
  ],
  templateUrl: './dashboard-navbar.html',
  styleUrl: './dashboard-navbar.scss',
})
export class DashboardNavbar {
  private readonly profileStore = inject(UserProfileStore);

  readonly userAvatarUrl = this.profileStore.profile()?.avatarUrl;

  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
