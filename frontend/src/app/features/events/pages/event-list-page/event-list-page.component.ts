import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EventFiltersComponent } from '../../components/event-filters/event-filters.component';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EventService } from '../../services/event.service';
import { PagedResult, Workshop, WorkshopFilters } from '../../models/event.model';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, EventFiltersComponent, EventCardComponent, PaginationComponent],
  templateUrl: './event-list-page.component.html',
  styleUrl: './event-list-page.component.scss',
})
export class EventsComponentList implements OnInit {
  workshops: Workshop[] = [];
  totalItems = 0;
  totalPages = 1;
  currentPage = 1;
  isLoading = false;

  private activeFilters: Partial<WorkshopFilters> = {};

  constructor(private eventService: EventService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadWorkshops();
  }

  onFiltersChanged(filters: Partial<WorkshopFilters>): void {
    this.activeFilters = filters;
    this.currentPage = 1;
    this.loadWorkshops();
  }

  onPageChanged(page: number): void {
    this.currentPage = page;
    this.loadWorkshops();
  }

  private loadWorkshops(): void {
    this.isLoading = true;
    this.eventService.getWorkshops(this.activeFilters, this.currentPage).subscribe({
      next: (result: PagedResult<Workshop>) => {
        this.workshops = result.items;
        this.totalItems = result.totalItems;
        this.totalPages = result.totalPages;
        this.isLoading = false;
        this.cdr.markForCheck()
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
