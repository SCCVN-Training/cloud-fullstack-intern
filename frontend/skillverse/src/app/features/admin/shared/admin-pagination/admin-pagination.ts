import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-pagination.html',
  styleUrls: ['./admin-pagination.scss'],
})
export class AdminPaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  get showingFrom(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get pages(): number[] {
    const pages: number[] = [];

    const maxVisiblePages = Math.min(this.totalPages, 3);

    for (let page = 1; page <= maxVisiblePages; page++) {
      pages.push(page);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
