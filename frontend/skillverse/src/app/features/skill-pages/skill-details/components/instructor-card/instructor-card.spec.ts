import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorCard } from './instructor-card';
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

describe('InstructorCard', () => {
  let component: InstructorCard;
  let fixture: ComponentFixture<InstructorCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorCard);
    component = fixture.componentInstance;
    component.skill = mockSkill;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render instructor details', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.instructor-name')?.textContent).toContain(
      mockSkill.instructorName,
    );
    expect(compiled.querySelector('.instructor-title')?.textContent).toContain(
      mockSkill.instructorTitle,
    );
    expect(compiled.querySelector('.instructor-bio')?.textContent).toContain(
      mockSkill.instructorBio,
    );
  });
});
