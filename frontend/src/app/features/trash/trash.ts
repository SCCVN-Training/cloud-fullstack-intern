import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { TrashService } from './trash.service';
import { FileOperationsService } from '@core/file-operations/services/file-operations.service';
import { DriveItem } from '../../shared/components/drive-item-card/drive-item.model';
import { DashboardHeader } from '../../shared/components/dashboard-header/dashboard-header';
import { SidePanel } from '../../shared/components/side-panel/side-panel';
import { MobileBottomNav } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav';
import { UploadWidget } from '../upload-widget/upload-widget';
import { DriveItemCard } from '../../shared/components/drive-item-card/drive-item-card';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DashboardHeader,
    SidePanel,
    MobileBottomNav,
    UploadWidget,
    DriveItemCard,
  ],
  templateUrl: './trash.html',
  styleUrls: ['./trash.scss'],
})
export class TrashComponent implements OnInit {
  private fileService = inject(FileOperationsService);
  // private trashService = inject(TrashService);
  private snackBar = inject(MatSnackBar);

  // State signals
  isLoading = signal<boolean>(false);
  isSidebarCollapsed = signal<boolean>(false);
  currentNav = signal<string>('trash');
  usedStorage = signal<number>(0);
  totalStorage = signal<number>(100 * 1024 * 1024 * 1024); // 100 GB default

  items = signal<DriveItem[]>([]);
  hasItems = computed(() => this.items().length > 0);

  ngOnInit(): void {
    this.loadTrashedItems();
  }

  //   loadTrashedItems(): void {
  //     this.isLoading.set(true);
  //     this.trashService.getTrashedItems().subscribe({
  //       next: (data) => {
  //         this.items.set(data);
  //         this.isLoading.set(false);
  //       },
  //       error: () => {
  //         this.snackBar.open('Failed to load trash contents.', 'Close', {
  //           duration: 3000,
  //         });
  //         this.isLoading.set(false);
  //       },
  //     });
  //   }

  //   onRestoreItem(item: DriveItem): void {
  //     const action$ = item.isFolder
  //       ? this.trashService.restoreFolder(item.id) // Calls POST /storage/trash/folders/{id}/restore[cite: 4]
  //       : this.trashService.restoreFile(item.id); // Calls POST /storage/trash/files/{id}/restore[cite: 4]

  //     action$.subscribe({
  //       next: () => {
  //         this.items.update((list) => list.filter((i) => i.id !== item.id));
  //         this.snackBar.open(`${item.name} restored.`, 'Close', {
  //           duration: 2500,
  //         });
  //       },
  //       error: () =>
  //         this.snackBar.open('Failed to restore item.', 'Close', {
  //           duration: 3000,
  //         }),
  //     });
  //   }

  //   onPermanentDeleteItem(item: DriveItem): void {
  //     const action$ = item.isFolder
  //       ? this.trashService.hardDeleteFolder(item.id) // Calls DELETE /storage/trash/folders/{id}[cite: 4]
  //       : this.trashService.hardDeleteFile(item.id); // Calls DELETE /storage/trash/files/{id}[cite: 4]

  //     action$.subscribe({
  //       next: () => {
  //         this.items.update((list) => list.filter((i) => i.id !== item.id));
  //         this.snackBar.open(`${item.name} permanently deleted.`, 'Close', {
  //           duration: 2500,
  //         });
  //       },
  //       error: () =>
  //         this.snackBar.open('Failed to delete item permanently.', 'Close', {
  //           duration: 3000,
  //         }),
  //     });
  //   }

  //   onEmptyTrash(): void {
  //     if (
  //       !confirm(
  //         'Are you sure you want to permanently delete all items in the trash?',
  //       )
  //     ) {
  //       return;
  //     }

  //     this.isLoading.set(true);
  //     // Calls DELETE /storage/trash/empty[cite: 4]
  //     this.trashService.emptyTrash().subscribe({
  //       next: () => {
  //         this.items.set([]);
  //         this.isLoading.set(false);
  //         this.snackBar.open('Trash emptied successfully.', 'Close', {
  //           duration: 2500,
  //         });
  //       },
  //       error: () => {
  //         this.isLoading.set(false);
  //         this.snackBar.open('Failed to empty trash.', 'Close', {
  //           duration: 3000,
  //         });
  //       },
  //     });
  //   }

  //   switchNav(nav: string): void {
  //     this.currentNav.set(nav);
  //   }

  //   onSidebarCollapseChange(collapsed: boolean): void {
  //     this.isSidebarCollapsed.set(collapsed);
  //   }

  //   onUploadTrigger(): void {
  //     // Triggers upload modal if initiated from navigation
  //   }
}
