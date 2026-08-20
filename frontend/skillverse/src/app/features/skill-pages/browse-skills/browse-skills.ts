import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SkillService, SkillSort } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

interface SortChoice {
  value: SkillSort;
  label: string;
}

@Component({
  selector: 'app-browse-skills',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './browse-skills.html',
  styleUrls: ['./browse-skills.scss'],
})
export class BrowseSkillsPage implements OnInit, OnDestroy {
  // ----- Data for the current page (server already filtered/sorted/paged this) -----
  skillsList = signal<Skill[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(true);

  // ----- Search/sort state -----
  searchTerm = signal<string>('');
  selectedSort = signal<SkillSort>('newest');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);

  readonly sortChoices: SortChoice[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Top rated' },
    { value: 'popular', label: 'Most reviewed' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'title_asc', label: 'Title A-Z' },
  ];

  // ----- Pagination (server-side: skip/limit sent on every request) -----
  currentPage = signal<number>(1);
  readonly pageSize = 6;

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  isEmpty = computed(() => !this.isLoading() && this.total() === 0);

  // Debounce search input so we don't fire a request on every keystroke —
  // this is the client-side half of protecting the rate-limited /skills
  // endpoint; the server-side half is the @limiter.limit("60/minute") on
  // GET /skills itself.
  private searchInput$ = new Subject<string>();
  private searchSub?: Subscription;

  // Price inputs debounce the same way search does — typing in a number
  // field fires on every keystroke otherwise.
  private priceInput$ = new Subject<void>();
  private priceSub?: Subscription;

  constructor(private skillService: SkillService) {}

  ngOnInit(): void {
    this.searchSub = this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.currentPage.set(1); // any new search resets to page 1
        this.fetchSkills();
      });

    this.priceSub = this.priceInput$.pipe(debounceTime(500)).subscribe(() => {
      this.currentPage.set(1);
      this.fetchSkills();
    });

    this.fetchSkills();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.priceSub?.unsubscribe();
  }

  private fetchSkills(): void {
    this.isLoading.set(true);
    this.skillService
      .getSkills({
        skip: (this.currentPage() - 1) * this.pageSize,
        limit: this.pageSize,
        search: this.searchTerm() || undefined,
        sort: this.selectedSort(),
        minPrice: this.minPrice() ?? undefined,
        maxPrice: this.maxPrice() ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.skillsList.set(res.skills);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('API error: ', err);
          this.isLoading.set(false);
        },
      });
  }

  // ----- User actions -----

  onSearch(value: string) {
    this.searchInput$.next(value);
  }

  selectSort(sort: SkillSort) {
    this.selectedSort.set(sort);
    this.currentPage.set(1);
    this.fetchSkills();
  }

  onMinPriceChange(value: string) {
    this.minPrice.set(value === '' ? null : Number(value));
    this.priceInput$.next();
  }

  onMaxPriceChange(value: string) {
    this.maxPrice.set(value === '' ? null : Number(value));
    this.priceInput$.next();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.selectedSort.set('newest');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.currentPage.set(1);
    this.fetchSkills();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.fetchSkills();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}