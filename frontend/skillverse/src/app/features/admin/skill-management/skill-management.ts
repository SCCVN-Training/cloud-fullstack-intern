import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SkillService } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Skill as ApiSkill } from '../../../core/models/skill.model';

// Skill.rating/reviewCount stand in for "how much traction this skill
// has" in this view — the backend has no per-skill approval/suspension
// workflow, so `status` isn't a real field: every fetched skill is
// 'active'. Kept as a real (if currently-inert) filter dimension rather
// than removed, since a moderation status is a plausible near-future
// addition and the UI already has the plumbing for it.
interface Skill {
  id: string;
  title: string;
  description: string;
  category: string;
  mentor: string;
  reviewCount: number;
  createdDate: string;
  status: 'active' | 'pending' | 'suspended';
}

function toViewModel(skill: ApiSkill): Skill {
  return {
    id: skill.id,
    title: skill.title,
    description: skill.description,
    category: skill.category,
    mentor: skill.instructorName,
    reviewCount: skill.reviewCount,
    createdDate: new Date(skill.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    status: 'active',
  };
}

@Component({
  selector: 'app-skill-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skill-management.html',
  styleUrls: ['./skill-management.scss'],
})
export class SkillManagementComponent implements OnInit {
  // ========================================
  // Filters
  // ========================================

  selectedCategory = '';

  selectedStatus = '';

  searchTerm = '';

  // ========================================
  // Pagination
  // ========================================

  currentPage = 1;

  readonly pageSize = 5;

  // ========================================
  // Skills
  // ========================================

  skills: Skill[] = [];
  isLoading = signal(true);

  constructor(
    private skillService: SkillService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.skillService.getSkills({ limit: 100 }).subscribe({
      next: (res) => {
        this.skills = res.skills.map(toViewModel);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load skills:', err);
        this.toastService.showError('Could not load skills. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // ========================================
  // Filtered Skills
  // ========================================

  get filteredSkills(): Skill[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.skills.filter((skill) => {
      const matchesSearch =
        !search ||
        skill.title.toLowerCase().includes(search) ||
        skill.description.toLowerCase().includes(search) ||
        skill.mentor.toLowerCase().includes(search) ||
        skill.category.toLowerCase().includes(search);

      const matchesCategory = !this.selectedCategory || skill.category === this.selectedCategory;

      const matchesStatus = !this.selectedStatus || skill.status === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  // ========================================
  // Pagination
  // ========================================

  get totalSkills(): number {
    return this.filteredSkills.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalSkills / this.pageSize));
  }

  get paginatedSkills(): Skill[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredSkills.slice(startIndex, startIndex + this.pageSize);
  }

  get showingFrom(): number {
    if (this.totalSkills === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalSkills);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  // ========================================
  // Filters
  // ========================================

  onFilterChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  // ========================================
  // Pagination Actions
  // ========================================

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ========================================
  // Skill Actions
  // ========================================

  viewSkill(skill: Skill): void {
    this.router.navigate(['/skill-details', skill.id]);
  }

  editSkill(skill: Skill): void {
    // Reuses the same owner-or-admin edit form instructors use — the
    // backend already authorizes admins on PATCH /skills/{id}, no
    // separate admin-only edit UI needed.
    this.router.navigate(['/user/my-skills', skill.id, 'edit']);
  }

  deleteSkill(skill: Skill): void {
    const confirmed = window.confirm(`Are you sure you want to delete "${skill.title}"?`);

    if (!confirmed) {
      return;
    }

    this.skillService.deleteSkill(skill.id).subscribe({
      next: () => {
        this.skills = this.skills.filter((s) => s.id !== skill.id);
        this.toastService.showSuccess('Skill deleted.');
      },
      error: (err) => {
        console.error('Failed to delete skill:', err);
        this.toastService.showError(
          err?.error?.detail || 'Could not delete this skill. Please try again.',
        );
      },
    });
  }

  // ========================================
  // Status
  // ========================================

  getStatusLabel(status: Skill['status']): string {
    switch (status) {
      case 'active':
        return 'Active';

      case 'pending':
        return 'Pending';

      case 'suspended':
        return 'Suspended';

      default:
        return status;
    }
  }
}
