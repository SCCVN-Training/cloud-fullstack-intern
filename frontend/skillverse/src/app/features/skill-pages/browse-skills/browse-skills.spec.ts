import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { BrowseSkillsPage } from './browse-skills';
import { SkillListResponse, SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

const mockSkills: Skill[] = [
  {
    id: 'react-architecture-patterns',
    title: 'React Architecture Patterns',
    category: 'Development',
    description: 'Learn modern frontend architecture.',
    image: '/assets/images/skill-react.png',
    price: 120,
    duration: 45,
    level: 'Intermediate',
    requirements: 'Basic React knowledge',
    rating: 4.8,
    reviewCount: 42,
    instructorName: 'Jane Doe',
    instructorTitle: 'Senior Developer',
    instructorBio: 'Frontend expert',
    instructorAvatar: '/assets/images/jane-avatar.png',
    availableSlots: 5,
    language: 'English',
    tags: ['react', 'architecture'],
    featured: false,
    createdAt: '2026-07-01',
  },
];

const mockResponse: SkillListResponse = { total: mockSkills.length, skills: mockSkills };
const emptyResponse: SkillListResponse = { total: 0, skills: [] };

describe('BrowseSkillsPage', () => {
  let component: BrowseSkillsPage;
  let fixture: ComponentFixture<BrowseSkillsPage>;
  let skillService: SkillService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseSkillsPage],
      providers: [
        provideRouter([]),
        {
          provide: SkillService,
          useValue: {
            getSkills: vi.fn().mockReturnValue(of(mockResponse)),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseSkillsPage);
    component = fixture.componentInstance;
    skillService = TestBed.inject(SkillService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load skills from SkillService with pagination params', () => {
    expect(skillService.getSkills).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, limit: component.pageSize }),
    );
    expect(component.isLoading()).toBe(false);
    expect(component.skillsList().length).toBe(mockSkills.length);
    expect(component.total()).toBe(mockSkills.length);
  });

  it('should render skill card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.skill-card').length).toBe(mockSkills.length);
    expect(compiled.querySelector('.card-title')?.textContent).toContain(mockSkills[0].title);
  });

  it('should debounce search input and re-query the backend with the term', async () => {
    vi.useFakeTimers();
    const getSkillsSpy = skillService.getSkills as ReturnType<typeof vi.fn>;
    getSkillsSpy.mockClear();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'react';
    input.dispatchEvent(new Event('input'));

    vi.advanceTimersByTime(400);
    fixture.detectChanges();

    expect(getSkillsSpy).toHaveBeenCalledWith(expect.objectContaining({ search: 'react', skip: 0 }));
    vi.useRealTimers();
  });

  it('should show empty state when the backend returns no results', async () => {
    const getSkillsSpy = skillService.getSkills as ReturnType<typeof vi.fn>;
    getSkillsSpy.mockReturnValue(of(emptyResponse));

    component.clearFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).not.toBeNull();
    expect(compiled.querySelector('.btn-clear')).not.toBeNull();
  });
});
