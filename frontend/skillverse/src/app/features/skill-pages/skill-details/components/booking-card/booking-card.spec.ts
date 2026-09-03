import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingCard } from './booking-card';
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

describe('BookingCard', () => {
  let component: BookingCard;
  let fixture: ComponentFixture<BookingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingCard);
    component = fixture.componentInstance;
    component.skill = mockSkill;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display pricing and details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const detailVals = Array.from(compiled.querySelectorAll('.detail-val')).map(
      (node) => node.textContent?.trim() ?? '',
    );

    expect(compiled.querySelector('.price-value')?.textContent).toContain(
      mockSkill.price.toString(),
    );
    expect(detailVals[0]).toContain(String(mockSkill.duration));
    expect(detailVals[1]).toContain(mockSkill.level);
    expect(detailVals[2]).toContain(mockSkill.requirements);
  });

  it("should link the Book Session button to this skill's booking page", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const bookButton = compiled.querySelector('.btn-book') as HTMLElement;

    expect(bookButton.getAttribute('href')).toBe(`/booking/${mockSkill.id}`);
  });
});
