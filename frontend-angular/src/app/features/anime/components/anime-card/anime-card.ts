import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AnimeSeasonalItem } from '../../data-access/anime.schema';

@Component({
  selector: 'app-anime-card',
  standalone: true,
  imports: [MatChipsModule],
  templateUrl: './anime-card.html',
  styleUrl: './anime-card.scss',
})
export class AnimeCard {
  readonly anime = input.required<AnimeSeasonalItem>();

  readonly displayTitle = computed(
    () =>
      this.anime().title.romaji ||
      this.anime().title.english ||
      this.anime().title.native ||
      'Untitled',
  );

  readonly displaySubtitle = computed(() => {
    const { title } = this.anime();
    return title.english && title.english !== title.romaji ? title.english : title.native || '';
  });

  readonly imageUrl = computed(
    () =>
      this.anime().coverImage.large || this.anime().coverImage.medium || 'assets/placeholder.jpg',
  );

  readonly displayScore = computed(() => {
    const score = this.anime().averageScore;
    return score == null ? null : (score / 10).toFixed(1);
  });

  readonly nextAiringText = computed(() => {
    const next = this.anime().nextAiringEpisode;
    if (!next) return null;

    const diff = next.airingAt - Date.now() / 1000;
    if (diff <= 0) return 'Airing now';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    if (days > 0) return `Ep ${next.episode} in ${days}d`;
    if (hours > 0) return `Ep ${next.episode} in ${hours}h`;
    return `Ep ${next.episode} soon`;
  });

  readonly displayGenres = computed(() => {
    const genres = this.anime().genres || [];
    const shown = genres.slice(0, 3);
    return { shown, extra: genres.length - shown.length };
  });

  readonly formatText = computed(() => {
    const format = this.anime().format;
    return format ? format.toUpperCase() : null;
  });
}
