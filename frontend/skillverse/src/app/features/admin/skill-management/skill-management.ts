import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Skill {
  id: number;
  title: string;
  description: string;
  category: string;
  mentor: string;
  students: number;
  createdDate: string;
  status: 'active' | 'pending' | 'suspended';
}

@Component({
  selector: 'app-skill-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skill-management.html',
  styleUrls: ['./skill-management.scss'],
})
export class SkillManagementComponent {
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

  readonly skills: Skill[] = [
    {
      id: 1,
      title: 'Advanced Watercolor Techniques',
      description: 'Master fluid dynamics, color blending, and advanced watercolor methods.',
      category: 'Art & Design',
      mentor: 'Sarah Johnson',
      students: 42,
      createdDate: 'Jan 15, 2026',
      status: 'active',
    },
    {
      id: 2,
      title: 'Digital Photography',
      description: 'Learn composition, lighting, camera settings, and professional editing.',
      category: 'Photography',
      mentor: 'Michael Chen',
      students: 36,
      createdDate: 'Jan 22, 2026',
      status: 'active',
    },
    {
      id: 3,
      title: 'Python Programming',
      description: 'Build a strong foundation in Python programming and problem solving.',
      category: 'Programming',
      mentor: 'David Wilson',
      students: 58,
      createdDate: 'Feb 03, 2026',
      status: 'active',
    },
    {
      id: 4,
      title: 'UI/UX Design Fundamentals',
      description: 'Understand user research, wireframing, prototyping, and design systems.',
      category: 'Design',
      mentor: 'Emily Davis',
      students: 31,
      createdDate: 'Feb 10, 2026',
      status: 'pending',
    },
    {
      id: 5,
      title: 'Conversational Spanish',
      description: 'Develop practical Spanish speaking and listening skills for everyday use.',
      category: 'Languages',
      mentor: 'Carlos Martinez',
      students: 27,
      createdDate: 'Feb 18, 2026',
      status: 'active',
    },
    {
      id: 6,
      title: 'Creative Writing',
      description: 'Learn storytelling, character development, dialogue, and narrative structure.',
      category: 'Writing',
      mentor: 'Jessica Brown',
      students: 24,
      createdDate: 'Mar 01, 2026',
      status: 'suspended',
    },
    {
      id: 7,
      title: 'Guitar for Beginners',
      description: 'Learn basic chords, rhythm patterns, scales, and beginner songs.',
      category: 'Music',
      mentor: 'Daniel Lee',
      students: 45,
      createdDate: 'Mar 08, 2026',
      status: 'active',
    },
    {
      id: 8,
      title: 'Public Speaking',
      description: 'Improve confidence, presentation structure, delivery, and communication.',
      category: 'Communication',
      mentor: 'Sophia Taylor',
      students: 19,
      createdDate: 'Mar 15, 2026',
      status: 'pending',
    },
  ];

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
    console.log('View skill:', skill);
  }

  editSkill(skill: Skill): void {
    console.log('Edit skill:', skill);
  }

  deleteSkill(skill: Skill): void {
    const confirmed = window.confirm(`Are you sure you want to delete "${skill.title}"?`);

    if (!confirmed) {
      return;
    }

    console.log('Delete skill:', skill);
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
