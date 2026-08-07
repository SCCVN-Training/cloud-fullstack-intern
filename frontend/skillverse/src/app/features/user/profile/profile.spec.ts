import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Profile } from './profile';
import { AuthService } from '../../../core/services/auth/auth';
import { ToastService } from '../../../shared/services/toast.service';

// Mock classes with manual tracking
class MockAuthService {
  private userData = {
    id: 'user-123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatar: 'https://example.com/avatar.jpg',
    profile: {
      bio: 'I love teaching and learning',
      age: 28,
      gender: 'female',
      interests: ['hiking', 'reading'],
      skillsLearning: ['guitar', 'piano'],
      skillsTaught: 3,
    },
  };

  currentUser = () => {
    return this.userData;
  };

  updateAccountInfo = (data: any) => {
    if (data.name !== undefined) {
      this.userData.name = data.name;
    }
    if (data.email !== undefined) {
      this.userData.email = data.email;
    }
    if (this.userData.profile) {
      if (data.bio !== undefined) {
        this.userData.profile.bio = data.bio;
      }
      if (data.age !== undefined) {
        this.userData.profile.age = data.age;
      }
      if (data.gender !== undefined) {
        this.userData.profile.gender = data.gender;
      }
    }
    return of(true);
  };

  updateAvatar = (dataUrl: string) => {
    this.userData.avatar = dataUrl;
    return of(true);
  };

  updateProfileFields = (fields: any) => {
    if (fields.skillsLearning && this.userData.profile) {
      this.userData.profile.skillsLearning = fields.skillsLearning;
    }
    if (fields.interests && this.userData.profile) {
      this.userData.profile.interests = fields.interests;
    }
    return of(true);
  };

  deleteAccount = () => {
    return of(true);
  };
}

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

// Mock ActivatedRoute for RouterLink
class MockActivatedRoute {
  snapshot = {
    paramMap: {
      get: () => null,
    },
  };
}

describe('Profile Component', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockAuthService: MockAuthService;
  let mockToastService: MockToastService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();
    mockToastService = new MockToastService();
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockToastService.clear();
    mockRouter.clear();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct default values', () => {
      expect(component.bioMaxLength).toBe(100);
      expect(component.maxAvatarSizeMb).toBe(3);
      expect(component.defaultAvatarUrl).toBeTruthy();
      expect(component.isUploadingAvatar()).toBe(false);
      expect(component.isEditingInfo()).toBe(false);
      expect(component.isSaving()).toBe(false);
      expect(component.showDeleteConfirm()).toBe(false);
      expect(component.isDeleting()).toBe(false);
      expect(component.addingSkill()).toBe(false);
      expect(component.addingInterest()).toBe(false);
      expect(component.reviews.length).toBe(3);
      expect(component.currentReviewIndex()).toBe(0);
    });

    it('should display user data from auth service', () => {
      const user = mockAuthService.currentUser();
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe('jane@example.com');
      expect(user.profile.bio).toBe('I love teaching and learning');
      expect(user.profile.age).toBe(28);
      expect(user.profile.gender).toBe('female');
    });
  });

  describe('Personal Information - Edit Mode', () => {
    it('should start edit mode with current user data', () => {
      const user = mockAuthService.currentUser();

      component.startEdit();

      expect(component.editName).toBe(user.name);
      expect(component.editEmail).toBe(user.email);
      expect(component.editBio).toBe(user.profile.bio);
      expect(component.editAge).toBe(user.profile.age);
      expect(component.editGender).toBe(user.profile.gender);
      expect(component.isEditingInfo()).toBe(true);
    });

    it('should cancel edit mode', () => {
      component.isEditingInfo.set(true);
      component.cancelEdit();
      expect(component.isEditingInfo()).toBe(false);
    });

    it('should show error if name is empty on save', () => {
      component.startEdit();
      component.editName = '   ';
      component.editEmail = 'test@test.com';

      component.saveEdit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Name and email cannot be empty.');
    });

    it('should show error if email is empty on save', () => {
      component.startEdit();
      component.editName = 'Jane Doe';
      component.editEmail = '   ';

      component.saveEdit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Name and email cannot be empty.');
    });

    it('should show error if bio exceeds max length', () => {
      component.startEdit();
      component.editName = 'Jane Doe';
      component.editEmail = 'jane@test.com';
      component.editBio = 'a'.repeat(101);

      component.saveEdit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('About Me must be 100 characters or fewer.');
    });

    it('should save successfully with valid data', () => {
      component.startEdit();
      component.editName = 'Jane Smith';
      component.editEmail = 'jane.smith@test.com';
      component.editBio = 'Updated bio';
      component.editAge = 29;
      component.editGender = 'female';

      component.saveEdit();

      // Check that the user data was updated
      const user = mockAuthService.currentUser();
      expect(user.name).toBe('Jane Smith');
      expect(user.email).toBe('jane.smith@test.com');
      expect(user.profile.bio).toBe('Updated bio');
      expect(user.profile.age).toBe(29);
      expect(user.profile.gender).toBe('female');

      const successes = mockToastService.getSuccesses();
      expect(successes).toContain('Profile updated.');
      expect(component.isEditingInfo()).toBe(false);
    });

    it('should handle save failure', () => {
      mockAuthService.updateAccountInfo = (data: any) => {
        const user = mockAuthService.currentUser();
        if (data.name !== undefined) {
          user.name = data.name;
        }
        if (data.email !== undefined) {
          user.email = data.email;
        }
        if (user.profile) {
          if (data.bio !== undefined) {
            user.profile.bio = data.bio;
          }
          if (data.age !== undefined) {
            user.profile.age = data.age;
          }
          if (data.gender !== undefined) {
            user.profile.gender = data.gender;
          }
        }
        return of(false);
      };

      component.startEdit();
      component.editName = 'Jane Doe';
      component.editEmail = 'jane@test.com';

      component.saveEdit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Could not save changes. Please try again.');
    });

    it('should handle save connection error', () => {
      mockAuthService.updateAccountInfo = (data: any) => {
        return throwError(() => new Error('Network error'));
      };

      component.startEdit();
      component.editName = 'Jane Doe';
      component.editEmail = 'jane@test.com';

      component.saveEdit();

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Connection error! Please try again.');
    });
  });

  describe('Account Deletion', () => {
    it('should open delete confirmation', () => {
      component.openDeleteConfirm();
      expect(component.showDeleteConfirm()).toBe(true);
    });

    it('should close delete confirmation', () => {
      component.showDeleteConfirm.set(true);
      component.closeDeleteConfirm();
      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should delete account successfully', () => {
      component.showDeleteConfirm.set(true);

      component.confirmDelete();

      expect(component.isDeleting()).toBe(false);
      expect(component.showDeleteConfirm()).toBe(false);

      const successes = mockToastService.getSuccesses();
      expect(successes).toContain('Your account has been deleted.');

      const navCalls = mockRouter.getNavigationCalls();
      expect(navCalls).toContainEqual(['/login']);
    });

    it('should handle delete failure', () => {
      mockAuthService.deleteAccount = () => of(false);

      component.showDeleteConfirm.set(true);
      component.confirmDelete();

      expect(component.isDeleting()).toBe(false);
      expect(component.showDeleteConfirm()).toBe(false);

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Could not delete account. Please try again.');
    });

    it('should handle delete connection error', () => {
      mockAuthService.deleteAccount = () => {
        return throwError(() => new Error('Network error'));
      };

      component.showDeleteConfirm.set(true);
      component.confirmDelete();

      expect(component.isDeleting()).toBe(false);
      expect(component.showDeleteConfirm()).toBe(false);

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Connection error! Please try again.');
    });
  });

  describe('Avatar Upload', () => {
    it('should reject non-JPG/PNG files', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      const event = { target: { files: [file], value: '' } } as any;

      component.onAvatarSelected(event);

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Please choose a .jpg or .png image.');
    });

    it('should reject files larger than max size', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 4 * 1024 * 1024 });
      const event = { target: { files: [file], value: '' } } as any;

      component.onAvatarSelected(event);

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Image must be under 3MB.');
    });

    it('should handle valid avatar upload', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
      const event = { target: { files: [file], value: '' } } as any;

      const originalFileReader = window.FileReader;

      class MockFileReader {
        onload: any = null;
        onerror: any = null;
        result = 'data:image/jpeg;base64,test';
        readAsDataURL() {
          setTimeout(() => {
            if (this.onload) {
              const loadEvent = { target: { result: this.result } };
              this.onload(loadEvent);
            }
          }, 0);
        }
        abort() {}
        readAsArrayBuffer() {}
        readAsBinaryString() {}
        readAsText() {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() {
          return true;
        }
        readyState: number = 2;
        error: any = null;
      }

      window.FileReader = MockFileReader as any;

      component.onAvatarSelected(event);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(component.isUploadingAvatar()).toBe(false);
      const successes = mockToastService.getSuccesses();
      expect(successes).toContain('Profile photo updated.');
      window.FileReader = originalFileReader;
    });

    it('should handle file reader error', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
      const event = { target: { files: [file], value: '' } } as any;

      const originalFileReader = window.FileReader;

      class MockFileReader {
        onload: any = null;
        onerror: any = null;
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              const errorEvent = new ProgressEvent('error');
              this.onerror(errorEvent);
            }
          }, 0);
        }
        abort() {}
        readAsArrayBuffer() {}
        readAsBinaryString() {}
        readAsText() {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() {
          return true;
        }
        readyState: number = 2;
        error: any = null;
        result: any = null;
      }

      window.FileReader = MockFileReader as any;

      component.onAvatarSelected(event);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const errors = mockToastService.getErrors();
      expect(errors).toContain('Could not read that file. Please try again.');
      window.FileReader = originalFileReader;
    });
  });

  describe('Skills Management', () => {
    it('should toggle add skill input', () => {
      expect(component.addingSkill()).toBe(false);

      component.toggleAddSkill();
      expect(component.addingSkill()).toBe(true);
      expect(component.skillInput).toBe('');

      component.toggleAddSkill();
      expect(component.addingSkill()).toBe(false);
    });

    it('should confirm add skill successfully', () => {
      const currentUser = mockAuthService.currentUser();
      const initialSkillsLength = currentUser.profile.skillsLearning.length;

      component.skillInput = '  new skill  ';
      component.confirmAddSkill();

      expect(component.skillInput).toBe('');
      expect(component.addingSkill()).toBe(false);

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.skillsLearning.length).toBe(initialSkillsLength + 1);
      expect(updatedUser.profile.skillsLearning).toContain('new skill');
    });

    it('should not add duplicate skill', () => {
      const currentUser = mockAuthService.currentUser();
      const existingSkill = currentUser.profile.skillsLearning[0];
      const initialLength = currentUser.profile.skillsLearning.length;

      component.skillInput = existingSkill;
      component.confirmAddSkill();

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.skillsLearning.length).toBe(initialLength);
    });

    it('should not add empty skill', () => {
      const currentUser = mockAuthService.currentUser();
      const initialLength = currentUser.profile.skillsLearning.length;

      component.skillInput = '   ';
      component.confirmAddSkill();

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.skillsLearning.length).toBe(initialLength);
    });

    it('should remove skill', () => {
      const currentUser = mockAuthService.currentUser();
      const skillToRemove = currentUser.profile.skillsLearning[0];
      const initialLength = currentUser.profile.skillsLearning.length;

      component.removeSkill(skillToRemove);

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.skillsLearning.length).toBe(initialLength - 1);
      expect(updatedUser.profile.skillsLearning).not.toContain(skillToRemove);
    });
  });

  describe('Interests Management', () => {
    it('should toggle add interest input', () => {
      expect(component.addingInterest()).toBe(false);

      component.toggleAddInterest();
      expect(component.addingInterest()).toBe(true);
      expect(component.interestInput).toBe('');

      component.toggleAddInterest();
      expect(component.addingInterest()).toBe(false);
    });

    it('should confirm add interest successfully', () => {
      const currentUser = mockAuthService.currentUser();
      const initialLength = currentUser.profile.interests.length;

      component.interestInput = '  new interest  ';
      component.confirmAddInterest();

      expect(component.interestInput).toBe('');
      expect(component.addingInterest()).toBe(false);

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.interests.length).toBe(initialLength + 1);
      expect(updatedUser.profile.interests).toContain('new interest');
    });

    it('should not add duplicate interest', () => {
      const currentUser = mockAuthService.currentUser();
      const existingInterest = currentUser.profile.interests[0];
      const initialLength = currentUser.profile.interests.length;

      component.interestInput = existingInterest;
      component.confirmAddInterest();

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.interests.length).toBe(initialLength);
    });

    it('should not add empty interest', () => {
      const currentUser = mockAuthService.currentUser();
      const initialLength = currentUser.profile.interests.length;

      component.interestInput = '   ';
      component.confirmAddInterest();

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.interests.length).toBe(initialLength);
    });

    it('should remove interest', () => {
      const currentUser = mockAuthService.currentUser();
      const interestToRemove = currentUser.profile.interests[0];
      const initialLength = currentUser.profile.interests.length;

      component.removeInterest(interestToRemove);

      const updatedUser = mockAuthService.currentUser();
      expect(updatedUser.profile.interests.length).toBe(initialLength - 1);
      expect(updatedUser.profile.interests).not.toContain(interestToRemove);
    });
  });

  describe('Reviews Carousel', () => {
    it('should navigate to previous review', () => {
      component.currentReviewIndex.set(1);

      component.prevReview();

      expect(component.currentReviewIndex()).toBe(0);
    });

    it('should navigate to next review', () => {
      component.currentReviewIndex.set(1);

      component.nextReview();

      expect(component.currentReviewIndex()).toBe(2);
    });

    it('should wrap around when going to previous from first', () => {
      component.currentReviewIndex.set(0);

      component.prevReview();

      expect(component.currentReviewIndex()).toBe(2);
    });

    it('should wrap around when going to next from last', () => {
      component.currentReviewIndex.set(2);

      component.nextReview();

      expect(component.currentReviewIndex()).toBe(0);
    });
  });

  describe('Template Rendering', () => {
    it('should render user name from auth service', () => {
      const nameElement = fixture.debugElement.query(By.css('.profile-name'));
      expect(nameElement.nativeElement.textContent).toContain('Jane Doe');
    });

    it('should render user stats', () => {
      const statNumbers = fixture.debugElement.queryAll(By.css('.stat-number'));
      expect(statNumbers.length).toBe(2);
    });

    it('should show edit form when isEditingInfo is true', () => {
      component.isEditingInfo.set(true);
      fixture.detectChanges();

      const editForm = fixture.debugElement.query(By.css('.info-form'));
      expect(editForm).toBeTruthy();
    });

    it('should show read-only view when not editing', () => {
      component.isEditingInfo.set(false);
      fixture.detectChanges();

      const infoView = fixture.debugElement.query(By.css('.info-view'));
      expect(infoView).toBeTruthy();
    });

    it('should render skills chips', () => {
      const skillChips = fixture.debugElement.queryAll(By.css('.tag-learning'));
      expect(skillChips.length).toBe(2);
    });

    it('should render interest chips', () => {
      const interestChips = fixture.debugElement.queryAll(By.css('.tag-interest'));
      expect(interestChips.length).toBe(2);
    });

    it('should render delete confirmation modal when shown', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modal).toBeTruthy();
    });

    it('should not render delete confirmation modal when hidden', () => {
      component.showDeleteConfirm.set(false);
      fixture.detectChanges();

      const modal = fixture.debugElement.query(By.css('.modal-overlay'));
      expect(modal).toBeFalsy();
    });

    it('should render reviews carousel', () => {
      const reviewItem = fixture.debugElement.query(By.css('.review-item'));
      expect(reviewItem).toBeTruthy();
    });

    it('should show review navigation when multiple reviews', () => {
      const navButtons = fixture.debugElement.queryAll(By.css('.btn-review-nav'));
      expect(navButtons.length).toBe(2);
    });

    it('should display add skill input when addingSkill is true', () => {
      component.addingSkill.set(true);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('.add-tag-input input'));
      expect(input).toBeTruthy();
    });

    it('should display add interest input when addingInterest is true', () => {
      component.addingInterest.set(true);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('.add-tag-input input'));
      expect(input).toBeTruthy();
    });

    it('should show empty hint when no skills', () => {
      const user = mockAuthService.currentUser();
      user.profile.skillsLearning = [];

      fixture = TestBed.createComponent(Profile);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const emptyHint = fixture.debugElement.query(By.css('.empty-hint'));
      expect(emptyHint).toBeTruthy();
    });

    it('should show empty hint when no interests', () => {
      const user = mockAuthService.currentUser();
      user.profile.interests = [];

      fixture = TestBed.createComponent(Profile);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const emptyHints = fixture.debugElement.queryAll(By.css('.empty-hint'));
      expect(emptyHints.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions - Click Events', () => {
    it('should open delete dialog when delete button clicked', () => {
      const deleteButton = fixture.debugElement.query(By.css('.btn-secondary'));

      expect(component.showDeleteConfirm()).toBe(false);

      deleteButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(true);
    });

    it('should close delete dialog when clicking overlay', () => {
      component.showDeleteConfirm.set(true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.modal-overlay'));
      overlay.nativeElement.click();
      fixture.detectChanges();

      expect(component.showDeleteConfirm()).toBe(false);
    });

    it('should start edit when edit button clicked', () => {
      const editButton = fixture.debugElement.query(By.css('.btn-primary'));
      expect(component.isEditingInfo()).toBe(false);

      editButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.isEditingInfo()).toBe(true);
      expect(component.editName).toBe('Jane Doe');
    });

    it('should toggle skill input when add skill button clicked', () => {
      const skillCard = fixture.debugElement.queryAll(By.css('.tag-card'))[0];
      const addButton = skillCard.query(By.css('.btn-icon'));

      expect(component.addingSkill()).toBe(false);

      addButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.addingSkill()).toBe(true);
    });

    it('should toggle interest input when add interest button clicked', () => {
      const interestCard = fixture.debugElement.queryAll(By.css('.tag-card'))[1];
      const addButton = interestCard.query(By.css('.btn-icon'));

      expect(component.addingInterest()).toBe(false);

      addButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.addingInterest()).toBe(true);
    });

    it('should navigate reviews when nav buttons clicked', () => {
      const navButtons = fixture.debugElement.queryAll(By.css('.btn-review-nav'));

      expect(component.currentReviewIndex()).toBe(0);

      navButtons[1].nativeElement.click();
      fixture.detectChanges();
      expect(component.currentReviewIndex()).toBe(1);

      navButtons[0].nativeElement.click();
      fixture.detectChanges();
      expect(component.currentReviewIndex()).toBe(0);
    });
  });
});
