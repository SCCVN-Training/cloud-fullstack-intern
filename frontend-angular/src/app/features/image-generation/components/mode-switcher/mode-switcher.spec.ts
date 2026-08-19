import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeSwitcher } from './mode-switcher';

describe('ModeSwitcher', () => {
  let component: ModeSwitcher;
  let fixture: ComponentFixture<ModeSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeSwitcher],
    }).compileComponents();

    fixture = TestBed.createComponent(ModeSwitcher);

    const mockMode = [
      {
        id: '1',
        label: 'Test',
        icon: 'test',
      },
    ];
    fixture.componentRef.setInput('modes', mockMode);
    fixture.componentRef.setInput('active', 'Test');
    fixture.componentRef.setInput('label', 'Test');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
