import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { SkillDetailsPage } from './skill-details';

describe('SkillDetailsPage', () => {
  let component: SkillDetailsPage;
  let fixture: ComponentFixture<SkillDetailsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillDetailsPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'id') {
                    return 'react-architecture-patterns';
                  }
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render Skill Hero', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-skill-hero')).toBeTruthy();
  });

  it('should render Booking Card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-booking-card')).toBeTruthy();
  });

  it('should render Instructor Card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-instructor-card')).toBeTruthy();
  });

  it('should render Review Carousel', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-review-carousel')).toBeTruthy();
  });

  it('should have route parameter', () => {
    expect(component).toBeTruthy();
  });
});
