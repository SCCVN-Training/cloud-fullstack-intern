import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';

interface NavigationItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  readonly navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      route: '/',
    },
    {
      label: 'Browse Skills',
      route: '/browse-skills',
    },
    {
      label: 'About Us',
      route: '/about-us',
    },
    {
      label: 'How It Works',
      route: '/how-it-works',
    },
  ];
}
