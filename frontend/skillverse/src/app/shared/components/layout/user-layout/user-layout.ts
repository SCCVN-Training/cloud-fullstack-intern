import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './user-layout.html',
  styleUrls: ['./user-layout.scss'],
})
export class UserLayoutComponent {
  // Shown until a user uploads their own avatar (avatar is null/undefined
  // by default — see AuthService.updateAvatar / ProfileResponse.avatar_url).
  readonly defaultAvatarUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCbCGWfN80I9PzrchuQjWHhHu4aY9C3k4tC-C0qG5vMVpOrishf8InXwxvXhRxamoxlAQsGcENn7bqzQPrGvz6-5DdrR3T7BwhZ0XXkN85uWVJB-gangg0bQ1QAFWgbhzN25JE46bd7N7fdqKMIi9MlDXHA94YxCYtpz3VGv3dUCQqA2MGLCKC1zExaJqJWL4xUpm0joc6HWOjvb-rUojc9JshNiRp_6ZiZAQMucWpYdgbYU7NTayzqgx9vzgRDMb3k7ir12z-5ylYK';

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
