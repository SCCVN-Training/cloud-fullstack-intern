import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonalAnimeList } from './seasonal-anime-list';

describe('SeasonalAnimeList', () => {
  let component: SeasonalAnimeList;
  let fixture: ComponentFixture<SeasonalAnimeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonalAnimeList],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonalAnimeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
