import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, beforeEach, it, expect } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { MySkills } from './my-skills';

describe('MySkills', () => {
  let component: MySkills;
  let fixture: ComponentFixture<MySkills>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MySkills, // Standalone component
        RouterTestingModule, // For routerLink
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MySkills);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render page title', () => {
    const titleElement = fixture.debugElement.query(By.css('h1'));
    expect(titleElement).toBeTruthy();
    expect(titleElement.nativeElement.textContent).toContain('My Skills');
  });

  it('should render page subtitle', () => {
    const subtitleElement = fixture.debugElement.query(By.css('.header-sticky p'));
    expect(subtitleElement).toBeTruthy();
    expect(subtitleElement.nativeElement.textContent).toContain(
      'Manage the skills you teach and track your impact.'
    );
  });

  it('should render Create New Skill button', () => {
    const buttonElement = fixture.debugElement.query(By.css('.btn-create'));
    expect(buttonElement).toBeTruthy();
    expect(buttonElement.nativeElement.textContent).toContain('Create New Skill');
  });

  it('should render Create New Skill button with icon', () => {
    const iconElement = fixture.debugElement.query(By.css('.btn-create .material-symbols-outlined'));
    expect(iconElement).toBeTruthy();
    expect(iconElement.nativeElement.textContent).toContain('add_circle');
  });

  it('should initialize with 2 skills', () => {
    expect(component.skills.length).toBe(2);
  });

  it('should render one card for each skill', () => {
    const cards = fixture.debugElement.queryAll(By.css('.skill-card'));
    expect(cards.length).toBe(component.skills.length);
  });

  it('should display first skill title', () => {
    const titles = fixture.debugElement.queryAll(By.css('.skill-card h3'));
    expect(titles.length).toBe(2);
    expect(titles[0].nativeElement.textContent).toContain('Advanced Watercolor Techniques');
  });

  it('should display second skill title', () => {
    const titles = fixture.debugElement.queryAll(By.css('.skill-card h3'));
    expect(titles[1].nativeElement.textContent).toContain('Intro to Python for Data Science');
  });

  it('should display first skill description', () => {
    const descriptions = fixture.debugElement.queryAll(By.css('.skill-card p'));
    expect(descriptions.length).toBe(2);
    expect(descriptions[0].nativeElement.textContent).toContain(
      'Master fluid dynamics and color blending for stunning landscapes.'
    );
  });

  it('should display second skill description', () => {
    const descriptions = fixture.debugElement.queryAll(By.css('.skill-card p'));
    expect(descriptions[1].nativeElement.textContent).toContain(
      'Learn the basics of Pandas, NumPy, and data visualization.'
    );
  });

  it('should display students count for each skill', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('42');
    expect(textContent).toContain('Students');
    expect(textContent).toContain('18');
  });

  it('should display coins earned for each skill', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('1,250');
    expect(textContent).toContain('Coins Earned');
    expect(textContent).toContain('890');
  });

  it('should display status badges for each skill', () => {
    const badges = fixture.debugElement.queryAll(By.css('.status-badge'));
    expect(badges.length).toBe(component.skills.length);
    badges.forEach(badge => {
      expect(badge.nativeElement.textContent).toContain('Active');
    });
  });

  it('should display skill icons', () => {
    const icons = fixture.debugElement.queryAll(By.css('.icon-container .material-symbols-outlined'));
    expect(icons.length).toBe(component.skills.length);
    expect(icons[0].nativeElement.textContent).toContain('brush');
    expect(icons[1].nativeElement.textContent).toContain('code');
  });

  it('should apply correct tone class to icon container', () => {
    const iconContainers = fixture.debugElement.queryAll(By.css('.icon-container'));
    expect(iconContainers.length).toBe(2);
    expect(iconContainers[0].classes['primary-icon']).toBeTruthy();
    expect(iconContainers[1].classes['tertiary-icon']).toBeTruthy();
  });

  it('should apply correct blob class to decorative blob', () => {
    const blobs = fixture.debugElement.queryAll(By.css('.decorative-blob'));
    expect(blobs.length).toBe(2);
    expect(blobs[0].classes['primary-blob']).toBeTruthy();
    expect(blobs[1].classes['tertiary-blob']).toBeTruthy();
  });

  it('should render Edit button for each skill', () => {
    const editButtons = fixture.debugElement.queryAll(By.css('.btn-edit'));
    expect(editButtons.length).toBe(component.skills.length);
    editButtons.forEach(button => {
      expect(button.nativeElement.textContent).toContain('Edit');
    });
  });

  it('should render Edit button with edit icon', () => {
    const editIcons = fixture.debugElement.queryAll(By.css('.btn-edit .material-symbols-outlined'));
    expect(editIcons.length).toBe(component.skills.length);
    editIcons.forEach(icon => {
      expect(icon.nativeElement.textContent).toContain('edit');
    });
  });

  it('should render Delete button for each skill', () => {
    const deleteButtons = fixture.debugElement.queryAll(By.css('.btn-delete'));
    expect(deleteButtons.length).toBe(component.skills.length);
  });

  it('should render Delete button with delete icon', () => {
    const deleteIcons = fixture.debugElement.queryAll(By.css('.btn-delete .material-symbols-outlined'));
    expect(deleteIcons.length).toBe(component.skills.length);
    deleteIcons.forEach(icon => {
      expect(icon.nativeElement.textContent).toContain('delete');
    });
  });

  it('should display stat boxes with correct structure', () => {
    const statBoxes = fixture.debugElement.queryAll(By.css('.stat-box'));
    expect(statBoxes.length).toBe(4); // 2 skills * 2 stats each
  });

  it('should display stat box icons correctly', () => {
    const statIcons = fixture.debugElement.queryAll(By.css('.stat-box .material-symbols-outlined'));
    expect(statIcons.length).toBe(4);
    expect(statIcons[0].nativeElement.textContent).toContain('group');
    expect(statIcons[1].nativeElement.textContent).toContain('toll');
    expect(statIcons[2].nativeElement.textContent).toContain('group');
    expect(statIcons[3].nativeElement.textContent).toContain('toll');
  });

  it('should format coins with number pipe', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('1,250');
    expect(textContent).toContain('890');
  });

  it('should have routerLink on create button', () => {
    const createLink = fixture.debugElement.query(By.css('.btn-create'));
    expect(createLink.attributes['routerLink']).toBe('/user/my-skills/create');
  });

  it('should display glass-card class on skill cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('.skill-card'));
    cards.forEach(card => {
      expect(card.classes['glass-card']).toBeTruthy();
    });
  });

  it('should have correct card structure', () => {
    const firstCard = fixture.debugElement.queryAll(By.css('.skill-card'))[0];
    expect(firstCard).toBeTruthy();
    
    // Kiểm tra decorative blob
    const blob = firstCard.query(By.css('.decorative-blob'));
    expect(blob).toBeTruthy();
    
    // Kiểm tra card top section
    const cardTop = firstCard.query(By.css('.card-top'));
    expect(cardTop).toBeTruthy();
    
    // Kiểm tra card body
    const cardBody = firstCard.query(By.css('.card-body'));
    expect(cardBody).toBeTruthy();
    
    // Kiểm tra stat grid
    const statGrid = firstCard.query(By.css('.stat-grid'));
    expect(statGrid).toBeTruthy();
    
    // Kiểm tra actions
    const actions = firstCard.query(By.css('.actions'));
    expect(actions).toBeTruthy();
  });
});