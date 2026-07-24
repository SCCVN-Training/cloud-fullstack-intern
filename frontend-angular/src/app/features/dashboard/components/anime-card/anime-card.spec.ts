import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeCard } from './anime-card';

describe('AnimeCard', () => {
  let component: AnimeCard;
  let fixture: ComponentFixture<AnimeCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeCard);

    const mockAnime = {
      mal_id: 1,
      title: '',
      title_english: null,
      title_japanese: null,
      score: null,

      season: null,
      year: null,

      synopsis: null,

      url: '',

      trailer: {
        url: null,
      },

      images: {
        jpg: {
          image_url: '',
          large_image_url: '',
        },
      },
    };

    fixture.componentRef.setInput('anime', mockAnime);
    fixture.detectChanges();

    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
