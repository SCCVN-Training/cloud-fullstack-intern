import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthStore } from '../auth/data-access/with-auth-store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home {
  private readonly router = inject(Router);

  readonly authStore = inject(AuthStore);

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
