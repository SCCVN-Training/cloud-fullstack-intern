import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { AnimeSeasonalItem } from '../../data-access/anime.schema';
import { AnimeCard } from '../anime-card/anime-card';

@Component({
  selector: 'app-anime-carousel',
  standalone: true,
  imports: [AnimeCard],
  templateUrl: './anime-carousel.html',
  styleUrl: './anime-carousel.scss',
})
export class AnimeCarousel implements AfterViewInit, OnDestroy {
  readonly animeList = input.required<AnimeSeasonalItem[]>();
  readonly loading = input(false);
  readonly autoSlideSpeed = input(0.5);
  readonly frameInterval = input(16);

  private readonly viewport = viewChild<ElementRef<HTMLDivElement>>('viewport');
  private readonly restartEffect = effect(() => {
    this.animeList();
    this.loading();
    this.offset = 0;
    requestAnimationFrame(() => this.measureLoop());
  });

  readonly isPaused = signal(false);
  readonly currentSlide = signal(0);
  readonly totalSlides = computed(() => Math.ceil(this.animeList().length / 3));
  readonly dotIndices = computed(() =>
    Array.from({ length: this.totalSlides() }, (_, index) => index),
  );
  readonly marqueeList = computed(() => [...this.animeList(), ...this.animeList()]);

  private animationFrame = 0;
  private lastTimestamp = 0;
  private offset = 0;
  private loopWidth = 0;
  private resumeTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.measureLoop();
      this.animate(performance.now());
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    clearTimeout(this.resumeTimer);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.measureLoop();
  }

  onMouseEnter(): void {
    this.isPaused.set(true);
  }

  onMouseLeave(): void {
    this.isPaused.set(false);
    this.lastTimestamp = performance.now();
  }

  toggleAutoplay(): void {
    this.isPaused.update((paused) => !paused);
    this.lastTimestamp = performance.now();
  }

  goToSlide(index: number): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport || !this.loopWidth) return;

    const target = (this.loopWidth / this.totalSlides()) * index;
    this.offset = target;
    this.currentSlide.set(index);
    viewport.scrollTo({ left: target, behavior: 'smooth' });
    this.isPaused.set(true);
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.isPaused.set(false);
      this.lastTimestamp = performance.now();
    }, 1300);
  }

  onScroll(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;
    this.offset = viewport.scrollLeft;
    this.updateCurrentSlide();
  }

  private animate(timestamp: number): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const delta = Math.min(timestamp - this.lastTimestamp, 40);

    if (!this.isPaused()) {
      this.offset += (delta / 16) * this.autoSlideSpeed();
      if (this.loopWidth && this.offset >= this.loopWidth) this.offset -= this.loopWidth;
      viewport.scrollTo({ left: this.offset, behavior: 'auto' });
      this.updateCurrentSlide();
    }

    this.lastTimestamp = timestamp;
    this.animationFrame = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
  }

  private measureLoop(): void {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport || !this.animeList().length) return;

    const secondSetStart = viewport.children[this.animeList().length] as HTMLElement | undefined;
    this.loopWidth = secondSetStart?.offsetLeft ?? viewport.scrollWidth / 2;
    this.offset = Math.min(this.offset, Math.max(this.loopWidth - 1, 0));
  }

  private updateCurrentSlide(): void {
    if (!this.loopWidth || !this.totalSlides()) return;
    const progress = Math.min(this.offset / this.loopWidth, 0.999);
    this.currentSlide.set(Math.floor(progress * this.totalSlides()));
  }
}
