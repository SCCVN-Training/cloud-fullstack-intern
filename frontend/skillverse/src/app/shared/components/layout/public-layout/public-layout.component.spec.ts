import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;
  let fixture: ComponentFixture<PublicLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --------------------------------------------------
  // Component Creation
  // --------------------------------------------------
  it('should create the public layout component', () => {
    expect(component).toBeTruthy();
  });

  // --------------------------------------------------
  // Header
  // --------------------------------------------------
  it('should render the header component', () => {
    const header = fixture.debugElement.query(
      By.css('app-header')
    );

    expect(header).toBeTruthy();
  });

  // --------------------------------------------------
  // Page Container
  // --------------------------------------------------
  it('should render the page container component', () => {
    const pageContainer = fixture.debugElement.query(
      By.css('app-page-container')
    );

    expect(pageContainer).toBeTruthy();
  });

  // --------------------------------------------------
  // Router Outlet
  // --------------------------------------------------
  it('should contain a router outlet', () => {
    const outlet = fixture.debugElement.query(
      By.css('router-outlet')
    );

    expect(outlet).toBeTruthy();
  });

  // --------------------------------------------------
  // Footer
  // --------------------------------------------------
  it('should render the footer component', () => {
    const footer = fixture.debugElement.query(
      By.css('app-footer')
    );

    expect(footer).toBeTruthy();
  });

  // --------------------------------------------------
  // Layout Order
  // --------------------------------------------------
  it('should render components in the correct order', () => {
    const host: HTMLElement = fixture.nativeElement;

    const children = Array.from(host.children);

    expect(children[0].tagName.toLowerCase()).toBe('app-header');
    expect(children[1].tagName.toLowerCase()).toBe('app-page-container');
    expect(children[2].tagName.toLowerCase()).toBe('app-footer');
  });
});