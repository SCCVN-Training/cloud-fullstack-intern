import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    component.currentPage = 1;
    component.totalPages = 8;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build a compact page list with an ellipsis marker', () => {
    expect(component.pages).toEqual([1, 2, 3, -1, 8]);
  });

  it('should not emit when going before page 1', () => {
    spyOn(component.pageChanged, 'emit');
    component.goTo(0);
    expect(component.pageChanged.emit).not.toHaveBeenCalled();
  });

  it('should emit the target page when valid', () => {
    spyOn(component.pageChanged, 'emit');
    component.goTo(3);
    expect(component.pageChanged.emit).toHaveBeenCalledWith(3);
  });
});
