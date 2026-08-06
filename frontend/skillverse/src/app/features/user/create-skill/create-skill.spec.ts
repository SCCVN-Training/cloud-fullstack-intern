import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CreateSkill } from './create-skill';
import { expect } from 'vitest';

describe('CreateSkill', () => {
  let component: CreateSkill;
  let fixture: ComponentFixture<CreateSkill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSkill],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSkill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with beginner level selected', () => {
    expect(component.selectedLevel).toBe('beginner');
  });

  it('should change selected level to intermediate', () => {
    component.selectLevel('intermediate');

    expect(component.selectedLevel).toBe('intermediate');
  });

  it('should change selected level to advanced', () => {
    component.selectLevel('advanced');

    expect(component.selectedLevel).toBe('advanced');
  });

  it('should render page title', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Create New Skill');
  });

  it('should render page description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Share your expertise with the SkillVerse community.'
    );
  });

  it('should render upload section', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Skill Cover Image');
    expect(compiled.textContent).toContain('Click to upload');
  });

  it('should render file input', () => {
    const fileInput = fixture.debugElement.query(
      By.css('input[type="file"]')
    );

    expect(fileInput).toBeTruthy();
  });

  it('should render skill title input', () => {
    const input = fixture.debugElement.query(
      By.css('#skillTitle')
    );

    expect(input).toBeTruthy();
  });

  it('should render category select', () => {
    const select = fixture.debugElement.query(
      By.css('#category')
    );

    expect(select).toBeTruthy();
  });

  it('should render category options', () => {
    const options = fixture.debugElement.queryAll(
      By.css('#category option')
    );

    expect(options.length).toBe(5);
  });

  it('should render price input', () => {
    const input = fixture.debugElement.query(
      By.css('#price')
    );

    expect(input).toBeTruthy();
  });

  it('should render description textarea', () => {
    const textarea = fixture.debugElement.query(
      By.css('#description')
    );

    expect(textarea).toBeTruthy();
  });

  it('should render duration input', () => {
    const input = fixture.debugElement.query(
      By.css('#duration')
    );

    expect(input).toBeTruthy();
  });

  it('should render three level radio buttons', () => {
    const radios = fixture.debugElement.queryAll(
      By.css('input[type="radio"]')
    );

    expect(radios.length).toBe(3);
  });

  it('should render all skill level labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Beginner');
    expect(compiled.textContent).toContain('Intermediate');
    expect(compiled.textContent).toContain('Advanced');
  });

  it('should update selected level', () => {
    component.selectLevel('advanced');

    expect(component.selectedLevel).toBe('advanced');
    });

  it('should have beginner active by default', () => {
    const activeBox = fixture.debugElement.query(
      By.css('.level-box.active')
    );

    expect(activeBox).toBeTruthy();
    expect(activeBox.nativeElement.textContent).toContain('Beginner');
  });

  it('should render cancel button', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Cancel');
  });

  it('should render publish button', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Publish Skill');
  });

  it('should render one form element', () => {
    const form = fixture.debugElement.query(
      By.css('form')
    );

    expect(form).toBeTruthy();
  });

  it('should render four category options plus placeholder', () => {
    const options = fixture.debugElement.queryAll(
      By.css('#category option')
    );

    expect(options.map(o => o.nativeElement.value)).toEqual([
      '',
      'design',
      'tech',
      'business',
      'music'
    ]);
  });

  it('should render required skill title input', () => {
    const input = fixture.debugElement.query(
      By.css('#skillTitle')
    ).nativeElement;

    expect(input.required).toBe(true);
  });
});