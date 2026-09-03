import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth';
import { SkillService, SkillWritePayload } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';

// Mirrors SkillService.MAX_DURATION_MINUTES / MAX_PRICE in
// marketplace-service. This is a live preview only — the backend
// recomputes and validates the real price on submit, so drift here just
// means a stale preview, never a wrong charge.
const MAX_DURATION_MINUTES = 45;
const MAX_PRICE = 100;

@Component({
  selector: 'app-create-skill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-skill.html',
  styleUrls: ['./create-skill.scss'],
})
export class CreateSkill implements OnInit {
  selectedLevel = 'beginner';

  title = '';
  category = '';
  description = '';
  requirements = '';
  duration: number | null = null;

  isEditMode = false;
  private editingSkillId: string | null = null;

  isLoading = signal(false);
  isSaving = signal(false);
  loadError = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private skillService: SkillService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const skillId = this.route.snapshot.paramMap.get('skillId');
    if (!skillId) return;

    this.isEditMode = true;
    this.editingSkillId = skillId;
    this.isLoading.set(true);

    this.skillService.getSkillById(skillId).subscribe({
      next: (skill) => {
        this.title = skill.title;
        this.category = skill.category;
        this.description = skill.description;
        this.requirements = skill.requirements;
        this.duration = skill.duration;
        this.selectedLevel = skill.level.toLowerCase();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load skill for editing:', err);
        this.loadError.set('Could not load this skill. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  selectLevel(level: string): void {
    this.selectedLevel = level;
  }

  // Read by the template for the disabled price field — never typed by
  // the user, always derived from duration. Clamped to the duration cap
  // so a mistyped value (e.g. 90) previews a sane number instead of one
  // the backend would reject outright.
  get computedPrice(): number {
    const duration = this.duration;
    if (!duration || duration <= 0) return 0;
    const clamped = Math.min(duration, MAX_DURATION_MINUTES);
    return Math.round((MAX_PRICE * clamped) / MAX_DURATION_MINUTES);
  }

  get canSubmit(): boolean {
    return (
      !!this.title.trim() &&
      !!this.category &&
      !!this.description.trim() &&
      !!this.requirements.trim() &&
      !!this.duration &&
      this.duration > 0 &&
      this.duration <= MAX_DURATION_MINUTES &&
      !this.isSaving()
    );
  }

  cancel(): void {
    this.router.navigate(['/user/my-skills']);
  }

  submit(): void {
    if (!this.canSubmit) return;

    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      this.toastService.showError('You must be logged in to publish a skill.');
      return;
    }

    this.isSaving.set(true);

    const basePayload: Partial<SkillWritePayload> = {
      title: this.title.trim(),
      category: this.category,
      description: this.description.trim(),
      requirements: this.requirements.trim(),
      duration: this.duration!,
      level: this.selectedLevel,
      // price intentionally omitted — the backend derives it from
      // duration, per the "system calculates it" requirement.
    };

    const request =
      this.isEditMode && this.editingSkillId
        ? this.skillService.updateSkill(this.editingSkillId, basePayload)
        : this.skillService.createSkill(
            { ...basePayload, image: this.placeholderImage() } as SkillWritePayload,
            userId,
          );

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.showSuccess(this.isEditMode ? 'Skill updated.' : 'Skill published.');
        this.router.navigate(['/user/my-skills']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.showError(
          err?.error?.detail || 'Could not save this skill. Please try again.',
        );
      },
    });
  }

  // No image-upload endpoint exists for skills yet (out of scope here) —
  // generated the same way seed.py does, so a newly created skill still
  // has a real image URL instead of an empty required field.
  private placeholderImage(): string {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.title.trim() || 'Skill');
  }
}
