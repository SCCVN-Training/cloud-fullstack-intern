import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorCard } from './instructor-card';

describe('InstructorCard', () => {
  let component: InstructorCard;
  let fixture: ComponentFixture<InstructorCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorCard);

    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
