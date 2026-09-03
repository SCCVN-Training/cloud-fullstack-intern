import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SkillHero } from './skill-hero';
import { Skill } from '../../../../../core/models/skill.model';

const mockSkill: Skill = {
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
};

describe('SkillHero', () => {
  let component: SkillHero;
  let fixture: ComponentFixture<SkillHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillHero],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillHero);
    component = fixture.componentInstance;
    component.skill = mockSkill;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render skill title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.hero-title')?.textContent).toContain(mockSkill.title);
    expect(compiled.querySelector('.hero-description')?.textContent).toContain(
      mockSkill.description,
    );
    expect(compiled.querySelector('img')?.getAttribute('alt')).toBe(mockSkill.title);
  });
});
