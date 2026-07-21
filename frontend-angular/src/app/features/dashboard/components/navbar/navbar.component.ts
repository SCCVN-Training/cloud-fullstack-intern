import { Component, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthStore } from '../../../../core/auth/data-access/with-auth-store';
import { ClickOutsideDirective } from '../../../../shared/directives/click-outside/click-outside';
import { DashboardNavbarMenuComponent } from './components/navbar-menu/navbar-menu.component';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    DashboardNavbarMenuComponent,
    ClickOutsideDirective,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class DashboardNavbarComponent {
  private readonly authStore = inject(AuthStore);

  readonly userAvatarUrl = this.authStore.currentUser()?.avatarUrl;

  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
