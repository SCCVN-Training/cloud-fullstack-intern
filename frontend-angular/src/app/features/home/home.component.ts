import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthStore } from '../../core/auth/data-access/with-auth-store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../../app.scss'],
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly authStore = inject(AuthStore);

  startCollecting(): void {
    this.router.navigate(['/dashboard']);
  }
}
