import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BrowseSkillsPage } from './browse-skills';

describe('BrowseSkillsPage', () => {
  let component: BrowseSkillsPage;
  let fixture: ComponentFixture<BrowseSkillsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseSkillsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseSkillsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
