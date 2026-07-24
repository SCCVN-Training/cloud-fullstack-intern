import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeCarousel } from './anime-carousel';

describe('AnimeCarousel', () => {
  let component: AnimeCarousel;
  let fixture: ComponentFixture<AnimeCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeCarousel],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
