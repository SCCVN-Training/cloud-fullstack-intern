import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

type SidePanelNavKey = 'home' | 'recent' | 'starred' | 'trash';

export interface SidePanelNavItem {
  key: SidePanelNavKey;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './side-panel.html',
  styleUrls: ['./side-panel.scss'],
})
export class SidePanel {
  @Input() usedStorage = 0;
  @Input() totalStorage = 1;
  @Input() activeNav: 'home' | 'recent' | 'starred' | 'trash' = 'home';
  @Output() navChange = new EventEmitter<
    'home' | 'recent' | 'starred' | 'trash'
  >();
  @Output() upgrade = new EventEmitter<void>();

  navItems: SidePanelNavItem[] = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'recent', icon: 'schedule', label: 'Recent' },
    { key: 'starred', icon: 'star', label: 'Starred' },
    { key: 'trash', icon: 'delete', label: 'Trash' },
  ];

  storagePercentage(): number {
    return Math.round((this.usedStorage / this.totalStorage) * 100);
  }
}
