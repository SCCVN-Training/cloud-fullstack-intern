import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AnimeSearchDialog } from './anime-search-dialog';

describe('AnimeSearchDialog', () => {
  let component: AnimeSearchDialog;
  let fixture: ComponentFixture<AnimeSearchDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeSearchDialog],

      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {
              /* empty */
            },
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { excludeIds: [] },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeSearchDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
