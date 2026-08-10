import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService, UserRecord } from '../../../core/services/auth/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayoutComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  get user(): UserRecord | null {
    return this.authService.currentUser();
  }

  get userName(): string {
    return this.user?.name ?? 'Administrator';
  }

  get userEmail(): string {
    return this.user?.email ?? 'admin@skillverse.com';
  }

  get userAvatar(): string {
    return (
      this.user?.avatar ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        this.userName,
      )}&background=a43073&color=ffffff`
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
