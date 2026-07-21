import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AboutUsPage } from './about-us';

describe('AboutUsPage', () => {
  let component: AboutUsPage;
  let fixture: ComponentFixture<AboutUsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsPage]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutUsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==========================
  // Component
  // ==========================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ==========================
  // Hero Section
  // ==========================

  it('should render the hero badge', () => {
    const badge = fixture.debugElement.query(By.css('.badge'));

    expect(badge).toBeTruthy();
  });

  it('should render the hero title', () => {
    const title = fixture.debugElement.query(By.css('.hero-title'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent)
      .toContain('Our Mission');
  });

  // ==========================
  // Story Section
  // ==========================

  it('should render at least one image', () => {
    const images = fixture.debugElement.queryAll(By.css('img'));

    expect(images.length).toBeGreaterThan(0);
  });

  // ==========================
  // Value Cards
  // ==========================

  it('should render value cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.value-card'));

    expect(cards.length).toBeGreaterThan(0);
  });

  // ==========================
  // FAQ
  // ==========================

  it('should render FAQ items', () => {
    const faqs = fixture.debugElement.queryAll(By.css('.faq-item'));

    expect(faqs.length).toBeGreaterThan(0);
  });

  // ==========================
  // CTA
  // ==========================

  it('should render the join button', () => {
    const button = fixture.debugElement.query(By.css('.btn-join'));

    expect(button).toBeTruthy();
  });

  // ==========================
  // Main Layout
  // ==========================

  it('should render the main container', () => {
    const main = fixture.debugElement.query(By.css('.about-main'));

    expect(main).toBeTruthy();
  });
});