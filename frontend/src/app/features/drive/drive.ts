import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardHeader } from '../../shared/components/dashboard-header/dashboard-header';
import {
  SidePanel,
  SidePanelNavKey,
} from '../../shared/components/side-panel/side-panel';
import { MobileBottomNav } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav';
import { DriveItemCard } from '../../shared/components/drive-item-card/drive-item-card';
import { DriveItem } from '../../shared/components/drive-item-card/drive-item.model';
import {
  UploadDialog,
  UploadDialogResult,
} from '../upload-dialog/upload-dialog';

@Component({
  selector: 'app-drive',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    DashboardHeader,
    SidePanel,
    MobileBottomNav,
    DriveItemCard,
  ],
  templateUrl: './drive.html',
  styleUrls: ['./drive.scss'],
})
export class Drive {
  usedStorage = signal<number>(5);
  totalStorage = signal<number>(20);
  currentNav = signal<SidePanelNavKey>('home');
  isLoading = signal<boolean>(false);
  isSidebarCollapsed = signal<boolean>(false);

  private dialog = inject(MatDialog);

  onSidebarCollapseChange(collapsed: boolean): void {
    this.isSidebarCollapsed.set(collapsed);
  }

  storagePercentage = computed(() => {
    const total = this.totalStorage();
    if (!total) return 0;
    return Math.min(100, Math.round((this.usedStorage() / total) * 100));
  });

  // Items structured based on DB schema
  items = signal<DriveItem[]>([
    {
      id: 'f101',
      ownerId: 'u1',
      parentFolderId: null,
      path: 'root',
      name: 'Q4 Market Report.pdf',
      itemType: 'file',
      storageKey: 'users/u1/q4_report.pdf',
      sizeBytes: 1258291,
      mimeType: 'application/pdf',
      contentHash: null,
      isTrashed: false,
      trashedAt: null,
      createdAt: '2023-10-22T15:15:00Z',
      updatedAt: '2023-10-22T15:15:00Z',
    },
    {
      id: 'd101',
      ownerId: 'u1',
      parentFolderId: null,
      path: 'root',
      name: 'Project Assets',
      itemType: 'folder',
      itemsCount: 12,
      isTrashed: false,
      trashedAt: null,
      createdAt: '2023-09-01T10:00:00Z',
      updatedAt: '2023-09-18T09:45:00Z',
    },
  ]);

  switchNav(nav: SidePanelNavKey) {
    this.currentNav.set(nav);
  }

  onUploadTrigger(): void {
    const dialogRef = this.dialog.open(UploadDialog, {
      width: '500px',
      disableClose: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: UploadDialogResult | undefined) => {
        if (!result) return;

        if (result.action === 'upload' && result.files) {
          console.log('Uploading files:', result.files);
        } else if (result.action === 'create-folder' && result.folderName) {
          console.log('Creating folder:', result.folderName);
        }
      });
  }

  onOpenItem(item: DriveItem): void {
    if (item.itemType === 'folder') {
      console.log('Navigating to folder ID:', item.id);
    } else {
      console.log('Previewing file:', item.name);
    }
  }

  onDownloadItem(item: DriveItem): void {
    console.log('Downloading file:', item.name);
  }

  onTrashItem(item: DriveItem): void {
    console.log('Moving to trash:', item.id);
  }
}
