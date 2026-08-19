import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportControls } from './export-controls';

describe('ExportControls', () => {
  let component: ExportControls;
  let fixture: ComponentFixture<ExportControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportControls],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportControls);
    fixture.componentRef.setInput('target', null);
    fixture.componentRef.setInput('filename', '');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
