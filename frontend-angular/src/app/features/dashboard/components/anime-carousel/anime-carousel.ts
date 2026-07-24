import { Component, ElementRef, input, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { JikanSeasonalAnime } from '../../../anime/data-access/anime.schema';
import { AnimeCard } from '../anime-card/anime-card';

@Component({
  selector: 'app-anime-carousel',
  standalone: true,
  imports: [MatIconModule, AnimeCard],
  templateUrl: './anime-carousel.html',
  styleUrl: './anime-carousel.scss',
})
export class AnimeCarousel {
  readonly animeList = input.required<JikanSeasonalAnime[]>();

  readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

  scrollLeft() {
    this.viewport().nativeElement.scrollBy({
      left: -900,
      behavior: 'smooth',
    });
  }

  scrollRight() {
    this.viewport().nativeElement.scrollBy({
      left: 900,
      behavior: 'smooth',
    });
  }
}
