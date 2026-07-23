import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {

  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  /**
   * Test 1
   * Verify Angular successfully creates the footer component.
   */
  it('should create the footer component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test 2
   * Verify the current year is generated correctly.
   */
  it('should set the current year', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  /**
   * Test 3
   * Verify the footer displays the SkillVerse brand.
   */
  it('should render the SkillVerse logo text', () => {

    const logo = fixture.debugElement.query(
      By.css('.footer-logo')
    );

    expect(logo).toBeTruthy();
    expect(logo.nativeElement.textContent)
      .toContain('SkillVerse');

  });

  /**
   * Test 4
   * Verify the copyright section contains the current year.
   */
  it('should display the current year in the copyright', () => {

    const copyright = fixture.debugElement.query(
      By.css('.footer-copyright')
    );

    expect(copyright.nativeElement.textContent)
      .toContain(component.currentYear.toString());

  });

  /**
   * Test 5
   * Verify all footer links are rendered.
   */
  it('should render four footer links', () => {

    const links = fixture.debugElement.queryAll(
      By.css('.footer-link')
    );

    expect(links.length).toBe(4);

    expect(links[0].nativeElement.textContent.trim())
      .toBe('Home');

    expect(links[1].nativeElement.textContent.trim())
      .toBe('Browse Skills');

    expect(links[2].nativeElement.textContent.trim())
      .toBe('How It Works');

    expect(links[3].nativeElement.textContent.trim())
      .toBe('About Us');

  });

  /**
   * Test 6
   * Verify the footer data model contains the expected links.
   */
  it('should define the correct quick links', () => {

    expect(component.quickLinks).toEqual([
      {
        label: 'Home',
        route: '/'
      },
      {
        label: 'Browse Skills',
        route: '/browse-skills'
      },
      {
        label: 'How It Works',
        route: '/how-it-works'
      },
      {
        label: 'About Us',
        route: '/about-us'
      }
    ]);

  });

});