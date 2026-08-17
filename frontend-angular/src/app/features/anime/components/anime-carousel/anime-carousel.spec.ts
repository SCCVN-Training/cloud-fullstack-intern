import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';
import { AnimeCarousel } from './anime-carousel';

describe('AnimeCarousel', () => {
  let component: AnimeCarousel;
  let fixture: ComponentFixture<AnimeCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeCarousel],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeCarousel);

    fixture.componentRef.setInput('animeList', []);
    fixture.detectChanges();

    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
