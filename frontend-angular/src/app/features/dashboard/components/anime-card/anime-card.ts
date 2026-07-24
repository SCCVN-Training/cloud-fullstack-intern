import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { JikanSeasonalAnime } from '../../../anime/data-access/anime.schema';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [MatCardModule, CommonModule],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.scss',
})
export class AnimeCard {
  readonly anime = input.required<JikanSeasonalAnime>();
}
