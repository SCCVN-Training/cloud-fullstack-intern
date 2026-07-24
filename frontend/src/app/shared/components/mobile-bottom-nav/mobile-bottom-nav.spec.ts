import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileBottomView } from './mobile-bottom-view';

describe('MobileBottomView', () => {
  let component: MobileBottomView;
  let fixture: ComponentFixture<MobileBottomView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileBottomView],
    }).compileComponents();

    fixture = TestBed.createComponent(MobileBottomView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
