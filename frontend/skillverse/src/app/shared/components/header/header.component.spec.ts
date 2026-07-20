import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {

  // Holds the instance of the component class
  let component: HeaderComponent;

  // Holds the rendered component (HTML + component)
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {

    // Configure Angular testing environment
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    // Create component instance
    fixture = TestBed.createComponent(HeaderComponent);

    // Access component class
    component = fixture.componentInstance;

    // Render HTML
    fixture.detectChanges();
  });

  /**
   * Test 1
   * Verify Angular successfully creates the component.
   */
  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test 2
   * Verify navigationItems array contains four menu items.
   */
  it('should contain four navigation items', () => {
    expect(component.navigationItems.length).toBe(4);
  });

  /**
   * Test 3
   * Verify the logo text appears in HTML.
   */
  it('should render the SkillVerse logo', () => {

    const logo = fixture.debugElement.query(
      By.css('.header-logo')
    );

    expect(logo).toBeTruthy();
    expect(logo.nativeElement.textContent)
      .toContain('SkillVerse');

  });

  /**
   * Test 4
   * Verify logo image exists.
   */
  it('should render the logo image', () => {

    const image = fixture.debugElement.query(
      By.css('.header-logo-image')
    );

    expect(image).toBeTruthy();
    expect(image.nativeElement.getAttribute('src'))
      .toContain('Logo.png');

  });

  /**
   * Test 5
   * Verify all navigation links appear on the page.
   */
  it('should render four navigation links', () => {

    const links = fixture.debugElement.queryAll(
      By.css('.header-link')
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
   * Verify Login and Register buttons exist.
   */
  it('should render Login and Register buttons', () => {

    const actions = fixture.debugElement.query(
      By.css('.header-actions')
    );

    expect(actions.nativeElement.textContent)
      .toContain('Login');

    expect(actions.nativeElement.textContent)
      .toContain('Register');

  });

  /**
   * Test 7
   * Verify the navigation data defined in the component.
   *
   * This checks the TypeScript logic, not the HTML.
   */
  it('should define the correct navigation items', () => {

    expect(component.navigationItems).toEqual([
      {
        label: 'Home',
        route: '/'
      },
      {
        label: 'Browse Skills',
        route: '/browse-skills'
      },
      {
        label: 'About Us',
        route: '/about-us'
      },
      {
        label: 'How It Works',
        route: '/how-it-works'
      }
    ]);

  });

});