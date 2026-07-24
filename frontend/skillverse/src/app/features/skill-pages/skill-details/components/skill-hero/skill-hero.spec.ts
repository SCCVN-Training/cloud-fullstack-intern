import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SkillHero } from './skill-hero';

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

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
