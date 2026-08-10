import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-modal.html',
  styleUrls: ['./admin-modal.scss'],
})
export class AdminModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() description = '';

  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
