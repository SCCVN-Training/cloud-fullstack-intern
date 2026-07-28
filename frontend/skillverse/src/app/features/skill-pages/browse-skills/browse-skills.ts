import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-browse-skills',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './browse-skills.html',
  styleUrls: ['./browse-skills.scss'],
})
export class BrowseSkillsPage implements OnInit {
  isSearchEmpty = false;

  // Use Signal for Zoneless environment
  skillsList = signal<Skill[]>([]);
  isLoading = signal<boolean>(true);

  // Signals and dynamic variable for paagination
  currentPage = signal<number>(1);
  readonly pageSize = 6;

  totalPages = computed(() => Math.ceil(this.skillsList().length / this.pageSize));

  // Create an array to render pagination button
  pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // Cut the array base on current page
  displayedSkills = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.skillsList().slice(startIndex, endIndex);
  });

  constructor(private skillService: SkillService) {}

  // Function to change page
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Call this function as soon as the page loads
  ngOnInit(): void {
    console.log(' Calling API ...');
    this.skillService.getSkills().subscribe({
      next: (data) => {
        console.log('There is a database: ', data);
        this.skillsList.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('API error: ', error);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(value: string) {
    if (value.toLowerCase() === 'empty') {
      this.isSearchEmpty = true;
    } else {
      this.isSearchEmpty = false;
    }
  }

  clearFilters() {
    this.isSearchEmpty = false;
  }
}
