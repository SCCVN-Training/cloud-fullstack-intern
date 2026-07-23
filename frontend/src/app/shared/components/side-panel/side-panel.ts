import { Component, EventEmitter, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

type SidePanelNavKey = 'home' | 'recent' | 'starred' | 'trash' | '';

export type { SidePanelNavKey };

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
  usedStorage = input(0);
  totalStorage = input(1);
  activeNav = input<SidePanelNavKey>('home');
  navChange = output<SidePanelNavKey>();
  upgrade = output<void>();

  navItems: SidePanelNavItem[] = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'recent', icon: 'schedule', label: 'Recent' },
    { key: 'starred', icon: 'star', label: 'Starred' },
    { key: 'trash', icon: 'delete', label: 'Trash' },
  ];

  storagePercentage(): number {
    return Math.round((this.usedStorage() / this.totalStorage()) * 100);
  }
}
