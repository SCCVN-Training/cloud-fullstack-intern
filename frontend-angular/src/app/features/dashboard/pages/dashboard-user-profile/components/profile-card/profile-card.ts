import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UserProfile } from '../../../../../user-profile/data-access/user-profile.schema';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './profile-card.html',
  styleUrls: ['./profile-card.scss'],
})
export class ProfileCardComponent {
  readonly profile = input.required<UserProfile>();

  getCardStyleClass(): string {
    const style = this.profile().profileCardStyle || 'Standard';
    return `card-style-${style.toLowerCase()}`;
  }

  getCardStyles() {
    const profile = this.profile();
    return {
      '--accent-color': profile.accentColor || '#2563eb',
      '--bg-color': profile.backgroundColor || '#ffffff',
    } as Record<string, string>;
  }
}
