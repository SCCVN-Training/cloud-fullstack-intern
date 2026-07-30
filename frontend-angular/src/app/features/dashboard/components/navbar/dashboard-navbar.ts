import { Component, inject, OnInit, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
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
export class DashboardNavbar implements OnInit {
  private readonly profileStore = inject(UserProfileStore);
  private router = inject(Router);

  readonly userAvatarUrl = this.profileStore.profile()?.avatarUrl;

  menuOpen = signal(false);

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        console.log('Navigation started to:', event.url);
        this.closeMenu();
      });
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
