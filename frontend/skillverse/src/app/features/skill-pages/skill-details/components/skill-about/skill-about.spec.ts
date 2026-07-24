import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillAbout } from './skill-about';

describe('SkillAbout', () => {
  let component: SkillAbout;
  let fixture: ComponentFixture<SkillAbout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillAbout],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillAbout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
