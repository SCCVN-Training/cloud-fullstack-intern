import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionReview } from './session-review';

describe('SessionReview', () => {
  let component: SessionReview;
  let fixture: ComponentFixture<SessionReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionReview],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionReview);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // =====================================
  // Component
  // =====================================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =====================================
  // Initial State
  // =====================================

  it('should initialize with five stars', () => {
    expect(component.stars).toEqual([1, 2, 3, 4, 5]);
  });

  it('should initialize ratings to zero', () => {
    expect(component.overallRating).toBe(0);
    expect(component.knowledgeRating).toBe(0);
    expect(component.communicationRating).toBe(0);
    expect(component.videoAudioRating).toBe(0);
  });

  it('should initialize feedback as an empty string', () => {
    expect(component.feedback).toBe('');
  });

  it('should initialize the reviewee as Sarah', () => {
    expect(component.reviewee.name).toBe('Sarah');
  });

  it('should initialize the reviewee with an avatar', () => {
    expect(component.reviewee.avatar).toBeTruthy();
  });

  // =====================================
  // Submit State
  // =====================================

  it('should not allow submission without an overall rating', () => {
    expect(component.canSubmit).toBe(false);
  });

  it('should allow submission after selecting an overall rating', () => {
    component.setOverallRating(5);

    expect(component.canSubmit).toBe(true);
  });

  // =====================================
  // Overall Rating
  // =====================================

  it('should set the overall rating', () => {
    component.setOverallRating(4);

    expect(component.overallRating).toBe(4);
  });

  it('should update the overall rating when a different rating is selected', () => {
    component.setOverallRating(3);
    expect(component.overallRating).toBe(3);

    component.setOverallRating(5);
    expect(component.overallRating).toBe(5);
  });

  // =====================================
  // Knowledge Rating
  // =====================================

  it('should set the knowledge rating', () => {
    component.setKnowledgeRating(4);

    expect(component.knowledgeRating).toBe(4);
  });

  it('should update the knowledge rating', () => {
    component.setKnowledgeRating(2);
    expect(component.knowledgeRating).toBe(2);

    component.setKnowledgeRating(5);
    expect(component.knowledgeRating).toBe(5);
  });

  // =====================================
  // Communication Rating
  // =====================================

  it('should set the communication rating', () => {
    component.setCommunicationRating(5);

    expect(component.communicationRating).toBe(5);
  });

  it('should update the communication rating', () => {
    component.setCommunicationRating(3);
    expect(component.communicationRating).toBe(3);

    component.setCommunicationRating(4);
    expect(component.communicationRating).toBe(4);
  });

  // =====================================
  // Video / Audio Rating
  // =====================================

  it('should set the video and audio rating', () => {
    component.setVideoAudioRating(4);

    expect(component.videoAudioRating).toBe(4);
  });

  it('should update the video and audio rating', () => {
    component.setVideoAudioRating(2);
    expect(component.videoAudioRating).toBe(2);

    component.setVideoAudioRating(5);
    expect(component.videoAudioRating).toBe(5);
  });

  // =====================================
  // Feedback
  // =====================================

  it('should store feedback text', () => {
    component.feedback = 'Great session. I learned a lot.';

    expect(component.feedback).toBe('Great session. I learned a lot.');
  });

  // =====================================
  // Submit Review
  // =====================================

  it('should not submit a review without an overall rating', () => {
    component.feedback = 'Great session.';

    expect(() => component.submitReview()).not.toThrow();

    expect(component.canSubmit).toBe(false);
  });

  it('should submit a review when an overall rating is selected', () => {
    component.setOverallRating(5);
    component.setKnowledgeRating(4);
    component.setCommunicationRating(5);
    component.setVideoAudioRating(4);
    component.feedback = 'Excellent session.';

    expect(() => component.submitReview()).not.toThrow();
  });

  // =====================================
  // Template
  // =====================================

  it('should render the reviewee name', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('How was your session with Sarah?');
  });

  it('should render the review introduction', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(
      'Your feedback helps us maintain a high-quality community.',
    );
  });

  it('should render the overall rating section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Overall Rating');
  });

  it('should render five overall rating buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.rating-star');

    expect(buttons.length).toBe(20);
  });

  it('should render the feedback textarea', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea).toBeTruthy();
    expect(textarea.rows).toBe(4);
  });

  it('should render the feedback placeholder', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.placeholder).toContain(
      'What did you learn? How could the session be improved?',
    );
  });

  it('should render the knowledge depth section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Knowledge Depth');
  });

  it('should render the communication section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Communication');
  });

  it('should render the video and audio quality section', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Video / Audio Quality');
  });

  it('should render the submit review button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    const submitButton = Array.from(buttons).find((button) =>
      (button as HTMLElement).textContent?.includes('Submit Review'),
    );

    expect(submitButton).toBeTruthy();
  });

  // =====================================
  // UI Interaction
  // =====================================

  it('should update the overall rating when a star is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.rating-star',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[2].click();
    fixture.detectChanges();

    expect(component.overallRating).toBe(3);
  });

  it('should update the knowledge rating when a star is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.rating-star',
    ) as NodeListOf<HTMLButtonElement>;

    // First five buttons = overall rating
    // Next five buttons = knowledge rating
    buttons[7].click();
    fixture.detectChanges();

    expect(component.knowledgeRating).toBe(3);
  });

  it('should update the communication rating when a star is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.rating-star',
    ) as NodeListOf<HTMLButtonElement>;

    // Communication starts after overall + knowledge
    buttons[12].click();
    fixture.detectChanges();

    expect(component.communicationRating).toBe(3);
  });

  it('should update the video and audio rating when a star is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.rating-star',
    ) as NodeListOf<HTMLButtonElement>;

    // Video/audio starts after overall + knowledge + communication
    buttons[18].click();
    fixture.detectChanges();

    expect(component.videoAudioRating).toBe(4);
  });

  it('should update the feedback when the textarea changes', () => {
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'Very helpful session.';

    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.feedback).toBe('Very helpful session.');
  });
});
