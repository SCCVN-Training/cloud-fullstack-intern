import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [MatButton],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  private location = inject(Location);
  private router = inject(Router);

  goBack() {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Fallback if no history (e.g., direct access to this page)
      this.router.navigate(['/home']);
    }
  }
}
