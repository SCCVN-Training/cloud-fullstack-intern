import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth';
import { SkillService } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';

interface SkillCardViewModel {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  icon: string;
  tone: 'primary' | 'tertiary';
}

const CARD_ICONS = ['workspace_premium', 'auto_stories', 'code', 'brush', 'terminal'];

@Component({
  selector: 'app-my-skills',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-skills.html',
  styleUrls: ['./my-skills.scss'],
})
export class MySkills implements OnInit {
  skills: SkillCardViewModel[] = [];
  isLoading = signal(true);

  constructor(
    private auth: AuthService,
    private skillService: SkillService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const instructorId = this.auth.currentUser()?.id;
    if (!instructorId) {
      this.isLoading.set(false);
      return;
    }

    this.skillService.getSkills({ instructorId, limit: 100 }).subscribe({
      next: (res) => {
        this.skills = res.skills.map((skill, i) => ({
          id: skill.id,
          title: skill.title,
          description: skill.description,
          price: skill.price,
          rating: skill.rating,
          reviewCount: skill.reviewCount,
          icon: CARD_ICONS[i % CARD_ICONS.length],
          tone: i % 2 === 0 ? 'primary' : 'tertiary',
        }));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load your skills:', err);
        this.toastService.showError('Could not load your skills. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  deleteSkill(skill: SkillCardViewModel): void {
    if (!window.confirm(`Delete "${skill.title}"? This can't be undone.`)) return;

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
}
