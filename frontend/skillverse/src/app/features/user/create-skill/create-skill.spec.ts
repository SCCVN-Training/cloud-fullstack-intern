import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, expect } from 'vitest';

import { CreateSkill } from './create-skill';
import { AuthService } from '../../../core/services/auth/auth';
import { SkillService } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Skill } from '../../../core/models/skill.model';

@Component({ template: '', standalone: true })
class BlankComponent {}

// submit() navigates here for real via router.navigate — give the router
// something to match so the navigation promise resolves instead of
// rejecting with an unhandled "Cannot match any routes" error.
const testRoutes = [{ path: 'user/my-skills', component: BlankComponent }];

const mockSkill: Skill = {
  id: 'skill-1',
  title: 'Existing Skill',
  category: 'tech',
  description: 'An existing skill to edit.',
  image: 'http://x.com/i.jpg',
  price: 67,
  duration: 30,
  level: 'intermediate',
  requirements: 'None',
  rating: 4.5,
  reviewCount: 3,
  instructorName: 'Jane Doe',
  instructorTitle: 'Mentor',
  instructorBio: 'Bio',
  instructorAvatar: 'http://x.com/avatar.jpg',
  availableSlots: 5,
  language: 'English',
  tags: [],
  featured: false,
  createdAt: '2026-01-01',
};

describe('CreateSkill', () => {
  let component: CreateSkill;
  let fixture: ComponentFixture<CreateSkill>;
  let skillService: {
    getSkillById: ReturnType<typeof vi.fn>;
    createSkill: ReturnType<typeof vi.fn>;
    updateSkill: ReturnType<typeof vi.fn>;
  };
  let toastService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let router: Router;

  async function setup(skillIdParam: string | null = null) {
    skillService = {
      getSkillById: vi.fn().mockReturnValue(of(mockSkill)),
      createSkill: vi.fn().mockReturnValue(of(mockSkill)),
      updateSkill: vi.fn().mockReturnValue(of(mockSkill)),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateSkill],
      providers: [
        provideRouter(testRoutes),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: toastService },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => skillIdParam } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSkill);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with beginner level selected', () => {
    expect(component.selectedLevel).toBe('beginner');
  });

  it('should change selected level to intermediate', () => {
    component.selectLevel('intermediate');
    expect(component.selectedLevel).toBe('intermediate');
  });

  it('should change selected level to advanced', () => {
    component.selectLevel('advanced');
    expect(component.selectedLevel).toBe('advanced');
  });

  it('should render page title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Create New Skill');
  });

  it('should render page description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Share your expertise with the SkillVerse community.');
  });

  it('should render upload section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Skill Cover Image');
    expect(compiled.textContent).toContain('Click to upload');
  });

  it('should render file input', () => {
    const fileInput = fixture.debugElement.query(By.css('input[type="file"]'));
    expect(fileInput).toBeTruthy();
  });

  it('should render skill title input', () => {
    const input = fixture.debugElement.query(By.css('#skillTitle'));
    expect(input).toBeTruthy();
  });

  it('should render category select', () => {
    const select = fixture.debugElement.query(By.css('#category'));
    expect(select).toBeTruthy();
  });

  it('should render four category options plus placeholder', () => {
    const options = fixture.debugElement.queryAll(By.css('#category option'));
    expect(options.map((o) => o.nativeElement.value)).toEqual([
      '',
      'design',
      'tech',
      'business',
      'music',
    ]);
  });

  it('should render price input as disabled', () => {
    const input = fixture.debugElement.query(By.css('#price')).nativeElement;
    expect(input).toBeTruthy();
    expect(input.disabled).toBe(true);
  });

  it('should render description textarea', () => {
    const textarea = fixture.debugElement.query(By.css('#description'));
    expect(textarea).toBeTruthy();
  });

  it('should render duration input', () => {
    const input = fixture.debugElement.query(By.css('#duration'));
    expect(input).toBeTruthy();
  });

  it('should render three level radio buttons', () => {
    const radios = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
    expect(radios.length).toBe(3);
  });

  it('should render all skill level labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Beginner');
    expect(compiled.textContent).toContain('Intermediate');
    expect(compiled.textContent).toContain('Advanced');
  });

  it('should have beginner active by default', () => {
    const activeBox = fixture.debugElement.query(By.css('.level-box.active'));
    expect(activeBox).toBeTruthy();
    expect(activeBox.nativeElement.textContent).toContain('Beginner');
  });

  it('should render cancel button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should render publish button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Publish Skill');
  });

  it('should render one form element', () => {
    const form = fixture.debugElement.query(By.css('form'));
    expect(form).toBeTruthy();
  });

  it('should render required skill title input', () => {
    const input = fixture.debugElement.query(By.css('#skillTitle')).nativeElement;
    expect(input.required).toBe(true);
  });

  // ---- Derived price ----

  it('computes price as the max cap at 45 minutes', () => {
    component.duration = 45;
    expect(component.computedPrice).toBe(100);
  });

  it('computes price proportionally for a shorter duration', () => {
    component.duration = 30;
    expect(component.computedPrice).toBe(67); // round(100 * 30 / 45)
  });

  it('computes 0 price when duration is not set', () => {
    component.duration = null;
    expect(component.computedPrice).toBe(0);
  });

  it('clamps the preview price at the 45-minute cap for an over-limit duration', () => {
    component.duration = 90;
    expect(component.computedPrice).toBe(100);
  });

  // ---- canSubmit / submit ----

  it('cannot submit with required fields missing', () => {
    expect(component.canSubmit).toBe(false);
  });

  it('can submit once all required fields are filled with a valid duration', () => {
    component.title = 'New Skill';
    component.category = 'tech';
    component.description = 'desc';
    component.requirements = 'none';
    component.duration = 30;
    expect(component.canSubmit).toBe(true);
  });

  it('cannot submit with a duration over 45 minutes', () => {
    component.title = 'New Skill';
    component.category = 'tech';
    component.description = 'desc';
    component.requirements = 'none';
    component.duration = 60;
    expect(component.canSubmit).toBe(false);
  });

  it('submit() calls createSkill (not updateSkill) in create mode', () => {
    component.title = 'New Skill';
    component.category = 'tech';
    component.description = 'desc';
    component.requirements = 'none';
    component.duration = 30;

    component.submit();

    expect(skillService.createSkill).toHaveBeenCalledTimes(1);
    expect(skillService.updateSkill).not.toHaveBeenCalled();
    const [payload, instructorId] = skillService.createSkill.mock.calls[0];
    expect(payload.price).toBeUndefined(); // derived server-side, not sent
    expect(instructorId).toBe('user-1');
  });

  it('submit() navigates to my-skills and shows a success toast', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.title = 'New Skill';
    component.category = 'tech';
    component.description = 'desc';
    component.requirements = 'none';
    component.duration = 30;

    component.submit();

    expect(toastService.showSuccess).toHaveBeenCalledWith('Skill published.');
    expect(navigateSpy).toHaveBeenCalledWith(['/user/my-skills']);
  });

  it('submit() shows an error toast and does not navigate on failure', () => {
    skillService.createSkill.mockReturnValue(throwError(() => ({ error: { detail: 'Nope' } })));
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.title = 'New Skill';
    component.category = 'tech';
    component.description = 'desc';
    component.requirements = 'none';
    component.duration = 30;

    component.submit();

    expect(toastService.showError).toHaveBeenCalledWith('Nope');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe('CreateSkill in edit mode', () => {
  let component: CreateSkill;
  let fixture: ComponentFixture<CreateSkill>;
  let skillService: {
    getSkillById: ReturnType<typeof vi.fn>;
    createSkill: ReturnType<typeof vi.fn>;
    updateSkill: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    skillService = {
      getSkillById: vi.fn().mockReturnValue(of(mockSkill)),
      createSkill: vi.fn().mockReturnValue(of(mockSkill)),
      updateSkill: vi.fn().mockReturnValue(of(mockSkill)),
    };

    await TestBed.configureTestingModule({
      imports: [CreateSkill],
      providers: [
        provideRouter(testRoutes),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => mockSkill.id } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSkill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('fetches and pre-fills the existing skill', () => {
    expect(skillService.getSkillById).toHaveBeenCalledWith(mockSkill.id);
    expect(component.title).toBe(mockSkill.title);
    expect(component.duration).toBe(mockSkill.duration);
    expect(component.isEditMode).toBe(true);
  });

  it('renders "Edit Skill" as the heading and "Save Changes" on the button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Edit Skill');
    expect(compiled.textContent).toContain('Save Changes');
  });

  it('submit() calls updateSkill (not createSkill) in edit mode', () => {
    component.submit();

    expect(skillService.updateSkill).toHaveBeenCalledWith(mockSkill.id, expect.any(Object));
    expect(skillService.createSkill).not.toHaveBeenCalled();
  });
});
