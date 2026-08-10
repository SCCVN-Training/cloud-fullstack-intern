import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stat-card.html',
  styleUrls: ['./admin-stat-card.scss'],
})
export class AdminStatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() percentage = '';
  @Input() icon = '';

  @Input()
  type: 'skills' | 'bookings' | 'coins' | 'reviews' | 'flagged' = 'skills';
}
