import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard-header.html',
  styleUrls: ['./dashboard-header.scss'],
})
export class DashboardHeader {
  @Input() brandSize = 36;
  @Input() searchPlaceholder = 'Search files, folders...';
  @Output() upload = new EventEmitter<void>();
  @Output() profile = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }
}
