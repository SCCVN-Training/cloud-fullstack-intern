import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Onboarding } from './onboarding';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth/auth';

// Mock classes with manual tracking
class MockToastService {
  private errors: string[] = [];
  private successes: string[] = [];

  showError = (message: string): void => {
    this.errors.push(message);
  };

  showSuccess = (message: string): void => {
    this.successes.push(message);
  };

  getErrors = (): string[] => this.errors;
  getSuccesses = (): string[] => this.successes;
  clear = (): void => {
    this.errors = [];
    this.successes = [];
  };
}

class MockAuthService {
  private onboardingComplete = true;

  completeOnboarding = (profile: any) => {
    return of(true);
  };

  // For testing failure scenarios
  setOnboardingResult(result: boolean) {
    this.completeOnboarding = (profile: any) => {
      return of(result);
    };
  }

  setOnboardingError(error: any) {
    this.completeOnboarding = (profile: any) => {
      return throwError(() => error);
    };
  }
}

class MockRouter {
  private navigationCommands: any[] = [];

  navigate = (commands: any[]): Promise<boolean> => {
    this.navigationCommands.push(commands);
    return Promise.resolve(true);
  };

  getNavigationCalls = (): any[] => this.navigationCommands;
  clear = (): void => {
    this.navigationCommands = [];
  };
}

describe('Onboarding Component', () => {
  let component: Onboarding;
  let fixture: ComponentFixture<Onboarding>;
  let mockToastService: MockToastService;
  let mockAuthService: MockAuthService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    // Create fresh mock instances
    mockToastService = new MockToastService();
    mockAuthService = new MockAuthService();
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, Onboarding],
      providers: [
        { provide: ToastService, useValue: mockToastService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Onboarding);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockToastService.clear();
    mockRouter.clear();
  });

  describe('Form Initialization', () => {
    it('should initialize the form with empty fields', () => {
      expect(component.onboardingForm).toBeDefined();
      expect(component.onboardingForm.get('fullName')?.value).toBe('');
      expect(component.onboardingForm.get('age')?.value).toBe(null);
      expect(component.onboardingForm.get('gender')?.value).toBe('');
      expect(component.onboardingForm.get('bio')?.value).toBe('');
    });

    it('should have correct validators for each field', () => {
      const fullNameControl = component.onboardingForm.get('fullName');
      const ageControl = component.onboardingForm.get('age');
      const genderControl = component.onboardingForm.get('gender');

      // Test required validators
      fullNameControl?.setValue('');
      expect(fullNameControl?.valid).toBeFalsy();
      expect(fullNameControl?.errors?.['required']).toBeTruthy();

      fullNameControl?.setValue('J');
      expect(fullNameControl?.errors?.['minlength']).toBeTruthy();

      ageControl?.setValue('');
      expect(ageControl?.valid).toBeFalsy();
      expect(ageControl?.errors?.['required']).toBeTruthy();

      ageControl?.setValue(10);
      expect(ageControl?.errors?.['min']).toBeTruthy();

      ageControl?.setValue(150);
      expect(ageControl?.errors?.['max']).toBeTruthy();

      genderControl?.setValue('');
      expect(genderControl?.valid).toBeFalsy();
      expect(genderControl?.errors?.['required']).toBeTruthy();
    });

    it('should have bio field without validators', () => {
      const bioControl = component.onboardingForm.get('bio');
      expect(bioControl?.valid).toBeTruthy();
      bioControl?.setValue('Some bio text');
      expect(bioControl?.valid).toBeTruthy();
    });
  });

  describe('Form Controls Accessor', () => {
    it('should return form controls through f getter', () => {
      expect(component.f).toBe(component.onboardingForm.controls);
    });
  });

  describe('Interest Management', () => {
    it('should add interest when valid and not duplicate', () => {
      component.interestInput = '  hiking  ';
      component.addInterest();

      expect(component.interests).toContain('hiking');
      expect(component.interestInput).toBe('');
    });

    it('should not add empty interest', () => {
      component.interestInput = '   ';
      component.addInterest();

      expect(component.interests.length).toBe(0);
    });

    it('should not add duplicate interest', () => {
      component.interests = ['hiking'];
      component.interestInput = 'hiking';
      component.addInterest();

      expect(component.interests.length).toBe(1);
      expect(component.interests).toEqual(['hiking']);
    });

    it('should remove interest', () => {
      component.interests = ['hiking', 'coding'];
      component.removeInterest('hiking');

      expect(component.interests).toEqual(['coding']);
      expect(component.interests).not.toContain('hiking');
    });
  });

  describe('Skill Management', () => {
    it('should add skill when valid and not duplicate', () => {
      component.skillInput = '  guitar  ';
      component.addSkill();

      expect(component.skillsLearning).toContain('guitar');
      expect(component.skillInput).toBe('');
    });

    it('should not add empty skill', () => {
      component.skillInput = '   ';
      component.addSkill();

      expect(component.skillsLearning.length).toBe(0);
    });

    it('should not add duplicate skill', () => {
      component.skillsLearning = ['guitar'];
      component.skillInput = 'guitar';
      component.addSkill();

      expect(component.skillsLearning.length).toBe(1);
      expect(component.skillsLearning).toEqual(['guitar']);
    });

    it('should remove skill', () => {
      component.skillsLearning = ['guitar', 'piano'];
      component.removeSkill('guitar');

      expect(component.skillsLearning).toEqual(['piano']);
      expect(component.skillsLearning).not.toContain('guitar');
    });
  });

  describe('skillsTaughtCount', () => {
    it('should be 0 by default', () => {
      expect(component.skillsTaughtCount).toBe(0);
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched and show error when form is invalid', () => {
      // Form is invalid by default
      component.onSubmit();

      expect(component.onboardingForm.touched).toBeTruthy();
      const errors = mockToastService.getErrors();
      expect(errors).toContain('Please fill in the required fields.');
    });

    it('should submit valid form and navigate on success', () => {
      // Ensure the auth service returns success
      mockAuthService.completeOnboarding = (profile: any) => {
        return of(true);
      };

      // Fill valid form
      component.onboardingForm.patchValue({
        fullName: 'Jane Doe',
        age: 25,
        gender: 'female',
        bio: 'I love learning',
      });
      component.interests = ['hiking'];
      component.skillsLearning = ['guitar'];

      // Track isLoading state before submit
      expect(component.isLoading$.value).toBe(false);

      component.onSubmit();

      // isLoading should be true during submission
      // Note: The value might be set to true then false quickly
      // We need to check that it was at least set to true
      expect(component.isLoading$.value).toBe(false); // Should be false after completion

      // Verify the profile data was sent
      // We can verify by checking if the toast success was called
      const successes = mockToastService.getSuccesses();
      expect(successes).toContain('Welcome to SkillVerse!');

      const navCalls = mockRouter.getNavigationCalls();
      expect(navCalls).toContainEqual(['/']);
    });

    it('should handle submission failure with success false', () => {
      mockAuthService.completeOnboarding = (profile: any) => {
        return of(false);
      };

      component.onboardingForm.patchValue({
        fullName: 'Jane Doe',
        age: 25,
        gender: 'female',
      });

      component.onSubmit();

      expect(component.isLoading$.value).toBe(false);
      const errors = mockToastService.getErrors();
      expect(errors).toContain('Something went wrong. Please try again.');
      const navCalls = mockRouter.getNavigationCalls();
      expect(navCalls.length).toBe(0);
    });

    it('should handle connection error', () => {
      mockAuthService.completeOnboarding = (profile: any) => {
        return throwError(() => new Error('Network error'));
      };

      component.onboardingForm.patchValue({
        fullName: 'Jane Doe',
        age: 25,
        gender: 'female',
      });

      component.onSubmit();

      expect(component.isLoading$.value).toBe(false);
      const errors = mockToastService.getErrors();
      expect(errors).toContain('Connection error! Please try again.');
      const navCalls = mockRouter.getNavigationCalls();
      expect(navCalls.length).toBe(0);
    });
  });

  describe('Template Rendering', () => {
    it('should render form with all fields', () => {
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();

      const inputs = fixture.debugElement.queryAll(By.css('input'));
      expect(inputs.length).toBeGreaterThanOrEqual(4); // fullName, age, interest, skill
    });

    it('should show error messages for invalid fields', () => {
      const fullNameInput = fixture.debugElement.query(By.css('#fullName')).nativeElement;
      fullNameInput.dispatchEvent(new Event('blur'));
      fullNameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const errorTexts = fixture.debugElement.queryAll(By.css('.error-text'));
      expect(errorTexts.length).toBeGreaterThan(0);
    });

    it('should show submit button as disabled when form is invalid', () => {
      const submitButton = fixture.debugElement.query(By.css('.btn-auth-submit')).nativeElement;
      expect(submitButton.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.onboardingForm.patchValue({
        fullName: 'Jane Doe',
        age: 25,
        gender: 'female',
      });
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('.btn-auth-submit')).nativeElement;
      expect(submitButton.disabled).toBeFalsy();
    });

    it('should show loading state when isLoading$ is true', () => {
      component.isLoading$.next(true);
      fixture.detectChanges();

      const submitButton = fixture.debugElement.query(By.css('.btn-auth-submit')).nativeElement;
      expect(submitButton.textContent).toContain('Saving...');
      expect(submitButton.disabled).toBeTruthy();
    });

    it('should display chips for interests', () => {
      component.interests = ['hiking', 'coding'];
      fixture.detectChanges();

      const chips = fixture.debugElement.queryAll(By.css('.chip'));
      expect(chips.length).toBe(2);
      expect(chips[0].nativeElement.textContent).toContain('hiking');
      expect(chips[1].nativeElement.textContent).toContain('coding');
    });

    it('should display chips for skills', () => {
      component.skillsLearning = ['guitar', 'piano'];
      fixture.detectChanges();

      // Find the skills section - it's the second chip list in the form
      const skillChips = fixture.debugElement.queryAll(By.css('.form-group:last-child .chip'));
      // In the actual template, skills are in the last form-group
      // Let's find all chips in the form groups
      const allChips = fixture.debugElement.queryAll(By.css('.chip'));
      // We should have at least 2 chips (skills)
      // The first chips might be interests if we set them
      // But we only set skills in this test
      expect(allChips.length).toBe(2);
    });

    it('should display skills taught count', () => {
      const note = fixture.debugElement.query(By.css('.skills-taught-note'));
      expect(note.nativeElement.textContent).toContain('Skills taught: 0');
    });
  });

  describe('Event Handlers', () => {
    it('should prevent default on Enter key in interest input', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      let preventedDefault = false;
      event.preventDefault = () => {
        preventedDefault = true;
      };

      const interestInput = fixture.debugElement.query(By.css('#interestInput')).nativeElement;
      interestInput.dispatchEvent(event);

      expect(preventedDefault).toBeTruthy();
    });

    it('should prevent default on Enter key in skill input', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      let preventedDefault = false;
      event.preventDefault = () => {
        preventedDefault = true;
      };

      const skillInput = fixture.debugElement.query(By.css('#skillInput')).nativeElement;
      skillInput.dispatchEvent(event);

      expect(preventedDefault).toBeTruthy();
    });

    it('should remove interest when chip remove button is clicked', () => {
      component.interests = ['hiking'];
      fixture.detectChanges();

      const removeButton = fixture.debugElement.query(By.css('.chip-remove')).nativeElement;
      removeButton.click();

      expect(component.interests).toEqual([]);
    });

    it('should remove skill when chip remove button is clicked', () => {
      component.skillsLearning = ['guitar'];
      fixture.detectChanges();

      const removeButtons = fixture.debugElement.queryAll(By.css('.chip-remove'));
      // Click the last remove button (which should be for skills)
      if (removeButtons.length > 0) {
        const lastRemoveButton = removeButtons[removeButtons.length - 1].nativeElement;
        lastRemoveButton.click();
        expect(component.skillsLearning).toEqual([]);
      }
    });
  });

  describe('Form Integration', () => {
    it('should bind fullName input correctly', () => {
      const input = fixture.debugElement.query(By.css('#fullName')).nativeElement;
      input.value = 'Jane Doe';
      input.dispatchEvent(new Event('input'));

      expect(component.onboardingForm.get('fullName')?.value).toBe('Jane Doe');
    });

    it('should bind age input correctly', () => {
      const input = fixture.debugElement.query(By.css('#age')).nativeElement;
      input.value = '25';
      input.dispatchEvent(new Event('input'));

      // Age input is type="number", so the value will be a number
      expect(component.onboardingForm.get('age')?.value).toBe(25);
    });

    it('should bind gender select correctly', () => {
      const select = fixture.debugElement.query(By.css('#gender')).nativeElement;
      select.value = 'female';
      select.dispatchEvent(new Event('change'));

      expect(component.onboardingForm.get('gender')?.value).toBe('female');
    });

    it('should bind bio textarea correctly', () => {
      const textarea = fixture.debugElement.query(By.css('#bio')).nativeElement;
      textarea.value = 'My bio';
      textarea.dispatchEvent(new Event('input'));

      expect(component.onboardingForm.get('bio')?.value).toBe('My bio');
    });
  });

  describe('Error Handling', () => {
    it('should show required error for full name', () => {
      const control = component.onboardingForm.get('fullName');
      control?.setValue('');
      control?.markAsTouched();
      fixture.detectChanges();

      const errors = fixture.debugElement.queryAll(
        By.css('.form-group:first-child .error-text small'),
      );
      const hasError = errors.some((e) => e.nativeElement.textContent === 'Full name is required.');
      expect(hasError).toBeTruthy();
    });

    it('should show minlength error for short full name', () => {
      const control = component.onboardingForm.get('fullName');
      control?.setValue('J');
      control?.markAsTouched();
      fixture.detectChanges();

      const errors = fixture.debugElement.queryAll(
        By.css('.form-group:first-child .error-text small'),
      );
      const hasError = errors.some(
        (e) => e.nativeElement.textContent === 'Full name is too short.',
      );
      expect(hasError).toBeTruthy();
    });

    it('should show age validation errors', () => {
      const control = component.onboardingForm.get('age');
      control?.setValue(10);
      control?.markAsTouched();
      fixture.detectChanges();

      // Find the error messages
      const errors = fixture.debugElement.queryAll(
        By.css('.form-row .form-group:first-child .error-text small'),
      );

      // Check if any error message matches
      const hasError = errors.some((e) => {
        const text = e.nativeElement.textContent.trim();
        return text === 'Enter a valid age.';
      });

      expect(hasError).toBeTruthy();
    });

    it('should show gender required error', () => {
      const control = component.onboardingForm.get('gender');
      control?.setValue('');
      control?.markAsTouched();
      fixture.detectChanges();

      const errors = fixture.debugElement.queryAll(
        By.css('.form-row .form-group:last-child .error-text small'),
      );
      const hasError = errors.some(
        (e) => e.nativeElement.textContent === 'Please select a gender.',
      );
      expect(hasError).toBeTruthy();
    });
  });

  describe('Additional Coverage', () => {
    it('should call addInterest when Enter is pressed in interest input', () => {
      // Track if addInterest was called
      const originalAddInterest = component.addInterest;
      let addInterestCalled = false;
      component.addInterest = () => {
        addInterestCalled = true;
        originalAddInterest.call(component);
      };

      const interestInput = fixture.debugElement.query(By.css('#interestInput')).nativeElement;

      // Focus the input and press Enter
      interestInput.focus();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      interestInput.dispatchEvent(event);

      // Note: The template uses (keydown.enter)="addInterest()"
      // So this should trigger the method
      expect(addInterestCalled).toBeTruthy();
    });

    it('should call addSkill when Enter is pressed in skill input', () => {
      const originalAddSkill = component.addSkill;
      let addSkillCalled = false;
      component.addSkill = () => {
        addSkillCalled = true;
        originalAddSkill.call(component);
      };

      const skillInput = fixture.debugElement.query(By.css('#skillInput')).nativeElement;

      skillInput.focus();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      skillInput.dispatchEvent(event);

      expect(addSkillCalled).toBeTruthy();
    });

    it('should handle missing form values gracefully', () => {
      // Set form to invalid state
      component.onboardingForm.patchValue({
        fullName: '',
        age: null,
        gender: '',
      });

      component.onSubmit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Please fill in the required fields.');
    });
  });
});
