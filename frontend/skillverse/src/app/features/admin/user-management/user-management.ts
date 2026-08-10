import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UserRole = 'learner' | 'mentor';
type UserStatus = 'active' | 'banned';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  joinedDate: string;
  status: UserStatus;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
})
export class UserManagementComponent {
  // ========================================
  // Filters
  // ========================================

  selectedRole = '';
  selectedStatus = '';

  // ========================================
  // Pagination
  // ========================================

  currentPage = 1;

  readonly pageSize = 5;

  // ========================================
  // Mock Users
  // ========================================

  users: User[] = [
    {
      id: 1,
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=47',
      role: 'mentor',
      joinedDate: 'Jan 15, 2026',
      status: 'active',
    },
    {
      id: 2,
      name: 'James Anderson',
      email: 'james.anderson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=12',
      role: 'learner',
      joinedDate: 'Jan 21, 2026',
      status: 'active',
    },
    {
      id: 3,
      name: 'Sophia Martinez',
      email: 'sophia.martinez@example.com',
      avatar: 'https://i.pravatar.cc/150?img=32',
      role: 'mentor',
      joinedDate: 'Feb 03, 2026',
      status: 'active',
    },
    {
      id: 4,
      name: 'Liam Thompson',
      email: 'liam.thompson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=11',
      role: 'learner',
      joinedDate: 'Feb 10, 2026',
      status: 'banned',
    },
    {
      id: 5,
      name: 'Olivia Brown',
      email: 'olivia.brown@example.com',
      avatar: 'https://i.pravatar.cc/150?img=44',
      role: 'learner',
      joinedDate: 'Feb 18, 2026',
      status: 'active',
    },
    {
      id: 6,
      name: 'Noah Davis',
      email: 'noah.davis@example.com',
      avatar: 'https://i.pravatar.cc/150?img=13',
      role: 'mentor',
      joinedDate: 'Mar 02, 2026',
      status: 'active',
    },
    {
      id: 7,
      name: 'Ava Johnson',
      email: 'ava.johnson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=49',
      role: 'learner',
      joinedDate: 'Mar 11, 2026',
      status: 'active',
    },
    {
      id: 8,
      name: 'William Garcia',
      email: 'william.garcia@example.com',
      avatar: 'https://i.pravatar.cc/150?img=68',
      role: 'mentor',
      joinedDate: 'Mar 19, 2026',
      status: 'banned',
    },
    {
      id: 9,
      name: 'Isabella Miller',
      email: 'isabella.miller@example.com',
      avatar: 'https://i.pravatar.cc/150?img=45',
      role: 'learner',
      joinedDate: 'Apr 01, 2026',
      status: 'active',
    },
    {
      id: 10,
      name: 'Benjamin Wilson',
      email: 'benjamin.wilson@example.com',
      avatar: 'https://i.pravatar.cc/150?img=14',
      role: 'mentor',
      joinedDate: 'Apr 08, 2026',
      status: 'active',
    },
    {
      id: 11,
      name: 'Mia Moore',
      email: 'mia.moore@example.com',
      avatar: 'https://i.pravatar.cc/150?img=48',
      role: 'learner',
      joinedDate: 'Apr 15, 2026',
      status: 'active',
    },
    {
      id: 12,
      name: 'Lucas Taylor',
      email: 'lucas.taylor@example.com',
      avatar: 'https://i.pravatar.cc/150?img=15',
      role: 'mentor',
      joinedDate: 'Apr 22, 2026',
      status: 'banned',
    },
  ];

  // ========================================
  // Filtered Users
  // ========================================

  get filteredUsers(): User[] {
    return this.users.filter((user) => {
      const roleMatches = !this.selectedRole || user.role === this.selectedRole;

      const statusMatches = !this.selectedStatus || user.status === this.selectedStatus;

      return roleMatches && statusMatches;
    });
  }

  // ========================================
  // Paginated Users
  // ========================================

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  // ========================================
  // Pagination Information
  // ========================================

  get totalUsers(): number {
    return this.filteredUsers.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalUsers / this.pageSize));
  }

  get showingFrom(): number {
    if (this.totalUsers === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalUsers);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];

    for (let page = 1; page <= this.totalPages; page++) {
      pages.push(page);
    }

    return pages;
  }

  // ========================================
  // Filter Actions
  // ========================================

  onFilterChange(): void {
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
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  // ========================================
  // User Actions
  // ========================================

  viewProfile(user: User): void {
    console.log('View profile:', user);
  }

  resetPassword(user: User): void {
    console.log('Reset password:', user);

    alert(`Password reset requested for ${user.name}.`);
  }

  toggleBan(user: User): void {
    if (user.status === 'banned') {
      user.status = 'active';

      console.log(`User ${user.name} has been unbanned.`);
      return;
    }

    user.status = 'banned';

    console.log(`User ${user.name} has been banned.`);
  }

  // ========================================
  // Display Helpers
  // ========================================

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'mentor':
        return 'Mentor';

      case 'learner':
        return 'Learner';

      default:
        return role;
    }
  }

  getStatusLabel(status: UserStatus): string {
    switch (status) {
      case 'active':
        return 'Active';

      case 'banned':
        return 'Banned/Suspended';

      default:
        return status;
    }
  }
}
