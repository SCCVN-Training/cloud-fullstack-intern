import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeSearchDialog } from './anime-search-dialog';

describe('AnimeSearchDialog', () => {
  let component: AnimeSearchDialog;
  let fixture: ComponentFixture<AnimeSearchDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeSearchDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeSearchDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
