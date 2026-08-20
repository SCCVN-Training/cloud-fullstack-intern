import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Top10 } from './top10';

describe('Top10', () => {
  let component: Top10;
  let fixture: ComponentFixture<Top10>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Top10],
    }).compileComponents();

    fixture = TestBed.createComponent(Top10);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
