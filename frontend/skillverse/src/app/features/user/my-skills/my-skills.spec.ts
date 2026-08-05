import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { MySkills } from './my-skills';

describe('MySkills', () => {
  let component: MySkills;
  let fixture: ComponentFixture<MySkills>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySkills],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MySkills);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // =====================================
  // Component
  // =====================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =====================================
  // Page
  // =====================================

  it('should render page title', () => {
    const title = fixture.debugElement.query(By.css('h1'));

    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('My Skills');
  });

  it('should render page subtitle', () => {
    const subtitle = fixture.debugElement.query(By.css('.header-sticky p'));

    expect(subtitle.nativeElement.textContent).toContain(
      'Manage the skills you teach'
    );
  });

  it('should render Create New Skill button', () => {
    const button = fixture.debugElement.query(By.css('.btn-create'));

    expect(button).toBeTruthy();
    expect(button.nativeElement.textContent).toContain(
      'Create New Skill'
    );
  });

  // =====================================
  // Skills
  // =====================================

  it('should initialize with 2 skills', () => {
    expect(component.skills.length).toBe(2);
  });

  it('should render one card for each skill', () => {
    const cards = fixture.debugElement.queryAll(
      By.css('.skill-card')
    );

    expect(cards.length).toBe(component.skills.length);
  });

  it('should display first skill title', () => {
    const title = fixture.debugElement.query(
      By.css('.skill-card h3')
    );

    expect(title.nativeElement.textContent).toContain(
      'Advanced Watercolor Techniques'
    );
  });

  it('should display first skill description', () => {
    const description = fixture.debugElement.query(
      By.css('.skill-card p')
    );

    expect(description.nativeElement.textContent).toContain(
      'Master fluid dynamics'
    );
  });

  it('should display students count', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('42');
    expect(text).toContain('Students');
  });

  it('should display coins earned', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('1250');
    expect(text).toContain('Coins Earned');
  });

  it('should display Active status', () => {
    const badges = fixture.debugElement.queryAll(
      By.css('.status-badge')
    );

    expect(badges[0].nativeElement.textContent).toContain('Active');
  });

  // =====================================
  // Actions
  // =====================================

  it('should render Edit button for each skill', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.btn-edit')
    );

    expect(buttons.length).toBe(component.skills.length);

    buttons.forEach(button => {
      expect(button.nativeElement.textContent).toContain('Edit');
    });
  });

  it('should render Delete button for each skill', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.btn-delete')
    );

    expect(buttons.length).toBe(component.skills.length);
  });

  // =====================================
  // RouterLink
  // =====================================

  it('should navigate to create skill page', () => {
    const link = fixture.debugElement.query(
      By.css('.btn-create')
    );

    expect(link.attributes['ng-reflect-router-link'])
      .toBe('/user/my-skills/create');
  });
});