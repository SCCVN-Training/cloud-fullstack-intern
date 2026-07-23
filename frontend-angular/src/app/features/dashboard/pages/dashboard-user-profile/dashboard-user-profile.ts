import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { UserProfileEvent } from '../../../user-profile/data-access/with-user-profile-event';
import { UserProfileStore } from '../../../user-profile/data-access/with-user-profile-store';
import { ProfileCardComponent } from './components/profile-card/profile-card';
@Component({
  selector: 'app-dashboard-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ProfileCardComponent,
  ],
  templateUrl: './dashboard-user-profile.html',
  styleUrl: './dashboard-user-profile.scss',
})
export class DashboardUserProfile implements OnInit {
  readonly profileStore = inject(UserProfileStore);
  readonly profileEvent = inject(UserProfileEvent);
  readonly router = inject(Router);

  ngOnInit(): void {
    // Fetch profile data if not already loaded
    if (!this.profileStore.profile()) {
      this.profileEvent.getMyProfile();
    }
  }

  goToEdit(): void {
    this.router.navigate(['/dashboard', 'profile', 'edit']);
  }
}
