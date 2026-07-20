import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material 3 UI Engines
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-drive',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './drive.html',
  styleUrls: ['./drive.scss'],
})
export class Drive {
  // Simple state machine for left sidebar navigation
  currentTab = signal<'home' | 'storage'>('home');

  // Hardcoded storage metrics for the markup display
  usedStorage = signal(4.2); // GB used
  totalStorage = signal(15); // GB total

  storagePercentage = computed(() => {
    return (this.usedStorage() / this.totalStorage()) * 100;
  });

  // Mock Data Schema for validation testing
  mockItems = [
    { name: 'Project Roadmap.pdf', type: 'file', updated: '2026-07-20' },
    { name: 'Q3 Invoices', type: 'folder', updated: '2026-07-18' },
    { name: 'Assets & Logos', type: 'folder', updated: '2026-07-15' },
    { name: 'ProfilePhoto.png', type: 'file', updated: '2026-07-19' },
  ];

  // Computes display items matching sorting constraints
  displayItems = computed(() => {
    if (this.currentTab() === 'home') {
      // Home tab: strictly chronological (newest first based on updated date string)
      return [...this.mockItems].sort((a, b) =>
        b.updated.localeCompare(a.updated),
      );
    } else {
      // My Storage tab: folders always bubble to the top, then files
      return [...this.mockItems].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
    }
  });

  switchTab(tab: 'home' | 'storage'): void {
    this.currentTab.set(tab);
  }

  onUploadTrigger(): void {
    console.log('Upload workflow triggered');
  }
}
