import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AnimeSearchDialog } from './anime-search-dialog';
// Nếu component có chứa animation hoặc icon của Material, bạn nên import NoopAnimationsModule để test không bị lỗi

describe('AnimeSearchDialog', () => {
  let component: AnimeSearchDialog;
  let fixture: ComponentFixture<AnimeSearchDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Chỉ import Standalone Component và các Module cần thiết
      imports: [AnimeSearchDialog],

      // Các service (dependency injection) phải nằm trong providers
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {
              /* empty */
            },
          }, // Mock hàm close để tránh lỗi khi component gọi this.dialogRef.close()
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { excludeIds: [] }, // Mock data truyền vào dialog
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
