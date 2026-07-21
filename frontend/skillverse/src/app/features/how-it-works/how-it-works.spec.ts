import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HowItWorksPage } from './how-it-works';

describe('HowItWorksPage', () => {
  let component: HowItWorksPage;
  let fixture: ComponentFixture<HowItWorksPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowItWorksPage]
    }).compileComponents();

    fixture = TestBed.createComponent(HowItWorksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero title', () => {
    const title = fixture.debugElement.query(By.css('.hero-title'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('Master New Skills');
  });

  it('should render the hero description', () => {
    const description = fixture.debugElement.query(
      By.css('.hero-section p')
    );

    expect(description).toBeTruthy();
  });

  it('should render two hero buttons', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.hero-actions button')
    );

    expect(buttons.length).toBe(2);
  });

  it('should render four step cards', () => {
    const cards = fixture.debugElement.queryAll(
      By.css('.step-card')
    );

    expect(cards.length).toBe(4);
  });

  it('should render all step titles', () => {
    const titles = fixture.debugElement.queryAll(
      By.css('.step-card h3')
    );

    expect(titles[0].nativeElement.textContent.trim()).toBe('Create a Profile');
    expect(titles[1].nativeElement.textContent.trim()).toBe('Teach & Earn');
    expect(titles[2].nativeElement.textContent.trim()).toBe('Browse & Book');
    expect(titles[3].nativeElement.textContent.trim()).toBe('Learn & Grow');
  });

  it('should render three benefit items', () => {
    const benefits = fixture.debugElement.queryAll(
      By.css('.benefit-item')
    );

    expect(benefits.length).toBe(3);
  });

  it('should render three images', () => {
    const images = fixture.debugElement.queryAll(
      By.css('img')
    );

    expect(images.length).toBe(3);
  });

  it('should render the CTA title', () => {
    const title = fixture.debugElement.query(
      By.css('.cta-title')
    );

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain(
      'Ready to Exchange Wisdom?'
    );
  });

  it('should render two CTA buttons', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.cta-actions button')
    );

    expect(buttons.length).toBe(2);
  });
});