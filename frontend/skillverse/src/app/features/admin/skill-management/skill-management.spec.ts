import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SkillManagementComponent } from './skill-management';
import { SkillService } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Skill } from '../../../core/models/skill.model';

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'skill-1',
    title: 'Python Programming',
    category: 'Programming',
    description: 'Build a strong foundation in Python.',
    image: 'http://x.com/i.jpg',
    price: 78,
    duration: 35,
    level: 'intermediate',
    requirements: 'None',
    rating: 4.5,
    reviewCount: 12,
    instructorName: 'David Wilson',
    instructorTitle: 'Mentor',
    instructorBio: 'Bio',
    instructorAvatar: 'http://x.com/avatar.jpg',
    availableSlots: 5,
    language: 'English',
    tags: [],
    featured: false,
    createdAt: '2026-02-03T00:00:00Z',
    ...overrides,
  };
}

describe('SkillManagementComponent', () => {
  let component: SkillManagementComponent;
  let fixture: ComponentFixture<SkillManagementComponent>;
  let skillService: { getSkills: ReturnType<typeof vi.fn>; deleteSkill: ReturnType<typeof vi.fn> };
  let toastService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(skills: Skill[]) {
    skillService = {
      getSkills: vi.fn().mockReturnValue(of({ total: skills.length, skills })),
      deleteSkill: vi.fn().mockReturnValue(of(undefined)),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SkillManagementComponent],
      providers: [
        provideRouter([]),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillManagementComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  it('should create and fetch real skills', async () => {
    await setup([makeSkill({})]);
    expect(component).toBeTruthy();
    expect(skillService.getSkills).toHaveBeenCalled();
    expect(component.skills.length).toBe(1);
  });

  it('maps instructorName to mentor and reviewCount for the view model', async () => {
    await setup([makeSkill({})]);
    expect(component.skills[0].mentor).toBe('David Wilson');
    expect(component.skills[0].reviewCount).toBe(12);
  });

  it('filters by search term across title/description/mentor/category', async () => {
    await setup([
      makeSkill({ id: 's1', title: 'Python Programming' }),
      makeSkill({ id: 's2', title: 'Guitar Basics', instructorName: 'Daniel Lee' }),
    ]);
    component.searchTerm = 'guitar';
    expect(component.filteredSkills.length).toBe(1);
    expect(component.filteredSkills[0].id).toBe('s2');
  });

  it('filters by category', async () => {
    await setup([
      makeSkill({ id: 's1', category: 'Programming' }),
      makeSkill({ id: 's2', category: 'Music' }),
    ]);
    component.selectedCategory = 'Music';
    expect(component.filteredSkills.map((s) => s.id)).toEqual(['s2']);
  });

  it('every fetched skill defaults to active status (no backend moderation field exists)', async () => {
    await setup([makeSkill({})]);
    expect(component.skills[0].status).toBe('active');
  });

  it('editSkill navigates to the shared edit route', async () => {
    await setup([makeSkill({ id: 'skill-42' })]);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.editSkill(component.skills[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-skills', 'skill-42', 'edit']);
  });

  it('viewSkill navigates to the public skill detail page', async () => {
    await setup([makeSkill({ id: 'skill-42' })]);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.viewSkill(component.skills[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/skill-details', 'skill-42']);
  });

  it('deleteSkill calls the real delete endpoint and removes the row after confirmation', async () => {
    await setup([makeSkill({ id: 'skill-1' })]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteSkill(component.skills[0]);

    expect(skillService.deleteSkill).toHaveBeenCalledWith('skill-1');
    expect(component.skills.length).toBe(0);
    expect(toastService.showSuccess).toHaveBeenCalledWith('Skill deleted.');
  });

  it('deleteSkill does nothing if the user cancels the confirmation', async () => {
    await setup([makeSkill({ id: 'skill-1' })]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteSkill(component.skills[0]);

    expect(skillService.deleteSkill).not.toHaveBeenCalled();
    expect(component.skills.length).toBe(1);
  });

  it('shows an error toast when the fetch fails', async () => {
    skillService = {
      getSkills: vi.fn().mockReturnValue(throwError(() => new Error('network error'))),
      deleteSkill: vi.fn(),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SkillManagementComponent],
      providers: [
        provideRouter([]),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillManagementComponent);
    fixture.detectChanges();

    expect(toastService.showError).toHaveBeenCalledWith('Could not load skills. Please try again.');
  });
});
