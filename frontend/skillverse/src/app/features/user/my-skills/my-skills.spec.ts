import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { MySkills } from './my-skills';
import { AuthService } from '../../../core/services/auth/auth';
import { SkillService } from '../../../core/services/skill/skill.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Skill } from '../../../core/models/skill.model';

function makeSkill(overrides: Partial<Skill>): Skill {
  return {
    id: 'skill-1',
    title: 'Advanced Watercolor Techniques',
    category: 'design',
    description: 'Master fluid dynamics and color blending for stunning landscapes.',
    image: 'http://x.com/i.jpg',
    price: 89,
    duration: 40,
    level: 'intermediate',
    requirements: 'None',
    rating: 4.7,
    reviewCount: 42,
    instructorName: 'Alex',
    instructorTitle: 'Mentor',
    instructorBio: 'Bio',
    instructorAvatar: 'http://x.com/avatar.jpg',
    availableSlots: 5,
    language: 'English',
    tags: [],
    featured: false,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

const mockSkills: Skill[] = [
  makeSkill({ id: 'skill-1', title: 'Advanced Watercolor Techniques' }),
  makeSkill({
    id: 'skill-2',
    title: 'Intro to Python for Data Science',
    description: 'Learn the basics of Pandas, NumPy, and data visualization.',
  }),
];

describe('MySkills', () => {
  let component: MySkills;
  let fixture: ComponentFixture<MySkills>;
  let skillService: { getSkills: ReturnType<typeof vi.fn>; deleteSkill: ReturnType<typeof vi.fn> };
  let toastService: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  async function setup() {
    skillService = {
      getSkills: vi.fn().mockReturnValue(of({ total: mockSkills.length, skills: mockSkills })),
      deleteSkill: vi.fn().mockReturnValue(of(undefined)),
    };
    toastService = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MySkills],
      providers: [
        provideRouter([]),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: toastService },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MySkills);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await setup();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches skills scoped to the current instructor', () => {
    expect(skillService.getSkills).toHaveBeenCalledWith(
      expect.objectContaining({ instructorId: 'user-1' }),
    );
  });

  it('should render page title', () => {
    const titleElement = fixture.debugElement.query(By.css('h1'));
    expect(titleElement).toBeTruthy();
    expect(titleElement.nativeElement.textContent).toContain('My Skills');
  });

  it('should render page subtitle', () => {
    const subtitleElement = fixture.debugElement.query(By.css('.header-sticky p'));
    expect(subtitleElement).toBeTruthy();
    expect(subtitleElement.nativeElement.textContent).toContain(
      'Manage the skills you teach and track your impact.',
    );
  });

  it('should render Create New Skill button', () => {
    const buttonElement = fixture.debugElement.query(By.css('.btn-create'));
    expect(buttonElement).toBeTruthy();
    expect(buttonElement.nativeElement.textContent).toContain('Create New Skill');
  });

  it('should have routerLink on create button', () => {
    const createLink = fixture.debugElement.query(By.css('.btn-create'));
    expect(createLink.attributes['routerLink']).toBe('/user/my-skills/create');
  });

  it('should load 2 skills from the real fetch', () => {
    expect(component.skills.length).toBe(2);
  });

  it('should render one card for each fetched skill', () => {
    const cards = fixture.debugElement.queryAll(By.css('.skill-card'));
    expect(cards.length).toBe(2);
  });

  it('should display each skill title', () => {
    const titles = fixture.debugElement.queryAll(By.css('.skill-card h3'));
    expect(titles[0].nativeElement.textContent).toContain('Advanced Watercolor Techniques');
    expect(titles[1].nativeElement.textContent).toContain('Intro to Python for Data Science');
  });

  it('should display each skill description', () => {
    const descriptions = fixture.debugElement.queryAll(By.css('.skill-card p'));
    expect(descriptions[0].nativeElement.textContent).toContain(
      'Master fluid dynamics and color blending for stunning landscapes.',
    );
  });

  it('should display price per session', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('89');
    expect(textContent).toContain('Coins / Session');
  });

  it('should render an Edit link for each skill', () => {
    const editLinks = fixture.debugElement.queryAll(By.css('.btn-edit'));
    expect(editLinks.length).toBe(2);
    editLinks.forEach((link) => expect(link.nativeElement.textContent).toContain('Edit'));
  });

  it('should render Delete button for each skill', () => {
    const deleteButtons = fixture.debugElement.queryAll(By.css('.btn-delete'));
    expect(deleteButtons.length).toBe(2);
  });

  it('deletes a skill after confirmation and removes it from the list', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteSkill(component.skills[0]);

    expect(skillService.deleteSkill).toHaveBeenCalledWith('skill-1');
    expect(component.skills.length).toBe(1);
    expect(toastService.showSuccess).toHaveBeenCalledWith('Skill deleted.');
  });

  it('does not delete when the user cancels the confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteSkill(component.skills[0]);

    expect(skillService.deleteSkill).not.toHaveBeenCalled();
    expect(component.skills.length).toBe(2);
  });

  it('shows an error toast if deletion fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    skillService.deleteSkill.mockReturnValue(throwError(() => ({ error: { detail: 'Nope' } })));

    component.deleteSkill(component.skills[0]);

    expect(toastService.showError).toHaveBeenCalledWith('Nope');
    expect(component.skills.length).toBe(2);
  });

  it('should display glass-card class on skill cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.skill-card'));
    cards.forEach((card) => {
      expect(card.classes['glass-card']).toBeTruthy();
    });
  });
});

describe('MySkills with no skills', () => {
  it('shows an empty-state message', async () => {
    const skillService = {
      getSkills: vi.fn().mockReturnValue(of({ total: 0, skills: [] })),
      deleteSkill: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MySkills],
      providers: [
        provideRouter([]),
        { provide: SkillService, useValue: skillService },
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'user-1' }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MySkills);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("You haven't published any skills yet.");
  });
});
