import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriveItemCard } from './drive-item-card';

describe('DriveItem', () => {
  let component: DriveItemCard;
  let fixture: ComponentFixture<DriveItemCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriveItemCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DriveItemCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
