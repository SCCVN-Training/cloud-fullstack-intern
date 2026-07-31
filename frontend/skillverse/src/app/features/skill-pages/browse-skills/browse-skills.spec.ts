import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { BrowseSkillsPage } from './browse-skills';
import { SkillService } from '../../../core/services/skill/skill.service';
import { Skill } from '../../../core/models/skill.model';

const mockSkills: Skill[] = [
  {
    id: 'react-architecture-patterns',
    title: 'React Architecture Patterns',
    category: 'Development',
    description: 'Learn modern frontend architecture.',
    image: '/assets/images/skill-react.png',
    price: 120,
    duration: '2h',
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
            getSkills: vi.fn().mockReturnValue(of(mockSkills)),
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

  it('should load skills from SkillService', () => {
    expect(skillService.getSkills).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.displayedSkills().length).toBe(mockSkills.length);
  });

  it('should render skill card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.skill-card').length).toBe(mockSkills.length);
    expect(compiled.querySelector('.card-title')?.textContent).toContain(mockSkills[0].title);
  });

  it('should show empty search state when search value is empty', () => {
    component.onSearch('empty');
    fixture.detectChanges();

    expect(component.isSearchEmpty).toBe(true);
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });
});
