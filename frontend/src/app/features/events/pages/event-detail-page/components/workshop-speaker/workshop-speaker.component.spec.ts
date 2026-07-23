import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkshopSpeakerComponent } from './workshop-speaker.component';
import { WorkshopSpeaker } from '../../../../models/workshop-detail.model';

describe('WorkshopSpeakerComponent', () => {
  let component: WorkshopSpeakerComponent;
  let fixture: ComponentFixture<WorkshopSpeakerComponent>;

  const mockSpeaker: WorkshopSpeaker = {
    name: 'Dr. Elena Rodriguez',
    title: 'Head of Global Logistics',
    bio: 'Bio text.',
    avatarUrl: 'assets/test.jpg',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkshopSpeakerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkshopSpeakerComponent);
    component = fixture.componentInstance;
    component.speaker = mockSpeaker;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the speaker name and title', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Dr. Elena Rodriguez');
    expect(text).toContain('Head of Global Logistics');
  });
});
