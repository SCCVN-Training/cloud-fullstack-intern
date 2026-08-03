import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { Homepage } from './homepage';

describe('Homepage', () => {
  let component: Homepage;
  let fixture: ComponentFixture<Homepage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Homepage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Homepage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Verify Angular successfully creates the homepage component.
   */
  it('should create the homepage component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verify the hero title is rendered.
   */
  it('should render the hero title', () => {
    const title = fixture.debugElement.query(By.css('.hero-title'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('Exchange Wisdom');
    expect(title.nativeElement.textContent).toContain('Grow Together');
  });

  /**
   * Verify both call-to-action buttons exist.
   */
  it('should render Start Teaching and Explore Skills buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));

    expect(buttons.length).toBe(2);

    expect(buttons[0].nativeElement.textContent.trim()).toBe('Start Teaching');
    expect(buttons[1].nativeElement.textContent.trim()).toBe('Explore Skills');
  });

  /**
   * Verify the "How It Works" section exists.
   */
  it('should render the How It Works section', () => {
    const heading = fixture.debugElement.query(By.css('.features-heading h2'));

    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe('How It Works');
  });

  /**
   * Verify exactly three feature cards are displayed.
   */
  it('should render three feature cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.feature-card'));

    expect(cards.length).toBe(3);
  });

  /**
   * Verify the feature card titles.
   */
  it('should render the correct feature titles', () => {
    const titles = fixture.debugElement.queryAll(By.css('.feature-card h3'));

    expect(titles[0].nativeElement.textContent.trim()).toBe('Teach a Skill');
    expect(titles[1].nativeElement.textContent.trim()).toBe('Earn Skill Coins');
    expect(titles[2].nativeElement.textContent.trim()).toBe('Learn Anything');
  });

  /**
   * Verify the Trending Skills section exists.
   */
  it('should render the Trending Skills section', () => {
    const heading = fixture.debugElement.query(By.css('.trending-title'));

    expect(heading).toBeTruthy();
    expect(heading.nativeElement.textContent.trim()).toBe('Trending Skills');
  });

  /**
   * Verify four trending skill cards are displayed.
   */
  it('should render four trending skill cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.trending-card'));

    expect(cards.length).toBe(4);
  });

  /**
   * Verify each trending card displays an image.
   */
  it('should render an image for every trending skill', () => {
    const images = fixture.debugElement.queryAll(By.css('.trending-card img'));

    expect(images.length).toBe(4);
  });

  /**
   * Verify the hero image is rendered.
   */
  it('should render the hero image', () => {
    const image = fixture.debugElement.query(By.css('.hero-image img'));

    expect(image).toBeTruthy();
    expect(image.nativeElement.getAttribute('src')).toContain('googleusercontent');
  });
});
