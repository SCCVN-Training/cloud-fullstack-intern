import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Top5 } from './top5';

describe('Top5', () => {
  let component: Top5;
  let fixture: ComponentFixture<Top5>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Top5],
    }).compileComponents();

    fixture = TestBed.createComponent(Top5);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
