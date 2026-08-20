import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageGeneration } from './image-generation';

describe('ImageGeneration', () => {
  let component: ImageGeneration;
  let fixture: ComponentFixture<ImageGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageGeneration],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageGeneration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
