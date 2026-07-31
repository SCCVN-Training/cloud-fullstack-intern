import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillAbout } from './skill-about';
import { Skill } from '../../../../../core/models/skill.model';

const mockSkill: Skill = {
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
  aboutText: 'Deep dive into React architecture patterns.',
  learningOutcomes: ['Design reusable UI architecture', 'Build scalable React applications'],
};

describe('SkillAbout', () => {
  let component: SkillAbout;
  let fixture: ComponentFixture<SkillAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillAbout],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillAbout);
    component = fixture.componentInstance;
    component.skill = mockSkill;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render about text and learning outcomes', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('p')?.textContent).toContain(mockSkill.aboutText);
    expect(compiled.querySelectorAll('.learning-list li').length).toBe(
      mockSkill.learningOutcomes?.length,
    );
  });
});
